import React, { useState } from 'react';
import { Debt } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useApp } from '../../context/AppContext';
import { UnifiedFinancialModal } from '../modals/UnifiedFinancialModal';
import { DebtModal } from '../modals/DebtModal';
import { 
  Landmark, 
  PlusCircle, 
  CheckCircle2, 
  Archive, 
  Trash2, 
  CreditCard,
  Pencil,
  RotateCcw
} from 'lucide-react';

export const FinancingTab: React.FC = () => {
  const { 
    debts, 
    payDebtInstallment, 
    unpayDebtInstallment,
    deleteDebt,
    expenses, 
    dashboard 
  } = useFinance();

  const { selectedMonth } = useApp();

  const [debtViewFilter, setDebtViewFilter] = useState<'ativos' | 'quitados'>('ativos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const kpis = dashboard?.kpis;
  const debtBalance = dashboard?.debtBalance;

  // Função utilitária para obter o mês (YYYY-MM) em que a dívida foi quitada
  const getSettledMonth = (d: Debt): string | null => {
    if (d.status !== 'quitado') return null;
    if (d.settledAt) return d.settledAt.slice(0, 7);
    if (d.payments && d.payments.length > 0) return d.payments[0].date.slice(0, 7);
    return null;
  };

  // Filtragem estrita para o mês selecionado
  const activeDebtsInMonth = debts.filter(d => {
    if (d.hasBoletoInMonth === false) return false;
    if (d.isBeforeStartMonth || d.isAfterEndMonth) return false;
    if (d.isSettledPriorToMonth) return false;

    const settledMonth = getSettledMonth(d);
    if (settledMonth && settledMonth < selectedMonth) return false;
    if (d.status === 'quitado' && settledMonth !== selectedMonth) return false;

    return true;
  });

  // Histórico de quitados
  const settledDebts = debts.filter(d => d.status === 'quitado' || d.remainingBalance === 0);

  return (
    <div className="space-y-6">
      {/* Card Principal: Balanceamento de Dívidas & Parcelamentos */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/10">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Balanceamento de Dívidas & Parcelamentos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Visão consolidada de amortização, evolução da dívida e contratos da frota</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/25 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Financiamento / Contrato</span>
          </button>
        </div>

        {/* Grid de Métricas de Endividamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {/* Saldo Devedor Total */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 transition-all">
            <div className="text-[11px] text-slate-400 font-medium">Saldo Devedor Total Acumulado</div>
            <div className="mt-1 font-mono text-xl font-bold text-rose-400">
              {(debtBalance?.totalRemainingBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400">
              {debtBalance?.activeDebtsCount || 0} contratos ativos com saldo a quitar
            </div>
          </div>

          {/* Total Já Amortizado / Pago */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 transition-all">
            <div className="text-[11px] text-slate-400 font-medium">Total Amortizado / Pago</div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
              {(debtBalance?.totalAmortizedAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="mt-1.5 text-[10px] text-emerald-400/90 font-medium">
              {debtBalance?.amortizationPercentage || 0}% do total original liquidado
            </div>
          </div>

          {/* Parcelas no Mês Selecionado */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 transition-all">
            <div className="text-[11px] text-slate-400 font-medium">Parcelas no Mês ({selectedMonth})</div>
            <div className="mt-1 font-mono text-xl font-bold text-purple-400">
              {(kpis?.totalDebtsDueMonth || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400">
              {activeDebtsInMonth.length} contrato(s) com boleto neste mês
            </div>
          </div>

          {/* Total Contratado Original */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/60 transition-all">
            <div className="text-[11px] text-slate-400 font-medium">Total Contratado Original</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-200">
              {(debtBalance?.totalOriginalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400">
              {debtBalance?.settledDebtsCount || 0} contrato(s) já quitado(s)
            </div>
          </div>
        </div>

        {/* Barra de Progresso de Amortização Geral */}
        <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/80 mb-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">Progresso Geral de Quitação da Frota</span>
            <span className="font-mono font-bold text-purple-300 text-sm">
              {debtBalance?.amortizationPercentage || 0}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, debtBalance?.amortizationPercentage || 0))}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 font-mono gap-2">
            <span>Total Contratado: {(debtBalance?.totalOriginalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span>Saldo Remanescente: {(debtBalance?.totalRemainingBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span className="text-emerald-400">Quitados: {debtBalance?.settledDebtsCount || 0} contratos</span>
          </div>
        </div>

        {/* Resumo Financeiro do Mês Vigente */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium">Status dos Boletos no Mês ({selectedMonth}):</span>
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Pago:</span>
              <span className="text-emerald-400 font-bold">
                {(debtBalance?.monthPaidAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">Restante a Pagar:</span>
              <span className="text-amber-400 font-bold">
                {(debtBalance?.monthRemainingAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Visualização: Vigentes no Mês vs Histórico de Quitados */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDebtViewFilter('ativos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              debtViewFilter === 'ativos'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-md shadow-purple-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Contratos Vigentes no Mês</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300">
              {activeDebtsInMonth.length}
            </span>
          </button>

          <button
            onClick={() => setDebtViewFilter('quitados')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              debtViewFilter === 'quitados'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Histórico de Quitados</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300">
              {settledDebts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Lista de Contratos Vigentes */}
      {debtViewFilter === 'ativos' && (
        <div className="space-y-3">
          {activeDebtsInMonth.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Nenhum contrato ativo neste mês</p>
              <p className="text-xs text-slate-500 mt-1">
                Todos os contratos foram quitados anteriormente ou não há parcelas a vencer em {selectedMonth}.
              </p>
            </div>
          ) : (
            activeDebtsInMonth.map(d => {
              const settledMonth = getSettledMonth(d);
              const isPaidThisMonth = (d.status === 'quitado' && settledMonth === selectedMonth) ||
                expenses.some(e => e.debtId === d.id && e.date.startsWith(selectedMonth) && e.status === 'pago') ||
                (d.payments && d.payments.some(p => p.date.startsWith(selectedMonth) && (p.status as any) === 'pago'));

              return (
                <div
                  key={d.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{d.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.status === 'quitado'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isPaidThisMonth
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {d.status === 'quitado'
                          ? (d.settledAt ? `Quitado em ${d.settledAt}` : 'Quitado neste mês')
                          : isPaidThisMonth
                          ? 'Boleto Pago neste mês'
                          : `A Pagar (Venc. dia ${d.dueDay})`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Credor: <span className="text-slate-300 font-medium">{d.creditor || 'Geral'}</span> • Vencimento: Dia {d.dueDay} de cada mês
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 pt-1">
                      <span>Total Original: <strong className="text-slate-300">{d.totalOriginalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                      <span>•</span>
                      <span className="text-rose-400 font-medium">
                        Saldo Devedor: {d.remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {d.startMonth && d.endMonth && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">
                            Vigência: {d.startMonth} a {d.endMonth}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-3 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Parcela no Mês</div>
                      <div className="font-mono text-base font-bold text-purple-400">
                        {d.installmentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {d.installmentNumberInMonth 
                          ? `Boleto: Parcela ${d.installmentNumberInMonth} de ${d.totalInstallments}`
                          : `Progresso: ${d.paidInstallments}/${d.totalInstallments} pagas`}
                      </div>
                    </div>

                    {d.status !== 'quitado' && !isPaidThisMonth && (
                      <button
                        onClick={() => {
                          const day = d.dueDay || 10;
                          const parts = (selectedMonth || '').split('-');
                          const targetDate = parts.length >= 2 ? `${parts[0]}-${parts[1]}-${String(day).padStart(2, '0')}` : undefined;
                          payDebtInstallment(d.id, undefined, targetDate);
                        }}
                        className="px-4 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        Pagar Parcela
                      </button>
                    )}

                    {isPaidThisMonth && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Boleto Pago</span>
                        </span>
                        {d.status !== 'quitado' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Estornar o pagamento da parcela de "${d.title}" referente a ${selectedMonth}?\n\nEla voltará a constar como pendente/a pagar neste mês e o saldo devedor será restaurado.`)) {
                                unpayDebtInstallment(d.id, selectedMonth);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title="Remover baixa de pagamento deste mês"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => setEditingDebt(d)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors"
                      title="Editar contrato"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (isPaidThisMonth && d.status !== 'quitado') {
                          if (window.confirm(`Estornar o pagamento da parcela de "${d.title}" referente a ${selectedMonth}?\n\nPara excluir o contrato por completo, estorne a parcela primeiro.`)) {
                            unpayDebtInstallment(d.id, selectedMonth);
                          }
                        } else {
                          if (window.confirm(`Excluir contrato ${d.title}?`)) {
                            deleteDebt(d.id);
                          }
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title={isPaidThisMonth && d.status !== 'quitado' ? "Estornar parcela deste mês" : "Excluir contrato"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Histórico de Contratos Quitados */}
      {debtViewFilter === 'quitados' && (
        <div className="space-y-3">
          {settledDebts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
              <Archive className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">Nenhum contrato quitado no histórico</p>
            </div>
          ) : (
            settledDebts.map(d => (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 opacity-90"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">{d.title}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      100% Quitado
                    </span>
                    {d.settledAt && (
                      <span className="text-[11px] text-slate-400">
                        (em {d.settledAt})
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400">
                    Credor: {d.creditor || 'Geral'} • Total Quitado: {d.totalOriginalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>

                  <div className="text-[11px] text-emerald-400/80 pt-0.5">
                    ✓ Todas as {d.totalInstallments} parcelas de {d.installmentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foram totalmente quitadas.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500">Saldo: R$ 0,00</span>
                  <button
                    onClick={() => setEditingDebt(d)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors"
                    title="Editar histórico do contrato"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir histórico do contrato ${d.title}?`)) {
                        deleteDebt(d.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <UnifiedFinancialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType="financiamento"
      />

      <DebtModal
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        debt={editingDebt}
      />
    </div>
  );
};
