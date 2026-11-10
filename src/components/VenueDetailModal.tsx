import React, { useState } from 'react';
import {
  X,
  Zap,
  Tv,
  Volume2,
  Users,
  Clock,
  Compass,
  Bookmark,
  Share2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Flame,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Phone,
  ExternalLink,
  ChevronRight,
  Info,
  Ticket,
  QrCode,
  LayoutDashboard,
  Star
} from 'lucide-react';
import {
  Venue,
  VenueLiveState,
  UserIntent,
  RallyMatchResult,
  SportsGame,
  VenueGame,
  Presence
} from '../types';
import { INTENT_CONFIGS } from '../data/seedData';
import { QRCheckInModal } from './business/QRCheckInModal';
import { VenueClaimModal } from './business/VenueClaimModal';
import { businessVenueService } from '../services/businessVenueService';
import { googlePlacesService } from '../services/googlePlacesService';

interface VenueDetailModalProps {
  venue: Venue;
  liveState: VenueLiveState;
  matchResult: RallyMatchResult;
  currentIntent: UserIntent;
  activeGame?: SportsGame | null;
  venueGame?: VenueGame;
  friendsInside: Presence[];
  isSaved: boolean;
  onToggleSave: (venueId: string) => void;
  onClose: () => void;
  onCheckInSuccess?: () => void;
  onOpenDashboard?: (venueId: string) => void;
}

export const VenueDetailModal: React.FC<VenueDetailModalProps> = ({
  venue,
  liveState,
  matchResult,
  currentIntent,
  activeGame,
  venueGame,
  friendsInside,
  isSaved,
  onToggleSave,
  onClose,
  onCheckInSuccess,
  onOpenDashboard
}) => {
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const intentConfig = INTENT_CONFIGS[currentIntent];

  const claim = businessVenueService.getClaimForVenue(venue.id);
  const isClaimed = venue.claimed || claim?.verification_status === 'APPROVED';
  const promotions = businessVenueService.getPromotionsForVenue(venue.id);
  const activePromo = promotions[0];
  const programming = businessVenueService.getProgrammingForVenue(venue.id);
  const googlePlace = googlePlacesService.getPlaceForVenue(venue.id);
  const reliability = businessVenueService.calculateVenueReliability(venue.id);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Check out ${venue.name} on RallyOn! ${matchResult.score}% Rally Match for sports viewing.`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getMetricColor = (val: number, inverse = false) => {
    const score = inverse ? 100 - val : val;
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-600 text-black';
    if (score >= 75) return 'from-amber-400 to-orange-500 text-black';
    if (score >= 60) return 'from-orange-500 to-red-600 text-white';
    return 'from-neutral-700 to-neutral-800 text-neutral-300';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="min-h-screen max-w-md mx-auto bg-neutral-950 pb-24 border-x border-neutral-800/80 shadow-2xl">
        {/* Top Floating Control Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-neutral-300 bg-neutral-900/90 hover:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(venue.id)}
              className={`p-2 rounded-full border transition-all ${
                isSaved
                  ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Photo & Badges */}
        <div className="relative h-60 w-full overflow-hidden">
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

          {/* Floating Live Badge */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-lg shadow-red-600/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              {liveState.currentStatus}
            </span>
            {liveState.trendingVelocity > 15 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-black shadow-md">
                <TrendingUp className="w-3.5 h-3.5" />
                +{liveState.trendingVelocity}% Velocity
              </span>
            )}
          </div>

          {/* Title Header at bottom of image */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-amber-400 mb-1">
              <span>{venue.baseline.category}</span>
              <span>•</span>
              <span>{venue.neighborhood}</span>
              <span>•</span>
              <span>{venue.baseline.priceLevel}</span>
              {googlePlace && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    {googlePlace.rating}
                  </span>
                </>
              )}
              {isClaimed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Claimed ✓
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl font-black text-white leading-tight">{venue.name}</h1>
              {isClaimed && onOpenDashboard && (
                <button
                  onClick={() => onOpenDashboard(venue.id)}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shrink-0 flex items-center gap-1 shadow-md transition-transform active:scale-95"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {copiedLink && (
          <div className="mx-4 mt-2 p-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl text-center">
            Link copied to clipboard!
          </div>
        )}

        <div className="px-4 py-4 space-y-5">
          {/* RALLY MATCH SCORE CARD */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-900/80 border border-neutral-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Rally Match Engine
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-neutral-200">
                    Optimized for: <strong className="text-amber-400">{intentConfig.label}</strong> {intentConfig.emoji}
                  </span>
                </div>
              </div>

              {/* Big Score Gauge */}
              <div
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${getMatchScoreBg(
                  matchResult.score
                )} shadow-xl font-black`}
              >
                <span className="text-2xl leading-none">{matchResult.score}%</span>
                <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5">Match</span>
              </div>
            </div>

            {/* Match breakdown bars */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-[11px]">
              <div>
                <span className="text-neutral-400 block text-[10px]">Intent Fit</span>
                <span className="font-bold text-white">{matchResult.breakdown.intentAlignment}%</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Sports Focus</span>
                <span className="font-bold text-white">{matchResult.breakdown.sportsAffinity}%</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Viewing Sightlines</span>
                <span className="font-bold text-white">{matchResult.breakdown.viewingScore}%</span>
              </div>
            </div>
          </div>

          {/* ACTIVE PROMOTION / SPECIAL OFFER (Section 13 & 26) */}
          {activePromo && (
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-orange-500/15 border border-amber-500/40 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" />
                  Special: With RallyOn Check-In
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">
                  {activePromo.discount_value}
                </span>
              </div>
              <h3 className="text-sm font-black text-white">{activePromo.title}</h3>
              <p className="text-xs text-neutral-300 mt-1">{activePromo.description}</p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-[10px] text-neutral-400">{activePromo.terms}</span>
                <button
                  onClick={() => setShowCheckInModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1 shadow-md transition-transform active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Rally & Redeem</span>
                </button>
              </div>
            </div>
          )}

          {/* TONIGHT PROGRAMMING (Section 8 & 26) */}
          {programming.length > 0 && (
            <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  Tonight's Programming (Venue Controlled)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Venue Verified ✓
                </span>
              </div>

              <div className="space-y-2">
                {programming.map((prog) => (
                  <div key={prog.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{prog.notes || 'Featured Game Broadcast'}</span>
                      {prog.network && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {prog.network}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400">
                      <span>Screens: <b className="text-neutral-200">{prog.screen || 'Main Wall'}</b></span>
                      <span>•</span>
                      <span className={prog.audio_on ? 'text-blue-400 font-bold' : 'text-neutral-400'}>
                        Sound: {prog.audio_on ? 'ON 🔊' : 'Muted'}
                      </span>
                      {prog.featured && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">Featured Event 🎉</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GOOGLE PLACE & SPORTS AUDIT INTELLIGENCE (Section 3, 23 & 26) */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Place & Reliability Intelligence
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {reliability.score}% Sports Host Score
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Google Rating</span>
                <div className="flex items-center gap-1 mt-0.5 text-amber-400 font-black">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{googlePlace?.rating || 4.5}</span>
                  <span className="text-neutral-400 text-[10px] font-normal">
                    ({googlePlace?.userRatingsTotal || 1200} reviews)
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Sports Verification</span>
                <span className="font-bold text-white mt-0.5 block">
                  {reliability.verifiedGamesCount} verified games
                </span>
              </div>
            </div>
          </div>

          {/* GAME SECTION: GAME ON VERIFICATION */}
          {activeGame && (
            <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  Game Availability
                </span>

                {venueGame?.verificationStatus === 'GAME_ON' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    GAME ON 🔥
                  </span>
                ) : venueGame?.verificationStatus === 'LIKELY' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    LIKELY SHOWING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                    NOT CONFIRMED
                  </span>
                )}
              </div>

              <div className="bg-neutral-950/80 rounded-xl p-3 border border-neutral-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    {activeGame.awayTeam.name} vs {activeGame.homeTeam.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">{activeGame.league}</span>
                    <span>•</span>
                    {activeGame.liveDetails ? (
                      <span>
                        {activeGame.liveDetails.period} {activeGame.liveDetails.clock} ({activeGame.liveDetails.currentScore.away} - {activeGame.liveDetails.currentScore.home})
                      </span>
                    ) : (
                      <span>{activeGame.startTime}</span>
                    )}
                  </div>
                </div>

                {venueGame?.audioConfirmed && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audio On</span>
                  </div>
                )}
              </div>

              {venueGame?.screenAllocations && (
                <p className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-300">Screen Setup:</span> {venueGame.screenAllocations}
                </p>
              )}
            </div>
          )}

          {/* RIGHT NOW: LIVE VENUE TELEMETRY */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Right Now Telemetry
              </span>
              <span className="text-[10px] text-neutral-500">
                Live signals updated seconds ago
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Crowd */}
              <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 font-medium">Crowd Level</span>
                  <span className="font-bold text-white">{liveState.crowd}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all"
                    style={{ width: `${liveState.crowd}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">
                  {liveState.crowd >= 90 ? 'Packed to the brim' : liveState.crowd >= 70 ? 'Lively room' : 'Easy breathing room'}
                </span>
              </div>

              {/* Energy */}
              <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 font-medium">Atmosphere Energy</span>
                  <span className="font-bold text-amber-400">{liveState.energy}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${liveState.energy}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">
                  {liveState.energy >= 90 ? 'Electric & roaring' : liveState.energy >= 70 ? 'Engaged & cheering' : 'Relaxed & low-key'}
                </span>
              </div>

              {/* Noise */}
              <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 font-medium">Sound / Noise</span>
                  <span className="font-bold text-white">{liveState.noise} dB-idx</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${liveState.noise}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">
                  {liveState.noise >= 85 ? 'Loud stadium audio' : liveState.noise >= 65 ? 'Active bar chatter' : 'Conversational quiet'}
                </span>
              </div>

              {/* Seating Availability */}
              <div className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400 font-medium">Open Seating</span>
                  <span className="font-bold text-emerald-400">{liveState.seatingAvailability}%</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${liveState.seatingAvailability}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 block font-medium">
                  {liveState.seatingAvailability >= 50
                    ? 'Plenty of open seats'
                    : liveState.seatingAvailability >= 20
                    ? 'A few spots available'
                    : 'Standing room only'}
                </span>
              </div>
            </div>
          </div>

          {/* FRIENDS INSIDE */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Friends Here ({friendsInside.length})
              </span>
              <span className="text-[10px] text-neutral-500">Live Presence</span>
            </div>

            {friendsInside.length > 0 ? (
              <div className="space-y-2">
                {friendsInside.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={friend.userAvatar}
                        alt={friend.userName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/40"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{friend.userName}</div>
                        <div className="text-[11px] text-neutral-400 italic">"{friend.statusMessage}"</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Inside
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic bg-neutral-950/50 p-3 rounded-xl text-center">
                None of your connected friends are currently checked in here.
              </p>
            )}
          </div>

          {/* WHY YOU SHOULD GO & MAYBE SKIP IF */}
          <div className="grid grid-cols-1 gap-3">
            {/* Why you should go */}
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Why You Should Go
              </span>
              <ul className="space-y-1.5 text-xs text-neutral-200">
                {matchResult.whyYouShouldGo.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Maybe skip if / Not a good fit */}
            {matchResult.maybeSkipIf.length > 0 && (
              <div className="rounded-2xl bg-amber-950/20 border border-amber-500/20 p-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Maybe Skip If
                </span>
                <ul className="space-y-1.5 text-xs text-neutral-300">
                  {matchResult.maybeSkipIf.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* STRUCTURED VENUE TRUTH */}
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Venue Truth Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">
                Verified Profile
              </span>
            </div>

            {/* Sports Hardware & Packages */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Sports & Screens
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-200">
                <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/70">
                  <span className="text-neutral-500 block text-[10px]">Screens</span>
                  <span className="font-bold text-white">{venue.venueTruth.sports.numTvs} TVs</span>
                </div>
                <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/70">
                  <span className="text-neutral-500 block text-[10px]">Projection</span>
                  <span className="font-bold text-white">
                    {venue.venueTruth.sports.hasProjector ? 'Yes (Laser/LED)' : 'No'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                {venue.venueTruth.sports.screenSizes}
              </p>
              {venue.venueTruth.sports.sportsPackages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {venue.venueTruth.sports.sportsPackages.map((pkg, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md">
                      {pkg}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Environment Seating Ratio */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Seating Layout & Ratio
              </span>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-neutral-800">
                <div
                  style={{ width: `${venue.venueTruth.environment.seatingRatio.bar}%` }}
                  className="bg-amber-500"
                  title={`Bar Stools ${venue.venueTruth.environment.seatingRatio.bar}%`}
                />
                <div
                  style={{ width: `${venue.venueTruth.environment.seatingRatio.tables}%` }}
                  className="bg-blue-500"
                  title={`Tables & Booths ${venue.venueTruth.environment.seatingRatio.tables}%`}
                />
                <div
                  style={{ width: `${venue.venueTruth.environment.seatingRatio.standing}%` }}
                  className="bg-purple-500"
                  title={`Standing / Yard ${venue.venueTruth.environment.seatingRatio.standing}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Bar ({venue.venueTruth.environment.seatingRatio.bar}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Tables ({venue.venueTruth.environment.seatingRatio.tables}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Standing ({venue.venueTruth.environment.seatingRatio.standing}%)
                </span>
              </div>
            </div>

            {/* Audience profile */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Typical Crowd Profile
              </span>
              <p className="text-xs text-neutral-300">
                {venue.venueTruth.audience.typicalCrowdAge}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {venue.venueTruth.audience.groupFriendly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                    👥 Group Friendly
                  </span>
                )}
                {venue.venueTruth.audience.soloFriendly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                    🙋 Solo Friendly
                  </span>
                )}
                {venue.venueTruth.audience.familyFriendly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                    👨‍👩‍👧 Family Friendly
                  </span>
                )}
                {venue.venueTruth.environment.dogFriendly && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                    🐕 Dog Friendly
                  </span>
                )}
              </div>
            </div>

            {/* Food & Specials */}
            {venue.venueTruth.experience.foodSpecials.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                  Featured Game Day Bites & Sips
                </span>
                <div className="flex flex-wrap gap-1">
                  {venue.venueTruth.experience.foodSpecials.concat(venue.venueTruth.experience.drinkSpecials).map((item, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                      🍴 {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location & Contact Info */}
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{venue.address}, {venue.city}, {venue.state}</span>
            </div>
            {venue.phone && (
              <div className="flex items-center gap-2 text-neutral-300">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <a href={`tel:${venue.phone}`} className="hover:text-amber-400">
                  {venue.phone}
                </a>
              </div>
            )}
            {venue.website && (
              <div className="flex items-center gap-2 text-neutral-300">
                <ExternalLink className="w-4 h-4 text-neutral-400 shrink-0" />
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  Visit Official Website
                </a>
              </div>
            )}

            {/* Claim Venue Link */}
            <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-[11px]">
              <span className="text-neutral-500">Are you the manager or owner?</span>
              <button
                onClick={() => setShowClaimModal(true)}
                className="text-amber-400 hover:underline font-bold"
              >
                Claim this venue
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 p-3 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 flex gap-2.5">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Rally Here</span>
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${venue.name} ${venue.address} Austin TX`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Directions</span>
          </a>
        </div>

        {/* Modals */}
        {showCheckInModal && (
          <QRCheckInModal
            venue={venue}
            activePromotion={activePromo}
            onClose={() => setShowCheckInModal(false)}
            onCheckInSuccess={() => {
              setShowCheckInModal(false);
              if (onCheckInSuccess) onCheckInSuccess();
            }}
          />
        )}

        {showClaimModal && (
          <VenueClaimModal
            venue={venue}
            onClose={() => setShowClaimModal(false)}
            onSuccess={() => {
              setShowClaimModal(false);
              if (onOpenDashboard) onOpenDashboard(venue.id);
            }}
          />
        )}
      </div>
    </div>
  );
};
