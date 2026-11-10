import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Users, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WelcomeScreenProps {
  onGoToSignUp: () => void;
  onGoToSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGoToSignUp, onGoToSignIn }) => {
  const { signInWithGoogle, signInWithApple, signInDemoUser, isLoading, authError } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Ambient background stadium glow */}
      <div className="absolute -top-32 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding */}
      <div className="pt-8 text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span>Game Day Intelligence</span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-amber-500/30">
            R
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">RALLYON</h1>
        </div>

        {/* Value Proposition */}
        <div className="space-y-2 max-w-xs mx-auto">
          <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400 leading-snug">
            "Find the game. Find your people. Find your place."
          </p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Know what's happening. Know where the crowd is. Know where you fit.
          </p>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="my-6 grid grid-cols-3 gap-2 relative z-10">
        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-center flex flex-col items-center">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white block">Real-Time</span>
          <span className="text-[9px] text-neutral-400">Crowd & Decibels</span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-center flex flex-col items-center">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white block">Presence</span>
          <span className="text-[9px] text-neutral-400">Friend Signals</span>
        </div>

        <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-center flex flex-col items-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white block">Match AI</span>
          <span className="text-[9px] text-neutral-400">Vibe Alignment</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 relative z-10 pb-4">
        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {authError}
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={onGoToSignUp}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Secondary CTA */}
        <button
          onClick={onGoToSignIn}
          className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-sm tracking-wide transition-all"
        >
          Sign In
        </button>

        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-neutral-800" />
          <span className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            or continue with
          </span>
          <div className="flex-1 border-t border-neutral-800" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Google Sign-in */}
          <button
            onClick={() => signInWithGoogle()}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.7C3.5 20.5 7.4 23.8 12 23.8z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Apple Sign-in (Architecture ready) */}
          <button
            onClick={() => signInWithApple()}
            disabled={isLoading}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.58-11.2-20.73-14.7-33.44-3.5-12.72-5.25-24.57-5.25-35.56 0-14.53 3.65-26.68 10.96-36.45 7.3-9.76 16.63-14.75 27.97-14.96 4.8 0 10.23 1.25 16.29 3.76 6.06 2.5 10.02 3.82 11.89 3.97 1.5.15 5.76-1.25 12.78-4.22 7.02-2.96 13.08-4.28 18.17-3.97 13.7.83 24.37 5.75 32.02 14.76-11.98 7.23-17.82 17.2-17.52 29.89.3 9.94 4.15 18.23 11.56 24.87 7.41 6.64 16.34 10.42 26.8 11.35-2.3 7.03-5.02 14.28-8.15 21.75zM119.22 33.04c0-7.3 2.66-14.25 7.98-20.85 5.32-6.6 11.86-10.93 19.62-13 1.05 4.3 1.15 8.75.31 13.34-.84 4.59-2.6 9.07-5.28 13.44-2.85 4.54-6.34 8.08-10.48 10.63-4.14 2.55-8.23 4.02-12.28 4.41-.3-2.64-.45-5.3-.45-7.97z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

        {/* Clearly labeled isolated development demo bypass */}
        <div className="pt-2">
          <button
            onClick={() => signInDemoUser()}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Continue as Demo User (Austin Fan Demo)</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-neutral-500 pt-1">
          By continuing, you agree to RallyOn's Terms & Community Guidelines.
        </p>
      </div>
    </div>
  );
};
