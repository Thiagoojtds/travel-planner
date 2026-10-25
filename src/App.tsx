import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { TruckProvider } from './context/TruckContext';
import { FreightProvider } from './context/FreightContext';
import { FinanceProvider } from './context/FinanceContext';

import { PinLockScreen } from './components/auth/PinLockScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { FreightsTab } from './components/tabs/FreightsTab';
import { DieselTab } from './components/tabs/DieselTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { FinancingTab } from './components/tabs/FinancingTab';
import { SimulatorTab } from './components/tabs/SimulatorTab';
import { MaintenanceTab } from './components/tabs/MaintenanceTab';
import { ChecklistTab } from './components/tabs/ChecklistTab';
import { TruckConfigTab } from './components/tabs/TruckConfigTab';

// Global Modals
import { FreightModal } from './components/modals/FreightModal';
import { FuelingModal } from './components/modals/FuelingModal';
import { UnifiedFinancialModal, FinancialModalType } from './components/modals/UnifiedFinancialModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, isChecking, isDemoMode } = useAuth();
  const { activeTab } = useApp();

  const [isFreightModalOpen, setIsFreightModalOpen] = useState(false);
  const [isFuelingModalOpen, setIsFuelingModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [financialModalDefaultType, setFinancialModalDefaultType] = useState<FinancialModalType>('entrada');

  const handleOpenFinancialModal = (type: FinancialModalType = 'entrada') => {
    setFinancialModalDefaultType(type);
    setIsFinancialModalOpen(true);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Carregando TransFrete Pro...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLockScreen />;
  }

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Painel Geral de Fretes & Despesas',
      subtitle: 'Visão executiva do Iveco Stralis Randon, receitas e restante a pagar no mês'
    },
    freights: {
      title: 'Gestão de Fretes & Viagens',
      subtitle: 'Controle de saídas, entregas, motorista (R$ 700) e saldo a receber na segunda-feira posterior'
    },
    diesel: {
      title: 'Gestão de Abastecimento & Diesel',
      subtitle: 'Controle de abastecimento por tanque duplo (600L/300L) e consumo de diesel'
    },
    expenses: {
      title: 'Despesas Fixas & Extrato Operacional',
      subtitle: 'Controle de custos fixos recorrentes (seguro, rastreador) e fluxo de entradas e saídas'
    },
    financing: {
      title: 'Financiamentos & Amortização de Dívidas',
      subtitle: 'Controle de contratos, evolução de saldo devedor e quitação das parcelas da frota'
    },
    simulator: {
      title: 'Simulador de Rentabilidade de Frete',
      subtitle: 'Calcule o custo operacional real e garanta sua margem líquida por viagem'
    },
    maintenance: {
      title: 'Manutenção & Saúde do Caminhão',
      subtitle: 'Alertas preventivos do motor Iveco (óleo 20.000 km), freios e carreta Randon'
    },
    checklist: {
      title: 'Checklist Diário Pré-Viagem',
      subtitle: 'Inspeção preventiva dos 6 itens de segurança antes da saída do veículo'
    },
    truck: {
      title: 'Configurações do Conjunto & Metas',
      subtitle: 'Dados técnicos do Iveco Stralis, semirreboque Randon e segurança por PIN'
    }
  };

  const currentMeta = tabTitles[activeTab] || tabTitles.dashboard;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            onNewFreight={() => setIsFreightModalOpen(true)}
            onNewFuel={() => setIsFuelingModalOpen(true)}
          />
        );
      case 'freights':
        return <FreightsTab />;
      case 'diesel':
        return <DieselTab />;
      case 'expenses':
        return <ExpensesTab />;
      case 'financing':
        return <FinancingTab />;
      case 'simulator':
        return <SimulatorTab />;
      case 'maintenance':
        return <MaintenanceTab />;
      case 'checklist':
        return <ChecklistTab />;
      case 'truck':
        return <TruckConfigTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-purple-500/15 border-b border-amber-500/30 px-3.5 sm:px-6 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                Modo Demonstração (Portfólio)
              </span>
              <span className="text-slate-300 hidden sm:inline">
                Você está navegando com <strong>dados fictícios simulados</strong>. Sinta-se à vontade para testar as funcionalidades!
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-semibold">
              PIN 1234
            </span>
          </div>
        )}
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onNewFreight={() => setIsFreightModalOpen(true)}
          onNewFuel={() => setIsFuelingModalOpen(true)}
          onNewTransaction={() => handleOpenFinancialModal('entrada')}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {renderActiveTab()}
        </main>
      </div>

      {/* Navegação Inferior Touch no Mobile */}
      <MobileBottomNav />

      <FreightModal
        isOpen={isFreightModalOpen}
        onClose={() => setIsFreightModalOpen(false)}
      />
      <FuelingModal
        isOpen={isFuelingModalOpen}
        onClose={() => setIsFuelingModalOpen(false)}
      />
      <UnifiedFinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        defaultType={financialModalDefaultType}
      />
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <TruckProvider>
            <FreightProvider>
              <FinanceProvider>
                <AppContent />
              </FinanceProvider>
            </FreightProvider>
          </TruckProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
