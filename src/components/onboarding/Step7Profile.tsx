import React, { useState } from 'react';
import { Camera, Check, ArrowRight, User as UserIcon, Star } from 'lucide-react';
import { User, TeamReference } from '../../types';

interface Step7ProfileProps {
  user: User;
  firstName: string;
  username: string;
  photoUrl: string;
  favoriteTeams: TeamReference[];
  onChangeFirstName: (val: string) => void;
  onChangeUsername: (val: string) => void;
  onChangePhotoUrl: (val: string) => void;
  onNext: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
];

export const Step7Profile: React.FC<Step7ProfileProps> = ({
  user,
  firstName,
  username,
  photoUrl,
  favoriteTeams,
  onChangeFirstName,
  onChangeUsername,
  onChangePhotoUrl,
  onNext
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(photoUrl || user.avatar || AVATAR_PRESETS[0]);

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    onChangePhotoUrl(url);
  };

  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-4 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">Confirm your profile</h2>
          <p className="text-xs text-neutral-400">
            This is how you'll appear to connected friends in Austin venues.
          </p>
        </div>

        {/* Avatar Selection */}
        <div className="text-center mb-5">
          <div className="relative inline-block mb-3">
            <img
              src={selectedAvatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-amber-500 shadow-xl mx-auto"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAvatar(preset)}
                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                  selectedAvatar === preset ? 'border-amber-500 scale-110' : 'border-neutral-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={preset} alt="preset" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <span className="text-[10px] text-neutral-500 mt-1 block">Photo is optional</span>
        </div>

        {/* Fields */}
        <div className="space-y-3 max-w-sm mx-auto">
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => onChangeFirstName(e.target.value)}
              placeholder="Your first name"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              RallyOn Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-neutral-500">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => onChangeUsername(e.target.value)}
                placeholder="handle"
                className="w-full pl-7 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Favorite Teams Summary */}
          {favoriteTeams.length > 0 && (
            <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                Selected Teams
              </span>
              <div className="flex flex-wrap gap-1">
                {favoriteTeams.map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  >
                    {t.logo} {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-neutral-900">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Complete Profile</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
