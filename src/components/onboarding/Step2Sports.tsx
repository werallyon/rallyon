import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { ONBOARDING_SPORTS } from '../../data/teamsDatabase';

interface Step2SportsProps {
  selectedSports: string[];
  onToggleSport: (sportId: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const Step2Sports: React.FC<Step2SportsProps> = ({
  selectedSports,
  onToggleSport,
  onNext,
  onSkip
}) => {
  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-4 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">
            What sports do you follow?
          </h2>
          <p className="text-xs text-neutral-400">
            Select all that apply. We'll show games and fan hubs for these sports.
          </p>
        </div>

        {/* Sports Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1 pb-2">
          {ONBOARDING_SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport.id);
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => onToggleSport(sport.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{sport.icon}</span>
                  <div>
                    <span className="text-xs font-bold block">{sport.name}</span>
                    <span className="text-[10px] text-neutral-500">{sport.category}</span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-amber-500 text-black'
                      : 'border border-neutral-700 group-hover:border-neutral-500'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-neutral-900 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400">
          {selectedSports.length} sport{selectedSports.length !== 1 ? 's' : ''} selected
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
