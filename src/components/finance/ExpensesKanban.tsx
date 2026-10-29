import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Landmark, 
  Calendar, 
  Tag, 
  RotateCcw, 
  Pencil, 
  Trash2, 
  Layers, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import { UnifiedFinancialItem, formatDateDisplay } from './UnifiedFinancialList';

interface ExpensesKanbanProps {
  items: UnifiedFinancialItem[];
  onPayItem: (item: UnifiedFinancialItem) => Promise<void> | void;
  onUnpayItem: (item: UnifiedFinancialItem) => Promise<void> | void;
  onEditItem: (item: UnifiedFinancialItem) => void;
  onDeleteItem: (item: UnifiedFinancialItem) => void;
  onInspectInvoice: (item: UnifiedFinancialItem) => void;
  categoryFilter?: string;
  selectedMonth?: string;
}

type KanbanColumnId = 'a_vencer' | 'atrasadas' | 'pagas';

interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  subtitle: string;
  colorScheme: {
    border: string;
    bg: string;
    badgeBg: string;
    text: string;
    headerBg: string;
    glow: string;
  };
  icon: React.ComponentType<{ className?: string }>;
}

export const ExpensesKanban: React.FC<ExpensesKanbanProps> = ({
  items,
  onPayItem,
  onUnpayItem,
  onEditItem,
  onDeleteItem,
  onInspectInvoice,
  categoryFilter,
  selectedMonth,
}) => {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const isEntradaOnly = categoryFilter === 'entrada';

  // Categorização dos itens nas colunas do Kanban
  // Coluna 1: A Vencer / No Prazo (Pendentes que vencem hoje ou no futuro)
  // Coluna 2: Atrasadas (Pendentes com data < hoje)
  // Coluna 3: Pagas / Liquidadas (status pago/quitado/recebido)
  const columns: {
    config: KanbanColumnConfig;
    items: UnifiedFinancialItem[];
    totalAmount: number;
  }[] = [
    {
      config: {
        id: 'a_vencer',
        title: isEntradaOnly ? 'A Receber / No Prazo' : 'A Vencer / No Prazo',
        subtitle: isEntradaOnly ? 'Entradas planejadas vigentes' : 'Contas pendentes deste mês',
        colorScheme: {
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/5',
          badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          text: 'text-amber-400',
          headerBg: 'bg-gradient-to-r from-amber-500/15 to-transparent',
          glow: 'ring-amber-500/40 shadow-amber-500/10',
        },
        icon: Clock,
      },
      items: items.filter(item => {
        const isPaid = item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;
        if (isPaid) return false;
        // Se for hoje ou futuro
        return item.rawDate >= todayStr;
      }),
      totalAmount: 0,
    },
    {
      config: {
        id: 'atrasadas',
        title: isEntradaOnly ? 'Previsão Expirada' : 'Atrasadas / Urgentes',
        subtitle: isEntradaOnly ? 'Data prevista já ultrapassada' : 'Vencidas necessitando pagamento',
        colorScheme: {
          border: 'border-rose-500/40',
          bg: 'bg-rose-500/5',
          badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
          text: 'text-rose-400',
          headerBg: 'bg-gradient-to-r from-rose-500/15 to-transparent',
          glow: 'ring-rose-500/40 shadow-rose-500/10',
        },
        icon: AlertTriangle,
      },
      items: items.filter(item => {
        const isPaid = item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;
        if (isPaid) return false;
        // Se a data de vencimento for anterior a hoje
        return item.rawDate < todayStr;
      }),
      totalAmount: 0,
    },
    {
      config: {
        id: 'pagas',
        title: isEntradaOnly ? 'Recebidas em Conta' : 'Pagas / Liquidadas',
        subtitle: isEntradaOnly ? 'Receitas já creditadas' : 'Despesas já quitadas',
        colorScheme: {
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/5',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          text: 'text-emerald-400',
          headerBg: 'bg-gradient-to-r from-emerald-500/15 to-transparent',
          glow: 'ring-emerald-500/40 shadow-emerald-500/10',
        },
        icon: CheckCircle2,
      },
      items: items.filter(item => {
        return item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;
      }),
      totalAmount: 0,
    },
  ];

  // Calcula totais de cada coluna
  columns.forEach(col => {
    col.totalAmount = col.items.reduce((sum, item) => sum + item.amount, 0);
  });

  // Drag and Drop Handlers
  const handleDragStart = (item: UnifiedFinancialItem) => {
    setDraggedItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItemId) return;
    const item = items.find(i => i.id === draggedItemId);
    setDraggedItemId(null);
    if (!item) return;

    const isCurrentlyPaid = item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;

    if (targetColId === 'pagas' && !isCurrentlyPaid) {
      // Mover para pago
      try {
        setActionInProgressId(item.id);
        await onPayItem(item);
      } finally {
        setActionInProgressId(null);
      }
    } else if ((targetColId === 'a_vencer' || targetColId === 'atrasadas') && isCurrentlyPaid) {
      // Mover de pago de volta para pendente
      try {
        setActionInProgressId(item.id);
        await onUnpayItem(item);
      } finally {
        setActionInProgressId(null);
      }
    }
  };

  const handleQuickPay = async (item: UnifiedFinancialItem) => {
    try {
      setActionInProgressId(item.id);
      await onPayItem(item);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleQuickUnpay = async (item: UnifiedFinancialItem) => {
    try {
      setActionInProgressId(item.id);
      await onUnpayItem(item);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid de Colunas do Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {columns.map(column => {
          const { config, items: colItems, totalAmount } = column;
          const Icon = config.icon;
          const isDragTarget = dragOverColumn === config.id;

          return (
            <div
              key={config.id}
              onDragOver={e => handleDragOver(e, config.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={e => handleDrop(e, config.id)}
              className={`rounded-2xl border transition-all duration-150 flex flex-col min-h-[500px] ${
                config.colorScheme.bg
              } ${
                isDragTarget
                  ? `border-dashed border-2 ring-2 ${config.colorScheme.border} ${config.colorScheme.glow} scale-[1.01]`
                  : `${config.colorScheme.border} bg-slate-900/60 shadow-lg`
              }`}
            >
              {/* Header da Coluna */}
              <div className={`p-4 rounded-t-2xl border-b border-slate-800/80 ${config.colorScheme.headerBg}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.colorScheme.badgeBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                        {config.title}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${config.colorScheme.badgeBg}`}>
                    {colItems.length}
                  </span>
                </div>

                {/* Subtotal da Coluna */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60 mt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total da Coluna:
                  </span>
                  <span className={`font-mono text-sm font-bold ${config.colorScheme.text}`}>
                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[160px]">
                {colItems.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-slate-800 text-slate-500">
                    <Icon className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-xs font-medium">Nenhum lançamento</span>
                    <span className="text-[10px] opacity-60">Arraste um card até aqui</span>
                  </div>
                ) : (
                  colItems.map(item => {
                    const isFinanciamento = item.entityType === 'financiamento';
                    const isFaturaCartao = item.entityType === 'fatura_cartao';
                    const isEntrada = item.entityType === 'entrada';
                    const isFixa = item.entityType === 'fixa';
                    const isDespesa = item.entityType === 'despesa';
                    const isPaid = item.status === 'pago' || item.status === 'quitado' || item.status === 'recebido' || item.isPaidInMonth;
                    const isOverdue = !isPaid && item.rawDate < todayStr;
                    const isToday = !isPaid && item.rawDate === todayStr;
                    const isProcessing = actionInProgressId === item.id;

                    const dateInfo = formatDateDisplay(item.rawDate);

                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item)}
                        onDragEnd={handleDragEnd}
                        className={`group relative rounded-xl p-3.5 bg-slate-900/95 border transition-all cursor-grab active:cursor-grabbing hover:shadow-xl ${
                          isOverdue 
                            ? 'border-rose-500/30 hover:border-rose-500/60' 
                            : isToday
                            ? 'border-amber-500/40 hover:border-amber-500/70'
                            : isPaid
                            ? 'border-slate-800 hover:border-emerald-500/30'
                            : 'border-slate-800 hover:border-slate-700'
                        } ${draggedItemId === item.id ? 'opacity-40 scale-95' : 'opacity-100'} ${
                          isProcessing ? 'pointer-events-none opacity-60 animate-pulse' : ''
                        }`}
                      >
                        {/* Linha 1: Badges de Tipo e Vencimento */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight border flex items-center gap-1 ${
                            isFinanciamento 
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                            isFixa 
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' :
                            isFaturaCartao 
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' :
                            isEntrada 
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                              'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}>
                            {isFinanciamento && <Landmark className="w-3 h-3" />}
                            {isFixa && <Calendar className="w-3 h-3" />}
                            {isFaturaCartao && <CreditCard className="w-3 h-3" />}
                            {isEntrada && <TrendingUp className="w-3 h-3" />}
                            {isDespesa && <Tag className="w-3 h-3" />}
                            <span className="truncate max-w-[120px]">{item.categoryBadge}</span>
                          </span>

                          {/* Indicador de Vencimento / Urgência */}
                          {isPaid ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{item.status === 'quitado' ? 'Quitado' : 'Pago'}</span>
                            </span>
                          ) : isOverdue ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Vencido</span>
                            </span>
                          ) : isToday ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 animate-pulse">
                              Vence Hoje
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{dateInfo.day}/{dateInfo.monthName}</span>
                            </span>
                          )}
                        </div>

                        {/* Linha 2: Título e Subtítulo */}
                        <div className="space-y-1 mb-2.5">
                          <h4 className="text-xs font-bold text-white leading-tight line-clamp-2" title={item.title}>
                            {item.title}
                          </h4>
                          {item.subtitle && (
                            <p className="text-[11px] text-slate-400 leading-normal line-clamp-1" title={item.subtitle}>
                              {item.subtitle}
                            </p>
                          )}
                          {item.installmentInfo && (
                            <div className="flex items-center gap-1 text-[10px] text-purple-300 font-medium">
                              <Layers className="w-3 h-3 text-purple-400" />
                              <span>{item.installmentInfo}</span>
                            </div>
                          )}
                        </div>

                        {/* Linha 3: Valor e Vencimento Completo */}
                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60 mb-3">
                          <div className="text-[10px] text-slate-400">
                            Venc: <strong className="text-slate-300">{dateInfo.fullDate}</strong>
                          </div>
                          <div className={`font-mono text-sm sm:text-base font-extrabold ${
                            isEntrada ? 'text-emerald-400' :
                            isFinanciamento ? 'text-purple-400' :
                            isFixa ? 'text-sky-400' :
                            isFaturaCartao ? 'text-indigo-400' :
                            'text-rose-400'
                          }`}>
                            {isEntrada ? '+' : '-'} {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        </div>

                        {/* Linha 4: Ações do Card */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          {/* Ação Primária: Pagar ou Estornar */}
                          {isPaid ? (
                            <button
                              type="button"
                              onClick={() => handleQuickUnpay(item)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all border border-slate-700 active:scale-95 shadow-sm"
                              title="Estornar pagamento e voltar para pendente"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Estornar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickPay(item)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 ${
                                isEntrada
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                                  : isOverdue
                                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-rose-500/10'
                                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                              }`}
                              title={isEntrada ? "Confirmar recebimento" : "Marcar como pago"}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isEntrada ? 'Receber' : 'Pagar'}</span>
                            </button>
                          )}

                          {/* Ações Secundárias */}
                          <div className="flex items-center gap-1">
                            {isFaturaCartao && (
                              <button
                                type="button"
                                onClick={() => onInspectInvoice(item)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors"
                                title="Ver compras da fatura"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 transition-colors"
                              title="Editar registro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Indicador de arrasto no canto */}
                        <div className="absolute right-2 top-2 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
