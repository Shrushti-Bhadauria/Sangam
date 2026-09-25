import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [citizen, setCitizen] = useState(null);
  const [loading, setLoading] = useState(true);
  const { changeLanguage } = useLanguage();

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('sangam_token');
    if (!token) {
      setUser(null);
      setCitizen(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      setUser(data.user);
      setCitizen(data.citizen);
      if (data.user.preferredLanguage) {
        changeLanguage(data.user.preferredLanguage);
      }
    } catch (err) {
      console.warn('Session expired or invalid, logging out.');
      localStorage.removeItem('sangam_token');
      setUser(null);
      setCitizen(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('sangam_token', data.token);
    setUser(data.user);
    setCitizen(data.citizen);
    if (data.user.preferredLanguage) {
      changeLanguage(data.user.preferredLanguage);
    }
    return data;
  };

  const quickLogin = async (role) => {
    let email = 'citizen@sangam.gov.in';
    let password = 'citizen123';

    if (role === 'DEPARTMENT_OFFICER') {
      email = 'officer@sangam.gov.in';
      password = 'officer123';
    } else if (role === 'INTEGRATION_ADMIN') {
      email = 'admin@sangam.gov.in';
      password = 'admin123';
    }

    return login(email, password);
  };

  const register = async (details) => {
    const data = await api.auth.register(details);
    localStorage.setItem('sangam_token', data.token);
    setUser(data.user);
    setCitizen(data.citizen);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sangam_token');
    setUser(null);
    setCitizen(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        citizen,
        loading,
        login,
        quickLogin,
        register,
        logout,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
