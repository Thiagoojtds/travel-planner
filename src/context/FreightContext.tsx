import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Freight } from '../types';
import { api } from '../services/api';
import { useApp } from './AppContext';

interface FreightContextType {
  freights: Freight[];
  isLoading: boolean;
  loadFreights: () => Promise<void>;
  addFreight: (data: Partial<Freight>) => Promise<Freight>;
  updateFreight: (id: string, data: Partial<Freight>) => Promise<Freight>;
  deleteFreight: (id: string) => Promise<void>;
}

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export const FreightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [freights, setFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast, triggerRefresh, refreshTrigger } = useApp();

  const loadFreights = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Freight[]>('/freights');
      setFreights(data);
    } catch (err: any) {
      console.error('Erro ao carregar fretes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFreights();
  }, [loadFreights, refreshTrigger]);

  const addFreight = async (data: Partial<Freight>): Promise<Freight> => {
    try {
      const created = await api.post<Freight>('/freights', data);
      showToast(`Frete ${created.code} cadastrado com sucesso!`, 'success');
      await loadFreights();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar frete', 'error');
      throw err;
    }
  };

  const updateFreight = async (id: string, data: Partial<Freight>): Promise<Freight> => {
    try {
      const updated = await api.put<Freight>(`/freights/${id}`, data);
      showToast(`Frete ${updated.code} atualizado!`, 'success');
      await loadFreights();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar frete', 'error');
      throw err;
    }
  };

  const deleteFreight = async (id: string): Promise<void> => {
    try {
      await api.delete(`/freights/${id}`);
      showToast('Frete excluído com sucesso', 'info');
      await loadFreights();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir frete', 'error');
      throw err;
    }
  };

  return (
    <FreightContext.Provider
      value={{
        freights,
        isLoading,
        loadFreights,
        addFreight,
        updateFreight,
        deleteFreight,
      }}
    >
      {children}
    </FreightContext.Provider>
  );
};

export const useFreights = () => {
  const context = useContext(FreightContext);
  if (!context) throw new Error('useFreights deve ser usado dentro de um FreightProvider');
  return context;
};
