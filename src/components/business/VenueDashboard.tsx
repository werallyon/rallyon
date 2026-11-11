import React, { useState, useEffect } from 'react';
import {
  Building2,
  Tv,
  Calendar,
  Tag,
  BarChart3,
  Users,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Clock,
  Flame,
  ArrowLeft,
  Settings,
  DollarSign
} from 'lucide-react';
import {
  Venue,
  SportsGame,
  VenueGameProgramming,
  Promotion,
  Sponsorship,
  VenueAnalyticsSummary,
  BusinessRole
} from '../../types';
import { businessVenueService } from '../../services/businessVenueService';
import { supabase } from '../../lib/supabaseClient';
import {
  getVenueGameProgramming,
  upsertVenueGameProgramming,
  deleteVenueGameProgramming
} from '../../services/venueService';
import { getStoredGames as getDatabaseGames } from '../../services/gameService';
import { sportsService } from '../../services/sportsProvider';
import { googlePlacesService } from '../../services/googlePlacesService';
import { useAuth } from '../../context/AuthContext';

interface VenueDashboardProps {
  venue: Venue;
  onBackToApp: () => void;
  onUpdateVenue?: (updatedVenue: Venue) => void;
}

type DashboardTab =
  | 'OVERVIEW'
  | 'GAMES'
  | 'PROFILE'
  | 'PROMOTIONS'
  | 'SPONSORSHIPS'
  | 'CHECKINS'
  | 'ANALYTICS'
  | 'SETTINGS';

export const VenueDashboard: React.FC<VenueDashboardProps> = ({
  venue,
  onBackToApp,
  onUpdateVenue
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');
  const [upcomingGames, setUpcomingGames] = useState<SportsGame[]>([]);
  const [programming, setProgramming] = useState<VenueGameProgramming[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [analytics, setAnalytics] = useState<VenueAnalyticsSummary | null>(null);
  const isDatabaseVenue = Boolean(supabase && !venue.id.startsWith('venue_'));

  // Profile builder form states
  const [editName, setEditName] = useState(venue.name);
  const [editPhone, setEditPhone] = useState(venue.phone || '');
  const [editWebsite, setEditWebsite] = useState(venue.website || '');
  const [editTvs, setEditTvs] = useState(venue.venueTruth.sports.numTvs);
  const [editScreenSizes, setEditScreenSizes] = useState(venue.venueTruth.sports.screenSizes);
  const [editHasProjector, setEditHasProjector] = useState(venue.venueTruth.sports.hasProjector);
  const [editGameAudio, setEditGameAudio] = useState(venue.venueTruth.sports.gameAudio);
  const [editEnergy, setEditEnergy] = useState(venue.venueTruth.environment.energyBaseline);
  const [editCrowd, setEditCrowd] = useState(venue.venueTruth.environment.crowdBaseline);
  const [editNoise, setEditNoise] = useState(venue.venueTruth.environment.noiseBaseline);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // New Promotion form states
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('15% OFF');
  const [newPromoType, setNewPromoType] = useState<Promotion['promotion_type']>('CHECK_IN_DISCOUNT');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [showNewPromoModal, setShowNewPromoModal] = useState(false);

  // Load sports games and venue business data
  useEffect(() => {
    let mounted = true;

    const loadGamesAndProgramming = async () => {
      const games = isDatabaseVenue
        ? await getDatabaseGames().catch(() => [])
        : await sportsService.getGames();
      if (mounted) setUpcomingGames(games);

      if (isDatabaseVenue) {
        const dbProgramming = await getVenueGameProgramming().catch(() => []);
        if (mounted) setProgramming(dbProgramming.filter((p) => p.venue_id === venue.id));
      }
    };

    loadGamesAndProgramming();

    const refreshData = () => {
      if (!isDatabaseVenue) setProgramming(businessVenueService.getProgrammingForVenue(venue.id));
      setPromotions(businessVenueService.getPromotionsForVenue(venue.id));
      setSponsorships(businessVenueService.getSponsorships().filter((s) => s.venue_id === venue.id));
      setAnalytics(businessVenueService.getVenueAnalytics(venue.id));
    };

    refreshData();
    const unsub = businessVenueService.subscribe(refreshData);
    return () => {
      mounted = false;
      unsub();
    };
  }, [venue.id, isDatabaseVenue]);

  const showToast = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Handle programming toggle
  const handleToggleShowing = (game: SportsGame, isShowing: boolean) => {
    if (!currentUser) return;
    const payload = {
      venue_id: venue.id,
      game_id: game.id,
      network: game.broadcastNetwork || 'ESPN',
      status: isShowing ? 'GAME_ON' : 'NOT_SHOWING' as VenueGameProgramming['status'],
      audio_on: true,
      screen: 'Main Video Wall',
      featured: isShowing,
      notes: isShowing ? 'Verified Airing on Main Screens • Sound ON' : 'Not showing tonight',
      confidence: 100,
      is_confirmed: isShowing,
      created_by: currentUser.name,
      start_time: game.startTime
    };

    if (isDatabaseVenue) {
      try {
        const saved = await upsertVenueGameProgramming(payload);
        setProgramming((prev) => {
          const next = prev.filter((p) => p.game_id !== game.id);
          return isShowing ? [saved, ...next] : next;
        });
        showToast(`Updated programming for ${game.homeTeam.abbrev} vs ${game.awayTeam.abbrev}`);
      } catch (error) {
        console.warn('Unable to persist venue programming.', error);
        showToast('Could not save programming. Verify this venue is claimed by your account.');
      }
    } else {
      businessVenueService.saveProgramming(payload);
      setProgramming(businessVenueService.getProgrammingForVenue(venue.id));
      showToast(`Updated programming for ${game.homeTeam.abbrev} vs ${game.awayTeam.abbrev}`);
    }
  };

  const handleToggleAudio = async (prog: VenueGameProgramming) => {
    const nextAudio = !prog.audio_on;
    if (isDatabaseVenue) {
      try {
        const saved = await upsertVenueGameProgramming({ ...prog, audio_on: nextAudio });
        setProgramming((prev) => prev.map((item) => item.id === saved.id ? saved : item));
        showToast(`Game audio ${nextAudio ? 'ON' : 'OFF'}`);
      } catch (error) {
        console.warn('Unable to update venue programming audio.', error);
        showToast('Could not update audio. Verify this venue is claimed by your account.');
      }
      return;
    }

    businessVenueService.saveProgramming({ ...prog, audio_on: nextAudio });
    setProgramming(businessVenueService.getProgrammingForVenue(venue.id));
    showToast(`Game audio ${nextAudio ? 'ON' : 'OFF'}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Venue = {
      ...venue,
      name: editName,
      phone: editPhone,
      website: editWebsite,
      venueTruth: {
        ...venue.venueTruth,
        sports: {
          ...venue.venueTruth.sports,
          numTvs: editTvs,
          screenSizes: editScreenSizes,
          hasProjector: editHasProjector,
          gameAudio: editGameAudio
        },
        environment: {
          ...venue.venueTruth.environment,
          energyBaseline: editEnergy,
          crowdBaseline: editCrowd,
          noiseBaseline: editNoise
        }
      }
    };
    if (onUpdateVenue) onUpdateVenue(updated);
    showToast('Venue Truth & Profile saved successfully.');
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoTitle) return;

    businessVenueService.createPromotion({
      venue_id: venue.id,
      title: newPromoTitle.trim(),
      description: newPromoDesc.trim() || 'Show verified RallyOn check-in to server.',
      promotion_type: newPromoType,
      discount_value: newPromoDiscount,
      terms: 'Valid during verified game hours with RallyOn app check-in.',
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE'
    });

    setNewPromoTitle('');
    setNewPromoDesc('');
    setShowNewPromoModal(false);
    showToast('Promotion created & published to fans.');
  };

  const venueQR = businessVenueService.getOrCreateVenueQRCode(venue.id);
  const reliability = businessVenueService.calculateVenueReliability(venue.id);
  const placeMatch = googlePlacesService.getVenueMatch(venue.id);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans max-w-4xl mx-auto pb-24 animate-fadeIn">
      {/* Top Business Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Fan App</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">{venue.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-black">
                BUSINESS SUITE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {venue.neighborhood} • Reliability Score: <span className="text-emerald-400 font-bold">{reliability.score}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected to Austin Matrix</span>
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {saveFeedback && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Dashboard Sub-Tabs Navigation (Section 27) */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 overflow-x-auto flex gap-1 scrollbar-none">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: Building2 },
          { id: 'GAMES', label: "What We're Airing", icon: Tv },
          { id: 'PROFILE', label: 'Venue Truth Builder', icon: Layers },
          { id: 'PROMOTIONS', label: 'Promotions', icon: Tag },
          { id: 'SPONSORSHIPS', label: 'Sponsorships', icon: Flame },
          { id: 'CHECKINS', label: 'QR & Check-Ins', icon: QrCode },
          { id: 'ANALYTICS', label: 'Analytics ROI', icon: BarChart3 },
          { id: 'SETTINGS', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-6 flex-1">
        {/* TAB 1: OVERVIEW & BUSINESS VALUE STORY (Section 8 & 19) */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* ROI Value Proposition Banner (Section 19) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 border border-amber-500/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Your RallyOn Business Impact
                </span>
                <span className="text-[11px] text-neutral-400">Past 30 Days</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase">Appeared In Searches</span>
                  <span className="text-xl font-black text-white">1,284</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">High Intent Fans</span>
                </div>

                <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase">Tapped "Rally Here"</span>
                  <span className="text-xl font-black text-amber-400">86</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">6.7% Conversion</span>
                </div>

                <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase">Verified Check-Ins</span>
                  <span className="text-xl font-black text-emerald-400">42</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Through Doors</span>
                </div>

                <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase">Offer Redemptions</span>
                  <span className="text-xl font-black text-purple-400">18</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Direct Tab Spend</span>
                </div>
              </div>
            </div>

            {/* Tonight's Live Programming Highlights */}
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Active Programming Tonight</h3>
                  <p className="text-xs text-neutral-400">Games officially confirmed by your venue staff</p>
                </div>
                <button
                  onClick={() => setActiveTab('GAMES')}
                  className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Manage All Games</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {programming.length > 0 ? (
                <div className="space-y-3">
                  {programming.slice(0, 3).map((prog) => {
                    const game = upcomingGames.find((g) => g.id === prog.game_id);
                    return (
                      <div
                        key={prog.id}
                        className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {prog.status}
                            </span>
                            <span className="text-xs font-bold text-neutral-300">
                              {prog.network || 'ESPN'} • {prog.screen}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">
                            {game ? `${game.awayTeam.name} @ ${game.homeTeam.name}` : prog.game_id}
                          </h4>
                          <p className="text-xs text-amber-400 italic">"{prog.notes}"</p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleToggleAudio(prog)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              prog.audio_on
                                ? 'bg-amber-500 text-black'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {prog.audio_on ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            <span>Audio {prog.audio_on ? 'ON' : 'OFF'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center bg-neutral-950 rounded-2xl border border-neutral-800/80">
                  <p className="text-xs text-neutral-400 mb-2">No games programmed for tonight yet.</p>
                  <button
                    onClick={() => setActiveTab('GAMES')}
                    className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl"
                  >
                    Select Games We're Airing
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WHAT WE'RE AIRING (Section 10) */}
        {activeTab === 'GAMES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">What Are You Showing?</h3>
                <p className="text-xs text-neutral-400">
                  Tell RallyOn which games you intend to broadcast with sound or on main screens.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingGames.map((game) => {
                const existing = programming.find((p) => p.game_id === game.id);
                const isShowing = existing && existing.status === 'GAME_ON';

                return (
                  <div
                    key={game.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isShowing
                        ? 'bg-neutral-900 border-amber-500/40 shadow-lg'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {game.league}
                          </span>
                          <span className="text-[11px] text-neutral-400">
                            {game.broadcastNetwork || 'ESPN / National'}
                          </span>
                          {game.status === 'LIVE' && (
                            <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">
                              LIVE NOW
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-white">
                          {game.awayTeam.name} ({game.awayTeam.record || '7-3'}) @ {game.homeTeam.name} ({game.homeTeam.record || '8-2'})
                        </h4>

                        {existing && (
                          <div className="text-xs text-neutral-300 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-amber-400">
                              {existing.audio_on ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                              Audio {existing.audio_on ? 'ON' : 'OFF'}
                            </span>
                            <span>Screen: {existing.screen}</span>
                          </div>
                        )}
                      </div>

                      {/* 1-Click Action Buttons (Section 10) */}
                      <div className="flex items-center gap-2">
                        {isShowing ? (
                          <>
                            <button
                              onClick={() => existing && handleToggleAudio(existing)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                existing?.audio_on ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Sound {existing?.audio_on ? 'ON' : 'OFF'}</span>
                            </button>
                            <button
                              onClick={() => handleToggleShowing(game, false)}
                              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs rounded-xl"
                            >
                              Not Showing
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleToggleShowing(game, true)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                          >
                            + Confirm Showing
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: VENUE PROFILE BUILDER (Section 9) */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-black text-white">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Venue Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Official Website</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-black text-white">Sports Experience (Venue Truth)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Number of TVs</label>
                  <input
                    type="number"
                    value={editTvs}
                    onChange={(e) => setEditTvs(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 block mb-1">Screen Sizes / Specs</label>
                  <input
                    type="text"
                    value={editScreenSizes}
                    onChange={(e) => setEditScreenSizes(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editHasProjector}
                    onChange={(e) => setEditHasProjector(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-950 border-neutral-800"
                  />
                  <span>Has Megatron / Projector</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editGameAudio}
                    onChange={(e) => setEditGameAudio(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-950 border-neutral-800"
                  />
                  <span>Game Audio Priority on House PA</span>
                </label>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-black text-white">Atmosphere Baselines</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Energy Baseline</span>
                    <span className="font-bold text-amber-400">{editEnergy}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editEnergy}
                    onChange={(e) => setEditEnergy(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span>Crowd Baseline</span>
                    <span className="font-bold text-amber-400">{editCrowd}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editCrowd}
                    onChange={(e) => setEditCrowd(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-2xl shadow-xl transition-transform active:scale-95"
            >
              Save Venue Truth Updates
            </button>
          </form>
        )}

        {/* TAB 4: PROMOTIONS & REWARDS (Section 13) */}
        {activeTab === 'PROMOTIONS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Active Promotions</h3>
                <p className="text-xs text-neutral-400">Incentivize fans to check in with RallyOn</p>
              </div>
              <button
                onClick={() => setShowNewPromoModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Offer</span>
              </button>
            </div>

            {promotions.length > 0 ? (
              <div className="space-y-3">
                {promotions.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400">
                          {p.discount_value}
                        </span>
                        <span className="text-[10px] text-neutral-400 uppercase">{p.promotion_type}</span>
                      </div>
                      <h4 className="text-sm font-black text-white">{p.title}</h4>
                      <p className="text-xs text-neutral-400">{p.description}</p>
                      <p className="text-[11px] text-emerald-400 mt-1 font-bold">
                        {p.claims_count} fans redeemed this month
                      </p>
                    </div>

                    <button
                      onClick={() => businessVenueService.deletePromotion(p.id)}
                      className="p-2 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-neutral-900 rounded-3xl border border-neutral-800">
                <p className="text-xs text-neutral-400 mb-3">No active promotions created yet.</p>
                <button
                  onClick={() => setShowNewPromoModal(true)}
                  className="px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl"
                >
                  Create Your First Offer
                </button>
              </div>
            )}

            {/* Create Promo Modal */}
            {showNewPromoModal && (
              <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white">Create New Promotion</h4>
                <input
                  type="text"
                  placeholder="Offer Title (e.g. 15% Off Total Food Tab)"
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Discount Badge (e.g. 15% OFF, $5 PINTS)"
                  value={newPromoDiscount}
                  onChange={(e) => setNewPromoDiscount(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                />
                <textarea
                  rows={2}
                  placeholder="Redemption details for server..."
                  value={newPromoDesc}
                  onChange={(e) => setNewPromoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreatePromo}
                    className="flex-1 py-2 bg-amber-500 text-black font-black text-xs rounded-xl"
                  >
                    Publish Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPromoModal(false)}
                    className="px-4 py-2 bg-neutral-800 text-neutral-300 text-xs rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SPONSORSHIPS (Section 11 & 12) */}
        {activeTab === 'SPONSORSHIPS' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Sponsored Games</h3>
              <p className="text-xs text-neutral-400">
                Sponsor key match-ups as "Game of the Night" to appear at the top of game feeds.
              </p>
            </div>

            {sponsorships.length > 0 ? (
              <div className="space-y-3">
                {sponsorships.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">
                        {s.creative.tagline || 'SPONSORED'}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">ACTIVE CAMPAIGN</span>
                    </div>
                    <h4 className="text-sm font-black text-white">{s.creative.headline}</h4>
                    <p className="text-xs text-neutral-300">{s.creative.description}</p>
                    <div className="pt-2 border-t border-neutral-800 flex gap-4 text-[11px] text-neutral-400">
                      <span>Impressions: <b className="text-white">{s.impressions}</b></span>
                      <span>Clicks: <b className="text-white">{s.clicks}</b></span>
                      <span>Check-ins: <b className="text-white">{s.check_ins}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-neutral-900 rounded-3xl border border-neutral-800 text-xs text-neutral-400">
                No active game sponsorships. Contact RallyOn ad operations to launch a promoted game campaign.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CHECK-INS & QR CODES (Section 14 & 15) */}
        {activeTab === 'CHECKINS' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-3">
              <h3 className="text-sm font-black text-white">Venue QR Table Token</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Display this QR code at your entrance or bar tops. Rotating anti-abuse tokens prevent screenshot fraud.
              </p>

              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
                <QrCode className="w-40 h-40 text-neutral-950" />
              </div>

              <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-400 inline-block">
                Token: <span className="font-mono text-amber-400">{venueQR.token}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ANALYTICS ROI (Section 18 & 19) */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div className="space-y-4">
            <h3 className="text-base font-black text-white">Performance & Discovery Analytics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Profile Views</span>
                <span className="text-lg font-black text-white">{analytics.discovery.profileViews}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Map Views</span>
                <span className="text-lg font-black text-white">{analytics.discovery.mapViews}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Game Screen Views</span>
                <span className="text-lg font-black text-white">{analytics.discovery.gameViews}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Direction Requests</span>
                <span className="text-lg font-black text-white">{analytics.engagement.directions}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Rally Here Taps</span>
                <span className="text-lg font-black text-amber-400">{analytics.engagement.gameSelections}</span>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">Verified Check-Ins</span>
                <span className="text-lg font-black text-emerald-400">{analytics.social.checkIns}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: SETTINGS & BILLING TIER (Section 20) */}
        {activeTab === 'SETTINGS' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
              <h3 className="text-sm font-black text-white">Monetization & Subscription Tier</h3>
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-400 block">PRO VENUE TIER</span>
                  <p className="text-[11px] text-neutral-400">Unlimited programming, promotions, and real-time crowd analytics.</p>
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Google Places Identity Info */}
            <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-2">
              <h3 className="text-sm font-black text-white">Google Places Match Status</h3>
              <p className="text-xs text-neutral-400">
                Place ID: <span className="font-mono text-white">{placeMatch?.placeId || 'Not Linked'}</span>
              </p>
              <p className="text-[11px] text-emerald-400">
                Match Confidence: {placeMatch?.matchConfidence || 99}% ({placeMatch?.matchSource})
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
