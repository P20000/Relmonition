import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  coupleId: string | null;
  login: (token: string, coupleId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [coupleId, setCoupleId] = useState<string | null>(localStorage.getItem('coupleId'));

  const login = (token: string, coupleId: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('coupleId', coupleId);
    setToken(token);
    setCoupleId(coupleId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('coupleId');
    setToken(null);
    setCoupleId(null);
  };

  return (
    <AuthContext.Provider value={{ token, coupleId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
