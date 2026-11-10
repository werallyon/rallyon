import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Building, Mail, Phone, Award } from 'lucide-react';
import { Venue } from '../types';

interface ClaimVenueModalProps {
  venue: Venue;
  onClose: () => void;
  onClaimSuccess: () => void;
}

export const ClaimVenueModal: React.FC<ClaimVenueModalProps> = ({ venue, onClose, onClaimSuccess }) => {
  const [managerName, setManagerName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [managerRole, setManagerRole] = useState('General Manager');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClaimSuccess();
    }, 1800);
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

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white">Verification Request Submitted</h3>
            <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto">
              Our venue relations team will verify your affiliation for <strong>{venue.name}</strong>. Once approved, you can verify games and broadcast watch parties.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Claim {venue.name}</h2>
                <p className="text-xs text-neutral-400">RallyOn Venue Partner Network</p>
              </div>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-3 mb-4 text-xs text-neutral-300 space-y-1.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Venue Truth Protection:</strong> Official managers can confirm active games, broadcast audio schedules, and post food & drink specials.
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 pl-6">
                * Note: Venue-reported data coordinates with, but does not override, independent real-time user crowd verification.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Official Business Email
                </label>
                <input
                  type="email"
                  required
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder={`manager@${venue.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                  Your Role
                </label>
                <select
                  value={managerRole}
                  onChange={(e) => setManagerRole(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="General Manager">General Manager</option>
                  <option value="Bar Manager / Beverage Director">Bar Manager / Beverage Director</option>
                  <option value="Owner / Operating Partner">Owner / Operating Partner</option>
                  <option value="Events Coordinator">Events Coordinator</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-bold text-neutral-300 hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-black shadow-lg shadow-amber-500/20"
                >
                  Request Verification
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
