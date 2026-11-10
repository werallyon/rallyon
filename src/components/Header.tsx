import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Zap, ChevronDown, Compass } from 'lucide-react';
import { marketService } from '../services/marketService';
import { MarketSelectorModal } from './market/MarketSelectorModal';
import { Market } from '../types';

interface HeaderProps {
  currentCity?: string;
  onCityChange?: (city: string) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onCityChange,
  isSimulating,
  onToggleSimulation
}) => {
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [activeMarket, setActiveMarket] = useState<Market>(
    marketService.getActiveMarket()
  );

  useEffect(() => {
    const unsubscribe = marketService.subscribe(() => {
      const current = marketService.getActiveMarket();
      setActiveMarket(current);
      if (onCityChange) {
        onCityChange(current.name);
      }
    });
    return unsubscribe;
  }, [onCityChange]);

  const handleMarketSelected = (market: Market) => {
    setActiveMarket(market);
    if (onCityChange) {
      onCityChange(market.name);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Brand & Positioning */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-xl text-white">
                  Rally<span className="text-amber-400">On</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium hidden sm:block">
                Sports + Social Venue Intelligence
              </p>
            </div>
          </div>

          {/* Market Selector & Real-Time Pulse */}
          <div className="flex items-center gap-2">
            {/* Simulation indicator */}
            <button
              onClick={onToggleSimulation}
              title={
                isSimulating
                  ? 'Real-time simulation running'
                  : 'Simulation paused'
              }
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
                isSimulating
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              <Activity
                className={`w-3 h-3 ${
                  isSimulating ? 'animate-pulse text-emerald-400' : ''
                }`}
              />
              <span className="hidden xs:inline">
                {isSimulating ? 'Live Pulse' : 'Paused'}
              </span>
            </button>

            {/* Dynamic Market Selector Pill */}
            <button
              onClick={() => setShowMarketModal(true)}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-200 transition-all group"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="max-w-[120px] truncate">
                {activeMarket.name.split('(')[0].trim()}
              </span>
              {activeMarket.launch_status === 'LIVE' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="text-[10px] text-amber-400 font-mono">
                  {activeMarket.launch_status.toLowerCase()}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Full Market Selector & GPS Modal */}
      <MarketSelectorModal
        isOpen={showMarketModal}
        onClose={() => setShowMarketModal(false)}
        onMarketSelected={handleMarketSelected}
      />
    </>
  );
};

