"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../../api-client';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  coupleId: string | null;
  email: string | null;
  accountType: string | null;
  activeTenantId: string | null;
  isLoaded: boolean;
  setActiveTenantId: (tenantId: string | null) => void;
  login: (token: string, userId: string, email: string, accountType: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');
    const savedEmail = localStorage.getItem('email');
    const savedAccountType = localStorage.getItem('accountType');
    const savedTenantId = localStorage.getItem('activeTenantId');

    setToken(savedToken);
    setUserId(savedUserId);
    setEmail(savedEmail);
    setAccountType(savedAccountType);
    setActiveTenantIdState(savedTenantId);
    setIsLoaded(true);

    // Sync profile if missing but token exists
    if (savedToken && (!savedEmail || !savedAccountType)) {
      apiClient.getMe(savedToken).then(data => {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('email', data.email);
        localStorage.setItem('accountType', data.accountType);
        setUserId(data.userId);
        setEmail(data.email);
        setAccountType(data.accountType);
      }).catch(err => {
        console.error('Failed to sync profile:', err);
        // If token is invalid, log out
        if (err.message.includes('Session expired') || err.message.includes('invalid')) {
          logout();
        }
      });
    }
  }, []);

  const login = (newToken: string, newUserId: string, newEmail: string, newAccountType: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('email', newEmail);
    localStorage.setItem('accountType', newAccountType);
    setToken(newToken);
    setUserId(newUserId);
    setEmail(newEmail);
    setAccountType(newAccountType);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('accountType');
    localStorage.removeItem('activeTenantId');
    setToken(null);
    setUserId(null);
    setEmail(null);
    setAccountType(null);
    setActiveTenantIdState(null);
  };

  const setActiveTenantId = (tenantId: string | null) => {
    if (tenantId) {
      localStorage.setItem('activeTenantId', tenantId);
    } else {
      localStorage.removeItem('activeTenantId');
    }
    setActiveTenantIdState(tenantId);
  };

  return (
    <AuthContext.Provider value={{ token, userId, email, accountType, activeTenantId, isLoaded, setActiveTenantId, coupleId: userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
