import React, { useState } from 'react';
import {
  User as UserIcon,
  MapPin,
  Bookmark,
  Users,
  Settings,
  Shield,
  Activity,
  LogOut,
  Clock,
  Tv,
  Heart,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Bell,
  Eye,
  Trash2,
  AlertTriangle,
  Lock,
  Plus,
  X,
  Star
} from 'lucide-react';
import { Venue, Presence, UserIntent, TeamReference } from '../types';
import { signalEngine } from '../services/signalEngine';
import { sportsProvider } from '../services/sportsProvider';
import { useAuth } from '../context/AuthContext';
import { ONBOARDING_SPORTS, searchTeams } from '../data/teamsDatabase';
import { businessVenueService } from '../services/businessVenueService';
import { Building2, ShieldAlert, BarChart3, QrCode } from 'lucide-react';
import { TeamLogo } from './common/TeamLogo';

interface ProfileScreenProps {
  venues: Venue[];
  savedVenueIds: string[];
  presences: Presence[];
  onSelectVenue: (venue: Venue) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenVenueDashboard?: (venueId: string) => void;
  onOpenAdminModeration?: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  venues,
  savedVenueIds,
  presences,
  onSelectVenue,
  isSimulating,
  onToggleSimulation,
  onOpenVenueDashboard,
  onOpenAdminModeration
}) => {
  const { currentUser, updateUser, logout, deleteAccount, sendPasswordReset } = useAuth();

  // Local state for tabs or sections
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PREFERENCES' | 'BUSINESS' | 'SETTINGS'>('OVERVIEW');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState(currentUser?.firstName || 'Sports');
  const [editLastName, setEditLastName] = useState(currentUser?.lastName || 'Fan');
  const [editUsername, setEditUsername] = useState(currentUser?.username || 'austin_fan');
  const [selectedAvatar, setSelectedAvatar] = useState(
    currentUser?.profilePhotoUrl || currentUser?.avatar || AVATAR_PRESETS[0]
  );

  // Teams addition modal/search
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  // Feedback states
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [resetSentMsg, setResetSentMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!currentUser) return null;

  // Active check-in
  const myPresence = presences.find((p) => p.userId === currentUser.id);
  const checkedInVenue = myPresence ? venues.find((v) => v.id === myPresence.venueId) : null;
  const savedVenues = venues.filter((v) => savedVenueIds.includes(v.id));
  const friendPresences = presences.filter((p) => p.userId !== currentUser.id);

  const showFeedback = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSaveProfile = async () => {
    const result = await updateUser({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      name: `${editFirstName.trim()} ${editLastName.trim()}`,
      username: editUsername.trim(),
      profilePhotoUrl: selectedAvatar,
      avatar: selectedAvatar
    });
    if (!result.success) return;
    setIsEditingProfile(false);
    showFeedback('Profile updated successfully.');
  };

  const handleToggleSport = (sportId: string) => {
    const current = currentUser.favoriteSports || [];
    const updated = current.includes(sportId)
      ? current.filter((s) => s !== sportId)
      : [...current, sportId];
    updateUser({ favoriteSports: updated });
  };

  const handleRemoveTeam = (teamId: string) => {
    const updated = (currentUser.favoriteTeams || []).filter((t) => t.id !== teamId);
    updateUser({ favoriteTeams: updated });
    showFeedback('Team preferences updated.');
  };

  const handleAddTeam = (team: TeamReference) => {
    const current = currentUser.favoriteTeams || [];
    if (!current.some((t) => t.id === team.id)) {
      updateUser({ favoriteTeams: [...current, team] });
      showFeedback(`Added ${team.name} to your teams.`);
    }
    setTeamSearchQuery('');
    setShowAddTeamModal(false);
  };

  const handleToggleExperience = (exp: UserIntent) => {
    const current = currentUser.preferredExperience || [];
    const updated = current.includes(exp)
      ? current.filter((e) => e !== exp)
      : [...current, exp];
    updateUser({
      preferredExperience: updated.length > 0 ? updated : ['HIGH_ENERGY']
    });
  };

  const handleToggleNotification = (key: keyof typeof currentUser.notificationPreferences) => {
    const updated = {
      ...currentUser.notificationPreferences,
      [key]: !currentUser.notificationPreferences[key]
    };
    updateUser({ notificationPreferences: updated });
  };

  const handleUpdatePrivacy = (updates: Partial<typeof currentUser.privacySettings>) => {
    const updated = {
      ...currentUser.privacySettings,
      ...updates
    };
    updateUser({ privacySettings: updated });
    showFeedback('Privacy settings updated.');
  };

  const handlePasswordReset = async () => {
    if (!currentUser.email) return;
    await sendPasswordReset(currentUser.email);
    setResetSentMsg(`Password reset instructions sent to ${currentUser.email}`);
    setTimeout(() => setResetSentMsg(null), 5000);
  };

  const handleDeleteAccount = () => {
    deleteAccount();
  };

  const searchedTeams = searchTeams(teamSearchQuery, currentUser.favoriteSports);

  return (
    <div className="space-y-4 pb-12 animate-fadeIn max-w-md mx-auto">
      {/* Toast Feedback */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.profilePhotoUrl || currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/60 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{currentUser.name}</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {currentUser.authProvider.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-400">@{currentUser.username}</p>
              <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-amber-400" />
                {currentUser.homeCity}, {currentUser.homeState} • {currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-bold text-neutral-200"
          >
            {isEditingProfile ? 'Close' : 'Edit'}
          </button>
        </div>

        {/* Inline Profile Editing Drawer */}
        {isEditingProfile && (
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Edit Basic Profile
            </span>

            {/* Avatar picker */}
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1.5">Choose Avatar</label>
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(p)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                      selectedAvatar === p ? 'border-amber-500 scale-110' : 'border-neutral-800 opacity-60'
                    }`}
                  >
                    <img src={p} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">First Name</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Handle</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-900/80 p-1 border border-neutral-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`py-1.5 px-1 rounded-lg transition-colors text-center truncate ${
            activeTab === 'OVERVIEW'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('PREFERENCES')}
          className={`py-1.5 px-1 rounded-lg transition-colors text-center truncate ${
            activeTab === 'PREFERENCES'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Sports Vibes
        </button>
        <button
          onClick={() => setActiveTab('BUSINESS')}
          className={`py-1.5 px-1 rounded-lg transition-colors text-center truncate ${
            activeTab === 'BUSINESS'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Venue Hub
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`py-1.5 px-1 rounded-lg transition-colors text-center truncate ${
            activeTab === 'SETTINGS'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Account
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ACTIVITY */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Active Check-In Card */}
          {myPresence && checkedInVenue ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/40 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Active Check-In
                </span>
                <button
                  onClick={() => signalEngine.checkOut(currentUser.id)}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Check Out</span>
                </button>
              </div>

              <h3 className="text-base font-black text-white">{checkedInVenue.name}</h3>
              <p className="text-xs text-neutral-300 italic mt-0.5">
                "{myPresence.statusMessage}"
              </p>

              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Expires automatically in ~2 hrs
                </span>
                <button
                  onClick={() => onSelectVenue(checkedInVenue)}
                  className="text-amber-400 font-bold hover:underline"
                >
                  View Venue Intel →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center">
              <span className="text-xs font-bold text-neutral-300 block mb-1">
                Not currently checked in
              </span>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                Tap "Rally Here" on any venue page when you arrive to let friends know and power live intelligence.
              </p>
            </div>
          )}

          {/* Saved Venues */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                Saved Venues ({savedVenues.length})
              </span>
            </div>

            {savedVenues.length > 0 ? (
              <div className="space-y-2">
                {savedVenues.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => onSelectVenue(v)}
                    className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{v.name}</h4>
                      <div className="text-[11px] text-neutral-400">
                        {v.neighborhood} • {v.venueTruth.sports.numTvs} TVs
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic bg-neutral-950/50 p-3 rounded-xl text-center">
                No saved venues yet. Tap the bookmark icon on any venue card to save it.
              </p>
            )}
          </div>

          {/* Friends Inside Austin Venues */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Connected Friends in Austin ({friendPresences.length} Active)
              </span>
            </div>

            <div className="space-y-2">
              {friendPresences.map((friend) => {
                const v = venues.find((item) => item.id === friend.venueId);
                return (
                  <div
                    key={friend.id}
                    onClick={() => v && onSelectVenue(v)}
                    className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={friend.userAvatar}
                        alt={friend.userName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{friend.userName}</h4>
                        <p className="text-[11px] text-amber-400">
                          @ {v?.name} •{' '}
                          <span className="text-neutral-400 italic">"{friend.statusMessage}"</span>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      Inside
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREFERENCES & SPORTS */}
      {activeTab === 'PREFERENCES' && (
        <div className="space-y-4">
          {/* Favorite Teams Section */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                My Teams ({currentUser.favoriteTeams?.length || 0})
              </span>
              <button
                onClick={() => setShowAddTeamModal(true)}
                className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Team</span>
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              Venues with dedicated fan clubs for these teams receive a +12 score boost in your Rally Match feed.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {currentUser.favoriteTeams && currentUser.favoriteTeams.length > 0 ? (
                currentUser.favoriteTeams.map((team) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold"
                  >
                    <TeamLogo logo={team.logo} name={team.name} size="xs" />
                    <span>{team.name}</span>
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      className="hover:text-red-400 ml-1 text-sm font-black"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-500 italic">No favorite teams chosen yet.</span>
              )}
            </div>

            {/* Modal for adding team */}
            {showAddTeamModal && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Search Team Database</span>
                  <button
                    onClick={() => setShowAddTeamModal(false)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="Search Cowboys, Chiefs, Longhorns..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {searchedTeams.slice(0, 6).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleAddTeam(t)}
                      className="w-full p-2 text-left text-xs text-neutral-200 hover:bg-neutral-900 rounded-lg flex items-center justify-between"
                    >
                      <span>
                        {t.logo} {t.name} ({t.league})
                      </span>
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Followed Sports */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              Followed Sports
            </span>
            <div className="grid grid-cols-2 gap-2">
              {ONBOARDING_SPORTS.slice(0, 8).map((s) => {
                const isSelected = (currentUser.favoriteSports || []).includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleToggleSport(s.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                    </span>
                    {isSelected && <span className="text-amber-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferred Watching Experiences */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              Watching Vibes (Feeds Match Engine)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'HIGH_ENERGY', label: 'High Energy' },
                { id: 'CHILL', label: 'Chill & Seated' },
                { id: 'WITH_FRIENDS', label: 'With Friends' },
                { id: 'SOLO', label: 'Solo Friendly' },
                { id: 'HARDCORE_FANS', label: 'Hardcore Fans' },
                { id: 'BEST_VIEWING', label: 'Best Viewing' }
              ].map((vibe) => {
                const isSelected = (currentUser.preferredExperience || []).includes(
                  vibe.id as UserIntent
                );
                return (
                  <button
                    key={vibe.id}
                    onClick={() => handleToggleExperience(vibe.id as UserIntent)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span>{vibe.label}</span>
                    {isSelected && <span className="text-amber-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENUE BUSINESS HUB & OPERATIONS */}
      {activeTab === 'BUSINESS' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Venue Business & Operations Hub
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                Partner Network
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Manage venue claiming, sports game programming, QR offers, and live venue analytics.
            </p>
          </div>

          {/* Managed Venues */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Claimed Venues ({venues.filter((v) => v.claimed).length})
              </span>
              <span className="text-[10px] text-neutral-400">Austin, TX</span>
            </div>

            <div className="space-y-2">
              {venues
                .filter((v) => v.claimed)
                .map((claimedVenue) => (
                  <div
                    key={claimedVenue.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-black text-white">{claimedVenue.name}</h4>
                      <p className="text-[11px] text-neutral-400">
                        {claimedVenue.neighborhood} • <span className="text-emerald-400 font-semibold">Active Tier</span>
                      </p>
                    </div>

                    {onOpenVenueDashboard && (
                      <button
                        onClick={() => onOpenVenueDashboard(claimedVenue.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1 shadow-md transition-transform active:scale-95"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Open Dashboard</span>
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Platform Moderation Console Quick Launch */}
          {onOpenAdminModeration && (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Platform Admin Console
                </span>
                <span className="text-[10px] text-red-400 font-mono">STAFF ONLY</span>
              </div>
              <p className="text-xs text-neutral-300">
                Review pending claims, resolve Google Places duplicates, and audit sports host accuracy scores.
              </p>
              <button
                onClick={onOpenAdminModeration}
                className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-black text-xs flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Launch Admin Moderation Panel</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & ACCOUNT MANAGEMENT */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-4">
          {/* Notifications Toggles */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                Notification Controls
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'favoriteTeamGames', label: 'Favorite team game alerts' },
                { key: 'gameStartingSoon', label: '30m game kickoff reminders' },
                { key: 'gameNearYou', label: 'Live sound & screen confirmations near you' },
                { key: 'venueTrending', label: 'Crowd surge warnings (+30% capacity)' },
                { key: 'friendsCheckingIn', label: 'Friends checking into Austin venues' },
                { key: 'recommendations', label: 'RallyOn personalized spot recommendations' }
              ].map((item) => {
                const enabled =
                  currentUser.notificationPreferences[
                    item.key as keyof typeof currentUser.notificationPreferences
                  ];
                return (
                  <div
                    key={item.key}
                    onClick={() =>
                      handleToggleNotification(
                        item.key as keyof typeof currentUser.notificationPreferences
                      )
                    }
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 cursor-pointer hover:border-neutral-700"
                  >
                    <span className="text-neutral-300">{item.label}</span>
                    <div
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        enabled ? 'bg-amber-500' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Privacy & Visibility
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Profile Visibility</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleUpdatePrivacy({ profileVisibility: mode })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold ${
                        currentUser.privacySettings.profileVisibility === mode
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Location Sharing</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['PRECISE', 'APPROXIMATE', 'OFF'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleUpdatePrivacy({ locationSharing: mode })}
                      className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold ${
                        currentUser.privacySettings.locationSharing === mode
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security & Account Management */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              Security & Account
            </span>

            {resetSentMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {resetSentMsg}
              </div>
            )}

            <button
              onClick={handlePasswordReset}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Send Password Reset Email</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Out</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>

            <div className="pt-2 border-t border-neutral-800">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Permanent Account Deletion</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    This will permanently delete your RallyOn account, saved venues, and check-in history. This cannot be undone.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleDeleteAccount}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-black"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic & Engine Info */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>RallyOn Intelligence Engine</span>
            <span>v1.2.0 • Austin Prod</span>
          </div>
        </div>
      )}
    </div>
  );
};
