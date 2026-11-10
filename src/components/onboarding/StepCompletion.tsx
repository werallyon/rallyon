import React from 'react';
import { Sparkles, Trophy, ArrowRight, ShieldCheck, MapPin, Users } from 'lucide-react';
import { User } from '../../types';

interface StepCompletionProps {
  user: User;
  onFinish: () => void;
}

export const StepCompletion: React.FC<StepCompletionProps> = ({ user, onFinish }) => {
  return (
    <div className="flex flex-col justify-between min-h-[500px] text-center py-6">
      <div className="space-y-6 pt-4">
        {/* Glowing badge */}
        <div className="relative inline-block mx-auto">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-4xl shadow-2xl shadow-amber-500/40 mx-auto">
            R
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center border-2 border-neutral-950 font-black text-sm">
            ✓
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">You're Ready.</h2>
          <p className="text-sm text-neutral-300 max-w-xs mx-auto leading-relaxed">
            RallyOn is ready to find your next game-day spot.
          </p>
        </div>

        {/* Personalized Setup Summary Card */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-3 max-w-sm mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Rally Engine Active</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px]">TEAMS FOLLOWED</span>
              <span className="font-bold text-white">
                {user.favoriteTeams.length > 0
                  ? `${user.favoriteTeams.length} Selected`
                  : 'All Austin Sports'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px]">PREFERRED VIBE</span>
              <span className="font-bold text-white">
                {user.preferredExperience.length > 0
                  ? user.preferredExperience[0].replace('_', ' ')
                  : 'High Energy'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px]">HOME METRO</span>
              <span className="font-bold text-white">
                {user.homeCity || 'Austin'}, {user.homeState || 'TX'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px]">GAME SOUND PRIORITY</span>
              <span className="font-bold text-amber-400">Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div className="pt-6">
        <button
          onClick={onFinish}
          className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-base tracking-wider shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>RallyOn</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
