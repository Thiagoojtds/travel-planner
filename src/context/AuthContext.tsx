import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getAuthPin, setAuthPin, clearAuthPin } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isChecking: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const verifyPin = async (pinToTest: string): Promise<boolean> => {
    try {
      const res = await api.post<{ success: boolean }>('/auth/verify', { pin: pinToTest });
      if (res.success) {
        setAuthPin(pinToTest);
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
  };

  const changePin = async (currentPin: string, newPin: string) => {
    await api.post('/auth/change-pin', { currentPin, newPin });
    setAuthPin(newPin);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isChecking, login, logout, changePin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
