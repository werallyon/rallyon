import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Users, Tv, Sparkles } from 'lucide-react';
import { Venue, PresenceActivity } from '../types';
import { signalEngine } from '../services/signalEngine';
import { CURRENT_USER } from '../data/seedData';

interface CheckInModalProps {
  venue: Venue;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ venue, onClose, onSuccess }) => {
  const [activity, setActivity] = useState<PresenceActivity>('WATCHING_GAME');
  const [statusMessage, setStatusMessage] = useState('');
  const [durationHours, setDurationHours] = useState(2);

  const activities: Array<{
    id: PresenceActivity;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultMessage: string;
  }> = [
    {
      id: 'WATCHING_GAME',
      label: 'Watching Game',
      icon: Tv,
      defaultMessage: 'Locked in on the game here!'
    },
    {
      id: 'WITH_FRIENDS',
      label: 'With Friends',
      icon: Users,
      defaultMessage: 'Grabbed a table with friends!'
    },
    {
      id: 'LOOKING_TO_SOCIALIZE',
      label: 'Socializing',
      icon: Sparkles,
      defaultMessage: 'Here watching sports & happy to chat!'
    },
    {
      id: 'JUST_ARRIVED',
      label: 'Just Arrived',
      icon: Clock,
      defaultMessage: 'Just walked in, checking out the vibe'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMessage =
      statusMessage.trim() ||
      activities.find((a) => a.id === activity)?.defaultMessage ||
      'Watching the game';

    signalEngine.checkIn(
      CURRENT_USER.id,
      CURRENT_USER.name,
      CURRENT_USER.avatar,
      venue.id,
      activity,
      finalMessage,
      durationHours
    );

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RallyOn Live Presence
          </div>
          <h2 className="text-xl font-black text-white">Check In at {venue.name}</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Let your friends know you're here and contribute to live crowd intelligence. Presence automatically expires.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              What are you doing?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activities.map((item) => {
                const Icon = item.icon;
                const isSelected = activity === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivity(item.id);
                      if (!statusMessage) setStatusMessage(item.defaultMessage);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status message */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Status Message (Optional)
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g., Table on the patio, Cowboys game on loud!"
              maxLength={70}
              className="w-full px-3 py-2 bg-neutral-800/90 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Presence Expiration
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setDurationHours(hours)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    durationHours === hours
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Your check-in will automatically disappear after {durationHours} hours to keep signals fresh.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-bold text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-xs font-black text-black shadow-lg shadow-orange-500/20 transition-all"
            >
              I'm Here Now 🔥
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
