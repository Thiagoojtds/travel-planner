import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Debt } from '../../types';
import { X, CreditCard, Calendar, DollarSign, UserCheck, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: Debt | null;
}

export const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, debt }) => {
  const { addDebt, updateDebt, payDebtInstallment, unpayDebtInstallment, expenses } = useFinance();
  const { selectedMonth } = useApp();

  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalOriginalAmount, setTotalOriginalAmount] = useState<number | string>('');
  const [totalInstallments, setTotalInstallments] = useState<number | string>(12);
  const [paidInstallments, setPaidInstallments] = useState<number | string>(0);
  const [installmentAmount, setInstallmentAmount] = useState<number | string>('');
  const [startMonth, setStartMonth] = useState<string>(selectedMonth || new Date().toISOString().slice(0, 7));
  const [dueDay, setDueDay] = useState<number | string>(10);
  const [category, setCategory] = useState('financiamento_caminhao');
  const [notes, setNotes] = useState('');

  const monthPaidExpense = debt
    ? expenses.find(e => e.debtId === debt.id && e.date.startsWith(selectedMonth) && e.status === 'pago')
    : null;
  const monthPendingExpense = debt
    ? expenses.find(e => e.debtId === debt.id && e.date.startsWith(selectedMonth) && e.status !== 'pago')
    : null;
  const monthExpense = monthPaidExpense || monthPendingExpense;
  const isSettled = debt ? (debt.status === 'quitado' || debt.remainingBalance === 0) : false;
  const isPaidThisMonth = isSettled || 
    Boolean(monthPaidExpense) || 
    Boolean(debt?.payments?.some(p => p.date.startsWith(selectedMonth) && (p.status as any) === 'pago'));

  useEffect(() => {
    if (debt) {
      setTitle(debt.title || '');
      setCreditor(debt.creditor || '');
      setTotalOriginalAmount(debt.totalOriginalAmount ?? '');
      setTotalInstallments(debt.totalInstallments ?? 12);
      setPaidInstallments(debt.paidInstallments ?? 0);
      setInstallmentAmount(debt.installmentAmount ?? '');
      setStartMonth(debt.startDate ? debt.startDate.slice(0, 7) : (selectedMonth || new Date().toISOString().slice(0, 7)));
      setDueDay(debt.dueDay ?? 10);
      setCategory(debt.category || 'financiamento_caminhao');
      setNotes(debt.notes || '');
    } else {
      setTitle('');
      setCreditor('');
      setTotalOriginalAmount('');
      setTotalInstallments(12);
      setPaidInstallments(0);
      setInstallmentAmount('');
      setStartMonth(selectedMonth || new Date().toISOString().slice(0, 7));
      setDueDay(10);
      setCategory('financiamento_caminhao');
      setNotes('');
    }
  }, [debt, isOpen, selectedMonth]);

  if (!isOpen) return null;

  const total = Number(totalOriginalAmount) || 0;
  const numInstallments = Number(totalInstallments) || 1;
  const numPaid = Number(paidInstallments) || 0;

  // Auto-calcula valor da parcela se não preenchido
  const calculatedInstallment = installmentAmount !== '' 
    ? Number(installmentAmount) 
    : (numInstallments > 0 ? total / numInstallments : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debt) {
      await updateDebt(debt.id, {
        title,
        creditor: creditor || undefined,
        totalOriginalAmount: total,
        remainingBalance: Math.max(0, total - (numPaid * calculatedInstallment)),
        totalInstallments: numInstallments,
        paidInstallments: numPaid,
        installmentAmount: calculatedInstallment,
        dueDay: Number(dueDay) || 10,
        startDate: startMonth,
        category,
        notes: notes || undefined,
      });
    } else {
      await addDebt({
        title,
        creditor: creditor || undefined,
        totalOriginalAmount: total,
        remainingBalance: Math.max(0, total - (numPaid * calculatedInstallment)),
        totalInstallments: numInstallments,
        paidInstallments: numPaid,
        initialPaidInstallments: numPaid,
        installmentAmount: calculatedInstallment,
        dueDay: Number(dueDay) || 10,
        startDate: startMonth,
        category,
        notes: notes || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {debt ? 'Editar Contrato / Parcelamento' : 'Novo Contrato / Dívida'}
              </h2>
              <p className="text-xs text-slate-400">Financiamento, IPVA, parcelamentos e saldo devedor</p>
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
        {debt && (
          <div className={`mb-4 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isPaidThisMonth
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${
                isPaidThisMonth ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {isPaidThisMonth ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Mês de {selectedMonth}:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPaidThisMonth
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {isSettled ? '100% Quitado' : (isPaidThisMonth ? '✓ Parcela Paga no Mês' : 'Pendente (A Pagar no Mês)')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isPaidThisMonth && monthPaidExpense 
                    ? `Comprovante: R$ ${Number(monthPaidExpense.amount).toFixed(2)} registrado em ${monthPaidExpense.date}` 
                    : `Parcela: ${Number(installmentAmount || debt.installmentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • Vencimento dia ${dueDay}`}
                </p>
              </div>
            </div>

            {isPaidThisMonth ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Remover o status de "PAGO" da parcela de "${debt.title}" em ${selectedMonth}?\n\nEla voltará a constar como pendente/a pagar neste mês e o saldo devedor será restaurado.`)) {
                    await unpayDebtInstallment(debt.id, selectedMonth);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Remover baixa de pagamento deste mês"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Remover "Pago"</span>
              </button>
            ) : !isSettled ? (
              <button
                type="button"
                onClick={async () => {
                  const day = debt.dueDay || 10;
                  const parts = (selectedMonth || '').split('-');
                  const targetDate = parts.length >= 2 ? `${parts[0]}-${parts[1]}-${String(day).padStart(2, '0')}` : undefined;
                  await payDebtInstallment(debt.id, undefined, targetDate);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar como Pago</span>
              </button>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Título do Contrato / Dívida</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Financiamento Carreta Randon, IPVA Caminhão"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Credor / Beneficiário</label>
              <input
                type="text"
                value={creditor}
                onChange={e => setCreditor(e.target.value)}
                placeholder="Ex: Banco BV, Tio Clebinho, Sefaz"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="financiamento_caminhao">Financiamento Cavalo / Caminhão</option>
                <option value="financiamento_carreta">Financiamento Carreta Randon</option>
                <option value="debito_diesel">Parcelamento Débito Diesel</option>
                <option value="ipva">IPVA / Licenciamento</option>
                <option value="emprestimo">Empréstimo Familiar / Terceiros</option>
                <option value="outros">Outros Débitos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalOriginalAmount}
                onChange={e => setTotalOriginalAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Total de Parcelas</label>
              <input
                type="number"
                required
                value={totalInstallments}
                onChange={e => setTotalInstallments(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Parcelas Já Pagas</label>
              <input
                type="number"
                value={paidInstallments}
                onChange={e => setPaidInstallments(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mês da 1ª Parcela</label>
              <input
                type="month"
                required
                value={startMonth}
                onChange={e => setStartMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor da Parcela (R$)</label>
              <input
                type="number"
                step="0.01"
                value={installmentAmount}
                onChange={e => setInstallmentAmount(e.target.value)}
                placeholder={calculatedInstallment ? calculatedInstallment.toFixed(2) : 'Calculado auto'}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-purple-400 font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Dica visual de vigência do parcelamento */}
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
            <span className="font-bold">Cronograma de Boletos: </span>
            <span>
              {Math.max(1, numInstallments - numPaid)} boletos de {calculatedInstallment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
              O parcelamento será exibido estritamente a partir de {startMonth} até o término das parcelas.
            </span>
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
              className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all"
            >
              {debt ? 'Salvar Alterações' : 'Cadastrar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
