import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useApp } from '../../context/AppContext';
import { FixedExpense, ExpenseCategory, PaymentMethod } from '../../types';
import { X, Calendar, DollarSign, Tag, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixedExpense?: FixedExpense | null;
}

export const FixedExpenseModal: React.FC<FixedExpenseModalProps> = ({ isOpen, onClose, fixedExpense }) => {
  const { addFixedExpense, updateFixedExpense, expenses, deleteExpense, payFixedExpense } = useFinance();
  const { selectedMonth } = useApp();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('seguro');
  const [amount, setAmount] = useState<number | string>('');
  const [dueDay, setDueDay] = useState<number | string>(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [beneficiary, setBeneficiary] = useState('');
  const [notes, setNotes] = useState('');

  const monthPayment = fixedExpense ? expenses.find(e => 
    e.fixedExpenseId === fixedExpense.id && 
    e.date.startsWith(selectedMonth) && 
    e.status === 'pago'
  ) : null;

  useEffect(() => {
    if (fixedExpense) {
      setDescription(fixedExpense.description || '');
      setCategory(fixedExpense.category || 'seguro');
      setAmount(fixedExpense.amount ?? '');
      setDueDay(fixedExpense.dueDay ?? 10);
      setPaymentMethod(fixedExpense.paymentMethod || 'pix');
      setBeneficiary(fixedExpense.beneficiary || '');
      setNotes(fixedExpense.notes || '');
    } else {
      setDescription('');
      setCategory('seguro');
      setAmount('');
      setDueDay(10);
      setPaymentMethod('pix');
      setBeneficiary('');
      setNotes('');
    }
  }, [fixedExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fixedExpense) {
      await updateFixedExpense(fixedExpense.id, {
        description,
        category,
        amount: Number(amount) || 0,
        dueDay: Number(dueDay) || 10,
        paymentMethod,
        beneficiary: beneficiary || undefined,
        notes: notes || undefined,
      });
    } else {
      await addFixedExpense({
        description,
        category,
        amount: Number(amount) || 0,
        dueDay: Number(dueDay) || 10,
        paymentMethod,
        beneficiary: beneficiary || undefined,
        notes: notes || undefined,
        active: true,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {fixedExpense ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa Recorrente'}
              </h2>
              <p className="text-xs text-slate-400">Seguro, Sascar/Rastreador, taxas mensais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status de Pagamento no Mês Selecionado */}
        {fixedExpense && (
          <div className={`mb-4 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            monthPayment
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                monthPayment ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {monthPayment ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Mês de {selectedMonth}:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    monthPayment
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {monthPayment ? '✓ Pago neste mês' : 'Pendente (A Pagar)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {monthPayment 
                    ? `Comprovante: R$ ${Number(monthPayment.amount).toFixed(2)} registrado em ${monthPayment.date}` 
                    : `Vencimento programado para o dia ${dueDay}`}
                </p>
              </div>
            </div>

            {monthPayment ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Remover o status de "PAGO" desta despesa fixa em ${selectedMonth}?\n\nEla voltará a constar como pendente/a pagar neste mês.`)) {
                    await deleteExpense(monthPayment.id);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Remover baixa de pagamento deste mês"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Remover "Pago"</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const day = fixedExpense.dueDay || 10;
                  const parts = (selectedMonth || '').split('-');
                  const targetDate = parts.length >= 2 ? `${parts[0]}-${parts[1]}-${String(day).padStart(2, '0')}` : undefined;
                  await payFixedExpense(fixedExpense.id, targetDate);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar como Pago</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Sascar Rastreador, Seguro Caminhão"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="seguro">Seguro</option>
                <option value="taxas_impostos">Rastreador (Sascar)</option>
                <option value="manutencao">Manutenção Recorrente</option>
                <option value="prestacao_veiculo">Prestação Veículo</option>
                <option value="outros">Outros Fixos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="pix">PIX</option>
                <option value="cartao_frota">Boleto / Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 850.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Beneficiário / Empresa</label>
            <input
              type="text"
              value={beneficiary}
              onChange={e => setBeneficiary(e.target.value)}
              placeholder="Ex: Sascar, Seguradora Sompo"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
            >
              {fixedExpense ? 'Salvar Alterações' : 'Salvar Despesa Fixa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
