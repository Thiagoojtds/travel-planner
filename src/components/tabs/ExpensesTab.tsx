import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useApp } from '../../context/AppContext';
import { UnifiedFinancialModal, FinancialModalType } from '../modals/UnifiedFinancialModal';
import { UnifiedFinancialList } from '../finance/UnifiedFinancialList';

export const ExpensesTab: React.FC = () => {
  const { 
    expenses, 
    dashboard
  } = useFinance();

  const { selectedMonth } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<FinancialModalType>('despesa');

  const kpis = dashboard?.kpis;

  const totalDebtsDue = kpis?.totalDebtsDueMonth || 0;
  const totalFixedOnly = kpis?.totalFixedDueMonth || 0;
  // Despesas Fixas acumulando as parcelas de financiamento do mês
  const totalFixedExpensesWithDebts = totalFixedOnly + totalDebtsDue;

  const totalEntradasRecebidas = expenses
    .filter(e => e.type === 'entrada' && e.date.startsWith(selectedMonth) && e.status !== 'pendente' && e.status !== 'agendado')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEntradasPlanejadas = expenses
    .filter(e => e.type === 'entrada' && e.date.startsWith(selectedMonth) && (e.status === 'pendente' || e.status === 'agendado'))
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSaidas = expenses
    .filter(e => e.type === 'saida' && e.date.startsWith(selectedMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenModal = (type: FinancialModalType = 'despesa') => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Resumo Financeiro, Parcelas & Despesas Fixas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Despesas Fixas Totais ({selectedMonth})</div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-400">
            {totalFixedExpensesWithDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Fixas: {totalFixedOnly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • Parcelas: {totalDebtsDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Financiamentos & Dívidas ({selectedMonth})</div>
          <div className="mt-1 font-mono text-xl font-bold text-purple-400">
            {totalDebtsDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Parcelas de contratos inclusas nos custos fixos</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Total de Saídas no Mês</div>
          <div className="mt-1 font-mono text-xl font-bold text-rose-400">
            {totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Despesas avulsas, fixas e parcelas registradas</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Entradas Recebidas ({selectedMonth})</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
            {totalEntradasRecebidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Recebido em conta</span>
            {totalEntradasPlanejadas > 0 && (
              <span className="text-amber-400 font-medium">
                +{totalEntradasPlanejadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a receber
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Central Unificada de Lançamentos com Filtro inicial em Todas as Despesas */}
      <UnifiedFinancialList
        initialCategoryFilter="todas_despesas"
        onNewTransaction={handleOpenModal}
      />

      <UnifiedFinancialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalDefaultType}
      />
    </div>
  );
};
