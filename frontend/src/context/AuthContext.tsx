import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email_or_id: string, password: string, remember_me?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  sendPhoneCode: (phoneNumber: string) => Promise<boolean>;
  verifyPhoneCode: (phoneNumber: string, code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('classsphere_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('classsphere_access_token');
    if (token) {
      authApi
        .getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('classsphere_user', JSON.stringify(userData));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('classsphere_user');
          localStorage.removeItem('classsphere_access_token');
          localStorage.removeItem('classsphere_refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email_or_id: string, password: string, remember_me = false): Promise<User> => {
    const data = await authApi.login(email_or_id, password, remember_me);
    localStorage.setItem('classsphere_access_token', data.access_token);
    localStorage.setItem('classsphere_refresh_token', data.refresh_token);
    localStorage.setItem('classsphere_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const sendPhoneCode = async (phoneNumber: string): Promise<boolean> => {
    try {
      await authApi.sendOTP(phoneNumber);
      return true;
    } catch {
      return false;
    }
  };

  const verifyPhoneCode = async (phoneNumber: string, code: string): Promise<boolean> => {
    try {
      const res = await authApi.verifyOTP(phoneNumber, code);
      if (res.is_phone_verified && user) {
        const updated = { ...user, is_phone_verified: true, phone_number: phoneNumber };
        setUser(updated);
        localStorage.setItem('classsphere_user', JSON.stringify(updated));
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        sendPhoneCode,
        verifyPhoneCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
