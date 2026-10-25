import React, { useState } from 'react';
import { CreditCardInvoice, CreditCardInvoiceItem } from '../../types';
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
  RotateCcw
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
  const { payInvoice, unpayInvoice, deleteInvoiceItem, deleteInvoice } = useFinance();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const items = invoice.items || [];
  const totalAmount = invoice.totalAmount !== undefined 
    ? invoice.totalAmount 
    : items.reduce((sum, item) => sum + item.amount, 0);

  const isPaid = invoice.status === 'pago';

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
      if (window.confirm(`Estornar o pagamento da fatura "${invoice.cardName}" (${invoice.month}) para Pendente?`)) {
        await unpayInvoice(invoice.id);
      }
    } else {
      await payInvoice(invoice.id);
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
    if (window.confirm(`Tem certeza que deseja excluir toda a fatura "${invoice.cardName}" de ${invoice.month} e seus lançamentos financeiros?`)) {
      await deleteInvoice(invoice.id);
      onClose();
    }
  };

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
                <h2 className="text-base font-bold text-white">Fatura: {invoice.cardName}</h2>
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
                <span>Mês: <strong className="text-slate-300">{invoice.month}</strong></span>
                <span>•</span>
                <span>Vencimento: <strong className="text-slate-300">{invoice.dueDate}</strong></span>
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

            {onAddNewPurchase && (
              <button
                onClick={() => {
                  onAddNewPurchase(invoice.cardName, invoice.month, invoice.dueDate);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Compra</span>
              </button>
            )}
          </div>
        </div>

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
