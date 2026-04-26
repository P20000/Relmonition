"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../../api-client';
import { getUserTenants } from '../../lib/tenants';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  coupleId: string | null;
  email: string | null;
  name: string | null;
  accountType: string | null;
  activeTenantId: string | null;
  isLoaded: boolean;
  setActiveTenantId: (tenantId: string | null) => void;
  login: (token: string, userId: string, email: string, name: string, accountType: string) => void;
  setName: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');
    const savedEmail = localStorage.getItem('email');
    const savedName = localStorage.getItem('name');
    const savedAccountType = localStorage.getItem('accountType');
    const savedTenantId = localStorage.getItem('activeTenantId');

    setToken(savedToken);
    setUserId(savedUserId);
    setEmail(savedEmail);
    setNameState(savedName);
    setAccountType(savedAccountType);
    setActiveTenantIdState(savedTenantId);
    setIsLoaded(true);

    // Auto-select tenant if missing but user is logged in
    if (savedToken && savedUserId && !savedTenantId) {
      getUserTenants(savedUserId).then(tenants => {
        if (tenants.length > 0) {
          setActiveTenantId(tenants[0].id);
        }
      });
    }

    // Sync profile if missing but token exists
    if (savedToken && (!savedEmail || !savedAccountType)) {
      apiClient.getMe(savedToken).then(data => {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('email', data.email);
        localStorage.setItem('name', data.name);
        localStorage.setItem('accountType', data.accountType);
        setUserId(data.userId);
        setEmail(data.email);
        setNameState(data.name);
        setAccountType(data.accountType);

        // Also check tenants here if still missing
        if (!savedTenantId) {
          getUserTenants(data.userId).then(tenants => {
            if (tenants.length > 0) {
              setActiveTenantId(tenants[0].id);
            }
          });
        }
      }).catch(err => {
        console.error('Failed to sync profile:', err);
        // If token is invalid, log out
        if (err.message.includes('Session expired') || err.message.includes('invalid')) {
          logout();
        }
      });
    }
  }, []);

  const login = (newToken: string, newUserId: string, newEmail: string, newName: string, newAccountType: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('email', newEmail);
    localStorage.setItem('name', newName);
    localStorage.setItem('accountType', newAccountType);
    setToken(newToken);
    setUserId(newUserId);
    setEmail(newEmail);
    setNameState(newName);
    setAccountType(newAccountType);

    // Auto-select first tenant on login
    getUserTenants(newUserId).then(tenants => {
      if (tenants.length > 0) {
        setActiveTenantId(tenants[0].id);
      }
    });
  };

  const setName = (newName: string) => {
    localStorage.setItem('name', newName);
    setNameState(newName);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('accountType');
    localStorage.removeItem('activeTenantId');
    setToken(null);
    setUserId(null);
    setEmail(null);
    setNameState(null);
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
    <AuthContext.Provider value={{ token, userId, email, name, accountType, activeTenantId, isLoaded, setActiveTenantId, coupleId: userId, login, logout, setName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
