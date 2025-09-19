import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext({ roles: [], fetchRoles: async () => {} });

export const AuthProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/auth/me/');
      setRoles(response.data.roles || []);
    } catch {
      setRoles([]);
    }
  };

  return (
    <AuthContext.Provider value={{ roles, fetchRoles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

