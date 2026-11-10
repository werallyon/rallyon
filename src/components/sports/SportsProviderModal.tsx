import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Key,
  Database,
  ExternalLink,
  ShieldCheck,
  Server,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  sportsService,
  SportsProviderStatus,
  ISportsDataProvider
} from '../../services/sportsProvider';

interface SportsProviderModalProps {
  onClose: () => void;
  onRefreshComplete?: () => void;
}

export const SportsProviderModal: React.FC<SportsProviderModalProps> = ({
  onClose,
  onRefreshComplete
}) => {
  const [status, setStatus] = useState<SportsProviderStatus>(sportsService.getStatus());
  const [providers, setProviders] = useState<ISportsDataProvider[]>(
    sportsService.getAvailableProviders()
  );
  const [activeProviderId, setActiveProviderId] = useState<string>(
    sportsService.getActiveProvider().id
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Commercial provider configuration state
  const [commercialApiKey, setCommercialApiKey] = useState('');
  const [commercialVendor, setCommercialVendor] = useState<
    'SPORTRADAR' | 'STATS_PERFORM' | 'THE_RUNDOWN'
  >('SPORTRADAR');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setStatus(sportsService.getStatus());
      setProviders(sportsService.getAvailableProviders());
      setActiveProviderId(sportsService.getActiveProvider().id);
    };

    const unsubscribe = sportsService.subscribe(update);
    update();
    return unsubscribe;
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await sportsService.testActiveConnection();
      setTestResult(result);
      setStatus(sportsService.getStatus());
    } finally {
      setIsTesting(false);
    }
  };

  const handleSwitchProvider = (providerId: string) => {
    sportsService.setActiveProviderById(providerId);
    setActiveProviderId(providerId);
    setStatus(sportsService.getStatus());
    setTestResult(null);
    setSaveMessage(null);
  };

  const handleSaveCommercialConfig = () => {
    sportsService.configureActiveProvider({
      apiKey: commercialApiKey,
      providerVendor: commercialVendor
    });
    setSaveMessage('Commercial provider credentials saved and active.');
    setStatus(sportsService.getStatus());
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await sportsService.refreshGames();
      setStatus(sportsService.getStatus());
      if (onRefreshComplete) onRefreshComplete();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Centralized Sports Data Layer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {status.requiresApiKey ? 'API KEY REQUIRED' : 'NO API KEY NEEDED'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                ESPN public endpoints with seamless commercial provider abstraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Active Status Banner */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Active Feed Telemetry
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  status.mode === 'LIVE_FEED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status.mode === 'LIVE_FEED' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                {status.mode === 'LIVE_FEED' ? 'Live ESPN Streams' : 'Curated Fallback Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block">Active Provider</span>
                <span className="font-bold text-white text-xs truncate block mt-0.5">
                  {status.name.split(' ')[0]}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block">Auth Level</span>
                <span className="font-bold text-emerald-400 text-xs block mt-0.5">
                  {status.requiresApiKey ? 'Licensed Key' : 'Zero Key (Public)'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block">Cached Games</span>
                <span className="font-bold text-white text-xs block mt-0.5">
                  {status.cachedGamesCount} fixtures
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-400 block">Ping Latency</span>
                <span className="font-bold text-amber-400 text-xs block mt-0.5">
                  {status.latencyMs ? `${status.latencyMs} ms` : 'Standby'}
                </span>
              </div>
            </div>

            {/* Diagnostics and sync buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-bounce' : ''}`} />
                <span>{isTesting ? 'Testing Latency...' : 'Test Endpoint Health'}</span>
              </button>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Games'}</span>
              </button>
            </div>

            {/* Test result display */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-[11px] ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Provider Selection & Architecture Abstraction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Plug & Play Provider Registry
              </span>
              <span className="text-[10px] text-neutral-400">
                Switch feeds without code changes
              </span>
            </div>

            <div className="space-y-2">
              {providers.map((p) => {
                const isCurrent = p.id === activeProviderId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSwitchProvider(p.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-neutral-950 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        {p.type === 'ESPN_PUBLIC' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-400">
                            ESPN Feeds
                          </span>
                        )}
                        {p.type === 'COMMERCIAL_LICENSED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400">
                            Enterprise
                          </span>
                        )}
                        {p.type === 'CURATED_SEEDED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-neutral-800 text-neutral-400">
                            Demo Mode
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="text-[10px] font-black text-amber-400">
                            ACTIVE ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400">
                      {p.type === 'ESPN_PUBLIC' &&
                        'Direct public scoreboard streams for NFL, CFB, NBA, CBB, MLB, NHL, MLS, EPL. Zero API key needed.'}
                      {p.type === 'COMMERCIAL_LICENSED' &&
                        'Licensed commercial gateway for Sportradar, Stats Perform, or The Rundown. Ready to swap anytime.'}
                      {p.type === 'CURATED_SEEDED' &&
                        'Seeded high-fidelity matches for offline demos and Austin test verification.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commercial Provider Configuration Drawer (if Commercial is selected) */}
          {activeProviderId === 'commercial-licensed-v1' && (
            <div className="p-4 rounded-2xl bg-neutral-950 border border-purple-500/40 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Commercial License Configuration
                </span>
                <span className="text-[10px] text-neutral-400">Enterprise Mode</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-neutral-300 block mb-1">
                    Select Commercial Vendor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SPORTRADAR', 'STATS_PERFORM', 'THE_RUNDOWN'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setCommercialVendor(v)}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-black border transition-all ${
                          commercialVendor === v
                            ? 'bg-purple-500 text-white border-purple-400'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {v.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-300 block mb-1">
                    Commercial Provider API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter commercial license key..."
                    value={commercialApiKey}
                    onChange={(e) => setCommercialApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Keys are safely retained in your current session provider configuration.
                  </p>
                </div>

                {saveMessage && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    {saveMessage}
                  </div>
                )}

                <button
                  onClick={handleSaveCommercialConfig}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors"
                >
                  Activate Commercial Feed
                </button>
              </div>
            </div>
          )}

          {/* Active Sports Leagues & Endpoint Matrix */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              Supported Public Sports Endpoints
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              {[
                { league: 'NFL', sport: 'Football', path: 'football/nfl' },
                { league: 'NCAA FB', sport: 'College FB', path: 'football/college-football' },
                { league: 'NBA', sport: 'Basketball', path: 'basketball/nba' },
                { league: 'NCAA BB', sport: 'College BB', path: 'basketball/mens-college-basketball' },
                { league: 'MLB', sport: 'Baseball', path: 'baseball/mlb' },
                { league: 'NHL', sport: 'Hockey', path: 'hockey/nhl' },
                { league: 'MLS', sport: 'Soccer', path: 'soccer/usa.1' },
                { league: 'Premier Lg', sport: 'Soccer', path: 'soccer/eng.1' },
                { league: 'UFC / MMA', sport: 'Fight Night', path: 'mma/ufc' },
                { league: 'PGA Tour', sport: 'Golf', path: 'golf/pga' }
              ].map((item) => (
                <div
                  key={item.league}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white block">{item.league}</span>
                    <span className="text-[9px] text-neutral-400">{item.path}</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="text-[10px] text-neutral-400">
            Last synced:{' '}
            <span className="text-neutral-300 font-mono">
              {status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Just now'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
