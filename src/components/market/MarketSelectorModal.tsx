import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Radio,
  Flame,
  Globe2,
  ShieldCheck
} from 'lucide-react';
import { Market, MarketLaunchStatus } from '../../types';
import { marketService } from '../../services/marketService';

interface MarketSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarketSelected?: (market: Market) => void;
}

export const MarketSelectorModal: React.FC<MarketSelectorModalProps> = ({
  isOpen,
  onClose,
  onMarketSelected
}) => {
  const [activeMarket, setActiveMarket] = useState<Market>(
    marketService.getActiveMarket()
  );
  const [allMarkets, setAllMarkets] = useState<Market[]>(
    marketService.getAllMarkets()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'LIVE' | 'EXPANSION'>('ALL');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = marketService.subscribe(() => {
      setActiveMarket(marketService.getActiveMarket());
      setAllMarkets(marketService.getAllMarkets());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSelectMarket = (market: Market) => {
    marketService.setActiveMarket(market.id);
    setActiveMarket(market);
    if (onMarketSelected) {
      onMarketSelected(market);
    }
    onClose();
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setDetectionMessage(null);

    if (!navigator.geolocation) {
      setIsDetectingLocation(false);
      setDetectionMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const result = marketService.detectMarketFromCoordinates(
          latitude,
          longitude
        );
        setIsDetectingLocation(false);

        if (result.isWithinBoundary) {
          setDetectionMessage(
            `Located in ${result.market.name}! (${result.distanceMiles} mi from center)`
          );
          handleSelectMarket(result.market);
        } else {
          setDetectionMessage(
            `Nearest market: ${result.market.name} (${result.distanceMiles} miles away). Switching to ${result.market.name}.`
          );
          handleSelectMarket(result.market);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        // If simulated or permission denied, default gracefully to Texarkana launch market
        setDetectionMessage(
          'Location access unavailable. Using primary launch market: Texarkana.'
        );
        const txk = marketService.getMarketById('market_texarkana');
        if (txk) handleSelectMarket(txk);
      },
      { timeout: 8000 }
    );
  };

  // Filter list by search query and active tab
  const filteredMarkets = allMarkets.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.state_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'LIVE') {
      return m.launch_status === 'LIVE' || m.launch_status === 'EXPANDING';
    }
    if (filterTab === 'EXPANSION') {
      return (
        m.launch_status === 'PREPARING' ||
        m.launch_status === 'SOFT_LAUNCH' ||
        m.launch_status === 'PLANNED'
      );
    }
    return true;
  });

  const getStatusBadge = (status: MarketLaunchStatus) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Market
          </span>
        );
      case 'EXPANDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Flame className="w-2.5 h-2.5" />
            Expanding
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" />
            Preparing
          </span>
        );
      case 'SOFT_LAUNCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Soft Launch
          </span>
        );
      case 'PLANNED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700">
            Planned Metro
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Select Your Sports Market
              </h2>
              <p className="text-xs text-neutral-400 font-medium">
                Market-first live sports intelligence network
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Market Card */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Active Viewing Market
            </span>
            {getStatusBadge(activeMarket.launch_status)}
          </div>
          <div className="flex items-center justify-between bg-neutral-800/60 border border-neutral-700/80 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {activeMarket.name}
                  <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                </div>
                <div className="text-xs text-neutral-400">
                  {activeMarket.state} • {activeMarket.radius} mi coverage zone
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-neutral-400">
              <span className="text-amber-400 font-bold">Selected</span>
            </div>
          </div>

          {/* GPS Location Auto-Detection Button */}
          <div className="mt-3">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 text-xs font-bold text-neutral-200 transition-all hover:border-amber-500/40"
            >
              <Radio
                className={`w-3.5 h-3.5 text-amber-400 ${
                  isDetectingLocation ? 'animate-spin' : ''
                }`}
              />
              <span>
                {isDetectingLocation
                  ? 'Resolving GPS Market...'
                  : 'Detect My Location (GPS)'}
              </span>
            </button>
            {detectionMessage && (
              <p className="mt-1.5 text-center text-[11px] text-amber-400/90 font-medium">
                {detectionMessage}
              </p>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 border-b border-neutral-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Watching somewhere else? Search metro, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 pt-1">
            {(['ALL', 'LIVE', 'EXPANSION'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === tab
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                {tab === 'ALL'
                  ? 'All Markets (Nationwide)'
                  : tab === 'LIVE'
                  ? 'Live Markets'
                  : 'Expansion Pipeline'}
              </button>
            ))}
          </div>
        </div>

        {/* Market List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-neutral-800/50">
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No markets found matching "{searchQuery}".
            </div>
          ) : (
            filteredMarkets.map((market) => {
              const isSelected = activeMarket.id === market.id;
              const isLive =
                market.launch_status === 'LIVE' ||
                market.launch_status === 'EXPANDING';

              return (
                <div
                  key={market.id}
                  onClick={() => handleSelectMarket(market)}
                  className={`pt-2 first:pt-0 group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/40'
                      : 'hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {market.state_code.split('/')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          {market.name}
                        </span>
                        {getStatusBadge(market.launch_status)}
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>{market.state}</span>
                        <span>•</span>
                        <span>
                          Pop.{' '}
                          {(market.population / 1000).toFixed(0)}k
                        </span>
                        <span>•</span>
                        <span>{market.radius} mi radius</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        Active
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Market-verified live sports intelligence</span>
          </div>
          <span className="text-neutral-400 font-mono">
            {allMarkets.length} metros staged
          </span>
        </div>
      </div>
    </div>
  );
};
