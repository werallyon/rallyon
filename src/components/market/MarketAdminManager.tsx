import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Sliders,
  MapPin,
  Building2,
  Users,
  Flame,
  Radio,
  Tv,
  Eye,
  Edit,
  Play,
  Pause,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import {
  Market,
  City,
  MarketLaunchStatus,
  MarketCoverage,
  MarketReadiness,
  MarketLaunchChecklist,
  Venue
} from '../../types';
import { marketService } from '../../services/marketService';
import { marketCoverageService } from '../../services/marketCoverageService';
import { businessVenueService } from '../../services/businessVenueService';
import { sportsService } from '../../services/sportsProvider';
import { SEEDED_VENUES, SEEDED_GAMES, SEEDED_VENUE_GAMES, SEEDED_PRESENCE } from '../../data/seedData';

export const MarketAdminManager: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>(marketService.getAllMarkets());
  const [activeMarket, setActiveMarket] = useState<Market>(marketService.getActiveMarket());
  const [selectedMarketForDetails, setSelectedMarketForDetails] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MarketLaunchStatus>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New Market form state
  const [newMarketData, setNewMarketData] = useState({
    name: '',
    slug: '',
    state: '',
    state_code: '',
    latitude: 32.7767,
    longitude: -96.797,
    radius: 35,
    population: 500000,
    timezone: 'America/Chicago',
    launch_status: 'PREPARING' as MarketLaunchStatus
  });

  // New City form state
  const [newCityName, setNewCityName] = useState('');
  const [newCityPopulation, setNewCityPopulation] = useState(50000);

  // Dynamic calculations map
  const [coverageMap, setCoverageMap] = useState<Record<string, MarketCoverage>>({});
  const [readinessMap, setReadinessMap] = useState<Record<string, MarketReadiness>>({});
  const [checklistMap, setChecklistMap] = useState<Record<string, MarketLaunchChecklist>>({});

  const allVenues = SEEDED_VENUES;
  const gamesToday = SEEDED_GAMES;

  const refreshData = () => {
    const all = marketService.getAllMarkets();
    setMarkets(all);
    setActiveMarket(marketService.getActiveMarket());

    // Compute dynamic coverage and readiness for each market
    const newCovMap: Record<string, MarketCoverage> = {};
    const newReadMap: Record<string, MarketReadiness> = {};
    const newCheckMap: Record<string, MarketLaunchChecklist> = {};

    all.forEach((m) => {
      // Mock programming for this market
      const cov = marketCoverageService.calculateMarketCoverage(
        m.id,
        allVenues,
        [],
        SEEDED_PRESENCE,
        gamesToday
      );
      const readiness = marketCoverageService.calculateMarketReadiness(m.id, cov);
      const checklist = marketCoverageService.getMarketLaunchChecklist(cov, readiness);

      newCovMap[m.id] = cov;
      newReadMap[m.id] = readiness;
      newCheckMap[m.id] = checklist;
    });

    setCoverageMap(newCovMap);
    setReadinessMap(newReadMap);
    setChecklistMap(newCheckMap);
  };

  useEffect(() => {
    refreshData();
    const unsub = marketService.subscribe(refreshData);
    return unsub;
  }, []);

  const handleLaunchStatusChange = (marketId: string, status: MarketLaunchStatus) => {
    marketService.setMarketLaunchStatus(marketId, status);
    setFeedbackMessage(`Market status updated to ${status}.`);
    setTimeout(() => setFeedbackMessage(null), 3500);
    refreshData();
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketData.name || !newMarketData.state) return;

    const slug =
      newMarketData.slug ||
      newMarketData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const created = marketService.createMarket({
      name: newMarketData.name,
      slug,
      state: newMarketData.state,
      state_code: newMarketData.state_code.toUpperCase(),
      country: 'USA',
      latitude: Number(newMarketData.latitude),
      longitude: Number(newMarketData.longitude),
      radius: Number(newMarketData.radius),
      population: Number(newMarketData.population),
      timezone: newMarketData.timezone,
      status: 'ACTIVE',
      launch_status: newMarketData.launch_status,
      geographic_boundary: {
        type: 'RADIUS',
        radiusMiles: Number(newMarketData.radius),
        center: {
          lat: Number(newMarketData.latitude),
          lng: Number(newMarketData.longitude)
        }
      }
    });

    setShowCreateModal(false);
    setFeedbackMessage(`Created new market: ${created.name}`);
    setTimeout(() => setFeedbackMessage(null), 3500);
    refreshData();
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketForDetails || !newCityName) return;

    marketService.addCity({
      market_id: selectedMarketForDetails.id,
      name: newCityName,
      state: selectedMarketForDetails.state,
      state_code: selectedMarketForDetails.state_code,
      country: 'USA',
      latitude: selectedMarketForDetails.latitude,
      longitude: selectedMarketForDetails.longitude,
      population: Number(newCityPopulation),
      status: 'ACTIVE'
    });

    setNewCityName('');
    setShowAddCityModal(false);
    setFeedbackMessage(`Added ${newCityName} to ${selectedMarketForDetails.name}`);
    setTimeout(() => setFeedbackMessage(null), 3500);
    refreshData();
  };

  // Filter markets
  const filteredMarkets = markets.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && m.launch_status !== statusFilter) return false;
    return true;
  });

  // KPI Summary stats
  const liveCount = markets.filter((m) => m.launch_status === 'LIVE').length;
  const preparingCount = markets.filter((m) => m.launch_status === 'PREPARING').length;
  const plannedCount = markets.filter((m) => m.launch_status === 'PLANNED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-neutral-900 border border-amber-500/30 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Market-First Expansion Engine
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Texarkana Live Launch
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Activate and govern metropolitan sports intelligence markets deliberately.
            Track venue saturation, game programming, live check-ins, and launch readiness thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Total Metros
          </div>
          <div className="text-2xl font-black text-white mt-1">{markets.length}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Nationwide Pipeline</div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Market
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {liveCount}
            <span className="text-xs font-normal text-emerald-400 ml-1.5">(Texarkana)</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">
            {coverageMap['market_texarkana']?.coverage_score || 82}% Coverage
          </div>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            Preparing Metros
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{preparingCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">DFW, Houston, Little Rock, Shreveport</div>
        </div>

        <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Planned Metros
          </div>
          <div className="text-2xl font-black text-neutral-300 mt-1">{plannedCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Top 50 U.S. Metros</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search markets or states..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'LIVE', 'PREPARING', 'SOFT_LAUNCH', 'PLANNED', 'PAUSED'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/80 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 text-[11px] font-bold uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-3">Launch Status</th>
                <th className="py-3 px-3 text-right">RallyOn Venues</th>
                <th className="py-3 px-3 text-right">Claimed</th>
                <th className="py-3 px-3 text-right">Games Today</th>
                <th className="py-3 px-3 text-right">Check-ins</th>
                <th className="py-3 px-3 text-right">Coverage</th>
                <th className="py-3 px-3 text-right">Readiness</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-medium">
              {filteredMarkets.map((market) => {
                const cov = coverageMap[market.id] || {
                  total_relevant_venues: 25,
                  RallyOn_venues: 14,
                  claimed_venues: 8,
                  games_today: 6,
                  active_checkins: 12,
                  coverage_score: 75
                };
                const readiness = readinessMap[market.id] || {
                  readiness_score: 82,
                  is_ready_for_launch: true
                };

                const isLive = market.launch_status === 'LIVE';

                return (
                  <tr
                    key={market.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      isLive ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                            isLive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {market.state_code.split('/')[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {market.name}
                            {isLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {market.state} • {market.radius} mi radius •{' '}
                            {(market.population / 1000).toFixed(0)}k pop
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={market.launch_status}
                        onChange={(e) =>
                          handleLaunchStatusChange(
                            market.id,
                            e.target.value as MarketLaunchStatus
                          )
                        }
                        className={`text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-1 bg-neutral-950 border focus:outline-none ${
                          isLive
                            ? 'border-emerald-500/50 text-emerald-400'
                            : market.launch_status === 'PREPARING'
                            ? 'border-amber-500/50 text-amber-300'
                            : 'border-neutral-700 text-neutral-400'
                        }`}
                      >
                        <option value="LIVE">Live</option>
                        <option value="EXPANDING">Expanding</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="SOFT_LAUNCH">Soft Launch</option>
                        <option value="PLANNED">Planned</option>
                        <option value="PAUSED">Paused</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-200">
                      {cov.RallyOn_venues}
                      <span className="text-neutral-500 font-normal text-[10px]">
                        /{cov.total_relevant_venues}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-300">
                      {cov.claimed_venues}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-300">
                      {cov.games_today}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-300">
                      {cov.active_checkins}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          cov.coverage_score >= 70
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : cov.coverage_score >= 40
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {cov.coverage_score}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          readiness.readiness_score >= 80
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : readiness.readiness_score >= 55
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {readiness.readiness_score}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedMarketForDetails(market)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Launch Audit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Launch Checklist & Detail Drawer */}
      {selectedMarketForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                  {selectedMarketForDetails.state_code.split('/')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {selectedMarketForDetails.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {selectedMarketForDetails.launch_status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Coordinates: {selectedMarketForDetails.latitude},{' '}
                    {selectedMarketForDetails.longitude} • Radius:{' '}
                    {selectedMarketForDetails.radius} miles
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMarketForDetails(null)}
                className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Coverage & Readiness Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coverage Summary */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Market Coverage Score
                    </span>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {coverageMap[selectedMarketForDetails.id]?.coverage_score || 0}%
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>RallyOn Venues:</span>
                      <span className="font-mono text-white">
                        {coverageMap[selectedMarketForDetails.id]?.RallyOn_venues} /{' '}
                        {coverageMap[selectedMarketForDetails.id]?.total_relevant_venues}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Claimed Venues:</span>
                      <span className="font-mono text-white">
                        {coverageMap[selectedMarketForDetails.id]?.claimed_venues}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Venue Truth Completeness:</span>
                      <span className="font-mono text-white">
                        {coverageMap[selectedMarketForDetails.id]?.venue_data_completeness}%
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Sports Data Quality:</span>
                      <span className="font-mono text-white">
                        {coverageMap[selectedMarketForDetails.id]?.sports_data_completeness}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Readiness Summary */}
                <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Launch Readiness Score
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {readinessMap[selectedMarketForDetails.id]?.readiness_score || 0}%
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-400">
                      <span>Venue Participation Score:</span>
                      <span className="font-mono text-white">
                        {readinessMap[selectedMarketForDetails.id]?.venue_participation_score}%
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>User Activity Score:</span>
                      <span className="font-mono text-white">
                        {readinessMap[selectedMarketForDetails.id]?.user_activity_score}%
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Ready For Full Activation:</span>
                      <span
                        className={`font-bold ${
                          readinessMap[selectedMarketForDetails.id]?.is_ready_for_launch
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {readinessMap[selectedMarketForDetails.id]?.is_ready_for_launch
                          ? 'YES (Approved)'
                          : 'PENDING CRITERIA'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 11-Point Market Launch Checklist */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      11-Point Market Launch Checklist
                    </h4>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Automated criteria validation
                  </span>
                </div>

                {checklistMap[selectedMarketForDetails.id] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        key: 'venue_discovery_complete',
                        label: 'Venue discovery complete'
                      },
                      {
                        key: 'venue_normalization_complete',
                        label: 'Venue normalization complete'
                      },
                      {
                        key: 'duplicate_cleanup_complete',
                        label: 'Duplicate cleanup complete'
                      },
                      { key: 'sports_data_active', label: 'Sports data active' },
                      {
                        key: 'venue_claims_started',
                        label: 'Venue claims started'
                      },
                      {
                        key: 'venue_programming_active',
                        label: 'Venue programming active'
                      },
                      { key: 'checkins_enabled', label: 'Check-ins enabled' },
                      {
                        key: 'promotions_enabled',
                        label: 'Promotions & offers enabled'
                      },
                      { key: 'analytics_active', label: 'Market analytics active' },
                      {
                        key: 'coverage_threshold_reached',
                        label: 'Coverage threshold reached (≥65%)'
                      },
                      {
                        key: 'ready_for_launch',
                        label: 'Approved for Live Market status'
                      }
                    ].map((item) => {
                      const isComplete = (checklistMap[selectedMarketForDetails.id] as any)[
                        item.key
                      ];
                      return (
                        <div
                          key={item.key}
                          className={`flex items-center gap-2 p-2 rounded-lg border ${
                            isComplete
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-500 shrink-0" />
                          )}
                          <span className="font-medium text-[11px]">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assigned Cities in this Market */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Assigned Municipalities & Cities ({marketService.getCitiesForMarket(selectedMarketForDetails.id).length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowAddCityModal(true)}
                    className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-bold"
                  >
                    + Assign City
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {marketService
                    .getCitiesForMarket(selectedMarketForDetails.id)
                    .map((city) => (
                      <div
                        key={city.id}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 flex items-center gap-1.5"
                      >
                        <span className="font-bold">{city.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          ({(city.population / 1000).toFixed(0)}k)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Market ID: <span className="font-mono text-neutral-300">{selectedMarketForDetails.id}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedMarketForDetails.launch_status !== 'LIVE' ? (
                  <button
                    onClick={() => {
                      handleLaunchStatusChange(selectedMarketForDetails.id, 'LIVE');
                      setSelectedMarketForDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Activate Market (Set LIVE)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleLaunchStatusChange(selectedMarketForDetails.id, 'PAUSED');
                      setSelectedMarketForDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-red-950/80 text-red-400 font-bold text-xs border border-red-500/30 transition-all"
                  >
                    Pause Market
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black text-white">Create New Metro Market</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMarket} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Market Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Nashville Metro"
                  value={newMarketData.name}
                  onChange={(e) =>
                    setNewMarketData({ ...newMarketData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">State Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Tennessee"
                    value={newMarketData.state}
                    onChange={(e) =>
                      setNewMarketData({ ...newMarketData, state: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">State Code</label>
                  <input
                    type="text"
                    required
                    placeholder="TN"
                    maxLength={5}
                    value={newMarketData.state_code}
                    onChange={(e) =>
                      setNewMarketData({
                        ...newMarketData,
                        state_code: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMarketData.latitude}
                    onChange={(e) =>
                      setNewMarketData({
                        ...newMarketData,
                        latitude: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newMarketData.longitude}
                    onChange={(e) =>
                      setNewMarketData({
                        ...newMarketData,
                        longitude: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Radius (Miles)</label>
                  <input
                    type="number"
                    required
                    value={newMarketData.radius}
                    onChange={(e) =>
                      setNewMarketData({
                        ...newMarketData,
                        radius: parseInt(e.target.value) || 30
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Population</label>
                  <input
                    type="number"
                    required
                    value={newMarketData.population}
                    onChange={(e) =>
                      setNewMarketData({
                        ...newMarketData,
                        population: parseInt(e.target.value) || 100000
                      })
                    }
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Initial Launch Status</label>
                <select
                  value={newMarketData.launch_status}
                  onChange={(e) =>
                    setNewMarketData({
                      ...newMarketData,
                      launch_status: e.target.value as MarketLaunchStatus
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  <option value="PREPARING">Preparing</option>
                  <option value="SOFT_LAUNCH">Soft Launch</option>
                  <option value="PLANNED">Planned</option>
                  <option value="LIVE">Live</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 font-bold text-neutral-950"
                >
                  Create Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && selectedMarketForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white">
              Assign City to {selectedMarketForDetails.name}
            </h3>
            <form onSubmit={handleAddCity} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">City Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Wake Village, TX"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Population</label>
                <input
                  type="number"
                  required
                  value={newCityPopulation}
                  onChange={(e) => setNewCityPopulation(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 font-bold text-neutral-950"
                >
                  Add Municipality
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
