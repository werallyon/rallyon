import React, { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PasswordResetScreenProps {
  onBackToSignIn: () => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ onBackToSignIn }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError('Unable to send reset email at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 max-w-md mx-auto relative selection:bg-amber-500 selection:text-black">
      <div>
        {/* Top Bar */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <button
            onClick={onBackToSignIn}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-xs tracking-wider uppercase text-neutral-400">Password Reset</span>
          <div className="w-8" />
        </div>

        {!isSubmitted ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Forgot password?</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter the email address associated with your RallyOn account and we'll send you instructions to reset your password.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Check your email</h2>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                We've sent instructions to reset your RallyOn password.
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto pt-2">
                If an account exists for {email}, you'll receive a password recovery email within a few minutes. Check your spam folder if it doesn't appear.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={onBackToSignIn}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="py-4 text-center">
        <button
          onClick={onBackToSignIn}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Remember your password? <span className="text-amber-400 font-bold ml-1">Sign In</span>
        </button>
      </div>
    </div>
  );
};
