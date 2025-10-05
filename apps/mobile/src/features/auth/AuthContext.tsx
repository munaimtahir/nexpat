import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import type { UserProfile } from '@/api/generated/client';
import { apiClient, authStorage } from '@/api/client';
import type { AuthContextValue } from './types';
import { logger } from '@/utils/logger';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const response = await apiClient.me();
      setUser(response.data);
      Sentry.setUser({ id: String(response.data.id), username: response.data.username });
    } catch (error) {
      logger.warn('Unable to fetch profile', error);
      setUser(null);
      Sentry.setUser(null);
    }
  }, []);

  const login = useCallback(async ({ username, password }: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login({ username, password });
      await authStorage.persistToken(response.data.token);
      await loadProfile();
    } finally {
      setIsLoading(false);
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await authStorage.clearToken();
    setUser(null);
    Sentry.setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await authStorage.loadToken();
        await loadProfile();
      } finally {
        setIsLoading(false);
      }
    };
    void bootstrap();
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(() => ({ user, isLoading, login, logout, refreshProfile }), [user, isLoading, login, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
