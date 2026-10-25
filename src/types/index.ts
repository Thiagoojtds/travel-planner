export type FreightStatus = 'planejado' | 'em_transito' | 'finalizado' | 'cancelado' | 'entregue';
export type PaymentStatus = 'pendente' | 'parcial' | 'pago';
export type TransactionType = 'entrada' | 'saida';

export type ExpenseCategory = 
  | 'frete'
  | 'adiantamento'
  | 'outra_receita'
  | 'combustivel' 
  | 'arla32' 
  | 'pedagio' 
  | 'manutencao' 
  | 'alimentacao_estadia' 
  | 'taxas_impostos' 
  | 'borracharia' 
  | 'prestacao_veiculo'
  | 'pagamento_motorista'
  | 'seguro'
  | 'fatura_cartao'
  | 'outros';

export type PaymentMethod = 'cartao_frota' | 'cartao_credito' | 'dinheiro' | 'pix' | 'tag_pedagio' | 'outro';
export type MaintenanceType = 'preventiva' | 'corretiva';
export type MaintenanceCategory = 
  | 'oleo_filtros' 
  | 'freios' 
  | 'pneus' 
  | 'suspensao_randon' 
  | 'motor' 
  | 'eletrica' 
  | 'revisao_geral';

export type FuelTankType = 'principal_600' | 'auxiliar_300' | 'ambos';

export interface TruckInfo {
  id: string;
  plate: string;
  model: string;
  brand: string;
  trailerModel: string;
  trailerPlate: string;
  year: number;
  currentKm: number;
  fuelCapacityPrincipal: number;
  fuelCapacityAuxiliar: number;
  avgConsumption: number;
  driverName: string;
  driverTripPay: number; // padrão R$ 700 por viagem
  oilChangeIntervalKm: number; // padrão 20.000 km
  lastOilChangeKm: number;
  monthlyTargetRevenue: number;
  monthlyTargetProfit: number;
  status: 'disponivel' | 'em_viagem' | 'manutencao';
}

export interface FreightWaypoint {
  city: string;
  state: string;
  arrivalDate?: string;   // Data de parada / chegada
  departureDate?: string; // Data de saída / continuação
  notes?: string;         // Motivo / observação da parada (ex: carga parcial, pernoite)
}

export type RouteType = 'ida_volta' | 'circuito' | 'so_ida';

export interface Freight {
  id: string;
  code: string; // ex: FRT-CWB-SP-202610-01
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  returnCity?: string | null;
  returnState?: string | null;
  routeType?: RouteType;
  waypoints?: FreightWaypoint[];
  client: string;
  cargoType: string;
  cargoWeightTons: number;
  distanceKm: number;
  departureDate: string;
  deliveryDate: string;
  receiptDate: string;
  grossValue: number;
  advanceValue: number;
  balanceDue: number;
  driverPay: number; // R$ 700 fixo configurável
  status: FreightStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  carrierContract?: string;
  fuelTotal?: number;
  tollsTotal?: number;
  otherExpensesTotal?: number;
  totalTripCosts?: number;
  netProfit?: number;
  profitMarginPct?: number;
}

export interface Fueling {
  id: string;
  date: string;
  currentKm: number;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  tank: FuelTankType;
  status: 'pago' | 'pendente';
  city?: string;
  state?: string;
  notes?: string;
  freightId?: string;
  freight?: { id: string; code: string; originCity: string; destCity: string };
}

export interface DefaultFuelingConfig {
  liters: number;
  pricePerLiter: number;
  tank: FuelTankType;
  status: 'pago' | 'pendente';
  city?: string;
  state?: string;
  notes?: string;
}

export interface Debt {
  id: string;
  title: string;
  creditor?: string;
  totalOriginalAmount: number;
  remainingBalance: number;
  totalInstallments: number;
  paidInstallments: number;
  initialPaidInstallments?: number;
  installmentAmount: number;
  interestRate: number;
  dueDay: number;
  startDate?: string;
  startMonth?: string;
  endMonth?: string;
  isBeforeStartMonth?: boolean;
  isAfterEndMonth?: boolean;
  installmentNumberInMonth?: number;
  status: 'ativo' | 'quitado';
  settledAt?: string;
  isSettledPriorToMonth?: boolean;
  isSettledInMonth?: boolean;
  hasBoletoInMonth?: boolean;
  category: string;
  notes?: string;
  payments?: Expense[];
}

export interface FixedExpense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  dueDay: number;
  paymentMethod: PaymentMethod;
  beneficiary?: string;
  active: boolean;
  notes?: string;
}

export interface Expense {
  id: string;
  type: TransactionType;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'recebido' | 'pago' | 'pendente' | 'agendado';
  freightId?: string;
  freight?: { id: string; code: string };
  debtId?: string;
  debt?: { id: string; title: string };
  fixedExpenseId?: string;
  fixedExpense?: { id: string; description: string };
  installmentNumber?: number;
  creditCardInvoiceId?: string;
  creditCardInvoice?: CreditCardInvoice;
}

export interface CreditCardInvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  totalAmount?: number;
  purchaseDate: string;
  currentInstallment: number;
  totalInstallments: number;
  parentPurchaseId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditCardInvoice {
  id: string;
  cardName: string;
  month: string;
  dueDate: string;
  closingDate?: string;
  status: 'pendente' | 'pago';
  notes?: string;
  totalAmount?: number;
  items?: CreditCardInvoiceItem[];
  expenses?: Expense[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  category: MaintenanceCategory;
  description: string;
  maintenanceKm: number;
  nextRecommendedKm?: number;
  date: string;
  workshop?: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  partsReplaced?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface ChecklistRecord {
  id: string;
  date: string;
  truckKm: number;
  status: 'aprovado' | 'alerta' | 'reprovado';
  driverName: string;
  oilLevel: boolean;
  coolantLevel: boolean;
  visibleLeaks: boolean;
  lightsAndTires: boolean;
  brakesOk: boolean;
  trailerCouplingRandon: boolean;
  notes?: string;
}

export interface OilProgress {
  usedKm: number;
  limitKm: number;
  remainingKm: number;
  percentage: number;
  isWarning: boolean;
  isCritical: boolean;
}

export interface UpcomingPayment {
  id: string;
  sourceType: 'debt' | 'fixed_expense' | 'expense';
  sourceId: string;
  title: string;
  category: string;
  creditorOrBeneficiary?: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  dueDay: number;
  daysRemaining: number;
  status: 'pendente' | 'atrasado' | 'pago';
  installmentInfo?: string;
  notes?: string;
}

export interface DebtBalanceSummary {
  totalOriginalAmount: number;
  totalRemainingBalance: number;
  totalAmortizedAmount: number;
  amortizationPercentage: number;
  totalDebtsCount: number;
  activeDebtsCount: number;
  settledDebtsCount: number;
  monthDueAmount: number;
  monthPaidAmount: number;
  monthRemainingAmount: number;
}

export interface DashboardData {
  month: string;
  truck: {
    plate: string;
    model: string;
    trailerModel: string;
    currentKm: number;
    lastOilChangeKm: number;
    oilProgress: OilProgress;
  };
  kpis: {
    grossRevenue: number;
    freightRevenue?: number;
    extraRevenue?: number;
    advancesReceived: number;
    balancesPending: number;
    totalFuelMonth: number;
    totalFuelLitersMonth: number;
    totalDriverPayMonth: number;
    totalMaintenanceMonth: number;
    totalDebtsDueMonth: number;
    totalFixedDueMonth: number;
    restanteAPagarTotal: number;
    netProfit: number;
    freightsCount: number;
    previousMonthComparison?: {
      previousMonthLabel: string;
      revenueDiff: number;
      revenuePercent: number | null;
      profitDiff: number;
      profitPercent: number | null;
      costsDiff: number;
      costsPercent: number | null;
      freightsDiff: number;
      marginDiff: number;
      fuelDiff: number;
      fuelPercent: number | null;
    };
  };
  recentFreights: Freight[];
  activeDebts: Debt[];
  activeFixedExpenses: FixedExpense[];
  debtBalance: DebtBalanceSummary;
  upcomingPayments: UpcomingPayment[];
  upcoming10DaysTotal: number;
  monthlyEvolution?: MonthlyEvolutionItem[];
}

export interface MonthlyEvolutionItem {
  month: string;
  label: string;
  grossRevenue: number;
  totalCosts: number;
  netProfit: number;
  freightsCount: number;
  profitMargin: number;
}

export interface ToastData {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

