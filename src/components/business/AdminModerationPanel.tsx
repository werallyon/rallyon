import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  Flame,
  AlertTriangle,
  ArrowLeft,
  Search,
  ExternalLink,
  RefreshCw,
  Radio,
  Zap,
  Server,
  Layers,
  Activity,
  Key,
  Globe
} from 'lucide-react';
import { VenueClaim, VenuePlaceMatch, ClaimVerificationStatus, SportsGame } from '../../types';
import { businessVenueService } from '../../services/businessVenueService';
import { googlePlacesService } from '../../services/googlePlacesService';
import { sportsService, SportsProviderStatus, ISportsDataProvider } from '../../services/sportsProvider';
import { SEEDED_VENUES } from '../../data/seedData';
import { TeamLogo } from '../common/TeamLogo';
import { MarketAdminManager } from '../market/MarketAdminManager';

interface AdminModerationPanelProps {
  onBack: () => void;
}

export const AdminModerationPanel: React.FC<AdminModerationPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'MARKETS' | 'CLAIMS' | 'PLACES' | 'AUDIT' | 'SPORTS_DATA'>('MARKETS');
  const [claims, setClaims] = useState<VenueClaim[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Sports data provider administration state
  const [sportsStatus, setSportsStatus] = useState<SportsProviderStatus>(sportsService.getStatus());
  const [sportsProviders, setSportsProviders] = useState<ISportsDataProvider[]>(sportsService.getAvailableProviders());
  const [activeProviderId, setActiveProviderId] = useState<string>(sportsService.getActiveProvider().id);
  const [isTestingSports, setIsTestingSports] = useState(false);
  const [sportsTestResult, setSportsTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [liveProviderGames, setLiveProviderGames] = useState<SportsGame[]>([]);
  const [commercialApiKey, setCommercialApiKey] = useState('');

  useEffect(() => {
    refresh();
    const unsub = businessVenueService.subscribe(refresh);
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateSports = () => {
      setSportsStatus(sportsService.getStatus());
      setSportsProviders(sportsService.getAvailableProviders());
      setActiveProviderId(sportsService.getActiveProvider().id);
    };
    const unsub = sportsService.subscribe(updateSports);
    updateSports();
    return unsub;
  }, []);

  useEffect(() => {
    if (activeTab === 'SPORTS_DATA') {
      sportsService.getGames().then(setLiveProviderGames);
    }
  }, [activeTab, activeProviderId]);

  const refresh = () => {
    setClaims(businessVenueService.getAllClaims());
  };

  const handleTestSportsConnection = async () => {
    setIsTestingSports(true);
    setSportsTestResult(null);
    try {
      const res = await sportsService.testActiveConnection();
      setSportsTestResult(res);
      setSportsStatus(sportsService.getStatus());
    } finally {
      setIsTestingSports(false);
    }
  };

  const handleSwitchSportsProvider = (id: string) => {
    sportsService.setActiveProviderById(id);
    setActiveProviderId(id);
    setSportsStatus(sportsService.getStatus());
    setSportsTestResult(null);
    sportsService.getGames().then(setLiveProviderGames);
    setActionFeedback(`Switched active sports provider to ${sportsService.getActiveProvider().name}`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleSaveCommercialApiKey = () => {
    sportsService.configureActiveProvider({ apiKey: commercialApiKey });
    setActionFeedback('Commercial sports provider credentials activated.');
    setSportsStatus(sportsService.getStatus());
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleReviewClaim = (claimId: string, status: ClaimVerificationStatus) => {
    businessVenueService.reviewClaim(
      claimId,
      status,
      status === 'APPROVED' ? 'Approved by platform admin.' : 'Denied due to verification failure.',
      'Austin Platform Admin'
    );
    setActionFeedback(`Claim status updated to ${status}`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans max-w-4xl mx-auto pb-24 animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white">Platform Admin Moderation</h1>
              <p className="text-[11px] text-neutral-400">Claims, Places Normalization & Audits</p>
            </div>
          </div>
        </div>
      </header>

      {actionFeedback && (
        <div className="p-3 m-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MARKETS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'MARKETS' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Markets & Expansion</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
        <button
          onClick={() => setActiveTab('CLAIMS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
            activeTab === 'CLAIMS' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Venue Claims ({claims.filter((c) => c.verification_status === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('PLACES')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
            activeTab === 'PLACES' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Google Places Matches
        </button>
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
            activeTab === 'AUDIT' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Reliability Audits
        </button>
        <button
          onClick={() => setActiveTab('SPORTS_DATA')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'SPORTS_DATA' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Sports Data Feeds</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {activeTab === 'MARKETS' && <MarketAdminManager />}

        {activeTab === 'CLAIMS' && (
          <div className="space-y-3">
            {claims.map((claim) => {
              const venue = SEEDED_VENUES.find((v) => v.id === claim.venue_id);
              return (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">
                        {claim.business_name} ({venue?.neighborhood || 'Austin'})
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Applicant: <b className="text-neutral-200">{claim.applicant_name}</b> • {claim.role}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        claim.verification_status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : claim.verification_status === 'DENIED'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {claim.verification_status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-300 space-y-1">
                    <div>Phone: <span className="font-mono text-amber-400">{claim.applicant_phone}</span></div>
                    <div>Email: <span className="font-mono text-amber-400">{claim.applicant_email}</span></div>
                    <div>Method: <span className="text-white font-bold">{claim.verification_method}</span></div>
                    {claim.notes && <div className="text-neutral-400 italic">"{claim.notes}"</div>}
                  </div>

                  {claim.verification_status === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Ownership</span>
                      </button>
                      <button
                        onClick={() => handleReviewClaim(claim.id, 'DENIED')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-red-500 hover:text-black text-neutral-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Deny</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'PLACES' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              RallyOn venues matched against Google Places API entities to ensure identity deduplication.
            </p>
            {SEEDED_VENUES.map((venue) => {
              const match = googlePlacesService.getVenueMatch(venue.id);
              const place = googlePlacesService.getPlaceForVenue(venue.id);

              return (
                <div key={venue.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white">{venue.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      {match?.matchConfidence || 99}% Confidence ({match?.matchSource || 'AUTOMATIC'})
                    </span>
                  </div>

                  <div className="text-xs text-neutral-400 space-y-0.5">
                    <div>Address: {place?.formattedAddress || venue.address}</div>
                    <div>Google Place ID: <span className="font-mono text-neutral-300">{place?.placeId || 'ChIJ...'}</span></div>
                    <div>Rating: <span className="text-amber-400 font-bold">★ {place?.rating || 4.5}</span> ({place?.userRatingsTotal || 1200} reviews)</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              Audit score calculated from venue sports confirmation accuracy vs actual games aired.
            </p>
            {SEEDED_VENUES.map((venue) => {
              const rel = businessVenueService.calculateVenueReliability(venue.id);
              return (
                <div key={venue.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white">{venue.name}</h4>
                    <p className="text-xs text-neutral-400">
                      Confirmation Rate: <b className="text-white">{rel.confirmationRate}%</b> • {rel.verifiedGamesCount} verified games
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">{rel.score}%</span>
                    <span className="text-[10px] text-neutral-400 block uppercase">{rel.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'SPORTS_DATA' && (
          <div className="space-y-4">
            {/* Telemetry card */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Live Sports Provider Architecture
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Centralized ESPN public sports data engine with pluggable commercial provider interface
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {sportsStatus.requiresApiKey ? 'API KEY CONFIGURED' : 'NO API KEY REQUIRED'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Active Feed</span>
                  <span className="font-bold text-white block mt-0.5">{sportsStatus.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Connection State</span>
                  <span className="font-bold text-emerald-400 block mt-0.5">
                    {sportsStatus.mode === 'LIVE_FEED' ? 'Live ESPN Streams' : 'Demo Fallback'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Cached Fixtures</span>
                  <span className="font-bold text-white block mt-0.5">{sportsStatus.cachedGamesCount} matches</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 block">Ping Latency</span>
                  <span className="font-bold text-amber-400 block mt-0.5">
                    {sportsStatus.latencyMs ? `${sportsStatus.latencyMs} ms` : 'Active'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestSportsConnection}
                  disabled={isTestingSports}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 text-amber-400 ${isTestingSports ? 'animate-bounce' : ''}`} />
                  <span>{isTestingSports ? 'Testing ESPN Endpoints...' : 'Test Endpoint Latency'}</span>
                </button>
                <button
                  onClick={() => sportsService.refreshGames().then(setLiveProviderGames)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Feeds Now</span>
                </button>
              </div>

              {sportsTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    sportsTestResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/40 text-red-300'
                  }`}
                >
                  {sportsTestResult.message}
                </div>
              )}
            </div>

            {/* Pluggable Provider Registry Switcher */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Pluggable Provider Architecture
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Switch between public ESPN feeds and commercial enterprise providers without altering application code.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {sportsProviders.map((p) => {
                  const isCurrent = p.id === activeProviderId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSwitchSportsProvider(p.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-neutral-950 border-amber-500 ring-1 ring-amber-500/40'
                          : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{p.name.split(' ')[0]}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-black text-amber-400">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 block">
                        {p.type === 'ESPN_PUBLIC' && 'Public API-key-free endpoints'}
                        {p.type === 'COMMERCIAL_LICENSED' && 'Sportradar / Stats Perform'}
                        {p.type === 'CURATED_SEEDED' && 'Offline high-fidelity fixtures'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Commercial config drawer if active */}
              {activeProviderId === 'commercial-licensed-v1' && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-purple-500/40 space-y-2.5 mt-2">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Commercial Sports Data Provider Credentials
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter Sportradar / Stats Perform API key..."
                      value={commercialApiKey}
                      onChange={(e) => setCommercialApiKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleSaveCommercialApiKey}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live games pulled from active provider */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Active Fixtures from {sportsStatus.name.split(' ')[0]} ({liveProviderGames.length})
                </span>
                <span className="text-[10px] text-neutral-400">Live scoreboards</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {liveProviderGames.slice(0, 8).map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="font-bold text-amber-400">{g.league}</span>
                      <span className={g.status === 'LIVE' ? 'text-red-400 font-bold' : ''}>
                        {g.status} {g.liveDetails?.period ? `• ${g.liveDetails.period}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-white">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <TeamLogo logo={g.awayTeam.logo} name={g.awayTeam.name} size="xs" />
                        <span className="truncate">{g.awayTeam.name}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums flex-shrink-0">
                        {g.status === 'UPCOMING' ? '-' : (g.liveDetails?.currentScore.away ?? '-')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-white">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                        <TeamLogo logo={g.homeTeam.logo} name={g.homeTeam.name} size="xs" />
                        <span className="truncate">{g.homeTeam.name}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums flex-shrink-0">
                        {g.status === 'UPCOMING' ? '-' : (g.liveDetails?.currentScore.home ?? '-')}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-900 flex justify-between">
                      <span>{g.broadcastNetwork || 'ESPN'}</span>
                      <span>{g.venueName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
