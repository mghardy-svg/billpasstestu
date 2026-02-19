'use client';

import { useState, useEffect } from 'react';
import { PropositionCard } from '@/components/features';
import {
  Card,
  CardContent,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '@/components/ui';
import { Search, Filter, Calendar, Loader2 } from 'lucide-react';
import { Proposition, PropositionPrediction, PropositionCategory, ApiResponse } from '@/types';

const categories: { value: PropositionCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'taxation', label: 'Taxation' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'environment', label: 'Environment' },
  { value: 'criminal_justice', label: 'Criminal Justice' },
  { value: 'labor', label: 'Labor' },
  { value: 'housing', label: 'Housing' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'government', label: 'Government' },
  { value: 'civil_rights', label: 'Civil Rights' },
];

const years = ['all', '2026', '2025', '2024', '2023', '2022', '2021', '2020','2019', '2018',
               '2017','2016','2015','2014','2013','2012','2011','2010', '2009', '2008', '2007',
               '2006', '2005', '2004', '2003', '2002', '2001', '2000', '1999', '1998',
               '1997', '1996', '1995', '1994', '1993', '1992', '1991', '1990'];

export default function PropositionsPage() {
  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [predictions, setPredictions] = useState<Record<string, PropositionPrediction>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch propositions from API
  useEffect(() => {
    const fetchPropositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let allPropositions: Proposition[] = [];

        if (selectedYear === 'all') {
          // Fetch from all years
          const yearsToFetch = ['2026', '2025', '2024', '2023', '2022', '2021', '2020','2019', '2018',
                                '2017','2016','2015','2014','2013','2012','2011','2010', '2009', '2008', '2007',
                               '2006', '2005', '2004', '2003', '2002', '2001', '2000', '1999', '1998',
                               '1997', '1996', '1995', '1994', '1993', '1992', '1991', '1990'];
          const fetchPromises = yearsToFetch.map(async (year) => {
            const response = await fetch(`/api/propositions?year=${year}`);
            const data: ApiResponse<Proposition[]> = await response.json();
            return data.success ? data.data : [];
          });

          const results = await Promise.all(fetchPromises);
          allPropositions = results.flat();
        } else {
          const response = await fetch(`/api/propositions?year=${selectedYear}`);
          const data: ApiResponse<Proposition[]> = await response.json();

          if (data.success) {
            allPropositions = data.data;
          } else {
            setError(data.error?.message || 'Failed to fetch propositions');
            setIsLoading(false);
            return;
          }
        }

        // Sort by year (newest first) then by number
        allPropositions.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return parseInt(a.number) - parseInt(b.number);
        });

        setPropositions(allPropositions);

        // Fetch predictions for upcoming propositions
        const upcoming = allPropositions.filter(p => p.status === 'upcoming');
        const predictionPromises = upcoming.map(async (prop) => {
          try {
            const predResponse = await fetch(`/api/predictions/${prop.id}`);
            const predData = await predResponse.json();
            if (predData.success) {
              return { id: prop.id, prediction: predData.data };
            }
          } catch {
            // Ignore prediction errors
          }
          return null;
        });

        const predResults = await Promise.all(predictionPromises);
        const predMap: Record<string, PropositionPrediction> = {};
        predResults.forEach(result => {
          if (result) {
            predMap[result.id] = result.prediction;
          }
        });
        setPredictions(predMap);
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropositions();
  }, [selectedYear]);

  // Filter propositions client-side for immediate response
  const filteredPropositions = propositions.filter((prop) => {
    const matchesSearch =
      searchQuery === '' ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.number.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'all' || prop.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' || prop.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const upcomingCount = filteredPropositions.filter((p) => p.status === 'upcoming').length;
  const passedCount = filteredPropositions.filter((p) => p.status === 'passed').length;
  const failedCount = filteredPropositions.filter((p) => p.status === 'failed').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          California Propositions
        </h1>
        <p className="text-gray-600">
          Browse and analyze statewide ballot propositions with prediction data
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {isLoading ? '-' : filteredPropositions.length}
              </p>
              <p className="text-sm text-gray-500">Total Propositions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {isLoading ? '-' : upcomingCount}
              </p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? '-' : passedCount}
              </p>
              <p className="text-sm text-gray-500">Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {isLoading ? '-' : failedCount}
              </p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search propositions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full md:w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="py-4 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Loading propositions...</span>
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredPropositions.length} propositions
            </p>
            {filteredPropositions.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="info">{upcomingCount} upcoming</Badge>
                <Badge variant="success">{passedCount} passed</Badge>
              </div>
            )}
          </div>

          {filteredPropositions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No propositions found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPropositions.map((proposition) => (
                <PropositionCard
                  key={proposition.id}
                  proposition={proposition}
                  prediction={predictions[proposition.id]}
                  showPrediction={proposition.status === 'upcoming'}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
