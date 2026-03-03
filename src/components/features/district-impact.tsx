npm install leaflet @types/leaflet

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  PropositionImpact,
  DistrictImpactDetail,
  DistrictType,
  ImpactSummary,
} from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui';
import { formatPercentage } from '@/lib/utils';
import { MapPin, TrendingUp, TrendingDown, Minus, Filter, Map, List } from 'lucide-react';

interface DistrictImpactProps {
  impact: PropositionImpact;
}

// ─── Tab Toggle ────────────────────────────────────────────────────────────────
type TabView = 'list' | 'map';

function TabToggle({ active, onChange }: { active: TabView; onChange: (v: TabView) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active === 'list'
            ? 'bg-white text-blue-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <List className="h-4 w-4" />
        List
      </button>
      <button
        onClick={() => onChange('map')}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          active === 'map'
            ? 'bg-white text-blue-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        <Map className="h-4 w-4" />
        Map
      </button>
    </div>
  );
}

// ─── Leaflet Map ───────────────────────────────────────────────────────────────
function DistrictMap({ districts }: { districts: DistrictImpactDetail[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet (avoids SSR issues)
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!, {
        center: [36.7783, -119.4179],
        zoom: 6,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Fetch California congressional districts GeoJSON
      const res = await fetch(
        'https://raw.githubusercontent.com/unitedstates/districts/gh-pages/cds/2012/CA-1/shape.geojson'
      );

      // Use a statewide CA GeoJSON as base, color by district data
      const caRes = await fetch(
        'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
      );
      const caData = await caRes.json();
      const caState = {
        ...caData,
        features: caData.features.filter((f: any) => f.properties.name === 'California'),
      };

      // Draw CA state outline
      L.geoJSON(caState, {
        style: {
          color: '#1e3a8a',
          weight: 2,
          fillColor: '#eff6ff',
          fillOpacity: 0.3,
        },
      }).addTo(map);

      // Build a lookup of district data by name keyword
      const districtLookup = new Map<string, DistrictImpactDetail>();
      districts.forEach((d) => districtLookup.set(d.districtId, d));

      // Add district markers as circles (since full CA district GeoJSON requires separate tiles)
      // Place markers proportionally across CA for each district
      const caDistrictCoords = generateDistrictCoords(districts);

      districts.forEach((district, i) => {
        const coords = caDistrictCoords[i];
        if (!coords) return;

        const isDemo = district.change.direction === 'democratic';
        const isRepub = district.change.direction === 'republican';
        const significance = district.change.significance;

        const color = isDemo ? '#1d4ed8' : isRepub ? '#b91c1c' : '#6b7280';
        const radius = significance === 'significant' ? 16 : significance === 'moderate' ? 11 : 7;
        const opacity = significance === 'significant' ? 0.85 : significance === 'moderate' ? 0.65 : 0.4;

        const circle = L.circleMarker(coords, {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: opacity,
        });

        const shift = district.change.balanceShift;
        const partisan = district.currentPartisan.democraticAdvantage;

        circle.bindPopup(`
          <div style="font-family: Georgia, serif; min-width: 200px;">
            <p style="font-weight: bold; font-size: 14px; margin: 0 0 6px;">${district.districtName}</p>
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: capitalize;">${district.districtType.replace('_', ' ')}</p>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span style="color: #374151;">Party lean:</span>
              <strong style="color: ${partisan > 0 ? '#1d4ed8' : '#b91c1c'}">
                ${partisan > 0 ? 'D' : 'R'}+${Math.abs(partisan).toFixed(1)}
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
              <span style="color: #374151;">Balance shift:</span>
              <strong style="color: ${isDemo ? '#1d4ed8' : isRepub ? '#b91c1c' : '#6b7280'}">
                ${shift > 0 ? '+' : ''}${shift.toFixed(2)}%
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: #374151;">Impact:</span>
              <span style="text-transform: capitalize; font-weight: 600;">${district.change.significance}</span>
            </div>
          </div>
        `);

        circle.addTo(map);
      });

      // Legend
      const legend = new (L.Control.extend({
        options: { position: 'bottomright' },
        onAdd() {
          const div = L.DomUtil.create('div');
          div.innerHTML = `
            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; font-family: Georgia, serif; font-size: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.1);">
              <p style="font-weight: bold; margin: 0 0 8px; color: #111827;">District Lean</p>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#1d4ed8;opacity:0.8;"></div>
                <span style="color:#374151;">Democratic shift</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#b91c1c;opacity:0.8;"></div>
                <span style="color:#374151;">Republican shift</span>
              </div>
              <p style="font-weight: bold; margin: 0 0 6px; color: #111827;">Impact Level</p>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <div style="width:16px;height:16px;border-radius:50%;background:#6b7280;opacity:0.85;"></div>
                <span>Significant</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <div style="width:11px;height:11px;border-radius:50%;background:#6b7280;opacity:0.65;"></div>
                <span>Moderate</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:7px;height:7px;border-radius:50%;background:#6b7280;opacity:0.4;"></div>
                <span>Minimal</span>
              </div>
            </div>
          `;
          return div;
        },
      }))();
      legend.addTo(map);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [districts]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg border-2 border-gray-200 overflow-hidden"
      style={{ height: '520px' }}
    />
  );
}

// Spread district markers across CA's geographic bounds
function generateDistrictCoords(districts: DistrictImpactDetail[]): [number, number][] {
  // CA rough bounds: lat 32.5–42, lng -124.5 to -114.1
  // Cluster by district type to give rough geographic sense
  const typeOffsets: Record<string, { latBase: number; lngBase: number }> = {
    congressional:   { latBase: 36.5, lngBase: -119.5 },
    state_senate:    { latBase: 37.5, lngBase: -120.5 },
    state_assembly:  { latBase: 34.5, lngBase: -118.0 },
    county:          { latBase: 38.5, lngBase: -121.5 },
  };

  return districts.map((d, i) => {
    const base = typeOffsets[d.districtType] ?? { latBase: 36.7, lngBase: -119.4 };
    // Spiral/grid layout within each type cluster
    const angle = (i * 137.5 * Math.PI) / 180; // golden angle spread
    const r = 0.3 * Math.sqrt(i % 30);
    const lat = base.latBase + r * Math.cos(angle);
    const lng = base.lngBase + r * Math.sin(angle);
    return [lat, lng];
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DistrictImpactDisplay({ impact }: DistrictImpactProps) {
  const [districtTypeFilter, setDistrictTypeFilter] = useState<DistrictType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'impact' | 'name'>('impact');
  const [activeTab, setActiveTab] = useState<TabView>('list');

  const filteredDistricts = impact.districts
    .filter((d) => districtTypeFilter === 'all' || d.districtType === districtTypeFilter)
    .sort((a, b) => {
      if (sortBy === 'impact') {
        return Math.abs(b.change.balanceShift) - Math.abs(a.change.balanceShift);
      }
      return a.districtName.localeCompare(b.districtName);
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            District Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImpactSummaryDisplay summary={impact.summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statewide Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Affected Districts"
              value={impact.statewide.totalAffectedDistricts.toString()}
              subtext={`of ${impact.districts.length} total`}
            />
            <StatCard
              label="Avg. Balance Shift"
              value={`${impact.statewide.averageBalanceShift > 0 ? '+' : ''}${impact.statewide.averageBalanceShift.toFixed(2)}%`}
              subtext={impact.statewide.netDirection}
              variant={
                impact.statewide.netDirection === 'democratic'
                  ? 'info'
                  : impact.statewide.netDirection === 'republican'
                    ? 'danger'
                    : 'default'
              }
            />
            <StatCard
              label="Competitiveness"
              value={`${impact.statewide.competitivenessChange > 0 ? '+' : ''}${(impact.statewide.competitivenessChange * 100).toFixed(1)}%`}
              subtext={
                impact.statewide.competitivenessChange > 0
                  ? 'More competitive'
                  : 'Less competitive'
              }
            />
            <StatCard
              label="Net Direction"
              value={impact.statewide.netDirection}
              variant={
                impact.statewide.netDirection === 'democratic'
                  ? 'info'
                  : impact.statewide.netDirection === 'republican'
                    ? 'danger'
                    : 'default'
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <CardTitle>District Details</CardTitle>
              <TabToggle active={activeTab} onChange={setActiveTab} />
            </div>
            {activeTab === 'list' && (
              <div className="flex gap-2">
                <Select
                  value={districtTypeFilter}
                  onValueChange={(v) => setDistrictTypeFilter(v as DistrictType | 'all')}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="congressional">Congressional</SelectItem>
                    <SelectItem value="state_senate">State Senate</SelectItem>
                    <SelectItem value="state_assembly">State Assembly</SelectItem>
                    <SelectItem value="county">County</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'impact' | 'name')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impact">By Impact</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {filteredDistricts.slice(0, 20).map((district) => (
                <DistrictRow key={district.districtId} district={district} />
              ))}
              {filteredDistricts.length > 20 && (
                <p className="text-center text-sm text-gray-500 py-2">
                  Showing 20 of {filteredDistricts.length} districts
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Circle size = impact level &nbsp;·&nbsp; Blue = Democratic shift &nbsp;·&nbsp; Red = Republican shift. Click any marker for details.
              </p>
              <DistrictMap districts={impact.districts} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components (unchanged) ───────────────────────────────────────────────

function ImpactSummaryDisplay({ summary }: { summary: ImpactSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{summary.impactedDistricts.significant}</p>
          <p className="text-sm text-red-700">Significant Impact</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary.impactedDistricts.moderate}</p>
          <p className="text-sm text-yellow-700">Moderate Impact</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-600">{summary.impactedDistricts.minimal}</p>
          <p className="text-sm text-gray-700">Minimal Impact</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Shift Distribution</h4>
        <div className="flex h-8 rounded-lg overflow-hidden">
          <div
            className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${(summary.shiftDistribution.democratic / summary.totalDistricts) * 100}%` }}
          >
            {summary.shiftDistribution.democratic > 0 && `D: ${summary.shiftDistribution.democratic}`}
          </div>
          <div
            className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-medium"
            style={{ width: `${(summary.shiftDistribution.unchanged / summary.totalDistricts) * 100}%` }}
          >
            {summary.shiftDistribution.unchanged > 0 && summary.shiftDistribution.unchanged}
          </div>
          <div
            className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${(summary.shiftDistribution.republican / summary.totalDistricts) * 100}%` }}
          >
            {summary.shiftDistribution.republican > 0 && `R: ${summary.shiftDistribution.republican}`}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Democratic</span>
          <span>Unchanged</span>
          <span>Republican</span>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{summary.representationImpact}</p>
      </div>
    </div>
  );
}

function DistrictRow({ district }: { district: DistrictImpactDetail }) {
  const ShiftIcon =
    district.change.direction === 'democratic'
      ? TrendingUp
      : district.change.direction === 'republican'
        ? TrendingDown
        : Minus;

  const shiftColor =
    district.change.direction === 'democratic'
      ? 'text-blue-600'
      : district.change.direction === 'republican'
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{district.districtName}</p>
          <Badge size="sm" variant="default">
            {district.districtType.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span>
            Current: {district.currentPartisan.democraticAdvantage > 0 ? 'D' : 'R'}+
            {Math.abs(district.currentPartisan.democraticAdvantage).toFixed(1)}
          </span>
          <span>Turnout: {formatPercentage(district.currentPartisan.voterEngagement)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`flex items-center gap-1 ${shiftColor}`}>
            <ShiftIcon className="h-4 w-4" />
            <span className="font-medium">
              {district.change.balanceShift > 0 ? '+' : ''}
              {district.change.balanceShift.toFixed(2)}%
            </span>
          </div>
          <Badge
            size="sm"
            variant={
              district.change.significance === 'significant'
                ? 'danger'
                : district.change.significance === 'moderate'
                  ? 'warning'
                  : 'default'
            }
          >
            {district.change.significance}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  variant = 'default',
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'info' | 'danger';
}) {
  const colors = { default: 'bg-gray-50', info: 'bg-blue-50', danger: 'bg-red-50' };
  const textColors = { default: 'text-gray-900', info: 'text-blue-700', danger: 'text-red-700' };

  return (
    <div className={`p-4 rounded-lg ${colors[variant]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${textColors[variant]} capitalize`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 capitalize">{subtext}</p>}
    </div>
  );
}
