import React from 'react';
import { Home, Radio, Map, Search, User } from 'lucide-react';

export type NavTab = 'HOME' | 'LIVE' | 'MAP' | 'SEARCH' | 'PROFILE';

interface NavigationProps {
  currentTab: NavTab;
  onTabSelect: (tab: NavTab) => void;
  liveBadgeCount?: number;
  friendActivityCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabSelect,
  liveBadgeCount = 3,
  friendActivityCount = 4
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'HOME', label: 'Home', icon: Home },
    { id: 'LIVE', label: 'Live', icon: Radio, badge: liveBadgeCount, badgeColor: 'bg-red-500' },
    { id: 'MAP', label: 'Map', icon: Map },
    { id: 'SEARCH', label: 'Search', icon: Search },
    { id: 'PROFILE', label: 'Profile', icon: User, badge: friendActivityCount, badgeColor: 'bg-blue-500' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800/80 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabSelect(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200 font-medium'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-amber-400' : ''
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ring-2 ring-neutral-950 animate-pulse ${
                      item.badgeColor || 'bg-amber-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}>
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
