import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Função utilitária para calcular a segunda-feira posterior à data de entrega
function getNextMonday(startDateStr: string): string {
  if (!startDateStr) {
    startDateStr = new Date().toISOString().split('T')[0];
  }
  const parts = startDateStr.split('-').map(Number);
  const date = parts.length === 3 
    ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    : new Date(startDateStr + 'T12:00:00');

  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Função utilitária para calcular dias úteis (padrão 7 dias úteis após chegada)
function addBusinessDays(startDateStr: string, businessDays: number = 7): string {
  if (!startDateStr) {
    startDateStr = new Date().toISOString().split('T')[0];
  }
  const parts = startDateStr.split('-').map(Number);
  const date = parts.length === 3 
    ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    : new Date(startDateStr + 'T12:00:00');

  let count = 0;
  while (count < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Função utilitária para gerar código human-readable único garantido
// Formato: FRT-[ORIGEM]-[DEST](-RT)-[ANO][MES]-[SEQ] (ex: FRT-CUR-SAO-RT-202610-01)
async function generateFreightCode(
  originCity?: string,
  destCity?: string,
  departureDate?: string,
  routeType?: string
): Promise<string> {
  const cleanStr = (s?: string) => (s || 'XYZ').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'VIA';
  const orig = cleanStr(originCity);
  const dest = cleanStr(destCity);
  
  const dateParts = (departureDate || '').split('-').map(Number);
  let yearMonth = '';
  if (dateParts.length >= 2 && !isNaN(dateParts[0]) && !isNaN(dateParts[1])) {
    yearMonth = `${dateParts[0]}${String(dateParts[1]).padStart(2, '0')}`;
  } else {
    const now = new Date();
    yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  
  const suffix = (routeType === 'ida_volta' || !routeType) ? '-RT' : '';
  const prefix = `FRT-${orig}-${dest}${suffix}-${yearMonth}`;

  // Localizar próximo sequencial livre garantindo unicidade absoluta
  let seq = 1;
  let candidate = `${prefix}-${String(seq).padStart(2, '0')}`;
  while (await prisma.freight.findUnique({ where: { code: candidate } })) {
    seq++;
    candidate = `${prefix}-${String(seq).padStart(2, '0')}`;
  }

  return candidate;
}

// GET /api/freights - Lista todos os fretes com suas despesas e abastecimentos vinculados
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, month } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (month) {
      where.departureDate = { startsWith: String(month) };
    }

    const freights = await prisma.freight.findMany({
      where,
      include: {
        fuelings: true,
        expenses: true,
      },
      orderBy: { departureDate: 'desc' }
    });

    // Calcular custos e lucro líquido real de cada frete
    const freightsWithMetrics = freights.map(f => {
      const fuelTotal = f.fuelings.reduce((sum, fuel) => sum + fuel.totalAmount, 0);
      const tollsTotal = f.expenses
        .filter(exp => exp.category === 'pedagio')
        .reduce((sum, exp) => sum + exp.amount, 0);
      const otherExpensesTotal = f.expenses
        .filter(exp => exp.category !== 'pedagio')
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const totalTripCosts = fuelTotal + tollsTotal + (f.driverPay || 700) + otherExpensesTotal;
      const netProfit = f.grossValue - totalTripCosts;
      const profitMarginPct = f.grossValue > 0 ? (netProfit / f.grossValue) * 100 : 0;

      let parsedWaypoints = [];
      if (typeof f.waypoints === 'string' && f.waypoints) {
        try { parsedWaypoints = JSON.parse(f.waypoints); } catch {}
      } else if (Array.isArray(f.waypoints)) {
        parsedWaypoints = f.waypoints;
      }

      return {
        ...f,
        waypoints: parsedWaypoints,
        fuelTotal,
        tollsTotal,
        otherExpensesTotal,
        totalTripCosts,
        netProfit,
        profitMarginPct,
      };
    });

    res.json(freightsWithMetrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/freights/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const freight = await prisma.freight.findUnique({
      where: { id: req.params.id },
      include: {
        fuelings: true,
        expenses: true,
      }
    });

    if (!freight) {
      return res.status(404).json({ error: 'Frete não encontrado' });
    }

    const fuelTotal = freight.fuelings.reduce((sum, fuel) => sum + fuel.totalAmount, 0);
    const tollsTotal = freight.expenses
      .filter(exp => exp.category === 'pedagio')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const otherExpensesTotal = freight.expenses
      .filter(exp => exp.category !== 'pedagio')
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const totalTripCosts = fuelTotal + tollsTotal + (freight.driverPay || 700) + otherExpensesTotal;
    const netProfit = freight.grossValue - totalTripCosts;

    res.json({
      ...freight,
      fuelTotal,
      tollsTotal,
      otherExpensesTotal,
      totalTripCosts,
      netProfit,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/freights - Cadastra novo frete
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      originCity,
      originState,
      destCity,
      destState,
      returnCity,
      returnState,
      routeType,
      waypoints,
      client,
      cargoType,
      cargoWeightTons,
      distanceKm,
      departureDate,
      deliveryDate,
      receiptDate,
      grossValue,
      advanceValue,
      balanceDue,
      driverPay,
      status,
      paymentStatus,
      notes,
      carrierContract,
    } = req.body;

    const truck = await prisma.truck.findFirst();
    const defaultDriverPay = truck?.driverTripPay ?? 700;

    // Se o código fornecido já existir no banco (ou for vazio), gera automaticamente o próximo sequencial único livre
    let code = req.body.code ? String(req.body.code).trim() : '';
    if (!code || (await prisma.freight.findUnique({ where: { code } }))) {
      code = await generateFreightCode(originCity, destCity, departureDate, routeType);
    }

    const calculatedBalance = balanceDue !== undefined 
      ? Number(balanceDue) 
      : Math.max(0, Number(grossValue || 0) - Number(advanceValue || 0));

    let waypointsStr: string | null = null;
    if (waypoints) {
      waypointsStr = typeof waypoints === 'string' ? waypoints : JSON.stringify(waypoints);
    }

    const finalRouteType = routeType || 'ida_volta';
    const finalReturnCity = returnCity || (finalRouteType !== 'so_ida' ? (originCity || 'Curitiba') : null);
    const finalReturnState = returnState || (finalRouteType !== 'so_ida' ? (originState || 'PR') : null);

    const finalDeliveryDate = deliveryDate || departureDate || new Date().toISOString().split('T')[0];
    const finalReceiptDate = receiptDate || getNextMonday(finalDeliveryDate);

    const newFreight = await prisma.freight.create({
      data: {
        code,
        originCity: originCity || 'Curitiba',
        originState: originState || 'PR',
        destCity: destCity || 'São Paulo',
        destState: destState || 'SP',
        returnCity: finalReturnCity,
        returnState: finalReturnState,
        routeType: finalRouteType,
        waypoints: waypointsStr,
        client: client || 'Cliente Geral',
        cargoType: cargoType || 'Carga Seca',
        cargoWeightTons: Number(cargoWeightTons || 0),
        distanceKm: Number(distanceKm || 0),
        departureDate: departureDate || new Date().toISOString().split('T')[0],
        deliveryDate: finalDeliveryDate,
        receiptDate: finalReceiptDate,
        grossValue: Number(grossValue || 0),
        advanceValue: Number(advanceValue || 0),
        balanceDue: calculatedBalance,
        driverPay: Number(driverPay ?? defaultDriverPay),
        status: status || 'planejado',
        paymentStatus: paymentStatus || 'pendente',
        notes,
        carrierContract,
      }
    });

    // Criar automaticamente lançamento financeiro de receita do frete com status planejado (pendente)
    const freightExpenseStatus = (newFreight.status === 'finalizado' || newFreight.paymentStatus === 'pago') ? 'recebido' : 'pendente';
    await prisma.expense.create({
      data: {
        type: 'entrada',
        category: 'frete',
        description: `Frete ${newFreight.code} - ${newFreight.originCity} → ${newFreight.destCity} (${newFreight.client})`,
        amount: Number(newFreight.grossValue || 0),
        date: newFreight.receiptDate || newFreight.deliveryDate || newFreight.departureDate,
        paymentMethod: 'pix',
        status: freightExpenseStatus,
        freightId: newFreight.id,
      }
    });

    res.status(201).json(newFreight);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/freights/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    delete data.id;
    delete data.fuelings;
    delete data.expenses;

    if (data.waypoints && typeof data.waypoints !== 'string') {
      data.waypoints = JSON.stringify(data.waypoints);
    }

    const updated = await prisma.freight.update({
      where: { id },
      data,
    });

    // Sincronizar entrada financeira vinculada ao frete
    const isReceived = updated.status === 'finalizado' || updated.paymentStatus === 'pago';
    const expenseStatus = isReceived ? 'recebido' : 'pendente';
    const expenseDate = updated.receiptDate || updated.deliveryDate || updated.departureDate;
    const expenseDescription = `Frete ${updated.code} - ${updated.originCity} → ${updated.destCity} (${updated.client})`;

    const existingIncomeExpense = await prisma.expense.findFirst({
      where: { freightId: id, type: 'entrada' }
    });

    if (existingIncomeExpense) {
      await prisma.expense.update({
        where: { id: existingIncomeExpense.id },
        data: {
          description: expenseDescription,
          amount: Number(updated.grossValue || 0),
          date: expenseDate,
          status: expenseStatus,
        }
      });
    } else {
      await prisma.expense.create({
        data: {
          type: 'entrada',
          category: 'frete',
          description: expenseDescription,
          amount: Number(updated.grossValue || 0),
          date: expenseDate,
          paymentMethod: 'pix',
          status: expenseStatus,
          freightId: updated.id,
        }
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/freights/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Excluir despesas e abastecimentos vinculados antes de excluir o frete
    await prisma.expense.deleteMany({ where: { freightId: id } });
    await prisma.fueling.deleteMany({ where: { freightId: id } });
    await prisma.freight.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Frete excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
