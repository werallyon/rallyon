import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  X,
  Sparkles,
  Ticket,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Share2,
  Tv,
  Users
} from 'lucide-react';
import { Venue, SportsGame, Promotion, Redemption } from '../../types';
import { businessVenueService } from '../../services/businessVenueService';
import { signalEngine } from '../../services/signalEngine';
import { useAuth } from '../../context/AuthContext';

interface QRCheckInModalProps {
  venue: Venue;
  activeGame?: SportsGame | null;
  onClose: () => void;
  onCheckInSuccess: () => void;
}

export const QRCheckInModal: React.FC<QRCheckInModalProps> = ({
  venue,
  activeGame,
  onClose,
  onCheckInSuccess
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'SCAN' | 'CODE'>('SCAN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInState, setCheckInState] = useState<'INITIAL' | 'RALLIED' | 'ERROR'>('INITIAL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockedOffer, setUnlockedOffer] = useState<Promotion | null>(null);
  const [activeRedemption, setActiveRedemption] = useState<Redemption | null>(null);
  const [staffRedeemed, setStaffRedeemed] = useState(false);

  // Get active venue QR code
  const venueQR = businessVenueService.getOrCreateVenueQRCode(venue.id);
  const activePromos = businessVenueService.getPromotionsForVenue(venue.id);
  const bestPromo = activePromos[0];

  const handlePerformCheckIn = (method: 'QR_SCAN' | 'GPS_ASSISTED') => {
    if (!currentUser) return;
    setIsProcessing(true);
    setErrorMsg(null);

    setTimeout(() => {
      // 1. Register check-in with signal engine
      const privacy = currentUser.privacySettings?.presenceVisibility || 'SHOW_VENUE';
      const displayName =
        currentUser.privacySettings?.profileVisibility === 'PRIVATE'
          ? 'RallyOn Fan'
          : currentUser.firstName || currentUser.name;

      signalEngine.checkIn(
        currentUser.id,
        displayName,
        privacy === 'SHOW_VENUE' ? currentUser.avatar : '',
        venue.id,
        'WATCHING_GAME',
        activeGame ? `Watching ${activeGame.homeTeam.abbrev} vs ${activeGame.awayTeam.abbrev}!` : 'Rallied at the bar!',
        2
      );

      // 2. Track analytics event
      businessVenueService.recordAnalyticsEvent({
        venue_id: venue.id,
        user_id: currentUser.id,
        event_type: 'CHECK_IN',
        game_id: activeGame?.id
      });

      // 3. Attempt offer redemption if promotion exists
      if (bestPromo) {
        const res = businessVenueService.redeemOffer({
          token: venueQR.token,
          userId: currentUser.id,
          venueId: venue.id,
          promotionId: bestPromo.id
        });

        if (res.success && res.promotion) {
          setUnlockedOffer(res.promotion);
          setActiveRedemption(res.redemption || null);
        } else if (res.error) {
          // Already redeemed earlier today
          setUnlockedOffer(bestPromo);
          setStaffRedeemed(true);
        }
      }

      setIsProcessing(false);
      setCheckInState('RALLIED');
      onCheckInSuccess();
    }, 900);
  };

  const handleMarkStaffRedeemed = () => {
    setStaffRedeemed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Rally Here Check-In</h3>
              <p className="text-[11px] text-neutral-400">{venue.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State 1: INITIAL (Options to Scan or GPS confirm) */}
        {checkInState === 'INITIAL' && (
          <div className="p-5 space-y-4">
            {/* Promo banner preview */}
            {bestPromo && (
              <div className="p-3 bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-xs flex-shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Unlockable Reward
                  </span>
                  <h4 className="text-xs font-black text-white">{bestPromo.title}</h4>
                  <p className="text-[10px] text-neutral-400">{bestPromo.discount_value} with check-in</p>
                </div>
              </div>
            )}

            {/* Interactive QR Visual representation */}
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-inner flex flex-col items-center justify-center relative group">
                {/* Visual SVG QR pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-950">
                  <rect x="0" y="0" width="30" height="30" fill="currentColor" rx="4" />
                  <rect x="5" y="5" width="20" height="20" fill="white" rx="2" />
                  <rect x="10" y="10" width="10" height="10" fill="currentColor" rx="1" />

                  <rect x="70" y="0" width="30" height="30" fill="currentColor" rx="4" />
                  <rect x="75" y="5" width="20" height="20" fill="white" rx="2" />
                  <rect x="80" y="10" width="10" height="10" fill="currentColor" rx="1" />

                  <rect x="0" y="70" width="30" height="30" fill="currentColor" rx="4" />
                  <rect x="5" y="75" width="20" height="20" fill="white" rx="2" />
                  <rect x="10" y="80" width="10" height="10" fill="currentColor" rx="1" />

                  {/* QR Data nodes */}
                  <rect x="38" y="10" width="8" height="8" fill="currentColor" />
                  <rect x="50" y="15" width="12" height="8" fill="currentColor" />
                  <rect x="38" y="25" width="24" height="8" fill="currentColor" />
                  <rect x="10" y="42" width="18" height="8" fill="currentColor" />
                  <rect x="35" y="40" width="30" height="20" fill="currentColor" rx="2" />
                  <rect x="72" y="42" width="18" height="8" fill="currentColor" />
                  <rect x="38" y="68" width="10" height="22" fill="currentColor" />
                  <rect x="55" y="72" width="20" height="10" fill="currentColor" />
                  <rect x="80" y="72" width="10" height="18" fill="currentColor" />
                </svg>
                <div className="absolute inset-0 bg-amber-500/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black bg-black/80 text-amber-400 px-2 py-1 rounded">
                    Token: {venueQR.token.substring(0, 14)}...
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400">
                <span className="font-bold text-white block">Official Venue QR Token</span>
                Scan table tent at venue, or use 1-tap GPS verification.
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => handlePerformCheckIn('QR_SCAN')}
                disabled={isProcessing}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying QR Token...' : 'Scan Venue QR Code'}</span>
              </button>

              <button
                onClick={() => handlePerformCheckIn('GPS_ASSISTED')}
                disabled={isProcessing}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>I'm Here (GPS-Assisted Check-In)</span>
              </button>
            </div>
          </div>
        )}

        {/* State 2: RALLIED CELEBRATION & REWARD VOUCHER (Section 16) */}
        {checkInState === 'RALLIED' && (
          <div className="p-6 space-y-5 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 animate-bounce">
              <Sparkles className="w-8 h-8 fill-current" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-1">
                Check-In Confirmed
              </span>
              <h3 className="text-2xl font-black text-white">YOU'RE RALLIED 🔥</h3>
              <p className="text-xs text-neutral-300 mt-1">
                Checked into <span className="font-bold text-white">{venue.name}</span>
              </p>
            </div>

            {/* Live Context Card */}
            <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800 text-left space-y-2 text-xs">
              {activeGame && (
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-amber-400" />
                    Game Airing
                  </span>
                  <span className="font-bold text-white">
                    {activeGame.awayTeam.abbrev} @ {activeGame.homeTeam.abbrev}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Check-in Signal
                </span>
                <span className="text-emerald-400 font-bold">Active in Austin Feed</span>
              </div>
            </div>

            {/* Unlocked Reward / Voucher (Section 15 & 16) */}
            {unlockedOffer && (
              <div className="p-4 bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 border-2 border-dashed border-amber-500/50 rounded-2xl text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" />
                    Reward Voucher
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    {unlockedOffer.discount_value}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-white">{unlockedOffer.title}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{unlockedOffer.description}</p>
                </div>

                <div className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">Voucher Status</span>
                    <span className={staffRedeemed ? 'text-neutral-500 line-through' : 'text-emerald-400 font-black'}>
                      {staffRedeemed ? 'REDEEMED' : 'UNREDEEMED • READY TO SHOW'}
                    </span>
                  </div>

                  {!staffRedeemed ? (
                    <button
                      onClick={handleMarkStaffRedeemed}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition-colors"
                    >
                      Show to Server
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Server Validated
                    </span>
                  )}
                </div>

                <p className="text-[9px] text-neutral-500 text-center">
                  Terms: {unlockedOffer.terms} • Single use per customer today.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-2xl transition-colors"
            >
              Done & Return to Venue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
