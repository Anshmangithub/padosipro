import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { loadPersistedToken, setToken as persistToken } from '../api/tokenStore';
import type { SessionInfo } from '../types';

interface AuthState {
  status: 'loading' | 'ready';
  isAuthenticated: boolean;
  session: SessionInfo | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  markProfileComplete: () => void;
  markTasksSelected: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', isAuthenticated: false, session: null });

  useEffect(() => {
    (async () => {
      const token = await loadPersistedToken();
      if (!token) {
        setState({ status: 'ready', isAuthenticated: false, session: null });
        return;
      }
      try {
        const session = await authApi.me();
        setState({ status: 'ready', isAuthenticated: true, session });
      } catch {
        // Token is missing/expired/invalid server-side — fall back to the auth stack.
        await persistToken(null);
        setState({ status: 'ready', isAuthenticated: false, session: null });
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    await persistToken(result.token);
    setState({
      status: 'ready',
      isAuthenticated: true,
      session: { user: result.user, hasProfile: result.hasProfile, hasSelectedTasks: result.hasSelectedTasks },
    });
  }, []);

  const logout = useCallback(async () => {
    await persistToken(null);
    setState({ status: 'ready', isAuthenticated: false, session: null });
  }, []);

  const markProfileComplete = useCallback(() => {
    setState((prev) => (prev.session ? { ...prev, session: { ...prev.session, hasProfile: true } } : prev));
  }, []);

  const markTasksSelected = useCallback(() => {
    setState((prev) => (prev.session ? { ...prev, session: { ...prev.session, hasSelectedTasks: true } } : prev));
  }, []);

  const value = useMemo(
    () => ({ ...state, login, logout, markProfileComplete, markTasksSelected }),
    [state, login, logout, markProfileComplete, markTasksSelected],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
