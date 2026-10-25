import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Funções auxiliares para cálculo de meses
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

// GET /api/debts
// Suporta filtro opcional por mês (?month=YYYY-MM)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const debts = await prisma.debt.findMany({
      include: {
        payments: {
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const monthStr = month ? String(month) : null;

    const debtsWithMeta = debts.map(d => {
      // Mês inicial da 1ª parcela no sistema
      const startMonth = d.startDate 
        ? d.startDate.slice(0, 7) 
        : d.createdAt.toISOString().slice(0, 7);

      const initialPaid = d.initialPaidInstallments || 0;
      // Quantidade de parcelas a serem pagas a partir de startMonth
      const remainingInstallmentsAtStart = Math.max(1, d.totalInstallments - initialPaid);
      // Mês final previsto da última parcela
      const endMonth = addMonths(startMonth, remainingInstallmentsAtStart - 1);

      let isBeforeStartMonth = false;
      let isAfterEndMonth = false;
      let installmentNumberInMonth: number | null = null;

      if (monthStr) {
        const monthDiff = getMonthDiff(startMonth, monthStr);
        isBeforeStartMonth = monthDiff < 0;
        isAfterEndMonth = monthDiff >= remainingInstallmentsAtStart;
        if (!isBeforeStartMonth && !isAfterEndMonth) {
          installmentNumberInMonth = initialPaid + monthDiff + 1;
        }
      }

      // Determinar a data de quitação efetiva com fallbacks robustos
      const effectiveSettledDate = d.settledAt || 
        (d.payments && d.payments[0]?.date) || 
        (d.status === 'quitado' ? d.updatedAt.toISOString().split('T')[0] : null);

      const settledMonth = effectiveSettledDate ? effectiveSettledDate.slice(0, 7) : null;

      // Se foi quitada em um mês anterior ao mês de referência
      const isSettledPriorToMonth = Boolean(
        monthStr &&
        d.status === 'quitado' &&
        settledMonth &&
        settledMonth < monthStr
      );

      // Se foi quitada no próprio mês de referência
      const isSettledInMonth = Boolean(
        monthStr &&
        d.status === 'quitado' &&
        settledMonth &&
        settledMonth === monthStr
      );

      // Existe boleto para pagamento no mês de referência?
      // O parcelamento DEVE ser exibido SOMENTE nos meses em que existem boletos para pagamentos!
      // 1. Não pode aparecer antes do mês inicial (startMonth)
      // 2. Não pode aparecer depois do término das parcelas (endMonth)
      // 3. Não pode aparecer após o mês em que foi quitada
      let hasBoletoInMonth = false;
      if (monthStr) {
        if (!isBeforeStartMonth && !isAfterEndMonth && !isSettledPriorToMonth) {
          hasBoletoInMonth = true;
        }
      } else {
        hasBoletoInMonth = d.status === 'ativo' && d.remainingBalance > 0;
      }

      return {
        ...d,
        startDate: d.startDate || startMonth,
        startMonth,
        endMonth,
        isBeforeStartMonth,
        isAfterEndMonth,
        installmentNumberInMonth,
        settledAt: d.settledAt || effectiveSettledDate,
        isSettledPriorToMonth,
        isSettledInMonth,
        hasBoletoInMonth,
      };
    });

    // Sincronização automática: garante que cada contrato ativo com boleto no mês tenha seu lançamento de despesa
    if (monthStr) {
      for (const d of debtsWithMeta) {
        if (d.hasBoletoInMonth && d.status === 'ativo' && d.installmentAmount > 0) {
          const existingExpense = await prisma.expense.findFirst({
            where: {
              debtId: d.id,
              date: { startsWith: monthStr }
            }
          });

          if (!existingExpense) {
            const dayNum = Math.min(28, Math.max(1, Number(d.dueDay || 10)));
            const dayStr = String(dayNum).padStart(2, '0');
            const expenseDate = `${monthStr}-${dayStr}`;
            const instNum = d.installmentNumberInMonth || (d.paidInstallments + 1);

            await prisma.expense.create({
              data: {
                type: 'saida',
                category: 'prestacao_veiculo',
                description: `Parcela ${instNum}/${d.totalInstallments} - ${d.title} (${d.creditor || 'Financiamento'})`,
                amount: d.installmentAmount,
                date: expenseDate,
                paymentMethod: 'pix',
                status: 'pendente',
                debtId: d.id,
                installmentNumber: instNum,
              }
            });
          }
        }
      }
    }

    res.json(debtsWithMeta);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/debts
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      creditor,
      totalOriginalAmount,
      remainingBalance,
      totalInstallments,
      paidInstallments,
      installmentAmount,
      interestRate,
      dueDay,
      startDate,
      category,
      notes,
    } = req.body;

    const total = Number(totalOriginalAmount || 0);
    const installments = Number(totalInstallments || 1);
    const paid = Number(paidInstallments || 0);
    const installmentVal = Number(installmentAmount || (installments > 0 ? total / installments : 0));
    const balance = remainingBalance !== undefined ? Number(remainingBalance) : total - (paid * installmentVal);
    const isSettled = paid >= installments || balance === 0;

    const startMonthVal = startDate 
      ? String(startDate).slice(0, 7) 
      : new Date().toISOString().slice(0, 7);

    const debt = await prisma.debt.create({
      data: {
        title,
        creditor,
        totalOriginalAmount: total,
        remainingBalance: Math.max(0, balance),
        totalInstallments: installments,
        paidInstallments: paid,
        initialPaidInstallments: paid,
        installmentAmount: installmentVal,
        interestRate: Number(interestRate || 0),
        dueDay: Number(dueDay || 10),
        startDate: startMonthVal,
        status: isSettled ? 'quitado' : 'ativo',
        settledAt: isSettled ? new Date().toISOString().split('T')[0] : null,
        category: category || 'financiamento',
        notes,
      }
    });

    // Se o contrato estiver ativo, cria imediatamente o lançamento da despesa da parcela do mês como 'pendente'
    if (!isSettled && installmentVal > 0) {
      const dayNum = Math.min(28, Math.max(1, Number(dueDay || 10)));
      const dayStr = String(dayNum).padStart(2, '0');
      const expenseDate = `${startMonthVal}-${dayStr}`;
      const installmentNum = paid + 1;

      await prisma.expense.create({
        data: {
          type: 'saida',
          category: 'prestacao_veiculo',
          description: `Parcela ${installmentNum}/${installments} - ${title} (${creditor || 'Financiamento'})`,
          amount: installmentVal,
          date: expenseDate,
          paymentMethod: 'pix',
          status: 'pendente',
          debtId: debt.id,
          installmentNumber: installmentNum,
        }
      });
    }

    res.status(201).json(debt);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/debts/:id/pay - Registrar pagamento/baixa de parcela
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, date, paymentMethod, notes } = req.body;

    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) {
      return res.status(404).json({ error: 'Contrato de dívida não encontrado' });
    }

    const payAmount = Number(amount ?? debt.installmentAmount);
    const newPaidCount = debt.paidInstallments + 1;
    const newBalance = Math.max(0, debt.remainingBalance - payAmount);
    const isNowSettled = newPaidCount >= debt.totalInstallments || newBalance === 0;
    const newStatus = isNowSettled ? 'quitado' : 'ativo';

    let payDate = date;
    if (!payDate && req.body.month) {
      const parts = String(req.body.month).split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const lastDay = new Date(y, m, 0).getDate();
        const validDay = Math.min(Math.max(1, Number(debt.dueDay || 10)), lastDay);
        payDate = `${parts[0]}-${parts[1]}-${String(validDay).padStart(2, '0')}`;
      }
    }
    if (!payDate) {
      payDate = new Date().toISOString().split('T')[0];
    }
    const settledAt = isNowSettled ? payDate : null;

    // Atualiza o saldo do contrato
    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        paidInstallments: newPaidCount,
        remainingBalance: newBalance,
        status: newStatus,
        settledAt,
      }
    });

    const payMonth = payDate.slice(0, 7);
    // Busca se já existe o lançamento de despesa deste contrato para o mês
    let expense = await prisma.expense.findFirst({
      where: {
        debtId: debt.id,
        date: { startsWith: payMonth },
      }
    });

    if (expense) {
      expense = await prisma.expense.update({
        where: { id: expense.id },
        data: {
          status: 'pago',
          amount: payAmount,
          date: payDate,
          paymentMethod: paymentMethod || expense.paymentMethod || 'pix',
          installmentNumber: newPaidCount,
        }
      });
    } else {
      expense = await prisma.expense.create({
        data: {
          type: 'saida',
          category: 'prestacao_veiculo',
          description: `Parcela ${newPaidCount}/${debt.totalInstallments} - ${debt.title} (${debt.creditor || 'Credor'})`,
          amount: payAmount,
          date: payDate,
          paymentMethod: paymentMethod || 'pix',
          status: 'pago',
          debtId: debt.id,
          installmentNumber: newPaidCount,
        }
      });
    }

    res.json({ debt: updatedDebt, expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/debts/:id/unpay - Estornar / remover pagamento de parcela de um mês
router.post('/:id/unpay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { month, expenseId } = req.body;

    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) {
      return res.status(404).json({ error: 'Contrato de dívida não encontrado' });
    }

    // Busca a despesa correspondente da parcela
    let expense = null;
    if (expenseId) {
      expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    } else if (month) {
      expense = await prisma.expense.findFirst({
        where: {
          debtId: id,
          date: { startsWith: month },
        },
        orderBy: { date: 'desc' }
      });
    }

    // Se ainda não achou, busca a despesa mais recente deste debtId
    if (!expense) {
      expense = await prisma.expense.findFirst({
        where: { debtId: id },
        orderBy: { date: 'desc' }
      });
    }

    const payAmount = expense ? expense.amount : debt.installmentAmount;
    const newPaidCount = Math.max(0, debt.paidInstallments - 1);
    const newBalance = Math.min(debt.totalOriginalAmount, debt.remainingBalance + payAmount);

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: {
        paidInstallments: newPaidCount,
        remainingBalance: newBalance,
        status: 'ativo',
        settledAt: null,
      }
    });

    if (expense) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: { status: 'pendente' }
      });
    }

    res.json({ success: true, debt: updatedDebt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/debts/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    delete data.id;
    delete data.payments;

    if (data.installmentAmount !== undefined) {
      data.installmentAmount = Number(data.installmentAmount);
    }
    if (data.totalOriginalAmount !== undefined) {
      data.totalOriginalAmount = Number(data.totalOriginalAmount);
    }
    if (data.remainingBalance !== undefined) {
      data.remainingBalance = Number(data.remainingBalance);
    }
    if (data.totalInstallments !== undefined) {
      data.totalInstallments = Number(data.totalInstallments);
    }
    if (data.paidInstallments !== undefined) {
      data.paidInstallments = Number(data.paidInstallments);
    }
    if (data.initialPaidInstallments !== undefined) {
      data.initialPaidInstallments = Number(data.initialPaidInstallments);
    }
    if (data.dueDay !== undefined) {
      data.dueDay = Number(data.dueDay);
    }
    if (data.interestRate !== undefined) {
      data.interestRate = Number(data.interestRate);
    }
    
    // Se marcou como quitado manualmente e não tinha settledAt
    if (data.status === 'quitado' && !data.settledAt) {
      data.settledAt = new Date().toISOString().split('T')[0];
    } else if (data.status === 'ativo') {
      data.settledAt = null;
    }

    const updated = await prisma.debt.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/debts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.deleteMany({ where: { debtId: id } });
    await prisma.debt.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
