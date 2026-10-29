import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TruckInfo, Fueling, MaintenanceRecord, ChecklistRecord, OilProgress, DefaultFuelingConfig } from '../types';
import { api } from '../services/api';
import { useApp } from './AppContext';
import { useAuth } from './AuthContext';

interface TruckContextType {
  truck: TruckInfo | null;
  fuelings: Fueling[];
  maintenances: MaintenanceRecord[];
  checklists: ChecklistRecord[];
  oilProgress: OilProgress;
  isLoading: boolean;
  defaultFuelingConfig: DefaultFuelingConfig;
  loadTruckData: () => Promise<void>;
  updateTruck: (data: Partial<TruckInfo>) => Promise<void>;
  addFueling: (data: Partial<Fueling>) => Promise<Fueling>;
  updateFueling: (id: string, data: Partial<Fueling>) => Promise<Fueling>;
  deleteFueling: (id: string) => Promise<void>;
  updateDefaultFuelingConfig: (data: Partial<DefaultFuelingConfig>) => Promise<DefaultFuelingConfig>;
  createDefaultFueling: (params: { date: string; currentKm?: number; freightId?: string; status?: 'pago' | 'pendente'; notes?: string }) => Promise<Fueling>;
  addMaintenance: (data: Partial<MaintenanceRecord>) => Promise<MaintenanceRecord>;
  deleteMaintenance: (id: string) => Promise<void>;
  addChecklist: (data: Partial<ChecklistRecord>) => Promise<ChecklistRecord>;
  registerOilChange: (km: number, cost?: number, workshop?: string) => Promise<void>;
}

const TruckContext = createContext<TruckContextType | undefined>(undefined);

export const TruckProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [truck, setTruck] = useState<TruckInfo | null>(null);
  const [fuelings, setFuelings] = useState<Fueling[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [defaultFuelingConfig, setDefaultFuelingConfig] = useState<DefaultFuelingConfig>({
    liters: 300,
    pricePerLiter: 5.89,
    tank: 'principal_600',
    status: 'pago',
    city: 'Curitiba',
    state: 'PR',
    notes: 'Abastecimento Padrão'
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast, triggerRefresh, refreshTrigger } = useApp();
  const { isAuthenticated } = useAuth();

  const loadTruckData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const [truckData, fuelingsData, maintenancesData, checklistsData, configData] = await Promise.all([
        api.get<TruckInfo>('/truck'),
        api.get<Fueling[]>('/fuelings'),
        api.get<MaintenanceRecord[]>('/maintenances'),
        api.get<ChecklistRecord[]>('/checklists'),
        api.get<DefaultFuelingConfig>('/fuelings/default-config').catch(() => null),
      ]);
      setTruck(truckData);
      setFuelings(fuelingsData);
      setMaintenances(maintenancesData);
      setChecklists(checklistsData);
      if (configData) {
        setDefaultFuelingConfig({
          ...configData,
          tank: configData.tank && configData.tank !== 'ambos' ? configData.tank : 'principal_600',
        });
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do caminhão:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTruckData();
    }
  }, [loadTruckData, refreshTrigger, isAuthenticated]);

  const updateTruck = async (data: Partial<TruckInfo>) => {
    try {
      const updated = await api.put<TruckInfo>('/truck', data);
      setTruck(updated);
      showToast('Configurações do caminhão atualizadas!', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar dados do caminhão', 'error');
      throw err;
    }
  };

  const addFueling = async (data: Partial<Fueling>): Promise<Fueling> => {
    try {
      const created = await api.post<Fueling>('/fuelings', data);
      showToast('Abastecimento registrado com sucesso!', 'success');
      await loadTruckData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar abastecimento', 'error');
      throw err;
    }
  };

  const updateFueling = async (id: string, data: Partial<Fueling>): Promise<Fueling> => {
    try {
      const updated = await api.put<Fueling>(`/fuelings/${id}`, data);
      showToast('Abastecimento atualizado!', 'success');
      await loadTruckData();
      triggerRefresh();
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar abastecimento', 'error');
      throw err;
    }
  };

  const deleteFueling = async (id: string): Promise<void> => {
    try {
      await api.delete(`/fuelings/${id}`);
      showToast('Abastecimento removido', 'info');
      await loadTruckData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover abastecimento', 'error');
      throw err;
    }
  };

  const updateDefaultFuelingConfig = async (data: Partial<DefaultFuelingConfig>): Promise<DefaultFuelingConfig> => {
    try {
      const updated = await api.put<DefaultFuelingConfig>('/fuelings/default-config', data);
      setDefaultFuelingConfig(updated);
      showToast('Configuração de abastecimento padrão salva!', 'success');
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar configuração padrão', 'error');
      throw err;
    }
  };

  const createDefaultFueling = async (params: {
    date: string;
    currentKm?: number;
    freightId?: string;
    status?: 'pago' | 'pendente';
    notes?: string;
  }): Promise<Fueling> => {
    const liters = defaultFuelingConfig.liters;
    const pricePerLiter = defaultFuelingConfig.pricePerLiter;
    const totalAmount = liters * pricePerLiter;
    const fuelingStatus = params.status || defaultFuelingConfig.status || 'pago';
    const notes = params.notes || defaultFuelingConfig.notes || 'Abastecimento Padrão';

    const payload: Partial<Fueling> = {
      date: params.date,
      currentKm: params.currentKm !== undefined ? params.currentKm : (truck?.currentKm || 0),
      liters,
      pricePerLiter,
      totalAmount,
      tank: defaultFuelingConfig.tank,
      status: fuelingStatus,
      city: defaultFuelingConfig.city,
      state: defaultFuelingConfig.state,
      notes,
      freightId: params.freightId,
    };

    return await addFueling(payload);
  };

  const addMaintenance = async (data: Partial<MaintenanceRecord>): Promise<MaintenanceRecord> => {
    try {
      const created = await api.post<MaintenanceRecord>('/maintenances', data);
      showToast('Manutenção registrada com sucesso!', 'success');
      await loadTruckData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar manutenção', 'error');
      throw err;
    }
  };

  const deleteMaintenance = async (id: string): Promise<void> => {
    try {
      await api.delete(`/maintenances/${id}`);
      showToast('Registro de manutenção removido', 'info');
      await loadTruckData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover manutenção', 'error');
      throw err;
    }
  };

  const addChecklist = async (data: Partial<ChecklistRecord>): Promise<ChecklistRecord> => {
    try {
      const created = await api.post<ChecklistRecord>('/checklists', data);
      showToast('Checklist diário registrado!', 'success');
      await loadTruckData();
      triggerRefresh();
      return created;
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar checklist', 'error');
      throw err;
    }
  };

  const registerOilChange = async (km: number, cost?: number, workshop?: string) => {
    try {
      await api.post('/truck/oil-change', { currentKm: km, cost, workshop });
      showToast('Troca de óleo e filtros registrada (20.000 km)!', 'success');
      await loadTruckData();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar troca de óleo', 'error');
      throw err;
    }
  };

  // Cálculo da troca de óleo
  const currentKm = truck?.currentKm || 0;
  const lastOilKm = truck?.lastOilChangeKm || 0;
  const limitKm = truck?.oilChangeIntervalKm || 20000;
  const usedKm = Math.max(0, currentKm - lastOilKm);
  const remainingKm = Math.max(0, limitKm - usedKm);
  const percentage = Math.min(100, Math.round((usedKm / limitKm) * 100));

  const oilProgress: OilProgress = {
    usedKm,
    limitKm,
    remainingKm,
    percentage,
    isWarning: percentage >= 85 && percentage < 100,
    isCritical: percentage >= 100,
  };

  return (
    <TruckContext.Provider
      value={{
        truck,
        fuelings,
        maintenances,
        checklists,
        oilProgress,
        isLoading,
        defaultFuelingConfig,
        loadTruckData,
        updateTruck,
        addFueling,
        updateFueling,
        deleteFueling,
        updateDefaultFuelingConfig,
        createDefaultFueling,
        addMaintenance,
        deleteMaintenance,
        addChecklist,
        registerOilChange,
      }}
    >
      {children}
    </TruckContext.Provider>
  );
};

export const useTruck = () => {
  const context = useContext(TruckContext);
  if (!context) throw new Error('useTruck deve ser usado dentro de um TruckProvider');
  return context;
};
