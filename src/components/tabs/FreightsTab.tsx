import React, { useState } from 'react';
import { useFreights } from '../../context/FreightContext';
import { useApp } from '../../context/AppContext';
import { Freight } from '../../types';
import { FreightModal } from '../modals/FreightModal';
import { KpiCardSkeleton, TableRowsSkeleton } from '../common/LoadingSkeleton';
import { 
  Truck, 
  PlusCircle, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Filter, 
  Receipt,
  UserCheck,
  Navigation,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Milestone,
  Target,
  LayoutList,
  CalendarRange
} from 'lucide-react';

interface WeekGroup {
  weekNum: number;
  label: string;
  startDateStr: string;
  endDateStr: string;
  startDay: number;
  endDay: number;
  freights: Freight[];
  totalGross: number;
  totalProfit: number;
  totalKm: number;
}

export const FreightsTab: React.FC = () => {
  const { freights, deleteFreight, updateFreight, isLoading } = useFreights();
  const { selectedMonth, setSelectedMonth } = useApp();

  const activeMonth = selectedMonth || new Date().toISOString().slice(0, 7);
  const [viewMode, setViewMode] = useState<'weeks' | 'list'>('weeks');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);

  const handleEdit = (f: Freight) => {
    setEditingFreight(f);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingFreight(null);
    setIsModalOpen(true);
  };

  const handleStartTrip = async (f: Freight) => {
    await updateFreight(f.id, {
      status: 'em_transito',
    });
  };

  const handleComplete = async (f: Freight) => {
    await updateFreight(f.id, {
      status: 'finalizado',
      paymentStatus: f.paymentStatus === 'pago' ? 'pago' : 'parcial',
    });
  };

  const handleSetStatus = async (f: Freight, newStatus: Freight['status']) => {
    const payload: Partial<Freight> = { status: newStatus };
    if ((newStatus === 'finalizado' || newStatus === 'entregue') && f.paymentStatus !== 'pago') {
      payload.paymentStatus = 'parcial';
    }
    await updateFreight(f.id, payload);
  };

  const handlePrevMonth = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = activeMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const formatMonthTitle = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Filtragem dos fretes pelo mês ativo
  const monthFreights = freights.filter(f => 
    (f.departureDate && f.departureDate.startsWith(activeMonth)) ||
    (!f.departureDate && f.deliveryDate && f.deliveryDate.startsWith(activeMonth))
  );
  
  // Fretes filtrados também pelo status escolhido
  const filteredMonthFreights = monthFreights.filter(f => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'finalizado') return f.status === 'finalizado' || f.status === 'entregue';
    return f.status === statusFilter;
  });

  // Cálculo das semanas do mês (Segunda a Domingo, mesclando pontas com menos de 4 dias para evitar semanas fantasmas de 1 ou 2 dias)
  const getWeeksOfMonth = (yearMonthStr: string, freightsInMonth: Freight[]): WeekGroup[] => {
    const [yStr, mStr] = yearMonthStr.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 1. Gera blocos preliminares de Segunda a Domingo
    const rawChunks: { startDay: number; endDay: number; days: number }[] = [];
    let currentDay = 1;
    while (currentDay <= daysInMonth) {
      const d = new Date(year, month - 1, currentDay);
      const dayOfWeek = (d.getDay() + 6) % 7; // 0 = Seg, 6 = Dom
      const daysToSunday = 6 - dayOfWeek;
      const weekEndDay = Math.min(daysInMonth, currentDay + daysToSunday);
      rawChunks.push({ startDay: currentDay, endDay: weekEndDay, days: weekEndDay - currentDay + 1 });
      currentDay = weekEndDay + 1;
    }

    // 2. Se a primeira semana tiver menos de 4 dias (ex: apenas domingo ou sex-dom), mescla com a seguinte
    if (rawChunks.length > 1 && rawChunks[0].days < 4) {
      rawChunks[1].startDay = rawChunks[0].startDay;
      rawChunks[1].days += rawChunks[0].days;
      rawChunks.shift();
    }

    // 3. Se a última semana tiver menos de 4 dias (ex: apenas segunda ou ter), mescla com a anterior
    if (rawChunks.length > 1 && rawChunks[rawChunks.length - 1].days < 4) {
      const last = rawChunks.pop()!;
      rawChunks[rawChunks.length - 1].endDay = last.endDay;
      rawChunks[rawChunks.length - 1].days += last.days;
    }

    return rawChunks.map((c, i) => {
      const weekIndex = i + 1;
      const startDateStr = `${yearMonthStr}-${String(c.startDay).padStart(2, '0')}`;
      const endDateStr = `${yearMonthStr}-${String(c.endDay).padStart(2, '0')}`;

      const weekFreights = freightsInMonth.filter(f => {
        const parts = (f.departureDate || '').split('-');
        const depDay = parseInt(parts[2] || '1', 10);
        return depDay >= c.startDay && depDay <= c.endDay;
      });

      const totalGross = weekFreights.reduce((acc, f) => acc + (f.grossValue || 0), 0);
      const totalProfit = weekFreights.reduce((acc, f) => {
        const driverPay = f.driverPay ?? 700;
        const fuelCost = f.fuelTotal ?? 0;
        const tollsCost = f.tollsTotal ?? 0;
        const totalCosts = f.totalTripCosts ?? (fuelCost + tollsCost + driverPay);
        return acc + (f.netProfit ?? (f.grossValue - totalCosts));
      }, 0);
      const totalKm = weekFreights.reduce((acc, f) => acc + (f.distanceKm || 0), 0);

      return {
        weekNum: weekIndex,
        label: `Semana ${weekIndex} (${String(c.startDay).padStart(2, '0')}/${mStr} a ${String(c.endDay).padStart(2, '0')}/${mStr})`,
        startDateStr,
        endDateStr,
        startDay: c.startDay,
        endDay: c.endDay,
        freights: weekFreights,
        totalGross,
        totalProfit,
        totalKm,
      };
    });
  };

  const weeks = getWeeksOfMonth(activeMonth, filteredMonthFreights);
  const totalTargetFreights = weeks.length * 3; // Previsão de 3 viagens por semana
  const monthFreightsCount = monthFreights.length;
  const monthProgressPct = Math.round((monthFreightsCount / (totalTargetFreights || 1)) * 100);
  const monthTotalRevenue = monthFreights.reduce((sum, f) => sum + (f.grossValue || 0), 0);
  const monthTotalProfit = monthFreights.reduce((sum, f) => {
    const driverPay = f.driverPay ?? 700;
    const fuelCost = f.fuelTotal ?? 0;
    const tollsCost = f.tollsTotal ?? 0;
    const totalCosts = f.totalTripCosts ?? (fuelCost + tollsCost + driverPay);
    return sum + (f.netProfit ?? (f.grossValue - totalCosts));
  }, 0);

  // Componente de Card de Frete Compacto
  const renderFreightCard = (f: Freight) => {
    const driverPay = f.driverPay ?? 700;
    const fuelCost = f.fuelTotal ?? 0;
    const tollsCost = f.tollsTotal ?? 0;
    const totalCosts = f.totalTripCosts ?? (fuelCost + tollsCost + driverPay);
    const realNetProfit = f.netProfit ?? (f.grossValue - totalCosts);

    return (
      <div
        key={f.id}
        className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm space-y-2"
      >
        {/* Linha 1: Identificação, Rota com Ida/Volta e Paradas, Status, Valores Principais e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Bloco Esquerda: Código + Rota + Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-bold text-sky-400 tracking-wide">
              {f.code}
            </span>

            {/* Rota com Suporte a Ida e Volta e Paradas */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{f.originCity} ({f.originState})</span>

              {f.waypoints && f.waypoints.length > 0 && f.waypoints.map((wp, i) => (
                <React.Fragment key={i}>
                  <span className="text-slate-500 font-normal">→</span>
                  <span className="text-amber-300 font-semibold">{wp.city} ({wp.state})</span>
                </React.Fragment>
              ))}

              <span className="text-slate-500 font-normal">
                {f.routeType === 'ida_volta' || !f.routeType ? '⇄' : '→'}
              </span>

              <span className="text-emerald-300">{f.destCity} ({f.destState})</span>

              {f.routeType === 'ida_volta' && f.returnCity && f.returnCity !== f.originCity && (
                <>
                  <span className="text-slate-500 font-normal">→</span>
                  <span className="text-sky-300 font-semibold">{f.returnCity} ({f.returnState})</span>
                </>
              )}
            </div>

            {/* Badges de Tipo de Rota */}
            {f.routeType === 'ida_volta' || !f.routeType ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20 flex items-center gap-1">
                <Repeat className="w-2.5 h-2.5" />
                Ida e Volta
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Só Ida
              </span>
            )}

            {f.waypoints && f.waypoints.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <Milestone className="w-2.5 h-2.5" />
                {f.waypoints.length} {f.waypoints.length === 1 ? 'parada' : 'paradas'}
              </span>
            )}

            {/* Seletor Interativo de Status */}
            <div className="relative inline-flex items-center">
              <select
                value={f.status}
                onChange={(e) => handleSetStatus(f, e.target.value as Freight['status'])}
                className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                  f.status === 'finalizado' || f.status === 'entregue' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' :
                  f.status === 'em_transito' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25' :
                  f.status === 'cancelado' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25' :
                  'bg-slate-700/50 text-slate-300 border border-slate-600/40 hover:bg-slate-700/80'
                }`}
                title="Clique para alterar status do frete"
              >
                <option value="planejado" className="bg-slate-900 text-slate-300">PLANEJADO</option>
                <option value="em_transito" className="bg-slate-900 text-sky-400">EM TRÂNSITO</option>
                <option value="finalizado" className="bg-slate-900 text-emerald-400">FINALIZADO</option>
                <option value="cancelado" className="bg-slate-900 text-rose-400">CANCELADO</option>
              </select>
              <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 pointer-events-none opacity-60 text-current" />
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              f.paymentStatus === 'pago' ? 'bg-emerald-500/10 text-emerald-400' :
              f.paymentStatus === 'parcial' ? 'bg-amber-500/10 text-amber-400' :
              'bg-rose-500/10 text-rose-400'
            }`}>
              {f.paymentStatus === 'pago' ? 'Quitado' : f.paymentStatus === 'parcial' ? 'Adiant. Pago' : 'Pgto Pendente'}
            </span>
          </div>

          {/* Bloco Direita: Valores Financeiros e Ações */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0 sm:ml-auto">
            {/* Resumo Financeiro Compacto */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Valor Bruto</span>
                <span className="font-mono text-xs sm:text-sm font-bold text-white">
                  {f.grossValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="pl-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 block leading-tight">Lucro Líquido</span>
                <span className={`font-mono text-xs sm:text-sm font-bold ${realNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {realNetProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              {/* Iniciar Viagem */}
              {f.status === 'planejado' && (
                <button
                  onClick={() => handleStartTrip(f)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-all shadow-sm shadow-sky-500/10"
                  title="Iniciar Viagem (mudar para Em Trânsito)"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Iniciar</span>
                </button>
              )}

              {/* Finalizar Viagem */}
              {f.status === 'em_transito' && (
                <button
                  onClick={() => handleComplete(f)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all shadow-sm shadow-emerald-500/10"
                  title="Finalizar Viagem"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Finalizar</span>
                </button>
              )}

              {/* Finalizar direto */}
              {f.status === 'planejado' && (
                <button
                  onClick={() => handleComplete(f)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-xs transition-all"
                  title="Marcar como Finalizado diretamente"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Finalizar</span>
                </button>
              )}

              {/* Voltar para Planejado */}
              {f.status === 'em_transito' && (
                <button
                  onClick={() => handleSetStatus(f, 'planejado')}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all"
                  title="Voltar para Planejado"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              {/* Reabrir Trânsito */}
              {(f.status === 'finalizado' || f.status === 'entregue') && (
                <button
                  onClick={() => handleSetStatus(f, 'em_transito')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-sky-300 text-xs transition-all"
                  title="Reabrir Trânsito"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reabrir</span>
                </button>
              )}

              {/* Editar */}
              <button
                onClick={() => handleEdit(f)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Editar frete"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {/* Excluir */}
              <button
                onClick={() => {
                  if (window.confirm(`Excluir frete ${f.code}?`)) {
                    deleteFreight(f.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="Excluir frete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Linha 2: Barra Detalhada Compacta (Cliente, Carga, Datas e Custos Vinculados) */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400">
          {/* Bloco 1: Operacional (Cliente, Carga, KM, Datas) */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span><strong className="text-slate-300">Cliente:</strong> {f.client}</span>
            <span className="text-slate-700">•</span>
            <span><strong className="text-slate-300">Carga:</strong> {f.cargoWeightTons}t ({f.cargoType})</span>
            <span className="text-slate-700">•</span>
            <span><strong className="text-slate-300">KM:</strong> {f.distanceKm} km</span>
            <span className="text-slate-700">•</span>
            <span>Saída: {f.departureDate} → Chegada: {f.deliveryDate}</span>
          </div>

          {/* Bloco 2: Custos Vinculados e Saldos da Viagem */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 font-sans">Diesel: </span>
              <span className="text-amber-400 font-semibold">{fuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div>
              <span className="text-slate-500 font-sans">Pedágio: </span>
              <span className="text-slate-300 font-semibold">{tollsCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div>
              <span className="text-slate-500 font-sans">Motorista: </span>
              <span className="text-purple-400 font-semibold">{driverPay.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div>
              <span className="text-slate-500 font-sans">Adiant: </span>
              <span className="text-emerald-400 font-semibold">{f.advanceValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            </div>
            <span className="text-slate-700">•</span>
            <div>
              <span className="text-slate-500 font-sans">Saldo: </span>
              <span className="text-sky-400 font-semibold">{f.balanceDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Linha 3: Paradas Intermediárias com Datas de Chegada e Saída */}
        {f.waypoints && f.waypoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px]">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 shrink-0">
              <Milestone className="w-3 h-3" />
              Paradas ({f.waypoints.length}):
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {f.waypoints.map((wp, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-slate-300">
                  <span className="font-semibold text-amber-300">{wp.city}/{wp.state}</span>
                  {(wp.arrivalDate || wp.departureDate) && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Chegada: {wp.arrivalDate || '-'} • Saída: {wp.departureDate || '-'})
                    </span>
                  )}
                  {wp.notes && (
                    <span className="text-[10px] text-slate-400 italic">
                      • {wp.notes}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && freights.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <TableRowsSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 transition-opacity duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
      {/* 1. Barra de Navegação do Mês & Meta de 3 Viagens/Semana */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Navegador de Mês */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">{formatMonthTitle(activeMonth)}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternador de Modo de Visualização (Por Semana vs Lista) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('weeks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                viewMode === 'weeks'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Por Semana</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                viewMode === 'list'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Lista Corrida</span>
            </button>
          </div>

          {/* Botão Novo Frete */}
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Frete (Iveco Stralis)</span>
          </button>
        </div>

        {/* Faixa de Acompanhamento da Meta Mensal (Previsão: 3 viagens/semana) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Card Meta de Fretes */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Meta de Viagens</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-base font-bold text-sky-400">{monthFreightsCount}</span>
                <span className="text-slate-500 font-mono">/ {totalTargetFreights} viagens</span>
                <span className="text-[10px] text-slate-400 ml-1">({weeks.length} sem × 3)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                {monthProgressPct}%
              </span>
            </div>
          </div>

          {/* Card Faturamento do Mês */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Faturamento em Fretes</span>
            <div className="font-mono text-base font-bold text-white mt-0.5">
              {monthTotalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Card Lucro Real do Mês */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lucro Líquido Real</span>
            <div className={`font-mono text-base font-bold mt-0.5 ${monthTotalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthTotalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filtros de Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Status:</span>
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'planejado', label: 'Planejados' },
              { id: 'em_transito', label: 'Em Trânsito' },
              { id: 'finalizado', label: 'Finalizados' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Exibindo <strong>{filteredMonthFreights.length}</strong> fretes em {formatMonthTitle(activeMonth)}
        </div>
      </div>

      {/* 3. Conteúdo Principal: Semanas vs Lista */}
      {viewMode === 'weeks' ? (
        <div className="space-y-4">
          {weeks.map(week => {
            const weekFreightsCount = week.freights.length;
            const weekTarget = 3;
            const weekPct = Math.round((weekFreightsCount / weekTarget) * 100);
            const isTargetMet = weekFreightsCount >= weekTarget;

            return (
              <div
                key={week.weekNum}
                className="rounded-2xl bg-slate-900/80 border border-slate-800/90 overflow-hidden shadow-lg transition-all"
              >
                {/* Header da Semana */}
                <div className="p-3.5 sm:p-4 bg-slate-950/60 border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
                  {/* Título da Semana e Meta */}
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border ${
                      isTargetMet
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : weekFreightsCount > 0
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{week.label}</span>
                        {/* Badge de Progresso da Meta */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isTargetMet
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : weekFreightsCount > 0
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                        }`}>
                          {weekFreightsCount} / {weekTarget} viagens ({weekPct}%)
                        </span>
                        {isTargetMet && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> Meta Atingida!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Previsão: 3 viagens por semana • Iveco Stralis Randon
                      </p>
                    </div>
                  </div>

                  {/* Totais da Semana */}
                  <div className="flex items-center gap-3.5 text-right ml-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block leading-tight">Receita Semanal</span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-white">
                        {week.totalGross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="pl-3 border-l border-slate-800">
                      <span className="text-[10px] text-slate-400 block leading-tight">Lucro Líquido</span>
                      <span className={`font-mono text-xs sm:text-sm font-bold ${week.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {week.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="pl-3 border-l border-slate-800 hidden md:block">
                      <span className="text-[10px] text-slate-400 block leading-tight">KM Rodados</span>
                      <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
                        {week.totalKm.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra Visual de Meta Semanal (3 Viagens) */}
                <div className="w-full bg-slate-950 h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isTargetMet
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : weekFreightsCount >= 2
                        ? 'bg-gradient-to-r from-sky-500 to-blue-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, (weekFreightsCount / weekTarget) * 100)}%` }}
                  />
                </div>

                {/* Lista de Fretes da Semana */}
                <div className="p-3 sm:p-3.5 space-y-2">
                  {week.freights.length === 0 ? (
                    <div className="py-5 text-center text-xs text-slate-500">
                      Nenhum frete registrado nesta semana. (Previsão de 6 fretes para o período)
                    </div>
                  ) : (
                    week.freights.map(f => renderFreightCard(f))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Modo Lista Corrida */
        <div className="space-y-2.5">
          {filteredMonthFreights.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
              <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">Nenhum frete encontrado em {formatMonthTitle(activeMonth)}</p>
              <p className="text-xs text-slate-500 mt-1">Clique em "Novo Frete" para registrar uma viagem.</p>
            </div>
          ) : (
            filteredMonthFreights.map(f => renderFreightCard(f))
          )}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <FreightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        freightToEdit={editingFreight}
      />
    </div>
  );
};
