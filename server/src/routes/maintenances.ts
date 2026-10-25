import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/maintenances
router.get('/', async (_req: Request, res: Response) => {
  try {
    const records = await prisma.maintenance.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maintenances
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      type,
      category,
      description,
      maintenanceKm,
      nextRecommendedKm,
      date,
      workshop,
      partsCost,
      laborCost,
      totalCost,
      partsReplaced,
      invoiceNumber,
      notes,
    } = req.body;

    const km = Number(maintenanceKm || 0);
    const pCost = Number(partsCost || 0);
    const lCost = Number(laborCost || 0);
    const total = totalCost ? Number(totalCost) : pCost + lCost;

    const maintenance = await prisma.maintenance.create({
      data: {
        type: type || 'preventiva',
        category: category || 'revisao_geral',
        description,
        maintenanceKm: km,
        nextRecommendedKm: nextRecommendedKm ? Number(nextRecommendedKm) : null,
        date: date || new Date().toISOString().split('T')[0],
        workshop,
        partsCost: pCost,
        laborCost: lCost,
        totalCost: total,
        partsReplaced,
        invoiceNumber,
        notes,
      }
    });

    // Se for troca de óleo, atualiza o caminhão
    const truck = await prisma.truck.findFirst();
    if (truck) {
      const updateData: any = {};
      if (km > truck.currentKm) {
        updateData.currentKm = km;
      }
      if (category === 'oleo_filtros') {
        updateData.lastOilChangeKm = km;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.truck.update({
          where: { id: truck.id },
          data: updateData,
        });
      }
    }

    // Registra como despesa de manutenção
    if (total > 0) {
      await prisma.expense.create({
        data: {
          type: 'saida',
          category: 'manutencao',
          description: `Manutenção: ${description} (${workshop || 'Oficina'})`,
          amount: total,
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: 'pix',
          status: 'pago',
        }
      });
    }

    res.status(201).json(maintenance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/maintenances/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.maintenance.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
