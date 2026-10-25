import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getAuthPin, setAuthPin, clearAuthPin } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isChecking: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const verifyPin = async (pinToTest: string): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean; mode?: 'demo' | 'production' }>('/auth/verify', { pin: pinToTest });
      if (res.success) {
        setAuthPin(pinToTest);
        setIsDemoMode(res.mode === 'demo' || pinToTest === '1234');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const savedPin = getAuthPin();
    if (savedPin) {
      verifyPin(savedPin).finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }

    const handleAuthRequired = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:required', handleAuthRequired);
    return () => window.removeEventListener('auth:required', handleAuthRequired);
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin);
    return ok;
  };

  const logout = () => {
    clearAuthPin();
    setIsAuthenticated(false);
    setIsDemoMode(false);
  };

  const changePin = async (currentPin: string, newPin: string) => {
    await api.post('/auth/change-pin', { currentPin, newPin });
    setAuthPin(newPin);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isDemoMode, isChecking, login, logout, changePin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
