/**
 * Auth context for mobile app. Manages session token and user state.
 * Token is stored in SecureStore; API client uses it for Bearer auth.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createApiClient, API_PATHS, ApiError } from '@hyve/shared';
const TOKEN_KEY = 'hyve_session_token';
const USER_KEY = 'hyve_user';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3000';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  apiClient: ReturnType<typeof createApiClient>;
  login: (sessionToken: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(async () => {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    return t;
  }, []);

  const apiClient = React.useMemo(
    () => createApiClient(apiUrl, getToken),
    [getToken]
  );

  const login = useCallback(async (sessionToken: string, userData: AuthUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    setToken(sessionToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post(API_PATHS.AUTH_LOGOUT);
    } catch {
      // Ignore logout API errors
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, [apiClient]);

  const refreshUser = useCallback(async () => {
    const t = await getToken();
    if (!t) return;
    try {
      const res = await apiClient.get<{ user: AuthUser }>(API_PATHS.USERS_ME);
      if (res?.user) {
        setUser(res.user);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await logout();
      }
    }
  }, [apiClient, getToken, logout]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await SecureStore.getItemAsync(TOKEN_KEY);
      const u = await SecureStore.getItemAsync(USER_KEY);
      if (cancelled) return;
      if (t) {
        setToken(t);
        if (u) {
          try {
            setUser(JSON.parse(u));
          } catch {
            setUser(null);
          }
        }
        // Optionally validate token and refresh user
        try {
          const res = await createApiClient(apiUrl, () => Promise.resolve(t)).get<{ user: AuthUser }>(
            API_PATHS.USERS_ME
          );
          if (res?.user && !cancelled) {
            setUser(res.user);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
          }
        } catch {
          if (!cancelled) {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            setToken(null);
            setUser(null);
          }
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token,
    apiClient,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
