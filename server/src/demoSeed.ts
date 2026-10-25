import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export async function ensureDemoDatabase(prismaProd: PrismaClient, prismaDemo: PrismaClient) {
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Verifica se as tabelas já existem no demo.db
    let tablesExist = false;
    try {
      const existingTables: any[] = await prismaDemo.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Truck';"
      );
      if (existingTables && existingTables.length > 0) {
        tablesExist = true;
      }
    } catch {
      tablesExist = false;
    }

    // 2. Se as tabelas não existem, copia a estrutura (DDL) de app.db
    if (!tablesExist) {
      console.log('📦 Inicializando estrutura do banco demo.db a partir do schema...');
      const schemaStatements: any[] = await prismaProd.$queryRawUnsafe(
        "SELECT sql FROM sqlite_master WHERE type IN ('table', 'index') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%';"
      );

      for (const stmt of schemaStatements) {
        if (stmt.sql) {
          try {
            await prismaDemo.$executeRawUnsafe(stmt.sql);
          } catch (err: any) {
            // Ignora se tabela/índice já existir
          }
        }
      }
      console.log('✅ Estrutura de tabelas criada em demo.db!');
    }

    // 3. Verifica se o demo.db já possui dados de caminhão ou frete
    const truckCount = await prismaDemo.truck.count();
    if (truckCount === 0) {
      console.log('🌱 Populando demo.db com dados fictícios realistas para portfólio...');
      await seedDemoData(prismaDemo);
      console.log('✨ Dados de demonstração carregados com sucesso em demo.db!');
    }
  } catch (error) {
    console.error('Erro ao verificar/inicializar demo.db:', error);
  }
}

async function seedDemoData(db: PrismaClient) {
  const currentYearMonth = new Date().toISOString().slice(0, 7); // ex: "2026-10"
  const today = new Date().toISOString().split('T')[0];

  // 1. Caminhão Demo
  const truck = await db.truck.create({
    data: {
      plate: 'BRA2E19',
      model: 'Iveco Stralis 440',
      brand: 'Iveco',
      trailerModel: 'Carreta Randon Graneleira',
      trailerPlate: 'ABC1D23',
      year: 2020,
      currentKm: 142500,
      fuelCapacityPrincipal: 600,
      fuelCapacityAuxiliar: 300,
      avgConsumption: 2.2,
      driverName: 'Carlos Silva',
      driverTripPay: 700.0,
      oilChangeIntervalKm: 20000,
      lastOilChangeKm: 135000,
      monthlyTargetRevenue: 40000,
      monthlyTargetProfit: 15000,
      status: 'disponivel',
    }
  });

  // 2. Fretes de Demonstração
  const freight1 = await db.freight.create({
    data: {
      code: `FRT-CWB-SP-${currentYearMonth.replace('-', '')}-01`,
      originCity: 'Curitiba',
      originState: 'PR',
      destCity: 'São Paulo',
      destState: 'SP',
      returnCity: 'Curitiba',
      returnState: 'PR',
      routeType: 'ida_volta',
      client: 'Cargill Agrícola',
      cargoType: 'Carga Seca / Paletizada',
      cargoWeightTons: 28.5,
      distanceKm: 820,
      departureDate: `${currentYearMonth}-05`,
      deliveryDate: `${currentYearMonth}-07`,
      receiptDate: `${currentYearMonth}-12`,
      grossValue: 5600,
      advanceValue: 3500,
      balanceDue: 2100,
      driverPay: 700,
      status: 'finalizado',
      paymentStatus: 'pago',
      notes: 'Viagem de demonstração concluída sem intercorrências',
    }
  });

  const freight2 = await db.freight.create({
    data: {
      code: `FRT-CAS-PNG-${currentYearMonth.replace('-', '')}-02`,
      originCity: 'Cascavel',
      originState: 'PR',
      destCity: 'Paranaguá',
      destState: 'PR',
      returnCity: 'Cascavel',
      returnState: 'PR',
      routeType: 'ida_volta',
      client: 'Bunge Alimentos',
      cargoType: 'Grãos a Granel',
      cargoWeightTons: 32.0,
      distanceKm: 1240,
      departureDate: `${currentYearMonth}-12`,
      deliveryDate: `${currentYearMonth}-15`,
      receiptDate: `${currentYearMonth}-19`,
      grossValue: 7400,
      advanceValue: 4500,
      balanceDue: 2900,
      driverPay: 700,
      status: 'finalizado',
      paymentStatus: 'pago',
      notes: 'Descarga no porto agendada',
    }
  });

  const freight3 = await db.freight.create({
    data: {
      code: `FRT-MGF-STN-${currentYearMonth.replace('-', '')}-03`,
      originCity: 'Maringá',
      originState: 'PR',
      destCity: 'Santos',
      destState: 'SP',
      returnCity: 'Maringá',
      returnState: 'PR',
      routeType: 'ida_volta',
      client: 'Amaggi Logística',
      cargoType: 'Açúcar Ensacado',
      cargoWeightTons: 30.0,
      distanceKm: 1380,
      departureDate: `${currentYearMonth}-20`,
      deliveryDate: `${currentYearMonth}-23`,
      receiptDate: `${currentYearMonth}-26`,
      grossValue: 8800,
      advanceValue: 5000,
      balanceDue: 3800,
      driverPay: 700,
      status: 'em_transito',
      paymentStatus: 'parcial',
      notes: 'Em trânsito sentido Porto de Santos',
    }
  });

  // 3. Abastecimentos de Demonstração
  const fuel1 = await db.fueling.create({
    data: {
      date: `${currentYearMonth}-05`,
      currentKm: 139800,
      liters: 320,
      pricePerLiter: 5.89,
      totalAmount: 1884.80,
      tank: 'ambos',
      status: 'pago',
      city: 'Curitiba',
      state: 'PR',
      notes: 'Posto Ipiranga Linha Verde',
      freightId: freight1.id,
    }
  });

  const fuel2 = await db.fueling.create({
    data: {
      date: `${currentYearMonth}-12`,
      currentKm: 141200,
      liters: 380,
      pricePerLiter: 5.95,
      totalAmount: 2261.00,
      tank: 'ambos',
      status: 'pago',
      city: 'Cascavel',
      state: 'PR',
      notes: 'Posto Coopavel BR-277',
      freightId: freight2.id,
    }
  });

  const fuel3 = await db.fueling.create({
    data: {
      date: `${currentYearMonth}-20`,
      currentKm: 142500,
      liters: 350,
      pricePerLiter: 5.87,
      totalAmount: 2054.50,
      tank: 'ambos',
      status: 'pendente',
      city: 'Maringá',
      state: 'PR',
      notes: 'Posto G10 Saída',
      freightId: freight3.id,
    }
  });

  // 4. Despesas Operacionais correspondentes aos abastecimentos
  await db.expense.create({
    data: {
      type: 'saida',
      category: 'combustivel',
      description: 'Diesel 320.0L (Tanque duplo) - Curitiba/PR',
      amount: 1884.80,
      date: `${currentYearMonth}-05`,
      paymentMethod: 'cartao_frota',
      status: 'pago',
      freightId: freight1.id,
      fuelingId: fuel1.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'saida',
      category: 'combustivel',
      description: 'Diesel 380.0L (Tanque duplo) - Cascavel/PR',
      amount: 2261.00,
      date: `${currentYearMonth}-12`,
      paymentMethod: 'cartao_frota',
      status: 'pago',
      freightId: freight2.id,
      fuelingId: fuel2.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'saida',
      category: 'combustivel',
      description: 'Diesel 350.0L (Tanque duplo) - Maringá/PR',
      amount: 2054.50,
      date: `${currentYearMonth}-20`,
      paymentMethod: 'cartao_frota',
      status: 'pendente',
      freightId: freight3.id,
      fuelingId: fuel3.id,
    }
  });

  // 5. Entradas financeiras dos fretes
  await db.expense.create({
    data: {
      type: 'entrada',
      category: 'adiantamento',
      description: `Adiantamento Frete ${freight1.code}`,
      amount: 3500,
      date: `${currentYearMonth}-05`,
      paymentMethod: 'pix',
      status: 'pago',
      freightId: freight1.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'entrada',
      category: 'frete',
      description: `Saldo Frete ${freight1.code}`,
      amount: 2100,
      date: `${currentYearMonth}-12`,
      paymentMethod: 'pix',
      status: 'pago',
      freightId: freight1.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'entrada',
      category: 'adiantamento',
      description: `Adiantamento Frete ${freight2.code}`,
      amount: 4500,
      date: `${currentYearMonth}-12`,
      paymentMethod: 'pix',
      status: 'pago',
      freightId: freight2.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'entrada',
      category: 'frete',
      description: `Saldo Frete ${freight2.code}`,
      amount: 2900,
      date: `${currentYearMonth}-19`,
      paymentMethod: 'pix',
      status: 'pago',
      freightId: freight2.id,
    }
  });

  await db.expense.create({
    data: {
      type: 'entrada',
      category: 'adiantamento',
      description: `Adiantamento Frete ${freight3.code}`,
      amount: 5000,
      date: `${currentYearMonth}-20`,
      paymentMethod: 'pix',
      status: 'pago',
      freightId: freight3.id,
    }
  });

  // 6. Contrato de Financiamento Demonstrativo
  const debt = await db.debt.create({
    data: {
      title: 'Financiamento Iveco Stralis (Banco Financiador)',
      creditor: 'Banco CNH Industrial',
      totalOriginalAmount: 182400,
      remainingBalance: 91200,
      totalInstallments: 48,
      paidInstallments: 24,
      initialPaidInstallments: 23,
      installmentAmount: 3800,
      interestRate: 0.95,
      dueDay: 23,
      status: 'ativo',
      category: 'prestacao_veiculo',
      notes: 'Parcela mensal fixa da frota',
    }
  });

  // Despesa correspondente à parcela do mês
  await db.expense.create({
    data: {
      type: 'saida',
      category: 'prestacao_veiculo',
      description: `Parcela 24/48 - ${debt.title}`,
      amount: 3800,
      date: `${currentYearMonth}-23`,
      paymentMethod: 'pix',
      status: 'pago',
      debtId: debt.id,
      installmentNumber: 24,
    }
  });

  // 7. Despesas Fixas Demonstrativas
  const fix1 = await db.fixedExpense.create({
    data: {
      description: 'Seguro Frota & Carga Randon',
      category: 'seguro',
      amount: 650.00,
      dueDay: 10,
      paymentMethod: 'pix',
      beneficiary: 'Porto Seguro Cargas',
      active: true,
      notes: 'Apólice anual frota pesada',
    }
  });

  const fix2 = await db.fixedExpense.create({
    data: {
      description: 'Rastreador Sascar / Telemetria Satelital',
      category: 'taxas_impostos',
      amount: 145.00,
      dueDay: 20,
      paymentMethod: 'pix',
      beneficiary: 'Sascar Tecnologia',
      active: true,
      notes: 'Sensor de desengate e portas',
    }
  });

  // 8. Manutenção Demonstrativa
  await db.maintenance.create({
    data: {
      type: 'preventiva',
      category: 'oleo_filtros',
      description: 'Troca de Óleo do Motor (Uranil 15W40) + Filtros de Óleo, Ar e Combustível',
      maintenanceKm: 135000,
      nextRecommendedKm: 155000,
      date: `${currentYearMonth}-02`,
      workshop: 'Iveco Concessionária Oficial',
      partsCost: 850.00,
      laborCost: 400.00,
      totalCost: 1250.00,
      partsReplaced: 'Filtro lubrificante, filtro de combustível duplo, filtro de ar primário e 32L de óleo 15W40',
      invoiceNumber: 'NF-8921',
      notes: 'Revisão preventiva de 20.000 km realizada dentro do prazo',
    }
  });

  // 9. Checklist Diário Demonstrativo
  await db.checklist.create({
    data: {
      date: today,
      truckKm: 142500,
      status: 'aprovado',
      driverName: 'Carlos Silva',
      oilLevel: true,
      coolantLevel: true,
      visibleLeaks: false,
      lightsAndTires: true,
      brakesOk: true,
      trailerCouplingRandon: true,
      notes: 'Conjunto inspecionado e aprovado para viagem.',
    }
  });

  // 10. Configuração de Abastecimento Padrão Demo
  await db.appConfig.create({
    data: {
      key: 'default_fueling_config',
      value: JSON.stringify({
        liters: 300,
        pricePerLiter: 5.89,
        tank: 'ambos',
        status: 'pago',
        city: 'Curitiba',
        state: 'PR',
        notes: 'Abastecimento Padrão Demo'
      })
    }
  });
}
