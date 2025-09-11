import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const storedRoles = window.localStorage.getItem('roles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    }
  }, []);

  const hasRole = (role) => {
    return roles.includes(role);
  };

  const value = {
    roles,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
