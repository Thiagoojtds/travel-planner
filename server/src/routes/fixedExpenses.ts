import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/fixed-expenses
router.get('/', async (_req: Request, res: Response) => {
  try {
    const fixed = await prisma.fixedExpense.findMany({
      orderBy: { dueDay: 'asc' }
    });
    res.json(fixed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fixed-expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      description,
      category,
      amount,
      dueDay,
      paymentMethod,
      beneficiary,
      active,
      notes,
    } = req.body;

    const item = await prisma.fixedExpense.create({
      data: {
        description,
        category: category || 'outros',
        amount: Number(amount || 0),
        dueDay: Number(dueDay || 10),
        paymentMethod: paymentMethod || 'pix',
        beneficiary,
        active: active !== undefined ? Boolean(active) : true,
        notes,
      }
    });

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fixed-expenses/:id/pay - Lança no mês correspondente
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { date, amount, month } = req.body;

    const fixed = await prisma.fixedExpense.findUnique({ where: { id } });
    if (!fixed) {
      return res.status(404).json({ error: 'Despesa fixa não encontrada' });
    }

    const payAmount = Number(amount ?? fixed.amount);
    let payDate = date;
    if (!payDate && month) {
      const parts = String(month).split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const lastDay = new Date(y, m, 0).getDate();
        const validDay = Math.min(Math.max(1, Number(fixed.dueDay || 10)), lastDay);
        payDate = `${parts[0]}-${parts[1]}-${String(validDay).padStart(2, '0')}`;
      }
    }
    if (!payDate) {
      payDate = new Date().toISOString().split('T')[0];
    }
    const targetMonth = payDate.slice(0, 7);

    // Evita duplicidade se já houver registro no mesmo mês (atualiza existente ou cria novo)
    const existingPayment = await prisma.expense.findFirst({
      where: {
        fixedExpenseId: fixed.id,
        date: { startsWith: targetMonth },
      }
    });

    let expense;
    if (existingPayment) {
      expense = await prisma.expense.update({
        where: { id: existingPayment.id },
        data: {
          status: 'pago',
          amount: payAmount,
          date: payDate,
        }
      });
    } else {
      expense = await prisma.expense.create({
        data: {
          type: 'saida',
          category: fixed.category,
          description: `Mensalidade: ${fixed.description} (${fixed.beneficiary || 'Recorrente'})`,
          amount: payAmount,
          date: payDate,
          paymentMethod: fixed.paymentMethod || 'pix',
          status: 'pago',
          fixedExpenseId: fixed.id,
        }
      });
    }

    res.json({ fixed, expense });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/fixed-expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    delete data.id;

    if (data.amount !== undefined) {
      data.amount = Number(data.amount);
    }
    if (data.dueDay !== undefined) {
      data.dueDay = Number(data.dueDay);
    }
    if (data.active !== undefined) {
      data.active = Boolean(data.active);
    }

    const updated = await prisma.fixedExpense.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/fixed-expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fixedExpense.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
