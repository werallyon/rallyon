import React from 'react';
import { ArrowRight, Check, Flame, Beer, Users, UserCheck, Megaphone, Tv } from 'lucide-react';
import { UserIntent } from '../../types';

interface ExperienceOption {
  id: UserIntent;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    id: 'HIGH_ENERGY',
    title: 'HIGH ENERGY',
    subtitle: 'Give me the loud crowd and big-game atmosphere.',
    icon: <Flame className="w-5 h-5 text-amber-400" />,
    accent: 'border-amber-500/50 bg-amber-500/10'
  },
  {
    id: 'CHILL',
    title: 'CHILL',
    subtitle: 'I want to actually watch the game.',
    icon: <Beer className="w-5 h-5 text-blue-400" />,
    accent: 'border-blue-500/50 bg-blue-500/10'
  },
  {
    id: 'WITH_FRIENDS',
    title: 'WITH FRIENDS',
    subtitle: 'I want a place where my group can hang out.',
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    accent: 'border-emerald-500/50 bg-emerald-500/10'
  },
  {
    id: 'SOLO',
    title: 'SOLO',
    subtitle: "I'm good going by myself.",
    icon: <UserCheck className="w-5 h-5 text-purple-400" />,
    accent: 'border-purple-500/50 bg-purple-500/10'
  },
  {
    id: 'HARDCORE_FANS',
    title: 'HARDCORE FANS',
    subtitle: 'Put me around people who really care.',
    icon: <Megaphone className="w-5 h-5 text-red-400" />,
    accent: 'border-red-500/50 bg-red-500/10'
  },
  {
    id: 'BEST_VIEWING',
    title: 'BEST VIEWING',
    subtitle: 'Give me the best setup to actually watch.',
    icon: <Tv className="w-5 h-5 text-cyan-400" />,
    accent: 'border-cyan-500/50 bg-cyan-500/10'
  }
];

interface Step4ExperienceProps {
  selectedExperiences: UserIntent[];
  onToggleExperience: (exp: UserIntent) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const Step4Experience: React.FC<Step4ExperienceProps> = ({
  selectedExperiences,
  onToggleExperience,
  onNext,
  onSkip
}) => {
  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-4 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">
            How do you like to watch?
          </h2>
          <p className="text-xs text-neutral-400">
            What kind of game-day experience are you looking for? (Choose all that apply)
          </p>
        </div>

        {/* Options list */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {EXPERIENCE_OPTIONS.map((opt) => {
            const isSelected = selectedExperiences.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggleExperience(opt.id)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? `${opt.accent} border-amber-500 shadow-md shadow-amber-500/10`
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-950 flex items-center justify-center flex-shrink-0 border border-neutral-800">
                    {opt.icon}
                  </div>
                  <div>
                    <span className="text-xs font-black tracking-wider text-white block">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-snug">
                      "{opt.subtitle}"
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                    isSelected
                      ? 'bg-amber-500 text-black'
                      : 'border border-neutral-700'
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
          {selectedExperiences.length} preference{selectedExperiences.length !== 1 ? 's' : ''} set
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
