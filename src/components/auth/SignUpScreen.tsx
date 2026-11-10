import React, { useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignUpScreenProps {
  onBack: () => void;
  onGoToSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onBack, onGoToSignIn }) => {
  const { signUp, signInWithGoogle, signInWithApple, isLoading, authError, clearAuthError } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    setValidationError(null);
    clearAuthError();

    if (!firstName.trim()) {
      setValidationError('Please enter your first name.');
      return false;
    }
    if (!lastName.trim()) {
      setValidationError('Please enter your last name.');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return false;
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setValidationError('Password must include at least one letter and one number.');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await signUp({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      username: username.trim() || undefined
    });
  };

  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

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
          <h2 className="text-2xl font-black text-white tracking-tight">Create your account</h2>
          <p className="text-xs text-neutral-400">
            Join thousands finding high-energy watch parties and verified games.
          </p>
        </div>

        {/* Errors */}
        {(validationError || authError) && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError || authError}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Taylor"
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Username (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Username
              </label>
              <span className="text-[10px] text-neutral-500">Optional</span>
            </div>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="atx_sports_fan"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Password Strength Indicators */}
          <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Check className="w-2.5 h-2.5" />
              </span>
              <span className={hasLength ? 'text-neutral-300' : 'text-neutral-500'}>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasLetter && hasNumber ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Check className="w-2.5 h-2.5" />
              </span>
              <span className={hasLetter && hasNumber ? 'text-neutral-300' : 'text-neutral-500'}>Contains letter & number</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'}`}>
                <Check className="w-2.5 h-2.5" />
              </span>
              <span className={passwordsMatch ? 'text-neutral-300' : 'text-neutral-500'}>Passwords match</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Social Options */}
        <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
          <button
            onClick={() => signInWithGoogle()}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z" />
              <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.7C3.5 20.5 7.4 23.8 12 23.8z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>

      {/* Bottom Switch */}
      <div className="py-4 text-center border-t border-neutral-800/80">
        <p className="text-xs text-neutral-400">
          Already have an account?{' '}
          <button
            onClick={onGoToSignIn}
            className="text-amber-400 font-bold hover:underline ml-1"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
