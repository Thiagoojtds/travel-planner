import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/fuelings - Lista abastecimentos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { freightId, month } = req.query;
    const where: any = {};
    if (freightId) where.freightId = String(freightId);
    if (month) where.date = { startsWith: String(month) };

    const fuelings = await prisma.fueling.findMany({
      where,
      include: {
        freight: {
          select: { id: true, code: true, originCity: true, destCity: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(fuelings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fuelings - Cadastra abastecimento (atualiza odômetro do Iveco e cria despesa de combustível)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      date,
      currentKm,
      liters,
      pricePerLiter,
      totalAmount,
      tank,
      status,
      city,
      state,
      notes,
      freightId,
    } = req.body;

    const km = Number(currentKm || 0);
    const lit = Number(liters || 0);
    const price = Number(pricePerLiter || 0);
    const total = totalAmount ? Number(totalAmount) : lit * price;
    const fuelingStatus = status === 'pendente' ? 'pendente' : 'pago';

    const fueling = await prisma.fueling.create({
      data: {
        date: date || new Date().toISOString().split('T')[0],
        currentKm: km,
        liters: lit,
        pricePerLiter: price,
        totalAmount: total,
        tank: tank || 'ambos',
        status: fuelingStatus,
        city,
        state,
        notes,
        freightId: freightId || null,
      }
    });

    // Atualiza odômetro do caminhão se este abastecimento tiver KM maior
    if (km > 0) {
      const truck = await prisma.truck.findFirst();
      if (truck && km > truck.currentKm) {
        await prisma.truck.update({
          where: { id: truck.id },
          data: { currentKm: km }
        });
      }
    }

    // Registra no extrato de despesas daquele frete/mês
    await prisma.expense.create({
      data: {
        type: 'saida',
        category: 'combustivel',
        description: `Diesel ${lit.toFixed(1)}L (${tank || 'Tanque duplo'}) - ${city || 'Estrada'}`,
        amount: total,
        date: date || new Date().toISOString().split('T')[0],
        paymentMethod: 'cartao_frota',
        status: fuelingStatus,
        freightId: freightId || null,
        fuelingId: fueling.id,
      }
    });

    res.status(201).json(fueling);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fuelings/default-config - Retorna a configuração de abastecimento padrão
router.get('/default-config', async (_req: Request, res: Response) => {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { key: 'default_fueling_config' }
    });

    if (config && config.value) {
      return res.json(JSON.parse(config.value));
    }

    const defaultConfig = {
      liters: 300,
      pricePerLiter: 5.89,
      tank: 'ambos',
      status: 'pago',
      city: 'Curitiba',
      state: 'PR',
      notes: 'Abastecimento Padrão'
    };

    res.json(defaultConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/fuelings/default-config - Salva a configuração de abastecimento padrão
router.put('/default-config', async (req: Request, res: Response) => {
  try {
    const { liters, pricePerLiter, tank, status, city, state, notes } = req.body;

    const configData = {
      liters: Number(liters) || 300,
      pricePerLiter: Number(pricePerLiter) || 5.89,
      tank: tank || 'ambos',
      status: status === 'pendente' ? 'pendente' : 'pago',
      city: city || 'Curitiba',
      state: state || 'PR',
      notes: notes || 'Abastecimento Padrão'
    };

    const updated = await prisma.appConfig.upsert({
      where: { key: 'default_fueling_config' },
      update: { value: JSON.stringify(configData) },
      create: { key: 'default_fueling_config', value: JSON.stringify(configData) }
    });

    res.json(JSON.parse(updated.value));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/fuelings/:id - Atualiza abastecimento e sincroniza despesa
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      date,
      currentKm,
      liters,
      pricePerLiter,
      totalAmount,
      tank,
      status,
      city,
      state,
      notes,
      freightId,
    } = req.body;

    const km = currentKm !== undefined ? Number(currentKm) : undefined;
    const lit = liters !== undefined ? Number(liters) : undefined;
    const price = pricePerLiter !== undefined ? Number(pricePerLiter) : undefined;
    const total = totalAmount !== undefined
      ? Number(totalAmount)
      : (lit !== undefined && price !== undefined ? lit * price : undefined);
    const fuelingStatus = status !== undefined ? (status === 'pendente' ? 'pendente' : 'pago') : undefined;

    const updated = await prisma.fueling.update({
      where: { id },
      data: {
        ...(date && { date }),
        ...(km !== undefined && { currentKm: km }),
        ...(lit !== undefined && { liters: lit }),
        ...(price !== undefined && { pricePerLiter: price }),
        ...(total !== undefined && { totalAmount: total }),
        ...(tank && { tank }),
        ...(fuelingStatus && { status: fuelingStatus }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(notes !== undefined && { notes }),
        ...(freightId !== undefined && { freightId: freightId || null }),
      }
    });

    // Atualiza odômetro do caminhão se KM for maior
    if (km && km > 0) {
      const truck = await prisma.truck.findFirst();
      if (truck && km > truck.currentKm) {
        await prisma.truck.update({
          where: { id: truck.id },
          data: { currentKm: km }
        });
      }
    }

    // Atualiza a despesa vinculada se existir
    const existingExpense = await prisma.expense.findFirst({
      where: { fuelingId: id }
    });

    if (existingExpense) {
      await prisma.expense.update({
        where: { id: existingExpense.id },
        data: {
          ...(date && { date }),
          ...(total !== undefined && { amount: total }),
          ...(fuelingStatus && { status: fuelingStatus }),
          ...(freightId !== undefined && { freightId: freightId || null }),
          ...(lit !== undefined && {
            description: `Diesel ${lit.toFixed(1)}L (${tank || updated.tank}) - ${city || updated.city || 'Estrada'}`
          }),
        }
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/fuelings/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expense.deleteMany({ where: { fuelingId: id } });
    await prisma.fueling.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
