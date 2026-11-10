import React from 'react';
import { Bell, ArrowRight, ShieldCheck, Flame, Users, Trophy, Sparkles } from 'lucide-react';
import { NotificationPreferences } from '../../types';

interface Step6NotificationsProps {
  preferences: NotificationPreferences;
  onToggleCategory: (key: keyof NotificationPreferences) => void;
  onEnableAll: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export const Step6Notifications: React.FC<Step6NotificationsProps> = ({
  preferences,
  onToggleCategory,
  onEnableAll,
  onNext,
  onSkip
}) => {
  const categories: {
    key: keyof NotificationPreferences;
    title: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'favoriteTeamGames',
      title: 'Favorite team games',
      desc: 'Alerts when Cowboys, Longhorns, or your teams play',
      icon: <Trophy className="w-4 h-4 text-amber-400" />
    },
    {
      key: 'gameStartingSoon',
      title: 'Game starting soon',
      desc: '30-minute reminder before kickoff or tip-off',
      icon: <Bell className="w-4 h-4 text-blue-400" />
    },
    {
      key: 'gameNearYou',
      title: 'Game near you',
      desc: 'Venues within 3 miles with confirmed sound and screens',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />
    },
    {
      key: 'venueTrending',
      title: 'Venue trending',
      desc: 'Live crowd surge warnings (+30% velocity)',
      icon: <Flame className="w-4 h-4 text-orange-400" />
    },
    {
      key: 'friendsCheckingIn',
      title: 'Friends checking in',
      desc: 'When connected friends arrive at an Austin venue',
      icon: <Users className="w-4 h-4 text-purple-400" />
    },
    {
      key: 'recommendations',
      title: 'RallyOn recommendations',
      desc: 'Personalized spot picks tailored to your vibe',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />
    }
  ];

  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Bell className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Want to know when something's happening?
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            Stay ahead of full-capacity lines and last-minute sound verifications.
          </p>
        </div>

        {/* Quick Enable All Action */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 mb-3">
          <div>
            <span className="text-xs font-bold text-white block">Enable All Alerts</span>
            <span className="text-[10px] text-neutral-400">Zero spam, sports intelligence only</span>
          </div>
          <button
            type="button"
            onClick={onEnableAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors"
          >
            Enable All
          </button>
        </div>

        {/* Category Switches */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const enabled = preferences[cat.key];
            return (
              <div
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-950 flex items-center justify-center border border-neutral-800">
                    {cat.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-white">{cat.title}</span>
                    <span className="text-[10px] text-neutral-400">{cat.desc}</span>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enabled ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-neutral-900 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
        >
          Not Now
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
  );
};
