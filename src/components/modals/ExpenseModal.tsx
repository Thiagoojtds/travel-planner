import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useFreights } from '../../context/FreightContext';
import { Expense, ExpenseCategory, PaymentMethod, TransactionType } from '../../types';
import { X, Receipt, Tag, MapPin, DollarSign, CheckCircle2, Clock } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, expense }) => {
  const { addExpense, updateExpense } = useFinance();
  const { freights } = useFreights();

  const [type, setType] = useState<TransactionType>('saida');
  const [category, setCategory] = useState<ExpenseCategory>('pedagio');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tag_pedagio');
  const [freightId, setFreightId] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente' | 'recebido'>('pago');

  useEffect(() => {
    if (expense) {
      setType(expense.type || 'saida');
      setCategory(expense.category || (expense.type === 'entrada' ? 'outra_receita' : 'pedagio'));
      setDescription(expense.description || '');
      setAmount(expense.amount ?? '');
      setDate(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setPaymentMethod(expense.paymentMethod || 'pix');
      setFreightId(expense.freightId || '');
      setStatus((expense.status as any) || (expense.type === 'entrada' ? 'recebido' : 'pago'));
    } else {
      setType('saida');
      setCategory('pedagio');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('tag_pedagio');
      setFreightId('');
      setStatus('pago');
    }
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expense) {
      await updateExpense(expense.id, {
        type,
        category,
        description,
        amount: Number(amount) || 0,
        date,
        paymentMethod,
        freightId: freightId || undefined,
        status: status as any,
      });
    } else {
      await addExpense({
        type,
        category,
        description,
        amount: Number(amount) || 0,
        date,
        paymentMethod,
        freightId: freightId || undefined,
        status: status as any,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              type === 'saida' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {expense ? (type === 'saida' ? 'Editar Despesa' : 'Editar Entrada') : 'Lançamento Financeiro Avulso'}
              </h2>
              <p className="text-xs text-slate-400">Pedágio, alimentação, borracharia e despesas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* Tipo (Saída / Entrada) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setType('saida'); setCategory('pedagio'); if (status === 'recebido') setStatus('pago'); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                type === 'saida'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              Despesa / Saída (-)
            </button>
            <button
              type="button"
              onClick={() => { setType('entrada'); setCategory('outra_receita'); if (status === 'pago') setStatus('recebido'); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                type === 'entrada'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              Receita / Entrada (+)
            </button>
          </div>

          {/* Status do Pagamento (Permite remover o "Pago") */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus(type === 'entrada' ? 'recebido' : 'pago')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  status === 'pago' || status === 'recebido'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{type === 'entrada' ? 'Recebido' : 'Pago / Liquidado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  status === 'pendente'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
                title="Deixar pendente (remover o status pago)"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{type === 'entrada' ? 'Planejada (A Receber)' : 'Não Pago (Pendente)'}</span>
              </button>
            </div>
            {status === 'pendente' && (
              <p className="text-[11px] text-amber-400/90 mt-1">
                {type === 'saida' ? 'Esta despesa constará como NÃO PAGA na listagem.' : 'Esta entrada constará como PLANEJADA a receber.'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Pedágio Regis Bittencourt, Borracharia pneu estepe"
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
                {type === 'saida' ? (
                  <>
                    <option value="pedagio">Pedágio</option>
                    <option value="alimentacao_estadia">Alimentação / Estadia</option>
                    <option value="borracharia">Borracharia</option>
                    <option value="combustivel">Combustível</option>
                    <option value="arla32">Arla 32</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="pagamento_motorista">Pagamento Motorista</option>
                    <option value="taxas_impostos">Taxas e Impostos</option>
                    <option value="outros">Outros</option>
                  </>
                ) : (
                  <>
                    <option value="outra_receita">Outra Receita</option>
                    <option value="adiantamento">Adiantamento Frete</option>
                    <option value="frete">Saldo Frete</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="tag_pedagio">Tag Pedágio / Sem Parar</option>
                <option value="pix">PIX</option>
                <option value="cartao_frota">Cartão Frota</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Ex: 120.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Vínculo a Frete */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Vincular a uma Viagem (Opcional)</label>
            <select
              value={freightId}
              onChange={e => setFreightId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="">Sem vínculo com viagem</option>
              {freights.map(f => (
                <option key={f.id} value={f.id}>
                  {f.code} • {f.originCity} → {f.destCity}
                </option>
              ))}
            </select>
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
              {expense ? 'Salvar Alterações' : 'Registrar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
