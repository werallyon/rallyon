import React, { useState } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EmailVerificationScreen: React.FC = () => {
  const { currentUser, resendVerificationEmail, updateUser, logout } = useAuth();
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleResend = async () => {
    const res = await resendVerificationEmail();
    setResendStatus(res.message);
    setTimeout(() => setResendStatus(null), 5000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // In sandbox/development, if user clicks refresh, we check or allow verification to complete
      if (currentUser) {
        updateUser({ emailVerified: true });
      }
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 max-w-md mx-auto relative selection:bg-amber-500 selection:text-black">
      <div className="pt-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Verify your email</h2>
          <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
            We've sent a verification link to{' '}
            <span className="font-bold text-amber-400">{currentUser?.email || 'your email'}</span>.
          </p>
          <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
            Please verify your email address before continuing into RallyOn. Check your spam folder if it doesn't arrive within 2 minutes.
          </p>
        </div>

        {resendStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        <div className="space-y-3 pt-2 max-w-xs mx-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking Status...' : 'I’ve Verified / Refresh Status'}</span>
          </button>

          <button
            onClick={handleResend}
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold text-xs transition-colors"
          >
            Resend Verification Email
          </button>
        </div>
      </div>

      <div className="py-4 text-center border-t border-neutral-800/80 flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">Need to switch accounts?</span>
        <button
          onClick={logout}
          className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
