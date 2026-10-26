import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTruck } from '../../context/TruckContext';
import { useApp } from '../../context/AppContext';
import { FinancialEvolutionChart } from '../charts/FinancialEvolutionChart';
import { DashboardSkeleton } from '../common/LoadingSkeleton';
import { 
  TrendingUp, 
  CircleDollarSign, 
  Fuel, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CalendarClock,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2
} from 'lucide-react';

interface DashboardTabProps {
  onNewFreight?: () => void;
  onNewFuel?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = () => {
  const { dashboard, debts, fixedExpenses, expenses, payDebtInstallment, payFixedExpense, updateExpense, isLoading } = useFinance();
  const { oilProgress } = useTruck();
  const { setActiveTab, selectedMonth } = useApp();

  const kpis = dashboard?.kpis;
  const recentFreights = dashboard?.recentFreights || [];
  const upcomingPayments = dashboard?.upcomingPayments || [];
  const upcoming10DaysTotal = dashboard?.upcoming10DaysTotal || 0;
  const monthlyEvolution = dashboard?.monthlyEvolution || [];

  // Cálculo em tempo real de todas as despesas em aberto no mês selecionado
  const unpaidDebtsAmount = (debts || [])
    .filter(d => {
      if (d.status === 'quitado' || d.remainingBalance <= 0) return false;
      if (d.hasBoletoInMonth === false) return false;
      if (d.isBeforeStartMonth || d.isAfterEndMonth || d.isSettledPriorToMonth) return false;
      const isPaid = (expenses || []).some(e => e.debtId === d.id && e.date.startsWith(selectedMonth) && e.status === 'pago') ||
                     (d.payments && d.payments.some(p => p.date.startsWith(selectedMonth) && (p.status as any) === 'pago'));
      return !isPaid;
    })
    .reduce((sum, d) => sum + Number(d.installmentAmount || 0), 0);

  const unpaidFixedAmount = (fixedExpenses || [])
    .filter(f => {
      if (!f.active) return false;
      const isPaid = (expenses || []).some(e => e.fixedExpenseId === f.id && e.date.startsWith(selectedMonth) && e.status === 'pago');
      return !isPaid;
    })
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const unpaidOperatingAmount = (expenses || [])
    .filter(e => e.type === 'saida' && e.date.startsWith(selectedMonth) && (e.status === 'pendente' || e.status === 'agendado') && !e.debtId && !e.fixedExpenseId)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalEmAbertoCalc = unpaidDebtsAmount + unpaidFixedAmount + unpaidOperatingAmount;
  const restanteAPagarDisplay = totalEmAbertoCalc > 0 
    ? totalEmAbertoCalc 
    : (kpis?.restanteAPagarTotal || 0);

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getDueBadge = (days: number) => {
    if (days < 0) {
      return {
        label: `Atrasado (-${Math.abs(days)}d)`,
        className: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold',
      };
    }
    if (days === 0) {
      return {
        label: 'Vence Hoje',
        className: 'bg-rose-500/25 text-rose-300 border border-rose-500/50 font-bold animate-pulse',
      };
    }
    if (days === 1) {
      return {
        label: 'Vence Amanhã',
        className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold',
      };
    }
    return {
      label: `Em ${days} dias`,
      className: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    };
  };

  const handlePayUpcoming = async (payment: any) => {
    try {
      if (payment.sourceType === 'debt') {
        await payDebtInstallment(payment.sourceId, undefined, payment.dueDate);
      } else if (payment.sourceType === 'fixed_expense') {
        await payFixedExpense(payment.sourceId, payment.dueDate);
      } else if (payment.sourceType === 'expense') {
        await updateExpense(payment.sourceId, { status: 'pago' });
      }
    } catch (err) {
      console.error('Erro ao efetuar baixa do pagamento:', err);
    }
  };

  if (isLoading && !dashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
      {isLoading && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs w-fit">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Atualizando dados do mês ({selectedMonth})...</span>
        </div>
      )}
      {/* Alerta Preventivo de Óleo se Crítico ou Alerta */}
      {oilProgress.isWarning && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300">
                Atenção: Troca de Óleo Próxima ({oilProgress.percentage}% do limite de 20.000 km)
              </div>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                Restam apenas {(oilProgress.remainingKm || 0).toLocaleString('pt-BR')} km para a revisão do motor Cursor.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            Ver Manutenção
          </button>
        </div>
      )}

      {oilProgress.isCritical && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300">
                Urgente: Limite de 20.000 km Excedido para Troca de Óleo!
              </div>
              <p className="text-[11px] text-rose-200/70 mt-0.5">
                O Iveco Stralis rodou {(oilProgress.usedKm || 0).toLocaleString('pt-BR')} km desde a última troca. Agende a revisão imediatamente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('maintenance')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition-colors"
          >
            Registrar Troca
          </button>
        </div>
      )}

      {/* Grid de KPIs Principais */}
      {(() => {
        const mom = kpis?.previousMonthComparison;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturamento Bruto */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Faturamento Bruto</span>
                <div className="flex items-center gap-1.5">
                  {mom && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      (mom.revenuePercent ?? mom.revenueDiff) >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {(mom.revenuePercent ?? mom.revenueDiff) >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>
                        {mom.revenuePercent !== null
                          ? `${mom.revenuePercent > 0 ? '+' : ''}${mom.revenuePercent}%`
                          : `${mom.revenueDiff >= 0 ? '+' : ''}${(mom.revenueDiff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`}
                      </span>
                    </span>
                  )}
                  <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-white">
                {(kpis?.grossRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-1.5">
                <span>{kpis?.freightsCount || 0} fretes</span>
                {mom && mom.freightsDiff !== 0 && (
                  <span className={`text-[10px] font-medium ${mom.freightsDiff > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    ({mom.freightsDiff > 0 ? `+${mom.freightsDiff}` : mom.freightsDiff} vs {mom.previousMonthLabel})
                  </span>
                )}
                {Boolean(kpis?.extraRevenue && kpis.extraRevenue > 0) && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">
                      +{(kpis?.extraRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} avulsos
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Lucro Líquido Real */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Lucro Líquido Real</span>
                <div className="flex items-center gap-1.5">
                  {mom && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      (mom.profitPercent ?? mom.profitDiff) >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {(mom.profitPercent ?? mom.profitDiff) >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      <span>
                        {mom.profitPercent !== null
                          ? `${mom.profitPercent > 0 ? '+' : ''}${mom.profitPercent}%`
                          : `${mom.profitDiff >= 0 ? '+' : ''}${(mom.profitDiff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`}
                      </span>
                    </span>
                  )}
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CircleDollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className={`mt-2 font-mono text-xl font-bold ${
                (kpis?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {(kpis?.netProfit || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Abatido diesel, parcelas, fixos e avulsas</span>
                {mom && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Margem: {mom.marginDiff >= 0 ? `+${mom.marginDiff}` : mom.marginDiff} p.p.
                  </span>
                )}
              </div>
            </div>

            {/* Restante a Pagar no Mês */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Restante a Pagar ({selectedMonth})</span>
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-amber-400">
                {restanteAPagarDisplay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 truncate">
                {restanteAPagarDisplay === 0
                  ? '✓ Todas as contas deste mês foram pagas'
                  : [
                      unpaidDebtsAmount > 0 ? `Parcelas: ${unpaidDebtsAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}` : null,
                      unpaidFixedAmount > 0 ? `Fixas: ${unpaidFixedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}` : null,
                      unpaidOperatingAmount > 0 ? `Avulsas: ${unpaidOperatingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}` : null,
                    ].filter(Boolean).join(' • ')}
              </div>
            </div>

            {/* Combustível Diesel do Mês */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Diesel do Mês</span>
                <div className="flex items-center gap-1.5">
                  {mom && mom.fuelDiff !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      mom.fuelDiff <= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {mom.fuelDiff <= 0 ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      <span>
                        {mom.fuelPercent !== null
                          ? `${mom.fuelPercent > 0 ? '+' : ''}${mom.fuelPercent}%`
                          : `${mom.fuelDiff > 0 ? '+' : ''}${(mom.fuelDiff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`}
                      </span>
                    </span>
                  )}
                  <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-400">
                    <Fuel className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2 font-mono text-xl font-bold text-orange-400">
                {(kpis?.totalFuelMonth || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {(kpis?.totalFuelLitersMonth || 0).toFixed(1)} L consumidos
              </div>
            </div>
          </div>
        );
      })()}

      {/* Gráfico de Progressão dos Indicadores Principais */}
      {monthlyEvolution.length > 0 && (
        <FinancialEvolutionChart data={monthlyEvolution} />
      )}

      {/* SEÇÃO OPERACIONAL: Pagamentos dos Próximos 10 Dias & Fretes do Mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Card: Pagamentos dos Próximos 10 Dias (Agenda Operacional) */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Próximos 10 Dias</h2>
                  <p className="text-xs text-slate-400">Vencimentos imediatos de parcelas e despesas fixas</p>
                </div>
              </div>

              {/* Badge com Total dos Próximos 10 Dias */}
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Total 10 Dias</span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {upcoming10DaysTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Lista de Vencimentos */}
            {upcomingPayments.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-800/20 border border-slate-800 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
                <div className="text-xs font-bold text-slate-300">Tudo em dia!</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nenhum boleto ou parcela com vencimento previsto para os próximos 10 dias.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {upcomingPayments.map(p => {
                  const badge = getDueBadge(p.daysRemaining);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        p.daysRemaining < 0
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : p.daysRemaining === 0
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.className}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {p.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{p.creditorOrBeneficiary || 'Despesa'}</span>
                          <span>•</span>
                          <span className="text-purple-300">{p.installmentInfo || 'Recorrente'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">Venc: {formatDateBR(p.dueDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="font-mono text-xs font-bold text-white text-right">
                          {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <button
                          onClick={() => handlePayUpcoming(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                          title="Registrar pagamento"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Pagar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dica: Clique em "Pagar" para registrar o pagamento imediato.</span>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Ver Extrato Completo →
            </button>
          </div>
        </div>

        {/* 2. Card: Fretes do Mês */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Fretes do Mês</h2>
                <p className="text-xs text-slate-400">Apuração de receita e lucro líquido por viagem</p>
              </div>
              <button
                onClick={() => setActiveTab('freights')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                Ver Todos →
              </button>
            </div>

            {recentFreights.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Nenhum frete registrado neste mês.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {recentFreights.map(f => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-400">{f.code}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          f.status === 'finalizado' || f.status === 'entregue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          f.status === 'em_transito' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          'bg-slate-700/50 text-slate-300'
                        }`}>
                          {f.status === 'em_transito' ? 'Em Trânsito' : (f.status === 'finalizado' || f.status === 'entregue') ? 'Finalizado' : 'Planejado'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium mt-1">
                        {f.originCity}/{f.originState} → {f.destCity}/{f.destState}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Cliente: {f.client} • Carga: {f.cargoWeightTons}t ({f.cargoType})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-white">
                        {f.grossValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        Lucro Líq: {(f.netProfit ?? (f.grossValue - 700)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Saldo: {f.balanceDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total no mês: {recentFreights.length} fretes realizados</span>
            <button
              onClick={() => setActiveTab('freights')}
              className="text-sky-400 hover:text-sky-300 font-semibold"
            >
              Criar Novo Frete →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
