import React, { useState, useMemo } from 'react';
import { Debt, FixedExpense, Expense, CreditCardInvoice } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { useApp } from '../../context/AppContext';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  Tag,
  PlusCircle,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Receipt,
  CreditCard,
  Layers,
  FileText,
  List,
  Kanban,
  CalendarDays,
  CalendarRange,
  Filter
} from 'lucide-react';
import { FixedExpenseModal } from '../modals/FixedExpenseModal';
import { DebtModal } from '../modals/DebtModal';
import { ExpenseModal } from '../modals/ExpenseModal';
import { CreditCardInvoiceDetailsModal } from '../modals/CreditCardInvoiceDetailsModal';
import { ExpensesKanban } from './ExpensesKanban';

export interface UnifiedFinancialItem {
  id: string;
  entityType: 'financiamento' | 'entrada' | 'despesa' | 'fixa' | 'fatura_cartao';
  categoryBadge: string;
  title: string;
  subtitle: string;
  amount: number;
  totalOriginal?: number;
  remainingBalance?: number;
  installmentInfo?: string;
  dateOrDueDay: string;
  rawDate: string;
  status: 'pendente' | 'pago' | 'quitado' | 'recebido';
  statusLabel: string;
  isPlanejada?: boolean;
  isPaidInMonth?: boolean;
  rawDebt?: Debt;
  rawFixedExpense?: FixedExpense;
  rawExpense?: Expense;
  rawInvoice?: CreditCardInvoice;
}

export type EntityCategoryFilter = 'todos' | 'todas_despesas' | 'despesa' | 'fatura_cartao' | 'fixa' | 'financiamento' | 'entrada';
export type EntityStatusFilter = 'todos' | 'pendentes' | 'pagos';
export type SortField = 'date' | 'amount' | 'title';
export type SortOrder = 'asc' | 'desc';

// Função utilitária para formatação visual da coluna de data
export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return { day: '--', monthName: '--', monthYear: '--', dayOfWeek: '', fullDate: '--' };
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    const dayOfWeek = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      : '';
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthIndex = Number(month) - 1;
    const monthName = monthNames[monthIndex] || month;

    return {
      day,
      monthName,
      monthYear: `${monthName}/${year.slice(2)}`,
      dayOfWeek: dayOfWeek ? (dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)) : '',
      fullDate: `${day}/${month}/${year}`,
    };
  }
  return { day: dateStr, monthName: '', monthYear: '', dayOfWeek: '', fullDate: dateStr };
};

// Calcula a data de vencimento fixa no formato YYYY-MM-DD para o mês selecionado
export const getDueDateStr = (monthYear: string, dueDay: number | string): string => {
  const parts = (monthYear || '').split('-');
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (!isNaN(year) && !isNaN(month)) {
      const lastDay = new Date(year, month, 0).getDate();
      const validDay = Math.min(Math.max(1, Number(dueDay) || 10), lastDay);
      return `${parts[0]}-${parts[1]}-${String(validDay).padStart(2, '0')}`;
    }
  }
  return `${monthYear}-${String(Number(dueDay) || 10).padStart(2, '0')}`;
};

export type PeriodScope = 
  | 'mes_atual' 
  | 'hoje' 
  | 'esta_semana' 
  | 'proxima_semana' 
  | 'proximos_15_dias' 
  | 'proximos_30_dias' 
  | 'personalizado' 
  | 'todos';

const formatYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getPeriodRange = (
  scope: PeriodScope, 
  selectedMonth: string, 
  customStart?: string, 
  customEnd?: string
): { start?: string; end?: string; label: string } => {
  const now = new Date();
  const todayStr = formatYMD(now);

  switch (scope) {
    case 'hoje':
      return { 
        start: todayStr, 
        end: todayStr, 
        label: `Hoje (${formatDateDisplay(todayStr).fullDate})` 
      };

    case 'esta_semana': {
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const start = formatYMD(monday);
      const end = formatYMD(sunday);
      return { 
        start, 
        end, 
        label: `Esta Semana (${formatDateDisplay(start).fullDate} a ${formatDateDisplay(end).fullDate})` 
      };
    }

    case 'proxima_semana': {
      const nextWeekDate = new Date(now);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const end = formatYMD(nextWeekDate);
      return { 
        start: todayStr, 
        end, 
        label: `Próxima Semana (${formatDateDisplay(todayStr).fullDate} a ${formatDateDisplay(end).fullDate})` 
      };
    }

    case 'proximos_15_dias': {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 15);
      const end = formatYMD(targetDate);
      return { 
        start: todayStr, 
        end, 
        label: `Próximos 15 dias (${formatDateDisplay(todayStr).fullDate} a ${formatDateDisplay(end).fullDate})` 
      };
    }

    case 'proximos_30_dias': {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 30);
      const end = formatYMD(targetDate);
      return { 
        start: todayStr, 
        end, 
        label: `Próximos 30 dias (${formatDateDisplay(todayStr).fullDate} a ${formatDateDisplay(end).fullDate})` 
      };
    }

    case 'personalizado': {
      const start = customStart || '';
      const end = customEnd || '';
      const startFmt = start ? formatDateDisplay(start).fullDate : 'Início';
      const endFmt = end ? formatDateDisplay(end).fullDate : 'Fim';
      return { 
        start: start || undefined, 
        end: end || undefined, 
        label: `Personalizado (${startFmt} até ${endFmt})` 
      };
    }

    case 'todos':
      return { 
        start: undefined, 
        end: undefined, 
        label: 'Histórico Completo' 
      };

    case 'mes_atual':
    default: {
      const [y, m] = (selectedMonth || todayStr.slice(0, 7)).split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const monthPrefix = `${y}-${String(m).padStart(2, '0')}`;
      const start = `${monthPrefix}-01`;
      const end = `${monthPrefix}-${String(lastDay).padStart(2, '0')}`;
      return { 
        start, 
        end, 
        label: `Mês Selecionado (${selectedMonth})` 
      };
    }
  }
};

const getMonthsInRange = (startStr?: string, endStr?: string, fallbackMonth?: string): string[] => {
  if (!startStr && !endStr) return [fallbackMonth || formatYMD(new Date()).slice(0, 7)];
  const s = startStr || `${fallbackMonth || formatYMD(new Date()).slice(0, 7)}-01`;
  const e = endStr || s;
  const startY = parseInt(s.slice(0, 4), 10) || 2026;
  const startM = parseInt(s.slice(5, 7), 10) || 1;
  const endY = parseInt(e.slice(0, 4), 10) || startY;
  const endM = parseInt(e.slice(5, 7), 10) || startM;

  const months: string[] = [];
  let currY = startY;
  let currM = startM;
  let guard = 0;
  while ((currY < endY || (currY === endY && currM <= endM)) && guard < 60) {
    months.push(`${currY}-${String(currM).padStart(2, '0')}`);
    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
    guard++;
  }
  return months.length > 0 ? months : [fallbackMonth || formatYMD(new Date()).slice(0, 7)];
};

const isDateInRange = (dateStr: string, start?: string, end?: string): boolean => {
  if (!dateStr) return false;
  if (start && dateStr < start) return false;
  if (end && dateStr > end) return false;
  return true;
};

export const UnifiedFinancialList: React.FC<{
  initialCategoryFilter?: EntityCategoryFilter;
  title?: string;
  subtitle?: string;
  onNewTransaction?: (type?: 'financiamento' | 'entrada' | 'despesa' | 'fixa' | 'fatura_cartao') => void;
}> = ({
  initialCategoryFilter = 'todos',
  title,
  subtitle,
  onNewTransaction,
}) => {
  const { 
    debts, 
    payDebtInstallment, 
    unpayDebtInstallment,
    deleteDebt,
    fixedExpenses, 
    payFixedExpense, 
    deleteFixedExpense,
    expenses, 
    updateExpense,
    deleteExpense,
    payInvoice,
    unpayInvoice,
    deleteInvoice
  } = useFinance();

  const { selectedMonth } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<EntityCategoryFilter>(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState<EntityStatusFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodScope, setPeriodScope] = useState<PeriodScope>('mes_atual');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [editingFixedExpense, setEditingFixedExpense] = useState<FixedExpense | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [inspectingInvoice, setInspectingInvoice] = useState<CreditCardInvoice | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<'lista' | 'kanban'>('lista');

  const activePeriodRange = useMemo(() => {
    return getPeriodRange(periodScope, selectedMonth, customStartDate, customEndDate);
  }, [periodScope, selectedMonth, customStartDate, customEndDate]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Funções unificadas de ação para Lista e Kanban
  const handlePayItem = async (item: UnifiedFinancialItem) => {
    const isFinanciamento = item.entityType === 'financiamento';
    const isFixa = item.entityType === 'fixa';
    const isFaturaCartao = item.entityType === 'fatura_cartao';
    const isDespesa = item.entityType === 'despesa';
    const isEntrada = item.entityType === 'entrada';

    if (isEntrada && item.rawExpense) {
      await updateExpense(item.rawExpense.id, { status: 'recebido' });
    } else if (isFaturaCartao) {
      const invId = item.rawInvoice?.id || item.rawExpense?.creditCardInvoiceId;
      if (invId) {
        await payInvoice(invId);
      } else if (item.rawExpense) {
        await updateExpense(item.rawExpense.id, { status: 'pago' });
      }
    } else if (isFinanciamento && item.rawDebt) {
      await payDebtInstallment(item.rawDebt.id, undefined, item.rawDate);
    } else if (isFixa && item.rawFixedExpense) {
      await payFixedExpense(item.rawFixedExpense.id, item.rawDate);
    } else if (isDespesa && item.rawExpense) {
      await updateExpense(item.rawExpense.id, { status: 'pago' });
    }
  };

  const handleUnpayItem = async (item: UnifiedFinancialItem) => {
    const isFinanciamento = item.entityType === 'financiamento';
    const isFixa = item.entityType === 'fixa';
    const isFaturaCartao = item.entityType === 'fatura_cartao';
    const isDespesa = item.entityType === 'despesa';
    const isEntrada = item.entityType === 'entrada';

    if (isEntrada && item.rawExpense) {
      await updateExpense(item.rawExpense.id, { status: 'pendente' });
    } else if (isFaturaCartao) {
      const invId = item.rawInvoice?.id || item.rawExpense?.creditCardInvoiceId;
      if (invId) {
        await unpayInvoice(invId);
      } else if (item.rawExpense) {
        await updateExpense(item.rawExpense.id, { status: 'pendente' });
      }
    } else if (isFinanciamento && item.rawDebt) {
      await unpayDebtInstallment(item.rawDebt.id, selectedMonth);
    } else if (isFixa && item.rawExpense) {
      await deleteExpense(item.rawExpense.id);
    } else if (isDespesa && item.rawExpense) {
      await updateExpense(item.rawExpense.id, { status: 'pendente' });
    }
  };

  const handleDeleteItem = async (item: UnifiedFinancialItem) => {
    const isFinanciamento = item.entityType === 'financiamento';
    const isFixa = item.entityType === 'fixa';
    const isFaturaCartao = item.entityType === 'fatura_cartao';

    if (isFinanciamento && item.rawDebt) {
      if (item.isPaidInMonth && !item.rawDebt.status.includes('quitado')) {
        if (window.confirm(`Estornar o pagamento da parcela de "${item.title}" referente a ${selectedMonth}?\n\nEla voltará a constar como pendente/a pagar neste mês e o saldo devedor será restaurado.`)) {
          await unpayDebtInstallment(item.rawDebt.id, selectedMonth);
        }
      } else {
        if (window.confirm(`Excluir contrato ${item.rawDebt.title}?`)) {
          await deleteDebt(item.rawDebt.id);
        }
      }
    } else if (isFixa && item.rawFixedExpense) {
      if (item.isPaidInMonth && item.rawExpense) {
        if (window.confirm(`Estornar o pagamento da despesa fixa "${item.title}" referente a ${selectedMonth}?`)) {
          await deleteExpense(item.rawExpense.id);
        }
      } else {
        if (window.confirm(`Excluir despesa fixa ${item.rawFixedExpense.description}?`)) {
          await deleteFixedExpense(item.rawFixedExpense.id);
        }
      }
    } else if (isFaturaCartao) {
      const invId = item.rawInvoice?.id || item.rawExpense?.creditCardInvoiceId;
      if (window.confirm(`Excluir a fatura "${item.title}" de ${selectedMonth} e suas compras associadas?`)) {
        if (invId) {
          await deleteInvoice(invId);
        } else if (item.rawExpense) {
          await deleteExpense(item.rawExpense.id);
        }
      }
    } else if (item.rawExpense) {
      if (window.confirm(`Excluir lançamento ${item.rawExpense.description}?`)) {
        await deleteExpense(item.rawExpense.id);
      }
    }
  };

  const handleEditItem = (item: UnifiedFinancialItem) => {
    if (item.entityType === 'financiamento' && item.rawDebt) {
      setEditingDebt(item.rawDebt);
    } else if (item.entityType === 'fixa' && item.rawFixedExpense) {
      setEditingFixedExpense(item.rawFixedExpense);
    } else if ((item.entityType === 'despesa' || item.entityType === 'entrada') && item.rawExpense) {
      setEditingExpense(item.rawExpense);
    }
  };

  const handleInspectInvoice = (item: UnifiedFinancialItem) => {
    const inv = item.rawInvoice || item.rawExpense?.creditCardInvoice || {
      id: item.rawExpense?.creditCardInvoiceId || item.id,
      cardName: item.title.replace('Fatura: ', ''),
      month: selectedMonth,
      dueDate: item.rawDate,
      status: item.status as any,
      items: []
    };
    setInspectingInvoice(inv);
  };

  // Consolidação de todas as entidades
  const allItems = useMemo(() => {
    const list: UnifiedFinancialItem[] = [];
    const { start, end } = activePeriodRange;
    const isTodos = periodScope === 'todos';
    const isMesAtual = periodScope === 'mes_atual';

    // Determina os meses que devem ser avaliados para dívidas e despesas fixas
    const targetMonths = isTodos 
      ? [selectedMonth] 
      : isMesAtual 
      ? [selectedMonth] 
      : getMonthsInRange(start, end, selectedMonth);

    // 1. Financiamentos & Parcelamentos (Debts)
    targetMonths.forEach(targetMonth => {
      debts.forEach(d => {
        const isSettled = d.status === 'quitado' || d.remainingBalance === 0;
        const paidExpense = expenses.find(e => e.debtId === d.id && e.date.startsWith(targetMonth) && e.status === 'pago');
        const pendingExpense = expenses.find(e => e.debtId === d.id && e.date.startsWith(targetMonth) && e.status !== 'pago');
        const monthExpense = paidExpense || pendingExpense;
        const isPaidThisMonth = isSettled || 
          Boolean(paidExpense) ||
          (d.payments && d.payments.some(p => p.date.startsWith(targetMonth) && (p.status as any) === 'pago'));

        const isFinanciamento = d.category === 'financiamento_veiculo' || d.category === 'consorcio';
        const typeLabel = isFinanciamento ? 'Financiamento' : 'Parcelamento / Dívida';
        const dueDateStr = getDueDateStr(targetMonth, d.dueDay);

        // Se estiver num período com start e end, verifica se o dueDateStr está no intervalo
        if (!isTodos && !isMesAtual && !isDateInRange(dueDateStr, start, end)) {
          return;
        }

        const idSuffix = targetMonths.length > 1 ? `-${targetMonth}` : '';

        list.push({
          id: `debt-${d.id}${idSuffix}`,
          entityType: 'financiamento',
          categoryBadge: typeLabel,
          title: d.title,
          subtitle: `Credor: ${d.creditor || 'Geral'} • Vencimento: Dia ${d.dueDay} de cada mês${isPaidThisMonth && paidExpense ? ` • Liquidado em ${formatDateDisplay(paidExpense.date).fullDate}` : ''}`,
          amount: d.installmentAmount,
          totalOriginal: d.totalOriginalAmount,
          remainingBalance: d.remainingBalance,
          installmentInfo: d.installmentNumberInMonth 
            ? `Parcela ${d.installmentNumberInMonth} de ${d.totalInstallments}`
            : `${d.paidInstallments}/${d.totalInstallments} parcelas quitadas`,
          dateOrDueDay: `Dia ${d.dueDay}`,
          rawDate: dueDateStr,
          status: isSettled ? 'quitado' : (isPaidThisMonth ? 'pago' : 'pendente'),
          statusLabel: isSettled ? '100% Quitado' : (isPaidThisMonth ? 'Boleto Pago no Mês' : 'A Pagar no Mês'),
          isPaidInMonth: isPaidThisMonth,
          rawDebt: d,
          rawExpense: monthExpense,
        });
      });
    });

    // 2. Entradas Avulsas e Recebimentos (Expenses com type = 'entrada')
    expenses.filter(e => {
      if (e.type !== 'entrada') return false;
      if (isTodos) return true;
      if (isMesAtual) return e.date.startsWith(selectedMonth);
      return isDateInRange(e.date, start, end);
    }).forEach(e => {
      const catLabel = e.category === 'frete' ? 'Receita Frete' :
                       e.category === 'adiantamento' ? 'Adiantamento' : 'Outra Receita';
      const isPlanejada = e.status === 'pendente' || e.status === 'agendado';

      list.push({
        id: `exp-${e.id}`,
        entityType: 'entrada',
        categoryBadge: isPlanejada ? `Entrada Planejada • ${catLabel}` : `Entrada Recebida • ${catLabel}`,
        title: e.description,
        subtitle: `Pagamento: ${e.paymentMethod.toUpperCase()}${e.freight ? ` • Frete: ${e.freight.code}` : ''}`,
        amount: e.amount,
        dateOrDueDay: e.date,
        rawDate: e.date,
        status: isPlanejada ? 'pendente' : 'recebido',
        statusLabel: isPlanejada ? 'Planejada (A Receber)' : 'Recebida em Conta',
        isPlanejada,
        rawExpense: e,
      });
    });

    // 3. Faturas de Cartão de Crédito
    expenses
      .filter(e => {
        if (e.type !== 'saida' || (e.category !== 'fatura_cartao' && !Boolean(e.creditCardInvoiceId))) return false;
        if (isTodos) return true;
        if (isMesAtual) return e.date.startsWith(selectedMonth);
        return isDateInRange(e.date, start, end);
      })
      .forEach(e => {
        const isLiquidado = e.status === 'pago';
        const inv = e.creditCardInvoice;
        const itemsCount = inv?.items?.length || 0;
        const cardCleanName = inv?.cardName || e.description.replace(/^Fatura Cartão:\s*/i, '').split(' (')[0];

        list.push({
          id: `inv-${e.id}`,
          entityType: 'fatura_cartao',
          categoryBadge: `Fatura de Cartão • ${cardCleanName}`,
          title: `Fatura: ${cardCleanName}`,
          subtitle: `Vencimento: ${e.date}${itemsCount > 0 ? ` • ${itemsCount} compra(s) inclusa(s)` : ''}`,
          amount: e.amount,
          dateOrDueDay: e.date,
          rawDate: e.date,
          status: isLiquidado ? 'pago' : 'pendente',
          statusLabel: isLiquidado ? 'Fatura Paga' : 'A Pagar no Mês',
          rawExpense: e,
          rawInvoice: inv,
        });
      });

    // 4. Despesas Avulsas (Expenses com type = 'saida' exceto faturas, dívidas e fixas)
    expenses
      .filter(e => {
        if (e.type !== 'saida' || e.debtId || e.fixedExpenseId || e.creditCardInvoiceId || e.category === 'fatura_cartao') return false;
        if (isTodos) return true;
        if (isMesAtual) return e.date.startsWith(selectedMonth);
        return isDateInRange(e.date, start, end);
      })
      .forEach(e => {
        const catLabels: Record<string, string> = {
          pedagio: 'Pedágio',
          combustivel: 'Combustível',
          arla32: 'Arla 32',
          manutencao: 'Manutenção',
          alimentacao_estadia: 'Alimentação/Estadia',
          borracharia: 'Borracharia',
          taxas_impostos: 'Taxas',
          outros: 'Outros Custos',
        };
        const catName = catLabels[e.category] || e.category;
        const isLiquidado = e.status === 'pago';
        list.push({
          id: `exp-${e.id}`,
          entityType: 'despesa',
          categoryBadge: `Despesa • ${catName}`,
          title: e.description,
          subtitle: `Pagamento: ${e.paymentMethod.toUpperCase()}${e.freight ? ` • Frete: ${e.freight.code}` : ''}`,
          amount: e.amount,
          dateOrDueDay: e.date,
          rawDate: e.date,
          status: isLiquidado ? 'pago' : 'pendente',
          statusLabel: isLiquidado ? 'Liquidado' : 'A Pagar',
          rawExpense: e,
        });
      });

    // 5. Despesas Fixas Recorrentes (FixedExpenses)
    targetMonths.forEach(targetMonth => {
      fixedExpenses.forEach(f => {
        const paymentExpense = expenses.find(e => 
          e.fixedExpenseId === f.id && 
          e.date.startsWith(targetMonth) && 
          e.status === 'pago'
        );
        const isPaidThisMonth = Boolean(paymentExpense);
        const dueDateStr = getDueDateStr(targetMonth, f.dueDay);

        // Se estiver num período com start e end, verifica se o dueDateStr está no intervalo
        if (!isTodos && !isMesAtual && !isDateInRange(dueDateStr, start, end)) {
          return;
        }

        const idSuffix = targetMonths.length > 1 ? `-${targetMonth}` : '';

        list.push({
          id: `fixed-${f.id}${idSuffix}`,
          entityType: 'fixa',
          categoryBadge: `Despesa Fixa • ${f.category === 'seguro' ? 'Seguro' : 'Recorrente'}`,
          title: f.description,
          subtitle: `Beneficiário: ${f.beneficiary || 'Recorrente'} • Vencimento: Dia ${f.dueDay} de cada mês${isPaidThisMonth && paymentExpense ? ` • Liquidado em ${formatDateDisplay(paymentExpense.date).fullDate}` : ''}`,
          amount: f.amount,
          dateOrDueDay: `Dia ${f.dueDay}`,
          rawDate: dueDateStr,
          status: isPaidThisMonth ? 'pago' : 'pendente',
          statusLabel: isPaidThisMonth ? 'Pago no Mês' : 'A Pagar no Mês',
          isPaidInMonth: isPaidThisMonth,
          rawFixedExpense: f,
          rawExpense: paymentExpense,
        });
      });
    });

    return list;
  }, [debts, expenses, fixedExpenses, selectedMonth, activePeriodRange, periodScope]);

  // Filtragem dos itens unificados
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // 1. Filtro por Categoria / Tipo de Entidade
      if (categoryFilter === 'todas_despesas') {
        if (item.entityType === 'entrada') {
          return false;
        }
      } else if (categoryFilter !== 'todos' && item.entityType !== categoryFilter) {
        return false;
      }

      // 2. Filtro por Status (Pendentes/Não Pagas vs Pagas/Concluídas)
      const isConcluido = item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;
      if (statusFilter === 'pendentes') {
        if (isConcluido) {
          return false;
        }
      } else if (statusFilter === 'pagos' || (statusFilter as any) === 'concluidos') {
        if (!isConcluido) {
          return false;
        }
      }

      // 3. Validação do Mês para financiamento quando em mes_atual
      if (periodScope === 'mes_atual') {
        if (item.entityType === 'financiamento' && item.rawDebt) {
          const d = item.rawDebt;
          if (d.hasBoletoInMonth === false) return false;
          if (d.isBeforeStartMonth || d.isAfterEndMonth) return false;
          if (d.isSettledPriorToMonth) return false;
        }
      }

      // 4. Busca Textual
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(query);
        const matchesBadge = item.categoryBadge.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubtitle && !matchesBadge) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, categoryFilter, statusFilter, periodScope, searchTerm]);

  // Contadores para as tabs de filtros
  const counts = useMemo(() => {
    const despesaCount = allItems.filter(i => i.entityType === 'despesa').length;
    const faturaCount = allItems.filter(i => i.entityType === 'fatura_cartao').length;
    const fixaCount = allItems.filter(i => i.entityType === 'fixa').length;
    const financiamentoCount = allItems.filter(i => i.entityType === 'financiamento').length;
    const entradaCount = allItems.filter(i => i.entityType === 'entrada').length;

    return {
      todos: allItems.length,
      todas_despesas: despesaCount + fixaCount + financiamentoCount + faturaCount,
      fatura_cartao: faturaCount,
      entrada: entradaCount,
      despesa: despesaCount,
      fixa: fixaCount,
      financiamento: financiamentoCount,
    };
  }, [allItems]);

  // Contadores dinâmicos para os botões de status (dentro da categoria e escopo selecionados)
  const statusCounts = useMemo(() => {
    const categoryScopedItems = allItems.filter(item => {
      if (categoryFilter === 'todas_despesas') {
        if (item.entityType === 'entrada') return false;
      } else if (categoryFilter !== 'todos' && item.entityType !== categoryFilter) {
        return false;
      }
      if (periodScope === 'mes_atual') {
        if (item.entityType === 'financiamento' && item.rawDebt) {
          const d = item.rawDebt;
          if (d.hasBoletoInMonth === false) return false;
          if (d.isBeforeStartMonth || d.isAfterEndMonth) return false;
          if (d.isSettledPriorToMonth) return false;
        }
      }
      return true;
    });

    const pagos = categoryScopedItems.filter(i => 
      i.status === 'pago' || i.status === 'quitado' || i.status === 'recebido' || i.isPaidInMonth
    ).length;

    const pendentes = categoryScopedItems.length - pagos;

    return {
      todos: categoryScopedItems.length,
      pendentes,
      pagos,
    };
  }, [allItems, categoryFilter, periodScope]);

  // Totais da visualização filtrada (com distinção de entradas recebidas vs planejadas e sub-divisão de despesas)
  const filteredTotals = useMemo(() => {
    let entradasRecebidas = 0;
    let entradasPlanejadas = 0;
    let saidas = 0;
    let totalFixas = 0;
    let totalAvulsas = 0;
    let totalFinanc = 0;
    let totalFaturas = 0;

    filteredItems.forEach(i => {
      if (i.entityType === 'entrada') {
        if (i.isPlanejada) {
          entradasPlanejadas += i.amount;
        } else {
          entradasRecebidas += i.amount;
        }
      } else {
        saidas += i.amount;
        if (i.entityType === 'fixa') totalFixas += i.amount;
        if (i.entityType === 'despesa') totalAvulsas += i.amount;
        if (i.entityType === 'financiamento') totalFinanc += i.amount;
        if (i.entityType === 'fatura_cartao') totalFaturas += i.amount;
      }
    });

    return { 
      entradasRecebidas, 
      entradasPlanejadas, 
      saidas, 
      totalFixas,
      totalAvulsas,
      totalFinanc,
      totalFaturas,
      liquidoEfetivado: entradasRecebidas - saidas 
    };
  }, [filteredItems]);

  // Ordenação dos itens filtrados por Data, Valor ou Título
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.rawDate.localeCompare(b.rawDate);
        if (cmp !== 0) {
          return sortOrder === 'desc' ? -cmp : cmp;
        }
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      if (sortField === 'amount') {
        const diff = a.amount - b.amount;
        if (diff !== 0) {
          return sortOrder === 'desc' ? -diff : diff;
        }
        return b.rawDate.localeCompare(a.rawDate);
      }
      if (sortField === 'title') {
        const cmp = a.title.localeCompare(b.title);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Barra de Título & Subtítulo (Opcional, exibida apenas quando explicitamente fornecida) */}
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <div className="text-xs text-slate-400">
            Total de <strong>{filteredItems.length}</strong> registro(s) listado(s)
          </div>
        </div>
      )}

      {/* Controles de Filtragem e Busca */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Linha 1: Categorias Principais (Tabs Roláveis com Touch) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 max-w-full scrollbar-none">
            {[
              { id: 'todos', label: 'Todos', icon: Tag, count: counts.todos, title: 'Todos os lançamentos (entradas e saídas)' },
              { id: 'todas_despesas', label: 'Todas as Despesas', icon: Receipt, count: counts.todas_despesas, title: 'Todas as despesas consolidadas: fixas, faturas de cartão, operacionais avulsas e financiamentos' },
              { id: 'fatura_cartao', label: 'Faturas de Cartão', icon: CreditCard, count: counts.fatura_cartao, title: 'Faturas de cartão de crédito e compras parceladas' },
              { id: 'despesa', label: 'Despesas Avulsas', icon: TrendingDown, count: counts.despesa, title: 'Despesas operacionais variáveis (diesel, pedágio, manutenção)' },
              { id: 'fixa', label: 'Despesas Fixas', icon: Calendar, count: counts.fixa, title: 'Despesas mensais recorrentes (seguro, rastreador, etc.)' },
              { id: 'financiamento', label: 'Financiamentos & Dívidas', icon: Landmark, count: counts.financiamento, title: 'Parcelamentos e financiamentos do caminhão/veículo' },
              { id: 'entrada', label: 'Entradas (Recebidas / Planejadas)', icon: TrendingUp, count: counts.entrada, title: 'Receitas de fretes e entradas avulsas' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id as EntityCategoryFilter)}
                  title={tab.title}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                    isActive
                      ? tab.id === 'todas_despesas'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-1 ring-rose-400/40'
                        : tab.id === 'fatura_cartao'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400/40'
                        : tab.id === 'entrada'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                        : tab.id === 'financiamento'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                        : tab.id === 'fixa'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                        : 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white font-bold' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 lg:pb-0 max-w-full">
            {/* Filtro de Status Dinâmico */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1 shrink-0">
              {/* Botão Todas/Todos */}
              <button
                onClick={() => setStatusFilter('todos')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                  statusFilter === 'todos'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{categoryFilter === 'todos' ? 'Todos' : 'Todas'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === 'todos' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500'
                }`}>
                  {statusCounts.todos}
                </span>
              </button>

              {/* Botão Não Pagas / Pendentes */}
              <button
                onClick={() => setStatusFilter('pendentes')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                  statusFilter === 'pendentes'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizar apenas as despesas não pagas"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {categoryFilter === 'entrada'
                    ? 'Planejadas'
                    : categoryFilter === 'todos'
                    ? 'Não Pagas / Pendentes'
                    : 'Não Pagas'}
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === 'pendentes' ? 'bg-amber-500/30 text-amber-200 font-bold' : 'bg-slate-900 text-slate-500'
                }`}>
                  {statusCounts.pendentes}
                </span>
              </button>

              {/* Botão Pagas / Concluídas */}
              <button
                onClick={() => setStatusFilter('pagos')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                  statusFilter === 'pagos'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualizar apenas as despesas que já foram pagas"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {categoryFilter === 'entrada'
                    ? 'Recebidas'
                    : categoryFilter === 'todos'
                    ? 'Pagas / Recebidas'
                    : 'Pagas'}
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  statusFilter === 'pagos' ? 'bg-emerald-500/30 text-emerald-200 font-bold' : 'bg-slate-900 text-slate-500'
                }`}>
                  {statusCounts.pagos}
                </span>
              </button>
            </div>

            {onNewTransaction && (
              <button
                onClick={() => onNewTransaction(categoryFilter === 'entrada' ? 'entrada' : categoryFilter === 'fixa' ? 'fixa' : categoryFilter === 'financiamento' ? 'financiamento' : 'despesa')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Novo Lançamento</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Barra de Pesquisa e Filtro de Período de Exibição */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Campo de Pesquisa */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por título, credor, fornecedor, descrição..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Seletor de Períodos Rápidos */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              {[
                { id: 'mes_atual', label: `Mês (${selectedMonth})`, title: `Exibir registros do mês selecionado (${selectedMonth})` },
                { id: 'hoje', label: 'Hoje', title: 'Exibir despesas e vencimentos de hoje' },
                { id: 'esta_semana', label: 'Esta Semana', title: 'Exibir da segunda-feira ao domingo desta semana' },
                { id: 'proxima_semana', label: 'Próxima Semana (7d)', title: 'Exibir vencimentos dos próximos 7 dias' },
                { id: 'proximos_15_dias', label: 'Próximos 15d', title: 'Exibir vencimentos dos próximos 15 dias' },
                { id: 'proximos_30_dias', label: 'Próximos 30d', title: 'Exibir vencimentos dos próximos 30 dias' },
                { id: 'personalizado', label: 'Personalizado', title: 'Definir intervalo de datas específico' },
                { id: 'todos', label: 'Histórico Completo', title: 'Exibir todos os registros históricos sem restrição' },
              ].map(p => {
                const isActive = periodScope === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriodScope(p.id as PeriodScope)}
                    title={p.title}
                    className={`px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300 shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-barra: Intervalo Personalizado & Indicador do Intervalo Ativo */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/70 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <CalendarDays className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Período ativo:</span>
              <span className="font-semibold text-sky-300 font-sans">
                {activePeriodRange.label}
              </span>
            </div>

            {periodScope === 'personalizado' && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">De:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:border-sky-500"
                />
                <span className="text-[11px] text-slate-400">Até:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Linha 3: Resumo dos Totais Filtrados com Destaque para Planejadas vs Recebidas ou Subtotais de Despesas */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono border-t border-slate-800/60">
          {categoryFilter === 'todas_despesas' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span className="text-slate-400 font-sans">Avulsas:</span>
                <span className="text-rose-400 font-bold">
                  {filteredTotals.totalAvulsas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <span className="text-slate-600 font-sans">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span className="text-slate-400 font-sans">Fixas:</span>
                <span className="text-sky-400 font-bold">
                  {filteredTotals.totalFixas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <span className="text-slate-600 font-sans">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-slate-400 font-sans">Financiamentos:</span>
                <span className="text-purple-400 font-bold">
                  {filteredTotals.totalFinanc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-400 font-sans">Entradas Recebidas:</span>
                <span className="text-emerald-400 font-bold">
                  +{filteredTotals.entradasRecebidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {filteredTotals.entradasPlanejadas > 0 && (
                <>
                  <span className="text-slate-600 font-sans">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-slate-400 font-sans">Entradas Planejadas:</span>
                    <span className="text-amber-400 font-bold">
                      +{filteredTotals.entradasPlanejadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span className="text-slate-400 font-sans">
              {categoryFilter === 'todas_despesas' ? 'Total Geral de Saídas:' : 'Saídas & Parcelas:'}
            </span>
            <span className="text-rose-400 font-bold">
              -{filteredTotals.saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* Cabeçalho de Colunas & Ordenação da Listagem */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Ordenar listagem por:
          </span>

          {/* Botão de Ordenação por Data */}
          <button
            onClick={() => handleSort('date')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
              sortField === 'date'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Alternar ordenação por data (Mais recente / Mais antiga)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Data:</span>
            <span className="font-bold text-white">
              {sortField === 'date' ? (sortOrder === 'desc' ? 'Mais Recente' : 'Mais Antiga') : 'Padrão'}
            </span>
            {sortField === 'date' ? (
              sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-sky-400" /> : <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-60" />
            )}
          </button>

          {/* Botão de Ordenação por Valor */}
          <button
            onClick={() => handleSort('amount')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all font-semibold ${
              sortField === 'amount'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Alternar ordenação por valor (Maior / Menor)"
          >
            <span>Valor:</span>
            <span className="font-bold text-white">
              {sortField === 'amount' ? (sortOrder === 'desc' ? 'Maior Valor' : 'Menor Valor') : 'Normal'}
            </span>
            {sortField === 'amount' ? (
              sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-sky-400" /> : <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-60" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-medium">
            Exibindo <strong className="text-white font-mono">{sortedItems.length}</strong> registro(s)
          </div>

          {/* Toggle de Modo de Visualização (Lista vs Kanban) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'lista'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <ExpensesKanban
          items={sortedItems}
          onPayItem={handlePayItem}
          onUnpayItem={handleUnpayItem}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          onInspectInvoice={handleInspectInvoice}
          categoryFilter={categoryFilter}
          selectedMonth={selectedMonth}
        />
      ) : (
        /* Listagem dos Itens Filtrados e Ordenados */
        <div className="space-y-2.5">
        {sortedItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${statusFilter === 'pendentes' ? 'text-emerald-400' : 'text-slate-600'}`} />
            <p className="text-sm font-semibold text-slate-300">
              {statusFilter === 'pendentes'
                ? 'Nenhuma despesa pendente a pagar neste período!'
                : statusFilter === 'pagos'
                ? 'Nenhum lançamento pago encontrado para os filtros selecionados'
                : 'Nenhum lançamento encontrado'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter === 'pendentes'
                ? 'Todas as contas e parcelas deste período já foram pagas e liquidadas.'
                : 'Altere os filtros de categoria, status ou busca textual para visualizar outros registros.'}
            </p>
          </div>
        ) : (
          sortedItems.map(item => {
            const isFinanciamento = item.entityType === 'financiamento';
            const isFaturaCartao = item.entityType === 'fatura_cartao';
            const isEntrada = item.entityType === 'entrada';
            const isDespesa = item.entityType === 'despesa';
            const isFixa = item.entityType === 'fixa';
            const isPlanejada = item.isPlanejada;
            const dateInfo = formatDateDisplay(item.rawDate);

            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group"
              >
                {/* Lado Esquerdo: Coluna de Data Dedicada + Ícone Temático + Informações */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Coluna de Data Dedicada */}
                  <div
                    className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[78px] px-2 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-center shrink-0 shadow-inner group-hover:border-slate-700 transition-colors"
                    title={`Data: ${dateInfo.fullDate}`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {dateInfo.dayOfWeek || (isFinanciamento || isFixa || isFaturaCartao ? 'VENC' : 'DATA')}
                    </span>
                    <span className="font-mono text-base sm:text-lg font-black text-white leading-tight my-0.5">
                      {dateInfo.day}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dateInfo.monthYear}
                    </span>
                  </div>

                  {/* Ícone Temático */}
                  <div className={`p-2.5 rounded-xl shrink-0 hidden sm:flex ${
                    isFinanciamento ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' :
                    isFaturaCartao ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' :
                    isEntrada ? (isPlanejada ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400') :
                    isDespesa ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' :
                    'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                  }`}>
                    {isFinanciamento && <Landmark className="w-4 h-4" />}
                    {isFaturaCartao && <CreditCard className="w-4 h-4" />}
                    {isEntrada && (isPlanejada ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />)}
                    {isDespesa && <TrendingDown className="w-4 h-4" />}
                    {isFixa && <Calendar className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-none">
                        {item.title}
                      </span>

                      {/* Badge de Categorização */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFinanciamento ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                        isFaturaCartao ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                        isEntrada ? (isPlanejada ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30') :
                        isDespesa ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                        'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      }`}>
                        {item.categoryBadge}
                      </span>

                      {/* Badge de Status */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        item.status === 'quitado' || item.status === 'pago' || item.status === 'recebido'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.status === 'recebido' && <CheckCircle2 className="w-3 h-3" />}
                        {isPlanejada && <Clock className="w-3 h-3" />}
                        <span>{item.statusLabel}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {item.subtitle}
                    </div>

                    {/* Detalhes extras se for dívida ou financiamento */}
                    {isFinanciamento && (
                      <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2.5 pt-0.5">
                        {item.totalOriginal !== undefined && (
                          <span>Total: <strong className="text-slate-300">{item.totalOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
                        )}
                        {item.remainingBalance !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400">
                              Saldo Restante: {item.remainingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </>
                        )}
                        {item.installmentInfo && (
                          <>
                            <span>•</span>
                            <span className="text-purple-300 font-medium">{item.installmentInfo}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Valores Financeiros e Ações */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">
                      {isFinanciamento ? 'Parcela Mensal' : isFixa ? 'Valor Mensal' : isFaturaCartao ? 'Total da Fatura' : (isPlanejada ? 'Valor Previsto' : 'Valor Total')}
                    </div>
                    <div className={`font-mono text-base font-bold ${
                      isEntrada ? (isPlanejada ? 'text-amber-400' : 'text-emerald-400') :
                      isFinanciamento ? 'text-purple-400' :
                      isFaturaCartao ? 'text-indigo-400' :
                      isFixa ? 'text-sky-400' : 'text-rose-400'
                    }`}>
                      {isEntrada ? '+' : '-'} {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  {/* Ações Rápidas por Tipo */}
                  {/* Para Entrada Planejada: Confirmar Recebimento */}
                  {isEntrada && item.rawExpense && isPlanejada && (
                    <button
                      onClick={() => updateExpense(item.rawExpense!.id, { status: 'recebido' })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                      title="Marcar entrada como recebida e creditada"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Recebimento</span>
                    </button>
                  )}

                  {/* Para Fatura de Cartão: Ver Compras & Pagar */}
                  {isFaturaCartao && (
                    <button
                      onClick={() => {
                        const inv = item.rawInvoice || item.rawExpense?.creditCardInvoice || {
                          id: item.rawExpense?.creditCardInvoiceId || item.id,
                          cardName: item.title.replace('Fatura: ', ''),
                          month: selectedMonth,
                          dueDate: item.rawDate,
                          status: item.status as any,
                          items: []
                        };
                        setInspectingInvoice(inv);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                      title="Ver compras e parcelas inclusas nesta fatura"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Ver Compras ({item.rawInvoice?.items?.length || item.rawExpense?.creditCardInvoice?.items?.length || 0})</span>
                    </button>
                  )}

                  {isFaturaCartao && item.status === 'pendente' && (
                    <button
                      onClick={() => {
                        const invId = item.rawInvoice?.id || item.rawExpense?.creditCardInvoiceId;
                        if (invId) {
                          payInvoice(invId);
                        } else if (item.rawExpense) {
                          updateExpense(item.rawExpense.id, { status: 'pago' });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1"
                      title="Marcar fatura como paga"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar Fatura</span>
                    </button>
                  )}

                  {/* Para Financiamento não pago */}
                  {isFinanciamento && item.rawDebt && item.rawDebt.status !== 'quitado' && !item.isPaidInMonth && (
                    <button
                      onClick={() => payDebtInstallment(item.rawDebt!.id, undefined, item.rawDate)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Pagar Parcela
                    </button>
                  )}

                  {/* Para Despesa Fixa pendente no mês */}
                  {isFixa && item.rawFixedExpense && !item.isPaidInMonth && (
                    <button
                      onClick={() => payFixedExpense(item.rawFixedExpense!.id, item.rawDate)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      Pagar no Mês
                    </button>
                  )}

                  {/* Para Despesa Operacional Pendente */}
                  {isDespesa && item.rawExpense && item.status === 'pendente' && (
                    <button
                      onClick={() => updateExpense(item.rawExpense!.id, { status: 'pago' })}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1"
                      title="Registrar pagamento desta despesa"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar</span>
                    </button>
                  )}

                  {/* Indicador de Quitado/Pago */}
                  {(item.status === 'quitado' || item.isPaidInMonth || ((isDespesa || isFaturaCartao) && item.status === 'pago')) && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.status === 'quitado' ? 'Quitado' : isFaturaCartao ? 'Fatura Paga' : 'Pago'}</span>
                    </span>
                  )}

                  {/* Botão de Edição (para Financiamento/Parcelamento) */}
                  {isFinanciamento && item.rawDebt && (
                    <button
                      onClick={() => setEditingDebt(item.rawDebt!)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors"
                      title="Editar contrato / parcelamento"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Botão de Edição (para Despesa Fixa) */}
                  {isFixa && item.rawFixedExpense && (
                    <button
                      onClick={() => setEditingFixedExpense(item.rawFixedExpense!)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 transition-colors"
                      title="Editar despesa fixa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Botão de Edição (para Despesa Avulsa ou Entrada) */}
                  {(isDespesa || isEntrada) && item.rawExpense && (
                    <button
                      onClick={() => setEditingExpense(item.rawExpense!)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 transition-colors"
                      title={isDespesa ? "Editar despesa" : "Editar entrada"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Botão de Exclusão / Estorno */}
                  <button
                    onClick={() => {
                      if (isFinanciamento && item.rawDebt) {
                        if (item.isPaidInMonth && !item.rawDebt.status.includes('quitado')) {
                          if (window.confirm(`Estornar o pagamento da parcela de "${item.title}" referente a ${selectedMonth}?\n\nEla voltará a constar como pendente/a pagar neste mês e o saldo devedor será restaurado.`)) {
                            unpayDebtInstallment(item.rawDebt.id, selectedMonth);
                          }
                        } else {
                          if (window.confirm(`Excluir contrato ${item.rawDebt.title}?`)) {
                            deleteDebt(item.rawDebt.id);
                          }
                        }
                      } else if (isFixa && item.rawFixedExpense) {
                        if (item.isPaidInMonth && item.rawExpense) {
                          if (window.confirm(`Estornar o pagamento da despesa fixa "${item.title}" referente a ${selectedMonth}?`)) {
                            deleteExpense(item.rawExpense.id);
                          }
                        } else {
                          if (window.confirm(`Excluir despesa fixa ${item.rawFixedExpense.description}?`)) {
                            deleteFixedExpense(item.rawFixedExpense.id);
                          }
                        }
                      } else if (isFaturaCartao) {
                        const invId = item.rawInvoice?.id || item.rawExpense?.creditCardInvoiceId;
                        if (window.confirm(`Excluir a fatura "${item.title}" de ${selectedMonth} e suas compras associadas?`)) {
                          if (invId) {
                            deleteInvoice(invId);
                          } else if (item.rawExpense) {
                            deleteExpense(item.rawExpense.id);
                          }
                        }
                      } else if (item.rawExpense) {
                        if (window.confirm(`Excluir lançamento ${item.rawExpense.description}?`)) {
                          deleteExpense(item.rawExpense.id);
                        }
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title={
                      isFixa && item.isPaidInMonth 
                        ? "Estornar pagamento deste mês" 
                        : isFinanciamento && item.isPaidInMonth 
                          ? "Estornar parcela deste mês" 
                          : isFaturaCartao 
                            ? "Excluir fatura"
                            : "Excluir registro"
                    }
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

      <FixedExpenseModal
        isOpen={!!editingFixedExpense}
        onClose={() => setEditingFixedExpense(null)}
        fixedExpense={editingFixedExpense}
      />

      <DebtModal
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        debt={editingDebt}
      />

      <ExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
      />

      <CreditCardInvoiceDetailsModal
        isOpen={Boolean(inspectingInvoice)}
        onClose={() => setInspectingInvoice(null)}
        invoice={inspectingInvoice}
        onAddNewPurchase={(cardName, month, dueDate) => {
          onNewTransaction?.('fatura_cartao');
        }}
      />
    </div>
  );
};
