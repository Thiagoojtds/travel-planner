import React, { useState } from 'react';
import { CreditCardInvoice, CreditCardInvoiceItem, ExpenseCategory } from '../../types';
import { useFinance } from '../../context/FinanceContext';
import { 
  X, 
  CreditCard, 
  Calendar, 
  Tag, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Layers,
  RotateCcw,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface CreditCardInvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: CreditCardInvoice | null;
  onAddNewPurchase?: (cardName: string, month: string, dueDate: string) => void;
}

export const CreditCardInvoiceDetailsModal: React.FC<CreditCardInvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onAddNewPurchase,
}) => {
  const { payInvoice, unpayInvoice, deleteInvoiceItem, deleteInvoice, addInvoiceItem, invoices } = useFinance();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Estado para formulário direto de adicionar compra nesta fatura
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState<ExpenseCategory>('manutencao');
  const [purchaseAmount, setPurchaseAmount] = useState<number | string>('');
  const [purchaseInstallments, setPurchaseInstallments] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  // Busca sempre os dados mais recentes da fatura a partir do contexto
  const liveInvoice = invoices.find(i => i.id === invoice.id) || invoice;
  const items = liveInvoice.items || [];
  const totalAmount = liveInvoice.totalAmount !== undefined 
    ? liveInvoice.totalAmount 
    : items.reduce((sum, item) => sum + item.amount, 0);

  const isPaid = liveInvoice.status === 'pago';

  const categoryLabels: Record<string, string> = {
    combustivel: 'Combustível',
    manutencao: 'Manutenção',
    alimentacao_estadia: 'Alimentação/Estadia',
    arla32: 'Arla 32',
    borracharia: 'Borracharia',
    pedagio: 'Pedágio',
    taxas_impostos: 'Taxas',
    seguro: 'Seguro',
    outros: 'Outros',
  };

  const handleToggleStatus = async () => {
    if (isPaid) {
      if (window.confirm(`Estornar o pagamento da fatura "${liveInvoice.cardName}" (${liveInvoice.month}) para Pendente?`)) {
        await unpayInvoice(liveInvoice.id);
      }
    } else {
      await payInvoice(liveInvoice.id);
    }
  };

  const handleDeleteItem = async (item: CreditCardInvoiceItem) => {
    if (item.totalInstallments > 1 && item.parentPurchaseId) {
      const choice = window.confirm(
        `A compra "${item.description}" foi parcelada em ${item.totalInstallments}x.\n\n` +
        `Clique em OK para excluir TODAS as parcelas desta compra (inclusive nos próximos meses).\n` +
        `Clique em Cancelar para manter as outras parcelas e cancelar a exclusão.`
      );
      if (choice) {
        await deleteInvoiceItem(item.id, true);
      }
    } else {
      if (window.confirm(`Remover a compra "${item.description}" desta fatura?`)) {
        await deleteInvoiceItem(item.id, false);
      }
    }
  };

  const handleDeleteEntireInvoice = async () => {
    if (window.confirm(`Tem certeza que deseja excluir toda a fatura "${liveInvoice.cardName}" de ${liveInvoice.month} e seus lançamentos financeiros?`)) {
      await deleteInvoice(liveInvoice.id);
      onClose();
    }
  };

  const handleAddPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseDescription.trim()) {
      alert('Por favor, informe a descrição da compra.');
      return;
    }

    const val = Number(purchaseAmount);
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor válido para a compra.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addInvoiceItem(liveInvoice.id, {
        description: purchaseDescription.trim(),
        category: purchaseCategory,
        totalAmount: val,
        totalInstallments: Math.max(1, Number(purchaseInstallments) || 1),
        purchaseDate: purchaseDate || liveInvoice.dueDate,
        notes: purchaseNotes.trim() || undefined,
      });

      // Limpa os campos e fecha o formulário inline
      setPurchaseDescription('');
      setPurchaseAmount('');
      setPurchaseInstallments(1);
      setPurchaseNotes('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setIsAddingPurchase(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numInst = Math.max(1, Number(purchaseInstallments) || 1);
  const numTot = Number(purchaseAmount) || 0;
  const instVal = numTot > 0 ? numTot / numInst : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-8 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Fatura: {liveInvoice.cardName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                  isPaid 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  <span>{isPaid ? 'Fatura Paga' : 'A Pagar'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Mês: <strong className="text-slate-300">{liveInvoice.month}</strong></span>
                <span>•</span>
                <span>Vencimento: <strong className="text-slate-300">{liveInvoice.dueDate}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo da Fatura & Ações Rápidas */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Desta Fatura
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-indigo-400 mt-0.5">
              {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {items.length} compra(s) ou parcela(s) inclusa(s)
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${
                isPaid
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300'
              }`}
            >
              {isPaid ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isPaid ? 'Estornar Pagamento' : 'Pagar Fatura'}</span>
            </button>

            <button
              onClick={() => setIsAddingPurchase(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 border ${
                isAddingPurchase
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {isAddingPurchase ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAddingPurchase ? 'Fechar Inclusão' : '+ Incluir Nova Compra'}</span>
            </button>
          </div>
        </div>

        {/* Formulário Inline para Incluir Compra Nesta Fatura */}
        {isAddingPurchase && (
          <form 
            onSubmit={handleAddPurchaseSubmit}
            className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 mb-4 space-y-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Incluir Compra nesta Fatura ({liveInvoice.cardName} • {liveInvoice.month})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Não cria nova fatura, adiciona direto nesta
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Descrição da Compra *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={purchaseDescription}
                  onChange={e => setPurchaseDescription(e.target.value)}
                  placeholder="Ex: Peças para freio, Combustível Graal, Troca de óleo..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={purchaseCategory}
                  onChange={e => setPurchaseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="manutencao">Manutenção</option>
                  <option value="combustivel">Combustível</option>
                  <option value="arla32">Arla 32</option>
                  <option value="borracharia">Borracharia</option>
                  <option value="alimentacao_estadia">Alimentação/Estadia</option>
                  <option value="pedagio">Pedágio</option>
                  <option value="taxas_impostos">Taxas/Impostos</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Data da Compra
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Valor Total da Compra (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={purchaseAmount}
                  onChange={e => setPurchaseAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Parcelamento
                </label>
                <select
                  value={purchaseInstallments}
                  onChange={e => setPurchaseInstallments(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1x (À Vista)</option>
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

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                  placeholder="Ex: NF 1234, garantia 90 dias..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Informação explicativa quando for parcelada */}
            {numInst > 1 && numTot > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>
                  <strong>{numInst}x de {instVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>: A 1ª parcela entra nesta fatura ({liveInvoice.month}) e as próximas {numInst - 1} parcelas serão distribuídas nos meses seguintes automaticamente.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-500/20">
              <button
                type="button"
                onClick={() => setIsAddingPurchase(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Salvando...' : 'Adicionar à Fatura'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Lista de Compras Inclusas na Fatura */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <div className="text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
            <span>Compras Inclusas nesta Fatura:</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Compras com parcelas futuras continuam nos meses seguintes
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
              Nenhuma compra cadastrada nesta fatura ainda.
            </div>
          ) : (
            items.map((item) => {
              const catName = categoryLabels[item.category] || item.category;
              const isParcelada = item.totalInstallments > 1;

              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {item.description}
                      </span>

                      {/* Badge da Categoria */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {catName}
                      </span>

                      {/* Badge de Parcelamento */}
                      {isParcelada ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Parcela {item.currentInstallment}/{item.totalInstallments}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400">
                          À Vista
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Compra em: <strong>{item.purchaseDate}</strong></span>
                      {isParcelada && item.totalAmount && (
                        <>
                          <span>•</span>
                          <span>
                            Total da compra: <strong className="text-slate-300">{item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                          </span>
                        </>
                      )}
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-400">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono text-sm sm:text-base font-bold text-indigo-400">
                        {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        nesta fatura
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={isParcelada ? "Excluir compra / parcelas" : "Remover compra"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer do Modal */}
        <div className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between shrink-0">
          <button
            onClick={handleDeleteEntireInvoice}
            className="text-xs text-rose-400/80 hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir fatura inteira</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
