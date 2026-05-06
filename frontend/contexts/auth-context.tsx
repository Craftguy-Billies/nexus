'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  firebaseAuth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
} from '@/lib/firebase';
import { ApiError, auth as authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** true when this account still needs onboarding flow (new or incomplete). */
  isNewUser: boolean;
  /** Sign in with Google popup. Returns onboarding-required flag. */
  loginWithGoogle: () => Promise<{ isNewUser: boolean }>;
  /** Sign in with email + password via Firebase. Returns onboarding-required flag. */
  loginWithEmail: (email: string, password: string) => Promise<{ isNewUser: boolean }>;
  /** Create a new Firebase email account. Returns onboarding-required flag (always true). */
  registerWithEmail: (email: string, password: string) => Promise<{ isNewUser: boolean }>;
  /** Complete onboarding: set handle + display name for a new Firebase user. */
  completeOnboarding: (username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const needsOnboarding = (u: User | null): boolean => {
    if (!u) return false;
    return (u.onboardingStep ?? 0) < 4;
  };

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setIsNewUser(needsOnboarding(me));
    } catch {
      setUser(null);
      setToken(null);
      setIsNewUser(false);
      localStorage.removeItem('nexus_token');
    }
  }, []);

  // Listen for Firebase auth state changes (handles page refresh / session persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Try to restore session from localStorage first
        const savedToken = localStorage.getItem('nexus_token');
        if (savedToken) {
          setToken(savedToken);
          try {
            const me = await authApi.me();
            setUser(me);
            setIsNewUser(needsOnboarding(me));
          } catch {
            // Token expired — try to exchange a fresh Firebase token
            try {
              const idToken = await fbUser.getIdToken(true);
              const res = await authApi.loginFirebase(idToken);
              if ('token' in res) {
                localStorage.setItem('nexus_token', res.token);
                setToken(res.token);
                setUser(res.user);
                setIsNewUser((res.isNewUser ?? false) || needsOnboarding(res.user));
              } else {
                setUser(null);
                setToken(null);
                setIsNewUser(true);
                localStorage.removeItem('nexus_token');
              }
            } catch {
              // User doesn't exist in DB yet (new user) — leave user as null
              setUser(null);
              setToken(null);
              localStorage.removeItem('nexus_token');
            }
          }
        }
      } else {
        // Signed out
        setUser(null);
        setToken(null);
        setIsNewUser(false);
        localStorage.removeItem('nexus_token');
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Internal helper: after Firebase sign-in, exchange the ID token with the backend.
   * Returns whether this is a brand-new user who needs to complete onboarding.
   */
  const exchangeFirebaseToken = useCallback(
    async (fbUser: FirebaseUser): Promise<{ isNewUser: boolean }> => {
      const idToken = await fbUser.getIdToken();
      try {
        const res = await authApi.loginFirebase(idToken);
        if ('token' in res) {
          localStorage.setItem('nexus_token', res.token);
          setToken(res.token);
          setUser(res.user);
          const onboardingPending = (res.isNewUser ?? false) || needsOnboarding(res.user);
          setIsNewUser(onboardingPending);
          return { isNewUser: onboardingPending };
        }

        // New Firebase user with no backend profile yet.
        setIsNewUser(true);
        return { isNewUser: true };
      } catch (err: unknown) {
        // 404 means the Firebase account exists but no DB record yet → new user
        if (err instanceof ApiError && (err.status === 404 || err.code === 'NOT_FOUND')) {
          setIsNewUser(true);
          return { isNewUser: true };
        }
        throw err;
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async (): Promise<{ isNewUser: boolean }> => {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    setFirebaseUser(result.user);
    return exchangeFirebaseToken(result.user);
  }, [exchangeFirebaseToken]);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<{ isNewUser: boolean }> => {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      setFirebaseUser(result.user);
      return exchangeFirebaseToken(result.user);
    },
    [exchangeFirebaseToken]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string): Promise<{ isNewUser: boolean }> => {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      setFirebaseUser(result.user);
      // Brand-new Firebase account → always a new user
      setIsNewUser(true);
      return { isNewUser: true };
    },
    []
  );

  const completeOnboarding = useCallback(
    async (username: string, displayName: string) => {
      if (!firebaseUser) throw new Error('Not authenticated');
      const idToken = await firebaseUser.getIdToken();
      const res = await authApi.registerFirebase({ firebaseIdToken: idToken, username, displayName });
      localStorage.setItem('nexus_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsNewUser((res.isNewUser ?? false) || needsOnboarding(res.user));
    },
    [firebaseUser]
  );

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    setIsNewUser(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isLoading,
        isAuthenticated: !!user,
        isNewUser,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
