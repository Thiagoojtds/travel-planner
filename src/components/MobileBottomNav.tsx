import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Truck, 
  Fuel, 
  CircleDollarSign, 
  Landmark, 
  Menu 
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsMobileMenuOpen } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'freights', label: 'Fretes', icon: Truck },
    { id: 'diesel', label: 'Diesel', icon: Fuel },
    { id: 'expenses', label: 'Despesas', icon: CircleDollarSign },
    { id: 'financing', label: 'Dívidas', icon: Landmark },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg select-none">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 ${
              isActive
                ? 'text-sky-400 bg-sky-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
            <span className="truncate max-w-[54px]">{item.label}</span>
          </button>
        );
      })}

      {/* Botão Mais para abrir gaveta completa com oficina, checklist, configurações, simulador */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-all active:scale-95"
      >
        <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
        <span>Mais</span>
      </button>
    </nav>
  );
};
