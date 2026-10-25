import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/expenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { freightId, month, category, type } = req.query;
    const where: any = {};
    if (freightId) where.freightId = String(freightId);
    if (category) where.category = String(category);
    if (type) where.type = String(type);
    if (month) where.date = { startsWith: String(month) };

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        freight: { select: { id: true, code: true } },
        debt: { select: { id: true, title: true } },
        fixedExpense: { select: { id: true, description: true } },
        creditCardInvoice: {
          include: {
            items: {
              orderBy: { purchaseDate: 'asc' }
            }
          }
        },
      },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      type,
      category,
      description,
      amount,
      date,
      paymentMethod,
      status,
      freightId,
      debtId,
      fixedExpenseId,
      installmentNumber,
    } = req.body;

    const expense = await prisma.expense.create({
      data: {
        type: type || 'saida',
        category: category || 'outros',
        description,
        amount: Number(amount || 0),
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'pix',
        status: status || 'pago',
        freightId: freightId || null,
        debtId: debtId || null,
        fixedExpenseId: fixedExpenseId || null,
        installmentNumber: installmentNumber ? Number(installmentNumber) : null,
      }
    });

    res.status(201).json(expense);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    delete data.id;

    if (data.amount !== undefined) {
      data.amount = Number(data.amount);
    }

    const updated = await prisma.expense.update({
      where: { id },
      data,
    });

    // Se for uma entrada vinculada a um frete, sincronizar o status de pagamento do frete
    if (updated.freightId && updated.type === 'entrada') {
      try {
        if (updated.status === 'recebido' || updated.status === 'pago') {
          await prisma.freight.update({
            where: { id: updated.freightId },
            data: { paymentStatus: 'pago' }
          });
        } else if (updated.status === 'pendente') {
          await prisma.freight.update({
            where: { id: updated.freightId },
            data: { paymentStatus: 'pendente' }
          });
        }
      } catch (err) {
        console.warn('Não foi possível sincronizar frete vinculado:', err);
      }
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    // Se pertencer a uma dívida/parcelamento, restaura o saldo e decrementa a parcela paga
    if (expense.debtId) {
      const debt = await prisma.debt.findUnique({ where: { id: expense.debtId } });
      if (debt) {
        const newPaidCount = Math.max(0, debt.paidInstallments - 1);
        const newBalance = Math.min(debt.totalOriginalAmount, debt.remainingBalance + expense.amount);
        await prisma.debt.update({
          where: { id: debt.id },
          data: {
            paidInstallments: newPaidCount,
            remainingBalance: newBalance,
            status: 'ativo',
            settledAt: null,
          }
        });
      }
    }

    // Se for uma fatura de cartão de crédito, remove a fatura e seus itens vinculados
    if (expense.creditCardInvoiceId) {
      await prisma.creditCardInvoice.delete({
        where: { id: expense.creditCardInvoiceId }
      }).catch(() => {});
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
