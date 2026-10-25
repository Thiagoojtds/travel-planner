import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Garantir que existe ao menos um caminhão (Iveco Stralis Randon)
async function getOrCreateTruck() {
  let truck = await prisma.truck.findFirst();
  if (!truck) {
    truck = await prisma.truck.create({
      data: {
        plate: 'BRA2E19',
        model: 'Iveco Stralis',
        brand: 'Iveco',
        trailerModel: 'Carreta Randon',
        trailerPlate: 'ABC1D23',
        year: 2018,
        currentKm: 0,
        fuelCapacityPrincipal: 600,
        fuelCapacityAuxiliar: 300,
        avgConsumption: 2.2,
        driverName: 'Motorista',
        driverTripPay: 700.0,
        oilChangeIntervalKm: 20000,
        lastOilChangeKm: 0,
        monthlyTargetRevenue: 35000,
        monthlyTargetProfit: 12000,
        status: 'disponivel',
      }
    });
  }
  return truck;
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const truck = await getOrCreateTruck();
    res.json(truck);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const truck = await getOrCreateTruck();
    const updated = await prisma.truck.update({
      where: { id: truck.id },
      data: req.body,
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/oil-change', async (req: Request, res: Response) => {
  try {
    const truck = await getOrCreateTruck();
    const currentKm = Number(req.body.currentKm ?? truck.currentKm);
    const cost = Number(req.body.cost ?? 0);
    const workshop = req.body.workshop || 'Oficina Especializada';
    const notes = req.body.notes || 'Troca de óleo do motor e filtros (Iveco Stralis)';

    // Atualiza o odômetro da última troca no caminhão
    const updatedTruck = await prisma.truck.update({
      where: { id: truck.id },
      data: {
        lastOilChangeKm: currentKm,
        currentKm: Math.max(truck.currentKm, currentKm),
      }
    });

    // Registra a manutenção preventiva
    const maintenance = await prisma.maintenance.create({
      data: {
        type: 'preventiva',
        category: 'oleo_filtros',
        description: 'Troca de Óleo e Filtros (20.000 km)',
        maintenanceKm: currentKm,
        nextRecommendedKm: currentKm + truck.oilChangeIntervalKm,
        date: new Date().toISOString().split('T')[0],
        workshop,
        partsCost: cost,
        laborCost: 0,
        totalCost: cost,
        partsReplaced: 'Óleo Motor 15W40/10W40, Filtro de Óleo, Filtro de Combustível/Separador',
        notes,
      }
    });

    // Se houve custo, registra no extrato de despesas
    if (cost > 0) {
      await prisma.expense.create({
        data: {
          type: 'saida',
          category: 'manutencao',
          description: `Troca de Óleo (${currentKm} km) - Iveco Stralis`,
          amount: cost,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'pix',
          status: 'pago',
        }
      });
    }

    res.json({ truck: updatedTruck, maintenance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
