import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import crypto from 'crypto';

const router = Router();

function addMonths(yearMonth: string, count: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const d = new Date(year, month + count, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDueDate(yearMonth: string, dueDay: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const validDay = Math.min(Math.max(1, dueDay || 10), lastDay);
  return `${yearStr}-${monthStr}-${String(validDay).padStart(2, '0')}`;
}

// GET /api/invoices - Listar faturas (com filtro opcional por mês ou cartão)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month, cardName } = req.query;
    const where: any = {};
    if (month) where.month = String(month);
    if (cardName) where.cardName = String(cardName);

    const invoices = await prisma.creditCardInvoice.findMany({
      where,
      include: {
        items: {
          orderBy: { purchaseDate: 'asc' }
        },
        expenses: true,
      },
      orderBy: { dueDate: 'asc' }
    });

    const enriched = invoices.map(inv => {
      const totalAmount = inv.items.reduce((sum, item) => sum + item.amount, 0);
      return {
        ...inv,
        totalAmount
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/cards - Listar nomes de cartões já cadastrados para autocompletar
router.get('/cards', async (_req: Request, res: Response) => {
  try {
    const invoices = await prisma.creditCardInvoice.findMany({
      select: { cardName: true },
      distinct: ['cardName']
    });
    const cardNames = invoices.map(i => i.cardName).filter(Boolean);
    res.json(cardNames);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/invoices/:id - Detalhes de uma fatura específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.creditCardInvoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { purchaseDate: 'asc' }
        },
        expenses: true,
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Fatura não encontrada' });
    }

    const totalAmount = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    res.json({ ...invoice, totalAmount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices - Cadastrar ou atualizar fatura com suas compras (suporta parcelamento N vezes gerando os meses futuros)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      cardName,
      month,
      dueDate,
      dueDay,
      closingDate,
      status,
      notes,
      items = []
    } = req.body;

    if (!cardName || !month) {
      return res.status(400).json({ error: 'Nome do cartão e mês de referência são obrigatórios' });
    }

    const dayNum = Number(dueDay) || (dueDate ? Number(String(dueDate).slice(8, 10)) : 10);
    const invoiceDueDate = dueDate || getDueDate(month, dayNum);

    // 1. Localiza ou cria a fatura do mês atual
    let currentInvoice = await prisma.creditCardInvoice.findFirst({
      where: {
        cardName,
        month,
      }
    });

    if (currentInvoice) {
      currentInvoice = await prisma.creditCardInvoice.update({
        where: { id: currentInvoice.id },
        data: {
          dueDate: invoiceDueDate,
          closingDate: closingDate || currentInvoice.closingDate,
          status: status || currentInvoice.status,
          notes: notes !== undefined ? notes : currentInvoice.notes,
        }
      });
    } else {
      currentInvoice = await prisma.creditCardInvoice.create({
        data: {
          cardName,
          month,
          dueDate: invoiceDueDate,
          closingDate: closingDate || null,
          status: status || 'pendente',
          notes: notes || null,
        }
      });
    }

    // 2. Processa cada item de compra incluído
    for (const item of items) {
      const totalInst = Math.max(1, Number(item.totalInstallments || 1));
      const currInst = Math.max(1, Number(item.currentInstallment || 1));
      const purchaseAmount = Number(item.amount || 0);
      const totalAmount = Number(item.totalAmount || (purchaseAmount * totalInst));
      const installmentVal = purchaseAmount > 0 
        ? purchaseAmount 
        : (totalInst > 0 ? totalAmount / totalInst : 0);
      const parentId = item.parentPurchaseId || crypto.randomUUID();
      const pDate = item.purchaseDate || invoiceDueDate;

      // Item na fatura do mês corrente
      await prisma.creditCardInvoiceItem.create({
        data: {
          invoiceId: currentInvoice.id,
          description: item.description,
          category: item.category || 'outros',
          amount: installmentVal,
          totalAmount,
          purchaseDate: pDate,
          currentInstallment: currInst,
          totalInstallments: totalInst,
          parentPurchaseId: parentId,
          notes: item.notes || null,
        }
      });

      // Se for parcelado, gera automaticamente as faturas e itens dos próximos meses!
      if (totalInst > currInst) {
        const remainingMonths = totalInst - currInst;
        for (let k = 1; k <= remainingMonths; k++) {
          const futureMonth = addMonths(month, k);
          const futureDueDate = getDueDate(futureMonth, dayNum);

          let futureInvoice = await prisma.creditCardInvoice.findFirst({
            where: {
              cardName,
              month: futureMonth,
            }
          });

          if (!futureInvoice) {
            futureInvoice = await prisma.creditCardInvoice.create({
              data: {
                cardName,
                month: futureMonth,
                dueDate: futureDueDate,
                status: 'pendente',
              }
            });
          }

          await prisma.creditCardInvoiceItem.create({
            data: {
              invoiceId: futureInvoice.id,
              description: item.description,
              category: item.category || 'outros',
              amount: installmentVal,
              totalAmount,
              purchaseDate: pDate,
              currentInstallment: currInst + k,
              totalInstallments: totalInst,
              parentPurchaseId: parentId,
              notes: item.notes || null,
            }
          });

          // Atualiza o valor e a despesa vinculada da fatura futura
          const futureItems = await prisma.creditCardInvoiceItem.findMany({
            where: { invoiceId: futureInvoice.id }
          });
          const futureTotal = futureItems.reduce((acc, it) => acc + it.amount, 0);

          const existingFutureExp = await prisma.expense.findFirst({
            where: { creditCardInvoiceId: futureInvoice.id }
          });

          if (existingFutureExp) {
            await prisma.expense.update({
              where: { id: existingFutureExp.id },
              data: {
                amount: futureTotal,
                date: futureDueDate,
              }
            });
          } else {
            await prisma.expense.create({
              data: {
                type: 'saida',
                category: 'fatura_cartao',
                description: `Fatura Cartão: ${cardName} (${futureMonth})`,
                amount: futureTotal,
                date: futureDueDate,
                paymentMethod: 'cartao_credito',
                status: 'pendente',
                creditCardInvoiceId: futureInvoice.id,
              }
            });
          }
        }
      }
    }

    // 3. Atualiza o total e o registro de Expense vinculado da fatura corrente
    const allCurrentItems = await prisma.creditCardInvoiceItem.findMany({
      where: { invoiceId: currentInvoice.id }
    });
    const currentTotal = allCurrentItems.reduce((acc, it) => acc + it.amount, 0);

    const existingCurrentExp = await prisma.expense.findFirst({
      where: { creditCardInvoiceId: currentInvoice.id }
    });

    if (existingCurrentExp) {
      await prisma.expense.update({
        where: { id: existingCurrentExp.id },
        data: {
          amount: currentTotal,
          date: invoiceDueDate,
          status: currentInvoice.status,
        }
      });
    } else {
      await prisma.expense.create({
        data: {
          type: 'saida',
          category: 'fatura_cartao',
          description: `Fatura Cartão: ${cardName} (${month})`,
          amount: currentTotal,
          date: invoiceDueDate,
          paymentMethod: 'cartao_credito',
          status: currentInvoice.status,
          creditCardInvoiceId: currentInvoice.id,
        }
      });
    }

    // Retorna a fatura completa consolidada
    const finalInvoice = await prisma.creditCardInvoice.findUnique({
      where: { id: currentInvoice.id },
      include: {
        items: {
          orderBy: { purchaseDate: 'asc' }
        },
        expenses: true,
      }
    });

    res.json({
      ...finalInvoice,
      totalAmount: currentTotal
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices/:id/pay - Marcar fatura como paga
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.creditCardInvoice.update({
      where: { id },
      data: { status: 'pago' }
    });

    // Atualiza a despesa vinculada
    await prisma.expense.updateMany({
      where: { creditCardInvoiceId: id },
      data: { status: 'pago' }
    });

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invoices/:id/unpay - Estornar pagamento da fatura (voltar para pendente)
router.post('/:id/unpay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.creditCardInvoice.update({
      where: { id },
      data: { status: 'pendente' }
    });

    // Atualiza a despesa vinculada
    await prisma.expense.updateMany({
      where: { creditCardInvoiceId: id },
      data: { status: 'pendente' }
    });

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/invoices/:id - Excluir fatura inteira
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.deleteMany({
      where: { creditCardInvoiceId: id }
    });
    await prisma.creditCardInvoice.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Fatura e despesas excluídas' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/invoices/items/:itemId - Excluir uma compra da fatura
router.delete('/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { deleteAllInstallments } = req.query;

    const item = await prisma.creditCardInvoiceItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const invoiceId = item.invoiceId;
    const parentId = item.parentPurchaseId;

    if (deleteAllInstallments === 'true' && parentId) {
      // Exclui todas as parcelas dessa compra de todas as faturas
      const allRelated = await prisma.creditCardInvoiceItem.findMany({
        where: { parentPurchaseId: parentId }
      });
      const affectedInvoiceIds = [...new Set(allRelated.map(i => i.invoiceId))];

      await prisma.creditCardInvoiceItem.deleteMany({
        where: { parentPurchaseId: parentId }
      });

      // Recalcula cada fatura afetada
      for (const invId of affectedInvoiceIds) {
        const remaining = await prisma.creditCardInvoiceItem.findMany({
          where: { invoiceId: invId }
        });
        if (remaining.length === 0) {
          // Se ficou vazia, remove a fatura e o expense
          await prisma.expense.deleteMany({ where: { creditCardInvoiceId: invId } });
          await prisma.creditCardInvoice.delete({ where: { id: invId } }).catch(() => {});
        } else {
          const total = remaining.reduce((acc, it) => acc + it.amount, 0);
          await prisma.expense.updateMany({
            where: { creditCardInvoiceId: invId },
            data: { amount: total }
          });
        }
      }
    } else {
      // Exclui apenas este item nesta fatura
      await prisma.creditCardInvoiceItem.delete({
        where: { id: itemId }
      });

      const remaining = await prisma.creditCardInvoiceItem.findMany({
        where: { invoiceId }
      });

      if (remaining.length === 0) {
        await prisma.expense.deleteMany({ where: { creditCardInvoiceId: invoiceId } });
        await prisma.creditCardInvoice.delete({ where: { id: invoiceId } }).catch(() => {});
      } else {
        const total = remaining.reduce((acc, it) => acc + it.amount, 0);
        await prisma.expense.updateMany({
          where: { creditCardInvoiceId: invoiceId },
          data: { amount: total }
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
