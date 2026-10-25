import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToastData } from '../types';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toast: ToastData | null;
  showToast: (message: string, type?: ToastData['type']) => void;
  hideToast: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setIsMobileMenuOpen(false);
  };
  const [toast, setToast] = useState<ToastData | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const showToast = (message: string, type: ToastData['type'] = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toast,
        showToast,
        hideToast,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de um AppProvider');
  return context;
};
