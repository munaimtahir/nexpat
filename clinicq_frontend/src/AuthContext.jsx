import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import api, { clearAccessToken } from './api';

const defaultContext = {
  roles: [],
  username: null,
  isLoading: false,
  hasRole: () => false,
  fetchRoles: async () => {},
  logout: () => {},
};

const AuthContext = createContext(defaultContext);

export const AuthProvider = ({ children, initialState }) => {
  const [roles, setRoles] = useState(initialState?.roles ?? []);
  const [username, setUsername] = useState(initialState?.username ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = useCallback(() => {
    setRoles([]);
    setUsername(null);
  }, []);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me/');
      const payload = response?.data ?? {};
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
      setUsername(payload.username ?? null);
      return payload;
    } catch (error) {
      resetState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [resetState]);

  const hasRole = useCallback(
    (role) => roles.some((current) => current?.toLowerCase() === role?.toLowerCase()),
    [roles],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    resetState();
  }, [resetState]);

  const value = useMemo(
    () => ({ roles, username, isLoading, fetchRoles, hasRole, logout }),
    [roles, username, isLoading, fetchRoles, hasRole, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
