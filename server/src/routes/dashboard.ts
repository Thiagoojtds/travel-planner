import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/dashboard?month=2026-10
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const month = (req.query.month as string) || currentYearMonth;

    // Obter dados do caminhão
    let truck = await prisma.truck.findFirst();
    if (!truck) {
      truck = await prisma.truck.create({
        data: {
          plate: 'BRA2E19',
          model: 'Iveco Stralis',
          brand: 'Iveco',
          trailerModel: 'Carreta Randon',
          trailerPlate: 'ABC1D23',
          currentKm: 0,
          fuelCapacityPrincipal: 600,
          fuelCapacityAuxiliar: 300,
          avgConsumption: 2.2,
          oilChangeIntervalKm: 20000,
          lastOilChangeKm: 0,
        }
      });
    }

    // Fretes do mês
    const freights = await prisma.freight.findMany({
      where: {
        departureDate: { startsWith: month }
      },
      include: {
        fuelings: true,
        expenses: true,
      }
    });

    // Despesas do mês
    const expenses = await prisma.expense.findMany({
      where: {
        date: { startsWith: month }
      }
    });

    // Abastecimentos do mês
    const fuelings = await prisma.fueling.findMany({
      where: {
        date: { startsWith: month }
      }
    });

    // Manutenções do mês
    const maintenances = await prisma.maintenance.findMany({
      where: {
        date: { startsWith: month }
      }
    });

function addMonths(yearMonth: string, count: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const d = new Date(year, month + count, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthDiff(fromYM: string, toYM: string): number {
  const [y1, m1] = fromYM.split('-').map(Number);
  const [y2, m2] = toYM.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

    // Dívidas ativas no mês consultado:
    // O parcelamento DEVE ser exibido SOMENTE nos meses em que existem boletos para pagamentos!
    const allDebts = await prisma.debt.findMany({
      include: {
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    const activeDebts = allDebts.filter(d => {
      const startMonth = d.startDate 
        ? d.startDate.slice(0, 7) 
        : d.createdAt.toISOString().slice(0, 7);

      const initialPaid = d.initialPaidInstallments || 0;
      const remainingInstallmentsAtStart = Math.max(1, d.totalInstallments - initialPaid);
      const endMonth = addMonths(startMonth, remainingInstallmentsAtStart - 1);

      const monthDiff = getMonthDiff(startMonth, month);
      const isBeforeStartMonth = monthDiff < 0;
      const isAfterEndMonth = monthDiff >= remainingInstallmentsAtStart;

      // 1. Se o mês consultado for anterior ao início ou posterior ao término das parcelas -> NUNCA EXIBIR!
      if (isBeforeStartMonth || isAfterEndMonth) {
        return false;
      }

      const effectiveSettledDate = d.settledAt || 
        (d.payments && d.payments[0]?.date) || 
        d.updatedAt.toISOString().split('T')[0];
      const settledMonth = effectiveSettledDate ? effectiveSettledDate.slice(0, 7) : null;

      // 2. Se a dívida foi quitada antes do mês consultado -> NUNCA EXIBIR!
      if (d.status === 'quitado' || d.remainingBalance === 0) {
        if (settledMonth && settledMonth < month) {
          return false;
        }
        // Se foi quitada neste mês e não tem saldo devedor restante -> não há boleto pendente no dashboard
        if (d.remainingBalance === 0) {
          return false;
        }
      }

      return true;
    });

    // Despesas fixas ativas
    const activeFixedExpenses = await prisma.fixedExpense.findMany({
      where: { active: true }
    });

    // Cálculos financeiros do mês
    // 1. Receita de fretes realizados no mês
    const freightRevenue = freights.reduce((acc, f) => acc + f.grossValue, 0);

    // 2. Entradas avulsas cadastradas em "Novo lançamento avulso" (Expense com type === 'entrada' sem freightId para não duplicar com freightRevenue)
    const extraRevenue = expenses
      .filter(e => e.type === 'entrada' && !e.freightId)
      .reduce((acc, e) => acc + e.amount, 0);

    // Faturamento Bruto Geral = Fretes + Entradas Avulsas
    const grossRevenue = freightRevenue + extraRevenue;

    const advancesReceived = freights.reduce((acc, f) => acc + f.advanceValue, 0);
    const balancesPending = freights
      .filter(f => f.paymentStatus !== 'pago')
      .reduce((acc, f) => acc + f.balanceDue, 0);

    const totalFuelMonth = fuelings.reduce((acc, f) => acc + f.totalAmount, 0);
    const totalFuelLitersMonth = fuelings.reduce((acc, f) => acc + f.liters, 0);

    const totalMaintenanceMonth = maintenances.reduce((acc, m) => acc + m.totalCost, 0);

    // Custos de motorista (fixo por viagem)
    const totalDriverPayMonth = freights.reduce((acc, f) => acc + (f.driverPay || truck.driverTripPay || 700), 0);

    // Parcelas de dívidas devidas neste mês
    const totalDebtsDueMonth = activeDebts.reduce((acc, d) => acc + d.installmentAmount, 0);
    const totalFixedDueMonth = activeFixedExpenses.reduce((acc, fe) => acc + fe.amount, 0);

    // Despesas operacionais avulsas do mês (pagas e pendentes) que não sejam parcelas, fixas, fretes ou combustível já contabilizado
    const standaloneOperatingExpenses = expenses
      .filter(e => e.type === 'saida' && !e.debtId && !e.fixedExpenseId && !e.freightId && !e.fuelingId && e.category !== 'combustivel')
      .reduce((acc, e) => acc + e.amount, 0);

    // Total de despesas pagas no mês
    const totalPaidExpenses = expenses
      .filter(e => e.type === 'saida' && e.status === 'pago')
      .reduce((acc, e) => acc + e.amount, 0);

    // Restante a pagar no mês (soma de todas as despesas em aberto: parcelas + fixas + despesas operacionais avulsas pendentes)
    const paidDebtIdsThisMonth = new Set(
      expenses.filter(e => e.debtId && e.status === 'pago').map(e => e.debtId)
    );
    const remainingDebtsToPay = activeDebts
      .filter(d => {
        // Se já foi paga neste mês via despesa com status 'pago', não resta a pagar
        if (paidDebtIdsThisMonth.has(d.id)) return false;
        // Se já foi paga no histórico de pagamentos do contrato no mês, não resta a pagar
        const isPaidInHistory = (d.payments || []).some(p => p.date.startsWith(month) && p.status === 'pago');
        if (isPaidInHistory) return false;
        // Se a dívida já está quitada e o saldo é zero, não deve cobrar
        if (d.status === 'quitado' && d.remainingBalance === 0) return false;
        return true;
      })
      .reduce((acc, d) => acc + d.installmentAmount, 0);

    const paidFixedIdsThisMonth = new Set(
      expenses.filter(e => e.fixedExpenseId && e.status === 'pago').map(e => e.fixedExpenseId)
    );
    const remainingFixedToPay = activeFixedExpenses
      .filter(f => !paidFixedIdsThisMonth.has(f.id))
      .reduce((acc, f) => acc + f.amount, 0);

    const remainingStandaloneOperating = expenses
      .filter(e => e.type === 'saida' && (e.status === 'pendente' || e.status === 'agendado') && !e.debtId && !e.fixedExpenseId)
      .reduce((acc, e) => acc + e.amount, 0);

    const restanteAPagarTotal = remainingDebtsToPay + remainingFixedToPay + remainingStandaloneOperating;

    // Lucro Real = Faturamento Bruto (Fretes + Entradas Avulsas) - Custos Totais Operacionais
    const totalOperatingCosts = totalFuelMonth + totalDriverPayMonth + totalMaintenanceMonth + totalDebtsDueMonth + totalFixedDueMonth + standaloneOperatingExpenses;
    const netProfit = grossRevenue - totalOperatingCosts;

    // Balanceamento de Dívidas & Parcelamentos
    const totalOriginalAmount = allDebts.reduce((acc, d) => acc + d.totalOriginalAmount, 0);
    const totalRemainingBalance = allDebts.reduce((acc, d) => acc + (d.status === 'quitado' ? 0 : d.remainingBalance), 0);
    const totalAmortizedAmount = Math.max(0, totalOriginalAmount - totalRemainingBalance);
    const amortizationPercentage = totalOriginalAmount > 0 
      ? Number(((totalAmortizedAmount / totalOriginalAmount) * 100).toFixed(1)) 
      : 100;
    const totalDebtsCount = allDebts.length;
    const activeDebtsCount = allDebts.filter(d => d.status === 'ativo' && d.remainingBalance > 0).length;
    const settledDebtsCount = allDebts.filter(d => d.status === 'quitado' || d.remainingBalance === 0).length;

    const monthDebtPaidAmount = expenses
      .filter(e => e.debtId && e.type === 'saida' && e.status === 'pago')
      .reduce((acc, e) => acc + e.amount, 0);
    const monthDebtDueAmount = monthDebtPaidAmount + remainingDebtsToPay;

    const debtBalance = {
      totalOriginalAmount,
      totalRemainingBalance,
      totalAmortizedAmount,
      amortizationPercentage,
      totalDebtsCount,
      activeDebtsCount,
      settledDebtsCount,
      monthDueAmount: monthDebtDueAmount,
      monthPaidAmount: monthDebtPaidAmount,
      monthRemainingAmount: remainingDebtsToPay,
    };

    // Cálculos de Pagamentos dos Próximos 10 Dias (e vencidos no mês corrente)
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const today = new Date(todayStr + 'T00:00:00');
    const endWindow = new Date(today);
    endWindow.setDate(today.getDate() + 10);
    const endWindowStr = endWindow.toISOString().slice(0, 10);

    function getCandidateDate(year: number, monthNum: number, day: number): string {
      const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
      const cappedDay = Math.min(day, lastDayOfMonth);
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(cappedDay).padStart(2, '0')}`;
    }

    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthNum = nextMonthDate.getMonth() + 1;

    const monthsToCheck = [
      { year: currentYear, month: currentMonthNum },
      { year: nextYear, month: nextMonthNum }
    ];

    const upcomingPayments: any[] = [];

    // 1. Parcelamentos / Dívidas ativas
    for (const d of allDebts) {
      if (d.status === 'quitado' || d.remainingBalance <= 0) continue;

      const startMonth = d.startDate 
        ? d.startDate.slice(0, 7) 
        : d.createdAt.toISOString().slice(0, 7);
      const initialPaid = d.initialPaidInstallments || 0;
      const remainingInstallmentsAtStart = Math.max(1, d.totalInstallments - initialPaid);

      for (const m of monthsToCheck) {
        const candDateStr = getCandidateDate(m.year, m.month, d.dueDay);
        const candDate = new Date(candDateStr + 'T00:00:00');
        const candMonthStr = candDateStr.slice(0, 7);

        // Verifica se o mês está dentro do cronograma das parcelas contratadas
        const monthDiff = getMonthDiff(startMonth, candMonthStr);
        if (monthDiff < 0 || monthDiff >= remainingInstallmentsAtStart) {
          continue; // Mês fora da vigência das parcelas do contrato!
        }

        // Se foi quitada antes desse mês de vencimento, pula
        if (d.settledAt && d.settledAt.slice(0, 7) < candMonthStr) continue;

        // Se já foi paga nesse mês, pula
        const isPaid = (d.payments || []).some(
          p => p.date.startsWith(candMonthStr) && p.status === 'pago'
        );
        if (isPaid) continue;

        const daysDiff = Math.round((candDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdueInCurrentMonth = candMonthStr === todayStr.slice(0, 7) && daysDiff < 0;
        const isUpcomingIn10Days = candDateStr >= todayStr && candDateStr <= endWindowStr;

        if (isUpcomingIn10Days || isOverdueInCurrentMonth) {
          upcomingPayments.push({
            id: `debt-${d.id}-${candDateStr}`,
            sourceType: 'debt',
            sourceId: d.id,
            title: d.title,
            creditorOrBeneficiary: d.creditor || undefined,
            amount: Number(d.installmentAmount || 0),
            dueDate: candDateStr,
            dueDay: Number(d.dueDay || 10),
            daysRemaining: daysDiff,
            status: daysDiff < 0 ? 'atrasado' : 'pendente',
            installmentInfo: `Parcela ${(d.paidInstallments || 0) + 1}/${d.totalInstallments}`,
            category: d.category,
          });
        }
      }
    }

    // 2. Despesas Fixas Recorrentes
    const allFixedWithExpenses = await prisma.fixedExpense.findMany({
      include: { expenses: true }
    });

    for (const fe of allFixedWithExpenses) {
      if (!fe.active) continue;

      for (const m of monthsToCheck) {
        const candDateStr = getCandidateDate(m.year, m.month, fe.dueDay);
        const candDate = new Date(candDateStr + 'T00:00:00');
        const candMonthStr = candDateStr.slice(0, 7);

        const isPaid = (fe.expenses || []).some(
          e => e.date.startsWith(candMonthStr) && e.status === 'pago'
        );
        if (isPaid) continue;

        const daysDiff = Math.round((candDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdueInCurrentMonth = candMonthStr === todayStr.slice(0, 7) && daysDiff < 0;
        const isUpcomingIn10Days = candDateStr >= todayStr && candDateStr <= endWindowStr;

        if (isUpcomingIn10Days || isOverdueInCurrentMonth) {
          upcomingPayments.push({
            id: `fixed-${fe.id}-${candDateStr}`,
            sourceType: 'fixed_expense',
            sourceId: fe.id,
            title: fe.description,
            creditorOrBeneficiary: fe.beneficiary || undefined,
            amount: Number(fe.amount || 0),
            dueDate: candDateStr,
            dueDay: Number(fe.dueDay || 10),
            daysRemaining: daysDiff,
            status: daysDiff < 0 ? 'atrasado' : 'pendente',
            installmentInfo: 'Despesa Recorrente',
            category: fe.category,
          });
        }
      }
    }

    // 3. Despesas operacionais avulsas ou outros custos agendados/pendentes
    // Exclui dívidas (debtId) e despesas fixas (fixedExpenseId) para evitar duplicidade com os blocos 1 e 2
    for (const exp of expenses) {
      if (exp.type !== 'saida') continue;
      if (exp.status !== 'pendente' && exp.status !== 'agendado') continue;
      if (exp.debtId || exp.fixedExpenseId) continue;
      if (!exp.date) continue;

      const expDate = new Date(exp.date + 'T00:00:00');
      const daysDiff = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdueInCurrentMonth = exp.date.slice(0, 7) === todayStr.slice(0, 7) && daysDiff < 0;
      const isUpcomingIn10Days = exp.date >= todayStr && exp.date <= endWindowStr;

      if (isUpcomingIn10Days || isOverdueInCurrentMonth) {
        upcomingPayments.push({
          id: `expense-${exp.id}`,
          sourceType: 'expense',
          sourceId: exp.id,
          title: exp.description,
          creditorOrBeneficiary: undefined,
          amount: Number(exp.amount || 0),
          dueDate: exp.date,
          dueDay: Number(exp.date.slice(8, 10)),
          daysRemaining: daysDiff,
          status: daysDiff < 0 ? 'atrasado' : 'pendente',
          installmentInfo: exp.installmentNumber ? `Parcela ${exp.installmentNumber}` : 'Saída Prevista',
          category: exp.category,
        });
      }
    }

    // Ordenar vencimentos por data crescente
    upcomingPayments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    // Soma total dos pagamentos com vencimento estritamente nos próximos 10 dias
    const upcoming10DaysTotal = upcomingPayments
      .filter(p => p.dueDate >= todayStr && p.dueDate <= endWindowStr)
      .reduce((acc, p) => acc + p.amount, 0);

    // Cálculo da troca de óleo (limite de 20.000 km)
    const usedKm = Math.max(0, truck.currentKm - truck.lastOilChangeKm);
    const limitKm = truck.oilChangeIntervalKm || 20000;
    const remainingKm = Math.max(0, limitKm - usedKm);
    const oilPercentage = Math.min(100, Math.round((usedKm / limitKm) * 100));
    const oilWarning = oilPercentage >= 85 && oilPercentage < 100;
    const oilCritical = oilPercentage >= 100;

    // Histórico de Evolução Mensal dos Indicadores (até 12 meses para permitir visualização flexível)
    function getPastMonths(refMonth: string, count: number = 12): string[] {
      const [y, m] = refMonth.split('-').map(Number);
      const result: string[] = [];
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(y, m - 1 - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        result.push(ym);
      }
      return result;
    }

    const pastMonthsList = getPastMonths(month, 12);
    const earliestMonth = pastMonthsList[0];

    const [allHistoryFreights, allHistoryExpenses, allHistoryFuelings, allHistoryMaintenances] = await Promise.all([
      prisma.freight.findMany({
        where: { departureDate: { gte: earliestMonth } }
      }),
      prisma.expense.findMany({
        where: { date: { gte: earliestMonth } }
      }),
      prisma.fueling.findMany({
        where: { date: { gte: earliestMonth } }
      }),
      prisma.maintenance.findMany({
        where: { date: { gte: earliestMonth } }
      }),
    ]);

    const driverTripPay = truck.driverTripPay || 700;

    const monthlyEvolution = pastMonthsList.map(m => {
      const [y, mon] = m.split('-').map(Number);
      const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(y, mon - 1)).replace('.', '');
      const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

      const mFreights = allHistoryFreights.filter(f => f.departureDate.startsWith(m));
      const mExpenses = allHistoryExpenses.filter(e => e.date.startsWith(m));
      const mFuelings = allHistoryFuelings.filter(f => f.date.startsWith(m));
      const mMaintenances = allHistoryMaintenances.filter(f => f.date.startsWith(m));

      const fRevenue = mFreights.reduce((acc, f) => acc + f.grossValue, 0);
      const eRevenue = mExpenses.filter(e => e.type === 'entrada' && !e.freightId).reduce((acc, e) => acc + e.amount, 0);
      const gRevenue = fRevenue + eRevenue;

      const fCost = mFuelings.reduce((acc, f) => acc + f.totalAmount, 0);
      const mCost = mMaintenances.reduce((acc, ma) => acc + ma.totalCost, 0);
      const dCost = mFreights.reduce((acc, f) => acc + (f.driverPay || driverTripPay), 0);

      // Dívidas ativas no mês m
      const mActiveDebts = allDebts.filter(d => {
        const startMonth = d.startDate ? d.startDate.slice(0, 7) : d.createdAt.toISOString().slice(0, 7);
        const initialPaid = d.initialPaidInstallments || 0;
        const remainingAtStart = Math.max(1, d.totalInstallments - initialPaid);
        const diff = getMonthDiff(startMonth, m);
        if (diff < 0 || diff >= remainingAtStart) return false;

        const effectiveSettledDate = d.settledAt || (d.payments && d.payments[0]?.date);
        const settledMonth = effectiveSettledDate ? effectiveSettledDate.slice(0, 7) : null;
        if (d.status === 'quitado' && settledMonth && settledMonth < m) return false;
        return true;
      });

      const debtsCost = mActiveDebts.reduce((acc, d) => acc + d.installmentAmount, 0);
      const fixedCost = allFixedWithExpenses.reduce((acc, fe) => acc + fe.amount, 0);

      const standaloneOut = mExpenses
        .filter(e => e.type === 'saida' && !e.debtId && !e.fixedExpenseId && !e.freightId && !e.fuelingId && e.category !== 'combustivel')
        .reduce((acc, e) => acc + e.amount, 0);

      const totalCosts = fCost + mCost + dCost + debtsCost + fixedCost + standaloneOut;
      const netProfit = gRevenue - totalCosts;
      const profitMargin = gRevenue > 0 ? Number(((netProfit / gRevenue) * 100).toFixed(1)) : 0;

      return {
        month: m,
        label: capitalizedLabel,
        grossRevenue: gRevenue,
        totalCosts,
        netProfit,
        freightsCount: mFreights.length,
        profitMargin,
      };
    });

    // Comparativo Mês a Mês (MoM) com o mês imediatamente anterior
    let previousMonthComparison = undefined;
    if (monthlyEvolution.length >= 2) {
      const prevMonthItem = monthlyEvolution[monthlyEvolution.length - 2];
      const currentMonthItem = monthlyEvolution[monthlyEvolution.length - 1];

      const prevFuel = allHistoryFuelings
        .filter(f => f.date.startsWith(prevMonthItem.month))
        .reduce((acc, f) => acc + f.totalAmount, 0);

      const revDiff = currentMonthItem.grossRevenue - prevMonthItem.grossRevenue;
      const revPercent = prevMonthItem.grossRevenue > 0
        ? Number(((revDiff / prevMonthItem.grossRevenue) * 100).toFixed(1))
        : null;

      const profitDiff = currentMonthItem.netProfit - prevMonthItem.netProfit;
      const profitPercent = prevMonthItem.netProfit !== 0
        ? Number(((profitDiff / Math.abs(prevMonthItem.netProfit)) * 100).toFixed(1))
        : null;

      const costsDiff = currentMonthItem.totalCosts - prevMonthItem.totalCosts;
      const costsPercent = prevMonthItem.totalCosts > 0
        ? Number(((costsDiff / prevMonthItem.totalCosts) * 100).toFixed(1))
        : null;

      const freightsDiff = currentMonthItem.freightsCount - prevMonthItem.freightsCount;
      const marginDiff = Number((currentMonthItem.profitMargin - prevMonthItem.profitMargin).toFixed(1));

      const fuelDiff = totalFuelMonth - prevFuel;
      const fuelPercent = prevFuel > 0
        ? Number(((fuelDiff / prevFuel) * 100).toFixed(1))
        : null;

      previousMonthComparison = {
        previousMonthLabel: prevMonthItem.label,
        revenueDiff: revDiff,
        revenuePercent: revPercent,
        profitDiff,
        profitPercent,
        costsDiff,
        costsPercent,
        freightsDiff,
        marginDiff,
        fuelDiff,
        fuelPercent,
      };
    }

    res.json({
      month,
      truck: {
        plate: truck.plate,
        model: truck.model,
        trailerModel: truck.trailerModel,
        currentKm: truck.currentKm,
        lastOilChangeKm: truck.lastOilChangeKm,
        oilProgress: {
          usedKm,
          limitKm,
          remainingKm,
          percentage: oilPercentage,
          isWarning: oilWarning,
          isCritical: oilCritical,
        }
      },
      kpis: {
        grossRevenue,
        freightRevenue,
        extraRevenue,
        advancesReceived,
        balancesPending,
        totalFuelMonth,
        totalFuelLitersMonth,
        totalDriverPayMonth,
        totalMaintenanceMonth,
        totalDebtsDueMonth,
        totalFixedDueMonth,
        restanteAPagarTotal,
        netProfit,
        freightsCount: freights.length,
        previousMonthComparison,
      },
      recentFreights: freights.slice(0, 5),
      activeDebts,
      activeFixedExpenses,
      debtBalance,
      upcomingPayments,
      upcoming10DaysTotal,
      monthlyEvolution,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
