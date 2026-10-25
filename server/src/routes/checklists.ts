import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/checklists
router.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await prisma.checklist.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/checklists
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      date,
      truckKm,
      driverName,
      oilLevel,
      coolantLevel,
      visibleLeaks,
      lightsAndTires,
      brakesOk,
      trailerCouplingRandon,
      notes,
    } = req.body;

    // Calcular status automático
    let status = 'aprovado';
    if (!brakesOk || visibleLeaks) {
      status = 'reprovado';
    } else if (!oilLevel || !coolantLevel || !lightsAndTires || !trailerCouplingRandon) {
      status = 'alerta';
    }

    const item = await prisma.checklist.create({
      data: {
        date: date || new Date().toISOString().split('T')[0],
        truckKm: Number(truckKm || 0),
        status,
        driverName: driverName || 'Motorista',
        oilLevel: oilLevel !== undefined ? Boolean(oilLevel) : true,
        coolantLevel: coolantLevel !== undefined ? Boolean(coolantLevel) : true,
        visibleLeaks: visibleLeaks !== undefined ? Boolean(visibleLeaks) : false,
        lightsAndTires: lightsAndTires !== undefined ? Boolean(lightsAndTires) : true,
        brakesOk: brakesOk !== undefined ? Boolean(brakesOk) : true,
        trailerCouplingRandon: trailerCouplingRandon !== undefined ? Boolean(trailerCouplingRandon) : true,
        notes,
      }
    });

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
