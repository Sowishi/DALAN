import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  authErrorMessage,
  continueAsGuest as requestGuest,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  subscribeAuth,
  type AuthUser,
} from '@/services/auth';

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  continueAsGuest: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return subscribeAuth((next) => {
      setUser(next);
      setReady(true);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      signIn: async (email, password) => {
        try {
          await signInWithEmail(email, password);
          return null;
        } catch (error) {
          return authErrorMessage(error);
        }
      },
      signUp: async (name, email, password) => {
        try {
          await signUpWithEmail(name, email, password);
          return null;
        } catch (error) {
          return authErrorMessage(error);
        }
      },
      continueAsGuest: async () => {
        try {
          await requestGuest();
          return null;
        } catch (error) {
          return authErrorMessage(error);
        }
      },
      signOut: signOutUser,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
