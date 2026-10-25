import React from 'react';
import { useApp } from '../context/AppContext';
import { useTruck } from '../context/TruckContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Fuel, 
  Calculator, 
  Wrench, 
  ClipboardCheck, 
  Settings, 
  Gauge, 
  CircleDollarSign, 
  Landmark, 
  Lock,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen } = useApp();
  const { truck, oilProgress } = useTruck();
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'freights', label: 'Fretes & Viagens', icon: Truck },
    { id: 'diesel', label: 'Abastecimento & Diesel', icon: Fuel },
    { id: 'expenses', label: 'Despesas & Gastos Fixos', icon: CircleDollarSign },
    { id: 'financing', label: 'Financiamentos & Dívidas', icon: Landmark },
    { id: 'simulator', label: 'Simulador de Frete', icon: Calculator },
    { id: 'maintenance', label: 'Manutenção & Oficina', icon: Wrench },
    { id: 'checklist', label: 'Checklist Diário', icon: ClipboardCheck },
    { id: 'truck', label: 'Iveco & Ajustes', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container (Drawer em Mobile, Fixo em Desktop) */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col h-screen select-none backdrop-blur-md shrink-0 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand area */}
        <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-md shadow-sky-500/10">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">TransFrete Pro</h2>
              <p className="text-[11px] text-slate-400">Iveco Stralis • Randon</p>
            </div>
          </div>

          {/* Botão fechar apenas no mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Truck quick summary */}
      <div className="mx-3 mt-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-200 tracking-wide">
            {truck?.plate || 'BRA-2E19'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {truck?.driverName || 'Motorista'} • {(truck?.currentKm || 0).toLocaleString('pt-BR')} km
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {truck?.status === 'em_viagem' ? 'Em Viagem' : truck?.status === 'manutencao' ? 'Oficina' : 'Livre'}
        </span>
      </div>

      {/* Oil change monitor */}
      <div className="mx-3 mt-2 p-3 rounded-xl bg-slate-800/30 border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5 text-[11px]">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" /> Óleo do Motor (20k)
          </span>
          <span className={`font-mono font-bold ${
            oilProgress.isCritical ? 'text-rose-400' : oilProgress.isWarning ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {(oilProgress.remainingKm || 0).toLocaleString('pt-BR')} km
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              oilProgress.isCritical ? 'bg-rose-500' : oilProgress.isWarning ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${oilProgress.percentage || 0}%` }}
          />
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer with lock */}
      <div className="p-3 border-t border-slate-800/70">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all"
          title="Bloquear aplicativo"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Bloquear Sessão</span>
        </button>
      </div>
      </aside>
    </>
  );
};
