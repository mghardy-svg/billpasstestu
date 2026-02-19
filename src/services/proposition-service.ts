/**
 * Service for managing proposition data
 * Integrates with real data sources: CA SOS, Cal-Access, Census, Ballotpedia
 */

import {
  Proposition,
  PropositionWithDetails,
  PropositionFinance,
  PropositionQueryParams,
  ApiResponse,
  PropositionCategory,
  BallotWordingAnalysis,
} from '@/types';
import { caSosClient, calAccessClient, ballotpediaClient } from '@/lib/external-apis';

class PropositionService {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all propositions with optional filtering.
   * If no year is specified, loads ALL available years.
   */
  async getAll(params?: PropositionQueryParams): Promise<ApiResponse<Proposition[]>> {
    try {
      // If a specific year is requested, fetch just that year
      if (params?.year) {
        const cacheKey = `propositions-${params.year}`;
        const cached = this.getFromCache<Proposition[]>(cacheKey);
        const propositions = cached ?? await caSosClient.getPropositionsByYear(params.year);
        if (!cached) this.setCache(cacheKey, propositions);
        const filtered = this.filterPropositions(propositions, params);
        return { data: filtered, success: true, meta: { total: filtered.length, cached: !!cached } };
      }

      // No year filter — load ALL years
      const cacheKey = 'propositions-all';
      const cached = this.getFromCache<Proposition[]>(cacheKey);

      if (cached) {
        return { data: this.filterPropositions(cached, params), success: true, meta: { total: cached.length, cached: true } };
      }

      const availableYears = await caSosClient.getAvailableYears();
      const allPropositions: Proposition[] = [];

      // Fetch all years in parallel (batched to avoid overwhelming)
      const BATCH_SIZE = 5;
      for (let i = 0; i < availableYears.length; i += BATCH_SIZE) {
        const batch = availableYears.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (year) => {
            const yearCacheKey = `propositions-${year}`;
            const yearCached = this.getFromCache<Proposition[]>(yearCacheKey);
            if (yearCached) return yearCached;
            const props = await caSosClient.getPropositionsByYear(year);
            this.setCache(yearCacheKey, props);
            return props;
          })
        );
        for (const props of results) {
          allPropositions.push(...props);
        }
      }

      // Deduplicate by id
      const seen = new Set<string>();
      const deduplicated = allPropositions.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // Sort by year desc, then proposition number asc
      deduplicated.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return parseInt(a.number) - parseInt(b.number);
      });

      this.setCache(cacheKey, deduplicated);

      const filtered = this.filterPropositions(deduplicated, params);
      return {
        data: filtered,
        success: true,
        meta: { total: filtered.length, cached: false },
      };
    } catch (error) {
      console.error('Error fetching propositions:', error);
      return {
        data: [],
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch propositions' },
      };
    }
  }

  /**
   * Get a proposition with full details
   */
  async getById(id: string): Promise<ApiResponse<PropositionWithDetails>> {
    try {
      const [yearStr, number] = id.split('-');
      const year = parseInt(yearStr);

      if (isNaN(year) || !number) {
        return {
          data: null as unknown as PropositionWithDetails,
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid proposition ID format' },
        };
      }

      const proposition = await caSosClient.getProposition(year, number);
      if (!proposition) {
        return {
          data: null as unknown as PropositionWithDetails,
          success: false,
          error: { code: 'NOT_FOUND', message: 'Proposition not found' },
        };
      }

      const [finance, ballotAnalysis] = await Promise.all([
        this.getFinanceData(number, year),
        this.getBallotAnalysis(proposition),
      ]);

      const withDetails: PropositionWithDetails = {
        ...proposition,
        finance: finance || undefined,
        ballotAnalysis: ballotAnalysis || undefined,
      };

      return { data: withDetails, success: true };
    } catch (error) {
      console.error('Error fetching proposition:', error);
      return {
        data: null as unknown as PropositionWithDetails,
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch proposition details' },
      };
    }
  }

  /**
   * Get propositions by year
   */
  async getByYear(year: number): Promise<ApiResponse<Proposition[]>> {
    return this.getAll({ year });
  }

  /**
   * Get propositions by category
   */
  async getByCategory(category: PropositionCategory): Promise<ApiResponse<Proposition[]>> {
    return this.getAll({ category });
  }

  /**
   * Get upcoming propositions
   */
  async getUpcoming(): Promise<ApiResponse<Proposition[]>> {
    return this.getAll({ status: 'upcoming' });
  }

  /**
   * Get historical propositions across a year range
   */
  async getHistorical(yearFrom: number, yearTo: number): Promise<ApiResponse<Proposition[]>> {
    try {
      const allPropositions: Proposition[] = [];

      for (let year = yearFrom; year <= yearTo; year++) {
        const yearProps = await caSosClient.getPropositionsByYear(year);
        allPropositions.push(...yearProps);
      }

      return {
        data: allPropositions.sort((a, b) => b.year - a.year),
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch historical data' },
      };
    }
  }

  /**
   * Get campaign finance data for a proposition
   */
  async getFinance(propositionId: string): Promise<ApiResponse<PropositionFinance>> {
    try {
      const [yearStr, number] = propositionId.split('-');
      const year = parseInt(yearStr);
      const finance = await this.getFinanceData(number, year);

      if (!finance) {
        return {
          data: null as unknown as PropositionFinance,
          success: false,
          error: { code: 'NOT_FOUND', message: 'Finance data not found' },
        };
      }

      return { data: finance, success: true };
    } catch (error) {
      return {
        data: null as unknown as PropositionFinance,
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch finance data' },
      };
    }
  }

  /**
   * Search propositions across all years
   */
  async search(query: string): Promise<ApiResponse<Proposition[]>> {
    try {
      const allResponse = await this.getAll();
      if (!allResponse.success) return { data: [], success: false, error: allResponse.error };

      const queryLower = query.toLowerCase();
      const filtered = allResponse.data.filter(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.summary.toLowerCase().includes(queryLower) ||
          p.number.includes(query)
      );

      return { data: filtered, success: true };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: { code: 'SEARCH_ERROR', message: 'Search failed' },
      };
    }
  }

  /**
   * Get similar propositions based on category
   */
  async getSimilar(propositionId: string, limit = 5): Promise<ApiResponse<Proposition[]>> {
    try {
      const propResponse = await this.getById(propositionId);
      if (!propResponse.success || !propResponse.data) {
        return { data: [], success: true };
      }

      const prop = propResponse.data;
      const historical = await caSosClient.getHistoricalResults(prop.category, 10);

      const similar: Proposition[] = [];
      for (const result of historical.slice(0, limit)) {
        const p = await caSosClient.getProposition(result.year, result.measureNumber);
        if (p && p.id !== propositionId) {
          similar.push(p);
        }
      }

      return { data: similar, success: true };
    } catch (error) {
      return { data: [], success: false, error: { code: 'FETCH_ERROR', message: 'Failed to find similar' } };
    }
  }

  /**
   * Get available years
   */
  async getAvailableYears(): Promise<number[]> {
    return caSosClient.getAvailableYears();
  }

  // Private helper methods

  private async getFinanceData(measureNumber: string, year: number): Promise<PropositionFinance | null> {
    const cacheKey = `finance-${year}-${measureNumber}`;
    const cached = this.getFromCache<PropositionFinance>(cacheKey);
    if (cached) return cached;

    const finance = await calAccessClient.getMeasureFinance(measureNumber, year);
    if (finance && (finance.supportCommittees.length > 0 || finance.oppositionCommittees.length > 0)) {
      this.setCache(cacheKey, finance);
      return finance;
    }

    return null;
  }

  private async getBallotAnalysis(proposition: Proposition): Promise<BallotWordingAnalysis | null> {
    try {
      const analysis = ballotpediaClient.analyzeBallotWording(
        proposition.title,
        proposition.summary,
        proposition.fullText
      );
      analysis.propositionId = proposition.id;
      return analysis;
    } catch {
      return null;
    }
  }

  private filterPropositions(
    propositions: Proposition[],
    params?: PropositionQueryParams
  ): Proposition[] {
    if (!params) return propositions;

    return propositions.filter((p) => {
      if (params.year && p.year !== params.year) return false;
      if (params.category && p.category !== params.category) return false;
      if (params.status && p.status !== params.status) return false;
      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase();
        if (
          !p.title.toLowerCase().includes(query) &&
          !p.summary.toLowerCase().includes(query) &&
          !p.number.includes(params.searchQuery)
        ) {
          return false;
        }
      }
      return true;
    });
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const propositionService = new PropositionService();
export default propositionService;
