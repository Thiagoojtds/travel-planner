import React from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, Fuel, ChevronLeft, ChevronRight, Calendar, RotateCcw, ArrowUpDown, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onNewFreight?: () => void;
  onNewFuel?: () => void;
  onNewTransaction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  onNewFreight, 
  onNewFuel,
  onNewTransaction 
}) => {
  const { selectedMonth, setSelectedMonth, setIsMobileMenuOpen } = useApp();

  const currentYearMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
  const isCurrentMonth = selectedMonth === currentYearMonth;

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(currentYearMonth);
  };

  const formattedMonth = (() => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1));
    } catch {
      return selectedMonth;
    }
  })();

  const renderMonthSelector = () => (
    <div className="flex items-center justify-center gap-2">
      {/* Month Selector */}
      <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-xl px-1.5 py-1 gap-1 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-200 capitalize min-w-[110px] sm:min-w-[130px] justify-center">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span className="truncate">{formattedMonth}</span>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Botão Voltar ao Mês Atual */}
      <button
        onClick={handleCurrentMonth}
        disabled={isCurrentMonth}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          isCurrentMonth
            ? 'bg-slate-800/30 text-slate-500 border border-slate-800/50 cursor-default opacity-40'
            : 'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 hover:text-sky-300 shadow-sm cursor-pointer'
        }`}
        title={isCurrentMonth ? 'Você já está no mês atual' : 'Voltar ao mês atual'}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mês Atual</span>
      </button>
    </div>
  );

  return (
    <header className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      {/* Visual Mobile (Layout Compacto em 2 Linhas) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        <div className="flex items-center justify-between gap-2">
          {/* Menu Hambúrguer + Título */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors active:scale-95"
              title="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-wide truncate">{title}</h1>
              <p className="text-[10px] text-slate-400 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Ações Rápidas Mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onNewTransaction && (
              <button
                onClick={onNewTransaction}
                className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 active:scale-95 transition-all"
                title="Nova Entrada / Saída"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            )}

            {onNewFuel && (
              <button
                onClick={onNewFuel}
                className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 active:scale-95 transition-all"
                title="Abastecer"
              >
                <Fuel className="w-4 h-4" />
              </button>
            )}

            {onNewFreight && (
              <button
                onClick={onNewFreight}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                title="Novo Frete"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-[11px]">Frete</span>
              </button>
            )}
          </div>
        </div>

        {/* Linha 2 Mobile: Filtro de Mês */}
        <div className="w-full flex justify-center pt-1 border-t border-slate-800/60">
          {renderMonthSelector()}
        </div>
      </div>

      {/* Visual Desktop (Grid 3 Colunas Perfeitamente Centralizado) */}
      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] lg:grid-cols-3 items-center gap-4">
        {/* Lado Esquerdo: Título & Subtítulo */}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white tracking-wide truncate">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
        </div>

        {/* Centro: Filtro de Mês Rigorosamente Centralizado */}
        <div className="justify-self-center">
          {renderMonthSelector()}
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center justify-end gap-2.5 flex-wrap justify-self-end">
          {onNewTransaction && (
            <button
              onClick={onNewTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Cadastrar nova entrada ou saída financeira"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Entrada / Saída</span>
            </button>
          )}

          {onNewFuel && (
            <button
              onClick={onNewFuel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Registrar abastecimento de diesel"
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Abastecer</span>
            </button>
          )}

          {onNewFreight && (
            <button
              onClick={onNewFreight}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all shadow-md shadow-sky-500/20 active:scale-95"
              title="Cadastrar novo frete"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Frete</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
