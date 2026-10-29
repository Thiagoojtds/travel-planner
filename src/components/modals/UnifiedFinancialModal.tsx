import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useFreights } from '../../context/FreightContext';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod, TransactionType } from '../../types';
import { 
  X, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Tag, 
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Trash2,
  Layers
} from 'lucide-react';

export type FinancialModalType = 'financiamento' | 'entrada' | 'despesa' | 'fixa' | 'fatura_cartao';

interface UnifiedFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: FinancialModalType;
  initialCardName?: string;
  initialMonth?: string;
  initialDueDate?: string;
}

export const UnifiedFinancialModal: React.FC<UnifiedFinancialModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'financiamento',
  initialCardName,
  initialMonth,
  initialDueDate,
}) => {
  const { addDebt, addExpense, addFixedExpense, addInvoice, addInvoiceItem, invoices } = useFinance();
  const { freights } = useFreights();
  const { selectedMonth } = useApp();

  const [activeType, setActiveType] = useState<FinancialModalType>(defaultType);

  // Estados para modo de fatura de cartão (existente vs nova)
  const [invoiceMode, setInvoiceMode] = useState<'existente' | 'nova'>('existente');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  useEffect(() => {
    if (invoices && invoices.length > 0) {
      if (initialCardName) {
        const match = invoices.find(i => 
          i.cardName.toLowerCase() === initialCardName.toLowerCase() && 
          (!initialMonth || i.month === initialMonth)
        );
        if (match) {
          setSelectedInvoiceId(match.id);
          setInvoiceMode('existente');
          return;
        }
      }
      if (!selectedInvoiceId || !invoices.some(i => i.id === selectedInvoiceId)) {
        setSelectedInvoiceId(invoices[0].id);
      }
      setInvoiceMode('existente');
    } else {
      setInvoiceMode('nova');
    }
  }, [invoices, initialCardName, initialMonth, isOpen]);

  // Estados para Financiamento / Parcelamento / Dívida
  const [debtTitle, setDebtTitle] = useState('');
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtCategory, setDebtCategory] = useState('financiamento_veiculo');
  const [debtTotalAmount, setDebtTotalAmount] = useState<number | string>('');
  const [debtTotalInstallments, setDebtTotalInstallments] = useState<number | string>(24);
  const [debtPaidInstallments, setDebtPaidInstallments] = useState<number | string>(0);
  const [debtInstallmentAmount, setDebtInstallmentAmount] = useState<number | string>('');
  const [debtStartMonth, setDebtStartMonth] = useState<string>(selectedMonth || new Date().toISOString().slice(0, 7));
  const [debtDueDay, setDebtDueDay] = useState<number | string>(10);
  const [debtNotes, setDebtNotes] = useState('');

  // Estados para Entrada e Despesa Avulsa
  const [entryCategory, setEntryCategory] = useState<ExpenseCategory>('adiantamento');
  const [entryStatus, setEntryStatus] = useState<'recebido' | 'pendente'>('recebido');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('alimentacao_estadia');
  const [transDescription, setTransDescription] = useState('');
  const [transAmount, setTransAmount] = useState<number | string>('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);
  const [transPaymentMethod, setTransPaymentMethod] = useState<PaymentMethod>('pix');
  const [transFreightId, setTransFreightId] = useState('');

  // Estados para Despesa Fixa Recorrente
  const [fixedDescription, setFixedDescription] = useState('');
  const [fixedCategory, setFixedCategory] = useState<ExpenseCategory>('seguro');
  const [fixedAmount, setFixedAmount] = useState<number | string>('');
  const [fixedDueDay, setFixedDueDay] = useState<number | string>(10);
  const [fixedBeneficiary, setFixedBeneficiary] = useState('');
  const [fixedPaymentMethod, setFixedPaymentMethod] = useState<PaymentMethod>('pix');
  const [fixedNotes, setFixedNotes] = useState('');

  // Estados para Fatura de Cartão de Crédito
  const [invoiceCardName, setInvoiceCardName] = useState(initialCardName || '');
  const [invoiceMonth, setInvoiceMonth] = useState(initialMonth || selectedMonth || new Date().toISOString().slice(0, 7));
  const [invoiceDueDay, setInvoiceDueDay] = useState<number | string>(15);
  const [invoiceStatus, setInvoiceStatus] = useState<'pendente' | 'pago'>('pendente');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id: string;
    description: string;
    category: ExpenseCategory;
    totalAmount: number | string;
    installments: number;
    purchaseDate: string;
    notes?: string;
  }>>([
    {
      id: '1',
      description: '',
      category: 'manutencao',
      totalAmount: '',
      installments: 1,
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  ]);

  const handleAddInvoiceItem = () => {
    setInvoiceItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        description: '',
        category: 'outros',
        totalAmount: '',
        installments: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      }
    ]);
  };

  const handleUpdateInvoiceItem = (id: string, field: string, value: any) => {
    setInvoiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveInvoiceItem = (id: string) => {
    if (invoiceItems.length === 1) {
      setInvoiceItems([{
        id: '1',
        description: '',
        category: 'manutencao',
        totalAmount: '',
        installments: 1,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      }]);
    } else {
      setInvoiceItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Soma de parcelas que caem na fatura do mês atual
  const totalInvoiceCurrentMonth = invoiceItems.reduce((acc, it) => {
    const tot = Number(it.totalAmount) || 0;
    const inst = Math.max(1, Number(it.installments) || 1);
    return acc + (tot / inst);
  }, 0);

  const totalInvoicePurchases = invoiceItems.reduce((acc, it) => {
    return acc + (Number(it.totalAmount) || 0);
  }, 0);

  useEffect(() => {
    if (isOpen) {
      setActiveType(defaultType);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  // Cálculo automático da parcela da dívida
  const numTotal = Number(debtTotalAmount) || 0;
  const numInst = Number(debtTotalInstallments) || 1;
  const numPaid = Number(debtPaidInstallments) || 0;
  const autoCalculatedInstallment = debtInstallmentAmount !== ''
    ? Number(debtInstallmentAmount)
    : (numInst > 0 ? numTotal / numInst : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'financiamento') {
      await addDebt({
        title: debtTitle,
        creditor: debtCreditor || undefined,
        totalOriginalAmount: numTotal,
        remainingBalance: Math.max(0, numTotal - (numPaid * autoCalculatedInstallment)),
        totalInstallments: numInst,
        paidInstallments: numPaid,
        initialPaidInstallments: numPaid,
        installmentAmount: autoCalculatedInstallment,
        dueDay: Number(debtDueDay) || 10,
        startDate: debtStartMonth,
        category: debtCategory,
        notes: debtNotes || undefined,
      });
    } else if (activeType === 'entrada') {
      await addExpense({
        type: 'entrada',
        category: entryCategory,
        description: transDescription,
        amount: Number(transAmount) || 0,
        date: transDate,
        paymentMethod: transPaymentMethod,
        freightId: transFreightId || undefined,
        status: entryStatus,
      });
    } else if (activeType === 'despesa') {
      await addExpense({
        type: 'saida',
        category: expenseCategory,
        description: transDescription,
        amount: Number(transAmount) || 0,
        date: transDate,
        paymentMethod: transPaymentMethod,
        freightId: transFreightId || undefined,
        status: 'pago',
      });
    } else if (activeType === 'fixa') {
      await addFixedExpense({
        description: fixedDescription,
        category: fixedCategory,
        amount: Number(fixedAmount) || 0,
        dueDay: Number(fixedDueDay) || 10,
        beneficiary: fixedBeneficiary || undefined,
        paymentMethod: fixedPaymentMethod,
        notes: fixedNotes || undefined,
        active: true,
      });
    } else if (activeType === 'fatura_cartao') {
      const validItems = invoiceItems.filter(
        it => it.description.trim() !== '' && Number(it.totalAmount) > 0
      );

      if (validItems.length === 0) {
        alert('Por favor, informe ao menos uma compra com descrição e valor para a fatura.');
        return;
      }

      const formattedItems = validItems.map(it => {
        const tot = Number(it.totalAmount);
        const inst = Math.max(1, Number(it.installments) || 1);
        const instVal = tot / inst;
        return {
          description: it.description.trim(),
          category: it.category,
          amount: instVal,
          totalAmount: tot,
          totalInstallments: inst,
          currentInstallment: 1,
          purchaseDate: it.purchaseDate,
          notes: it.notes || undefined,
        };
      });

      if (invoiceMode === 'existente' && selectedInvoiceId) {
        const targetInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[0];
        if (!targetInvoice) {
          alert('Por favor, selecione uma fatura existente ou alterne para criar nova fatura.');
          return;
        }

        for (const item of formattedItems) {
          await addInvoiceItem(targetInvoice.id, item);
        }
      } else {
        const parts = (invoiceMonth || '').split('-');
        const y = parts[0] || '2026';
        const m = parts[1] || '10';
        const d = String(Math.min(31, Math.max(1, Number(invoiceDueDay) || 15))).padStart(2, '0');
        const invoiceDueDate = `${y}-${m}-${d}`;

        await addInvoice({
          cardName: invoiceCardName.trim() || 'Cartão de Crédito',
          month: invoiceMonth,
          dueDate: invoiceDueDate,
          dueDay: Number(invoiceDueDay) || 15,
          status: invoiceStatus,
          notes: invoiceNotes || undefined,
          items: formattedItems,
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-8 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
              activeType === 'financiamento' ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' :
              activeType === 'fatura_cartao' ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400' :
              activeType === 'entrada' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' :
              activeType === 'despesa' ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' :
              'bg-sky-500/15 border border-sky-500/30 text-sky-400'
            }`}>
              {activeType === 'financiamento' && <Landmark className="w-5 h-5" />}
              {activeType === 'fatura_cartao' && <CreditCard className="w-5 h-5" />}
              {activeType === 'entrada' && <TrendingUp className="w-5 h-5" />}
              {activeType === 'despesa' && <TrendingDown className="w-5 h-5" />}
              {activeType === 'fixa' && <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Lançamentos</h2>
              <p className="text-xs text-slate-400">Financiamentos, faturas de cartão e despesas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Tipo de Lançamento (Tabs Unificadas) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 p-1 bg-slate-950/60 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveType('financiamento')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeType === 'financiamento'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Financiamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('fatura_cartao')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeType === 'fatura_cartao'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fatura Cartão</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('despesa')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeType === 'despesa'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Despesa Avulsa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('fixa')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeType === 'fixa'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Despesa Fixa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('entrada')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeType === 'entrada'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Entrada Avulsa</span>
          </button>
        </div>

        {/* Formulário Dinâmico */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* ======================================================== */}
          {/* TIPO 1: FINANCIAMENTO & PARCELAMENTO / DÍVIDA             */}
          {/* ======================================================== */}
          {activeType === 'financiamento' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Título do Contrato / Dívida *
                  </label>
                  <input
                    type="text"
                    required
                    value={debtTitle}
                    onChange={e => setDebtTitle(e.target.value)}
                    placeholder="Ex: Financiamento Iveco Stralis 2018 / Retífica de Motor"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Credor / Financeira / Beneficiário
                  </label>
                  <input
                    type="text"
                    value={debtCreditor}
                    onChange={e => setDebtCreditor(e.target.value)}
                    placeholder="Ex: Banco CNH, Safra, BV, Retífica"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria da Dívida
                  </label>
                  <select
                    value={debtCategory}
                    onChange={e => setDebtCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="financiamento_veiculo">Financiamento do Caminhão/Carreta</option>
                    <option value="parcelamento_oficina">Oficina / Manutenção Parcelada</option>
                    <option value="consorcio">Consórcio Contemplado</option>
                    <option value="emprestimo_capital">Capital de Giro / Empréstimo</option>
                    <option value="outros_parcelamentos">Outros Parcelamentos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor Total Contratado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={debtTotalAmount}
                    onChange={e => setDebtTotalAmount(e.target.value)}
                    placeholder="Ex: 120000.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total de Parcelas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={debtTotalInstallments}
                    onChange={e => setDebtTotalInstallments(e.target.value)}
                    placeholder="Ex: 48"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Parcelas Já Pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={Number(debtTotalInstallments) || 1}
                    value={debtPaidInstallments}
                    onChange={e => setDebtPaidInstallments(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor da Parcela Mensal (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={debtInstallmentAmount !== '' ? debtInstallmentAmount : (autoCalculatedInstallment > 0 ? autoCalculatedInstallment.toFixed(2) : '')}
                    onChange={e => setDebtInstallmentAmount(e.target.value)}
                    placeholder="Auto-calculado"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dia do Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={debtDueDay}
                    onChange={e => setDebtDueDay(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mês de Início (Vigência) *
                  </label>
                  <input
                    type="month"
                    required
                    value={debtStartMonth}
                    onChange={e => setDebtStartMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações do Financiamento
                </label>
                <textarea
                  rows={2}
                  value={debtNotes}
                  onChange={e => setDebtNotes(e.target.value)}
                  placeholder="Número de contrato, taxa de juros negociada, detalhes do gravame..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TIPO 2: ENTRADA / RECEITA AVULSA                          */}
          {/* ======================================================== */}
          {activeType === 'entrada' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Seletor de Status da Entrada (Planejada vs Recebida) */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-white block">Natureza do Lançamento</span>
                  <span className="text-[11px] text-slate-400">Indique se a entrada já foi creditada ou se está prevista</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryStatus('recebido')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      entryStatus === 'recebido'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Recebida (Já em Conta)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryStatus('pendente')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      entryStatus === 'pendente'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Planejada (A Receber)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição da Entrada *
                  </label>
                  <input
                    type="text"
                    required
                    value={transDescription}
                    onChange={e => setTransDescription(e.target.value)}
                    placeholder="Ex: Adiantamento frete CWB-SP, Venda de peça, Reembolso"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria da Receita
                  </label>
                  <select
                    value={entryCategory}
                    onChange={e => setEntryCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="adiantamento">Adiantamento de Frete</option>
                    <option value="frete">Recebimento de Frete</option>
                    <option value="outra_receita">Outra Receita / Reembolso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {entryStatus === 'recebido' ? 'Valor Recebido (R$) *' : 'Valor Previsto (R$) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transAmount}
                    onChange={e => setTransAmount(e.target.value)}
                    placeholder="Ex: 3500.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {entryStatus === 'recebido' ? 'Data do Recebimento Efetivo *' : 'Data Prevista para Receber *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={transDate}
                    onChange={e => setTransDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={transPaymentMethod}
                    onChange={e => setTransPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pix">PIX / Transferência</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="cartao_frota">Cartão Frota / Depósito</option>
                    <option value="outro">Outro Meio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vincular a uma Viagem / Frete (Opcional)
                </label>
                <select
                  value={transFreightId}
                  onChange={e => setTransFreightId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Nenhum frete vinculado (Avulso)</option>
                  {freights.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.code} - {f.originCity} → {f.destCity} ({f.departureDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TIPO 3: DESPESA / SAÍDA AVULSA                            */}
          {/* ======================================================== */}
          {activeType === 'despesa' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição do Gasto / Despesa *
                  </label>
                  <input
                    type="text"
                    required
                    value={transDescription}
                    onChange={e => setTransDescription(e.target.value)}
                    placeholder="Ex: Almoço na estrada, Borracharia remendo pneu, Arla 32"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria da Despesa
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="pedagio">Pedágio</option>
                    <option value="alimentacao_estadia">Alimentação & Estadia</option>
                    <option value="borracharia">Borracharia / Pneus</option>
                    <option value="manutencao">Manutenção Operacional</option>
                    <option value="arla32">Arla 32</option>
                    <option value="taxas_impostos">Taxas & Impostos</option>
                    <option value="combustivel">Combustível Avulso</option>
                    <option value="outros">Outros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor Pago (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={transAmount}
                    onChange={e => setTransAmount(e.target.value)}
                    placeholder="Ex: 150.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-rose-400 font-mono font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={transDate}
                    onChange={e => setTransDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={transPaymentMethod}
                    onChange={e => setTransPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="tag_pedagio">Tag Sem Parar / Pedágio</option>
                    <option value="cartao_frota">Cartão Frota</option>
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="outro">Outro Meio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Vincular a uma Viagem / Frete (Opcional)
                </label>
                <select
                  value={transFreightId}
                  onChange={e => setTransFreightId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">Despesa Geral da Frota (Sem frete específico)</option>
                  {freights.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.code} - {f.originCity} → {f.destCity} ({f.departureDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TIPO 4: DESPESA FIXA RECORRENTE                           */}
          {/* ======================================================== */}
          {activeType === 'fixa' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descrição da Despesa Fixa *
                  </label>
                  <input
                    type="text"
                    required
                    value={fixedDescription}
                    onChange={e => setFixedDescription(e.target.value)}
                    placeholder="Ex: Seguro Iveco Stralis + Randon, Rastreador Sascar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Beneficiário / Empresa Fornecedora
                  </label>
                  <input
                    type="text"
                    value={fixedBeneficiary}
                    onChange={e => setFixedBeneficiary(e.target.value)}
                    placeholder="Ex: Porto Seguro, Sascar, Sindicato"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Categoria Recorrente
                  </label>
                  <select
                    value={fixedCategory}
                    onChange={e => setFixedCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="seguro">Seguro do Caminhão / Frota</option>
                    <option value="outros">Rastreador / Sascar / Telemetria</option>
                    <option value="taxas_impostos">Taxas / Associação / Contador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fixedAmount}
                    onChange={e => setFixedAmount(e.target.value)}
                    placeholder="Ex: 850.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dia do Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={fixedDueDay}
                    onChange={e => setFixedDueDay(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={fixedPaymentMethod}
                    onChange={e => setFixedPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="pix">Boleto / PIX</option>
                    <option value="cartao_frota">Débito em Conta</option>
                    <option value="outro">Outro Meio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas / Contrato da Despesa Fixa
                </label>
                <textarea
                  rows={2}
                  value={fixedNotes}
                  onChange={e => setFixedNotes(e.target.value)}
                  placeholder="Número de apólice de seguro, contato do corretor, franquia..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TIPO 5: FATURA DE CARTÃO DE CRÉDITO COM COMPRAS PARCELADAS */}
          {/* ======================================================== */}
          {activeType === 'fatura_cartao' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Se houver faturas cadastradas, oferece a escolha entre incluir compras ou criar nova fatura */}
              {invoices && invoices.length > 0 && (
                <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInvoiceMode('existente')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      invoiceMode === 'existente'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Incluir em Fatura Existente ({invoices.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceMode('nova')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      invoiceMode === 'nova'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Nova Fatura</span>
                  </button>
                </div>
              )}

              {/* Modo 1: Incluir em Fatura Existente */}
              {invoiceMode === 'existente' && invoices && invoices.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Selecione a Fatura Cadastrada *
                    </label>
                    <select
                      value={selectedInvoiceId}
                      onChange={e => setSelectedInvoiceId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.cardName} • Mês {inv.month} (Vencimento: {inv.dueDate}) — Total: {(inv.totalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const selInv = invoices.find(i => i.id === selectedInvoiceId) || invoices[0];
                    if (!selInv) return null;
                    return (
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{selInv.cardName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              selInv.status === 'pago'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {selInv.status === 'pago' ? 'Fatura Paga' : 'A Pagar'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Mês: <strong className="text-slate-300">{selInv.month}</strong> • Vencimento: <strong className="text-slate-300">{selInv.dueDate}</strong>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Total Atual da Fatura</div>
                          <div className="font-mono text-sm sm:text-base font-bold text-indigo-400">
                            {(selInv.totalAmount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {selInv.items?.length || 0} compras já inclusas
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Modo 2: Criar Nova Fatura */
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nome do Cartão *
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceCardName}
                        onChange={e => setInvoiceCardName(e.target.value)}
                        placeholder="Ex: Nubank PJ, Itaú, Santander"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      {/* Sugestões rápidas */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Nubank PJ', 'Itaú Frota', 'Santander', 'Bradesco'].map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setInvoiceCardName(name)}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Mês de Referência *
                      </label>
                      <input
                        type="month"
                        required
                        value={invoiceMonth}
                        onChange={e => setInvoiceMonth(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Dia de Vencimento *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        required
                        value={invoiceDueDay}
                        onChange={e => setInvoiceDueDay(e.target.value)}
                        placeholder="15"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Status da Fatura
                      </label>
                      <select
                        value={invoiceStatus}
                        onChange={e => setInvoiceStatus(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="pendente">Pendente (A Pagar no Mês)</option>
                        <option value="pago">Já Paga / Liquidada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Observações / Anotações
                      </label>
                      <input
                        type="text"
                        value={invoiceNotes}
                        onChange={e => setInvoiceNotes(e.target.value)}
                        placeholder="Limite do cartão, fatura fechada..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Seção de Compras Inclusas na Fatura */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Compras Inclusas na Fatura</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Compras parceladas geram as faturas dos meses subsequentes automaticamente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Compra</span>
                  </button>
                </div>

                {/* Lista de Itens */}
                <div className="space-y-3">
                  {invoiceItems.map((item, idx) => {
                    const itemTotal = Number(item.totalAmount) || 0;
                    const instCount = Math.max(1, Number(item.installments) || 1);
                    const instVal = itemTotal > 0 ? itemTotal / instCount : 0;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-2.5 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            Compra #{idx + 1}
                          </span>
                          {invoiceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceItem(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                              title="Remover esta compra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                          {/* Descrição */}
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Descrição da Compra *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.description}
                              onChange={e => handleUpdateInvoiceItem(item.id, 'description', e.target.value)}
                              placeholder="Ex: Peças para o freio, Pneu Traseiro..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Categoria */}
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Categoria
                            </label>
                            <select
                              value={item.category}
                              onChange={e => handleUpdateInvoiceItem(item.id, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="manutencao">Manutenção</option>
                              <option value="combustivel">Combustível</option>
                              <option value="alimentacao_estadia">Alimentação/Estadia</option>
                              <option value="borracharia">Borracharia</option>
                              <option value="pedagio">Pedágio</option>
                              <option value="taxas_impostos">Taxas</option>
                              <option value="seguro">Seguro</option>
                              <option value="outros">Outros</option>
                            </select>
                          </div>

                          {/* Valor Total da Compra */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Valor Total (R$) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              value={item.totalAmount}
                              onChange={e => handleUpdateInvoiceItem(item.id, 'totalAmount', e.target.value)}
                              placeholder="0,00"
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Parcelamento */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-400 mb-1">
                              Parcelas
                            </label>
                            <select
                              value={item.installments}
                              onChange={e => handleUpdateInvoiceItem(item.id, 'installments', Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                            >
                              <option value={1}>1x (À vista)</option>
                              <option value={2}>2x</option>
                              <option value={3}>3x</option>
                              <option value={4}>4x</option>
                              <option value={5}>5x</option>
                              <option value={6}>6x</option>
                              <option value={7}>7x</option>
                              <option value={8}>8x</option>
                              <option value={9}>9x</option>
                              <option value={10}>10x</option>
                              <option value={12}>12x</option>
                              <option value={18}>18x</option>
                              <option value={24}>24x</option>
                            </select>
                          </div>
                        </div>

                        {/* Informação explicativa de parcelamento */}
                        {instCount > 1 && itemTotal > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                            <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>
                              <strong>{instCount} parcelas de {instVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>: Parcela 1 entra nesta fatura ({invoiceMonth}) e as próximas {instCount - 1} parcelas serão geradas automaticamente nas faturas dos próximos {instCount - 1} meses.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Card de Resumo Financeiro da Fatura */}
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                      Total Desta Fatura ({invoiceMonth})
                    </div>
                    <div className="font-mono text-lg font-black text-white mt-0.5">
                      {totalInvoiceCurrentMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {invoiceItems.length} compra(s) • Total das compras brutas: {totalInvoicePurchases.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-indigo-300 font-medium bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                      Vencimento: Dia {invoiceDueDay}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 ${
                activeType === 'financiamento' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' :
                activeType === 'fatura_cartao' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30' :
                activeType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' :
                activeType === 'despesa' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' :
                'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {activeType === 'financiamento' ? 'Cadastrar Financiamento' :
                 activeType === 'fatura_cartao' ? (invoiceMode === 'existente' ? 'Incluir Compras na Fatura' : 'Registrar Fatura e Parcelas') :
                 activeType === 'entrada' ? 'Confirmar Entrada' :
                 activeType === 'despesa' ? 'Confirmar Despesa' :
                 'Salvar Despesa Fixa'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
