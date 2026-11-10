import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  updateUser: (updates: Partial<User>) => User | null;
  completeOnboarding: () => User | null;
  logout: () => void;
  deleteAccount: () => boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Compute overall state
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
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.signUp(params);
      if (!res.success && res.error) {
        setAuthError(res.error);
      }
      return res;
    } catch (e: any) {
      const msg = e?.message || 'An unexpected error occurred during account creation.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (email: string, pass: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.signIn(email, pass);
      if (!res.success && res.error) {
        setAuthError(res.error);
      }
      return res;
    } catch (e: any) {
      const msg = e?.message || 'Unable to sign in. Please verify your credentials.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.signInWithGoogle();
      return res;
    } catch (e: any) {
      const msg = e?.message || 'Failed to authenticate with Google.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.signInWithApple();
      return res;
    } catch (e: any) {
      const msg = e?.message || 'Apple Sign-In is architecture ready but requires Apple Developer credentials.';
      setAuthError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await authService.signInDemoUser();
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    return authService.sendPasswordReset(email);
  };

  const handleResendVerification = async () => {
    return authService.resendVerificationEmail();
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return null;
    const updated = authService.updateUser(currentUser.id, updates);
    if (updated) setCurrentUser(updated);
    return updated;
  };

  const handleCompleteOnboarding = () => {
    if (!currentUser) return null;
    const updated = authService.completeOnboarding(currentUser.id);
    if (updated) setCurrentUser(updated);
    return updated;
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setAuthError(null);
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return false;
    const res = authService.deleteAccount(currentUser.id);
    if (res) {
      setCurrentUser(null);
      setAuthError(null);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authState,
        isLoading,
        authError,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleGoogleSignIn,
        signInWithApple: handleAppleSignIn,
        signInDemoUser: handleDemoSignIn,
        sendPasswordReset: handlePasswordReset,
        resendVerificationEmail: handleResendVerification,
        updateUser: handleUpdateUser,
        completeOnboarding: handleCompleteOnboarding,
        logout: handleLogout,
        deleteAccount: handleDeleteAccount,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
