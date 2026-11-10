import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignInScreenProps {
  onBack: () => void;
  onGoToSignUp: () => void;
  onGoToForgotPassword: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onBack,
  onGoToSignUp,
  onGoToForgotPassword
}) => {
  const { signIn, signInWithGoogle, signInWithApple, signInDemoUser, isLoading, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearAuthError();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    await signIn(email, password);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-6 max-w-md mx-auto relative selection:bg-amber-500 selection:text-black">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-black font-black text-xs">
              R
            </div>
            <span className="font-black text-sm tracking-wider">RALLYON</span>
          </div>
          <div className="w-8" />
        </div>

        {/* Heading */}
        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
          <p className="text-xs text-neutral-400">
            Sign in to access your saved venues, live match signals, and friend network.
          </p>
        </div>

        {/* Error message */}
        {(validationError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                placeholder="alex.taylor@rallyon.app"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={onGoToForgotPassword}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-neutral-800" />
          <span className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 border-t border-neutral-800" />
        </div>

        {/* Social Options */}
        <div className="space-y-2">
          <button
            onClick={() => signInWithGoogle()}
            disabled={isLoading}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z" />
              <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.7C3.5 20.5 7.4 23.8 12 23.8z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={() => signInWithApple()}
            disabled={isLoading}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.58-11.2-20.73-14.7-33.44-3.5-12.72-5.25-24.57-5.25-35.56 0-14.53 3.65-26.68 10.96-36.45 7.3-9.76 16.63-14.75 27.97-14.96 4.8 0 10.23 1.25 16.29 3.76 6.06 2.5 10.02 3.82 11.89 3.97 1.5.15 5.76-1.25 12.78-4.22 7.02-2.96 13.08-4.28 18.17-3.97 13.7.83 24.37 5.75 32.02 14.76-11.98 7.23-17.82 17.2-17.52 29.89.3 9.94 4.15 18.23 11.56 24.87 7.41 6.64 16.34 10.42 26.8 11.35-2.3 7.03-5.02 14.28-8.15 21.75zM119.22 33.04c0-7.3 2.66-14.25 7.98-20.85 5.32-6.6 11.86-10.93 19.62-13 1.05 4.3 1.15 8.75.31 13.34-.84 4.59-2.6 9.07-5.28 13.44-2.85 4.54-6.34 8.08-10.48 10.63-4.14 2.55-8.23 4.02-12.28 4.41-.3-2.64-.45-5.3-.45-7.97z" />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Demo User Fast Access */}
        <div className="pt-4">
          <button
            onClick={() => signInDemoUser()}
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-semibold text-center transition-colors"
          >
            ⚡ Fast Demo Sign-In (Alex Taylor)
          </button>
        </div>
      </div>

      {/* Bottom Switch */}
      <div className="py-4 text-center border-t border-neutral-800/80">
        <p className="text-xs text-neutral-400">
          Don't have an account?{' '}
          <button
            onClick={onGoToSignUp}
            className="text-amber-400 font-bold hover:underline ml-1"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};
