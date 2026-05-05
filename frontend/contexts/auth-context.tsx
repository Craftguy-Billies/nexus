'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { auth as authApi } from '@/lib/api';
import {
  firebaseGetIdToken,
  firebaseLoginWithEmail,
  firebaseLogout,
  firebaseRegisterWithEmail,
  firebaseSignInWithGoogle,
  isFirebaseWebConfigured,
} from '@/lib/firebase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerWithGoogle: (username: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('nexus_token');
    }
  }, []);

  const setSession = useCallback((nextToken: string, nextUser: User) => {
    localStorage.setItem('nexus_token', nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('nexus_token');
    if (savedToken) {
      setToken(savedToken);
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    if (isFirebaseWebConfigured()) {
      await firebaseLoginWithEmail(email, password);
      const firebaseIdToken = await firebaseGetIdToken();
      const res = await authApi.loginFirebase(firebaseIdToken);
      setSession(res.token, res.user);
      return;
    }

    const res = await authApi.login({ email, password });
    setSession(res.token, res.user);
  };

  const register = async (email: string, password: string, username: string, displayName: string) => {
    if (isFirebaseWebConfigured()) {
      await firebaseRegisterWithEmail(email, password);
      const firebaseIdToken = await firebaseGetIdToken();
      const res = await authApi.registerFirebase({ firebaseIdToken, username, displayName });
      setSession(res.token, res.user);
      return;
    }

    const res = await authApi.register({ email, password, username, displayName });
    setSession(res.token, res.user);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseWebConfigured()) {
      throw new Error('Firebase is not configured for the web app');
    }

    await firebaseSignInWithGoogle();
    const firebaseIdToken = await firebaseGetIdToken();
    const res = await authApi.loginFirebase(firebaseIdToken);
    setSession(res.token, res.user);
  };

  const registerWithGoogle = async (username: string, displayName: string) => {
    if (!isFirebaseWebConfigured()) {
      throw new Error('Firebase is not configured for the web app');
    }

    await firebaseSignInWithGoogle();
    const firebaseIdToken = await firebaseGetIdToken();

    const res = await authApi.registerFirebase({ firebaseIdToken, username, displayName });
    setSession(res.token, res.user);
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    firebaseLogout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        registerWithGoogle,
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
