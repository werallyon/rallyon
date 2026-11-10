import React from 'react';
import { ArrowRight, Sparkles, Compass, ShieldCheck, Flame } from 'lucide-react';
import { User } from '../../types';

interface Step1WelcomeProps {
  user: User;
  onNext: () => void;
  onSkipAll: () => void;
}

export const Step1Welcome: React.FC<Step1WelcomeProps> = ({ user, onNext, onSkipAll }) => {
  return (
    <div className="flex flex-col justify-between min-h-[500px] text-center py-4">
      <div className="space-y-6 pt-4">
        {/* Animated Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/10">
          <Flame className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Let's personalize RallyOn.
          </h2>
          <p className="text-sm text-neutral-300 max-w-xs mx-auto leading-relaxed">
            Tell us a little about what you're into and we'll show you better places to watch.
          </p>
        </div>

        {/* Quick Preview Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left space-y-2.5 max-w-sm mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Takes ~60 seconds to tailor:</span>
          </div>
          <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
            <li>Your favorite sports and booster teams</li>
            <li>Crowd vibe (electric watch parties vs. chill craft spots)</li>
            <li>Screen sightlines and game audio preferences</li>
          </ul>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-6">
        <button
          onClick={onNext}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Let's Go</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onSkipAll}
          className="w-full py-2.5 px-4 rounded-xl text-xs text-neutral-400 hover:text-white font-semibold transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
};
