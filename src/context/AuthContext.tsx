import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authService, SignUpParams, AuthResponse } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  authState: AuthState;
  isLoading: boolean;
  authError: string | null;
  signUp: (params: SignUpParams) => Promise<AuthResponse>;
  signIn: (email: string, pass: string) => Promise<AuthResponse>;
  signInWithGoogle: () => Promise<AuthResponse>;
  signInWithApple: () => Promise<AuthResponse>;
  signInDemoUser: () => Promise<AuthResponse>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message: string }>;
  updateUser: (updates: Partial<User>) => Promise<AuthResponse>;
  completeOnboarding: () => Promise<AuthResponse>;
  profileSaveError: string | null;
  clearProfileSaveError: () => void;
  logout: () => void;
  deleteAccount: () => boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const authRequestRevision = useRef(0);

  useEffect(() => {
    let mounted = true;
    const initializationRevision = authRequestRevision.current;
    const unsubscribe = authService.subscribe((user) => {
      if (mounted) {
        setCurrentUser(user);
        if (user) setAuthError(null);
      }
    });
    authService.initialize()
      .catch((e: any) => {
        if (mounted && initializationRevision === authRequestRevision.current) {
          setAuthError(e?.message || 'Unable to initialize authentication.');
        }
      })
      .finally(() => {
        if (mounted && initializationRevision === authRequestRevision.current) setIsLoading(false);
      });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const authState: AuthState = (() => {
    if (isLoading) return 'AUTH_IN_PROGRESS';
    if (authError) return 'AUTH_ERROR';
    if (!currentUser) return 'LOGGED_OUT';
    if (!currentUser.emailVerified) return 'EMAIL_VERIFICATION_REQUIRED';
    if (!currentUser.onboardingCompleted) return 'AUTHENTICATED_ONBOARDING_INCOMPLETE';
    return 'AUTHENTICATED_ONBOARDING_COMPLETE';
  })();

  const clearAuthError = () => setAuthError(null);

  const handleSignUp = async (params: SignUpParams): Promise<AuthResponse> => {
    const requestRevision = ++authRequestRevision.current;
    setIsLoading(true); setAuthError(null);
    try {
      const res = await authService.signUp(params);
      if (requestRevision === authRequestRevision.current && (!res.success || res.requiresEmailVerification)) setAuthError(res.error || 'Please check your email to continue.');
      return res;
    } catch (e: any) {
      const msg = e?.message || 'An unexpected error occurred during account creation.';
      if (requestRevision === authRequestRevision.current) setAuthError(msg); return { success: false, error: msg };
    } finally { if (requestRevision === authRequestRevision.current) setIsLoading(false); }
  };

  const handleSignIn = async (email: string, pass: string): Promise<AuthResponse> => {
    const requestRevision = ++authRequestRevision.current;
    setIsLoading(true); setAuthError(null);
    try {
      const res = await authService.signIn(email, pass);
      if (requestRevision === authRequestRevision.current && !res.success && res.error) setAuthError(res.error);
      return res;
    } catch (e: any) {
      const msg = e?.message || 'Unable to sign in. Please verify your credentials.';
      if (requestRevision === authRequestRevision.current) setAuthError(msg); return { success: false, error: msg };
    } finally { if (requestRevision === authRequestRevision.current) setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    const requestRevision = ++authRequestRevision.current;
    setIsLoading(true); setAuthError(null);
    try { return await authService.signInWithGoogle(); }
    catch (e: any) { const msg = e?.message || 'Failed to authenticate with Google.'; if (requestRevision === authRequestRevision.current) setAuthError(msg); return { success: false, error: msg }; }
    finally { if (requestRevision === authRequestRevision.current) setIsLoading(false); }
  };

  const handleAppleSignIn = async () => {
    const requestRevision = ++authRequestRevision.current;
    setIsLoading(true); setAuthError(null);
    try { return await authService.signInWithApple(); }
    catch (e: any) { const msg = e?.message || 'Failed to authenticate with Apple.'; if (requestRevision === authRequestRevision.current) setAuthError(msg); return { success: false, error: msg }; }
    finally { if (requestRevision === authRequestRevision.current) setIsLoading(false); }
  };

  const handleDemoSignIn = async () => { const requestRevision = ++authRequestRevision.current; setIsLoading(true); setAuthError(null); try { return await authService.signInDemoUser(); } finally { if (requestRevision === authRequestRevision.current) setIsLoading(false); } };
  const handlePasswordReset = async (email: string) => authService.sendPasswordReset(email);
  const handleResendVerification = async () => authService.resendVerificationEmail();
  const handleUpdateUser = async (updates: Partial<User>): Promise<AuthResponse> => {
    if (!currentUser) return { success: false, error: 'You must be signed in to save profile changes.' };
    // AuthService publishes persisted profile state only after its transactional
    // RPC commits. The returned result and shared notice expose persistence failures.
    const result = await authService.updateUser(currentUser.id, updates);
    setProfileSaveError(result.success ? null : result.error || 'Unable to save your profile. Please retry.');
    return result;
  };
  const handleCompleteOnboarding = async (): Promise<AuthResponse> => {
    if (!currentUser) return { success: false, error: 'You must be signed in to complete onboarding.' };
    // Do not bypass the canonical persistence boundary with an optimistic
    // context update; AuthService notifies subscribers after commit.
    const result = await authService.completeOnboarding(currentUser.id);
    setProfileSaveError(result.success ? null : result.error || 'Unable to complete onboarding. Please retry.');
    return result;
  };
  const handleLogout = () => { authRequestRevision.current++; authService.logout(); setCurrentUser(null); setAuthError(null); setProfileSaveError(null); setIsLoading(false); };
  const handleDeleteAccount = () => {
    if (!currentUser) return false;
    const res = authService.deleteAccount(currentUser.id);
    if (res) { setCurrentUser(null); setAuthError(null); }
    return res;
  };

  return <AuthContext.Provider value={{
    currentUser, authState, isLoading, authError, signUp: handleSignUp, signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn, signInWithApple: handleAppleSignIn, signInDemoUser: handleDemoSignIn,
    sendPasswordReset: handlePasswordReset, resendVerificationEmail: handleResendVerification,
    updateUser: handleUpdateUser, completeOnboarding: handleCompleteOnboarding, logout: handleLogout,
    deleteAccount: handleDeleteAccount, clearAuthError, profileSaveError, clearProfileSaveError: () => setProfileSaveError(null)
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
