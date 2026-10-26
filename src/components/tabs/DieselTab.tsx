import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { Fueling } from '../../types';
import { FuelingModal } from '../modals/FuelingModal';
import { DefaultFuelingModal } from '../modals/DefaultFuelingModal';
import { QuickFuelingModal } from '../modals/QuickFuelingModal';
import { Fuel, PlusCircle, Trash2, Edit2, CheckCircle2, Clock, Settings, Zap } from 'lucide-react';
import { KpiCardSkeleton, TableRowsSkeleton } from '../common/LoadingSkeleton';

export const DieselTab: React.FC = () => {
  const { fuelings, deleteFueling, updateFueling, defaultFuelingConfig, isLoading } = useTruck();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [fuelingToEdit, setFuelingToEdit] = useState<Fueling | null>(null);

  const totalLiters = fuelings.reduce((sum, f) => sum + f.liters, 0);
  const totalSpent = fuelings.reduce((sum, f) => sum + f.totalAmount, 0);
  const pendingAmount = fuelings
    .filter(f => f.status === 'pendente')
    .reduce((sum, f) => sum + f.totalAmount, 0);
  const avgPrice = totalLiters > 0 ? totalSpent / totalLiters : 0;

  const defaultTotalAmount = (defaultFuelingConfig?.liters || 300) * (defaultFuelingConfig?.pricePerLiter || 5.89);
  const defaultTankLabel =
    defaultFuelingConfig?.tank === 'principal_600'
      ? 'Principal (600L)'
      : defaultFuelingConfig?.tank === 'auxiliar_300'
      ? 'Auxiliar (300L)'
      : 'Ambos os Tanques (900L)';

  const handleToggleStatus = async (fuel: Fueling) => {
    const nextStatus = fuel.status === 'pendente' ? 'pago' : 'pendente';
    await updateFueling(fuel.id, { status: nextStatus });
  };

  if (isLoading && fuelings.length === 0) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-4">
          <TableRowsSkeleton rows={5} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 transition-opacity duration-300 ${isLoading ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Total Abastecido</div>
          <div className="mt-1 font-mono text-xl font-bold text-white">
            {totalLiters.toFixed(1)} L
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Volume acumulado de diesel</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">Gasto Total com Diesel</div>
            {pendingAmount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pendente
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">
            {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {pendingAmount > 0 
              ? `${pendingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a pagar` 
              : '100% quitado'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Preço Médio / Litro</div>
          <div className="mt-1 font-mono text-xl font-bold text-white">
            {avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Média ponderada do diesel</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Capacidade dos Tanques</div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-400">
            900 Litros
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            600L (Principal) + 300L (Auxiliar)
          </div>
        </div>
      </div>

      {/* Banner de Abastecimento Padrão */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/80 border border-amber-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Abastecimento Padrão Configurado</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                defaultFuelingConfig?.status === 'pendente'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {defaultFuelingConfig?.status === 'pendente' ? 'Status: Pendente' : 'Status: Pago'}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-300">
              <strong className="text-amber-400 font-mono">{defaultFuelingConfig?.liters || 300} L</strong> a{' '}
              <strong className="text-white font-mono">R$ {(defaultFuelingConfig?.pricePerLiter || 5.89).toFixed(3)}/L</strong>{' '}
              (= <strong className="text-amber-400 font-mono">{defaultTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>) •{' '}
              <span className="text-slate-400">{defaultTankLabel}</span> •{' '}
              <span className="text-slate-400">{defaultFuelingConfig?.city}/{defaultFuelingConfig?.state}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => setIsQuickModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Lançar Padrão</span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Histórico de Abastecimentos</h2>
          <p className="text-xs text-slate-400">Controle por tanque duplo, status de pagamento e viagens</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 text-xs font-bold transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>Lançar Padrão</span>
          </button>

          <button
            onClick={() => {
              setFuelingToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Manual</span>
          </button>
        </div>
      </div>

      {/* Fueling List */}
      {fuelings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
          <Fuel className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Nenhum abastecimento registrado</p>
          <p className="text-xs text-slate-500 mt-1">Clique em "Novo Abastecimento" para lançar combustível.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fuelings.map(fuel => {
            const tankLabel = 
              fuel.tank === 'principal_600' ? 'Tanque Principal (600L)' :
              fuel.tank === 'auxiliar_300' ? 'Tanque Auxiliar (300L)' : 'Ambos os Tanques (900L)';

            const isPending = fuel.status === 'pendente';

            return (
              <div
                key={fuel.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {tankLabel}
                    </span>

                    {/* Status Badge Interativo */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(fuel)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                      title="Clique para alternar entre Pago e Pendente"
                    >
                      {isPending ? (
                        <>
                          <Clock className="w-2.5 h-2.5" />
                          <span>Pendente</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Pago</span>
                        </>
                      )}
                    </button>

                    {fuel.freight && (
                      <span className="font-mono text-xs font-bold text-sky-400">
                        Viagem: {fuel.freight.code}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {fuel.city ? `${fuel.city}/${fuel.state || ''}` : 'Abastecimento em Trânsito'}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Data: {fuel.date}</span>
                    <span>•</span>
                    <span className="font-mono">Odômetro: {fuel.currentKm.toLocaleString('pt-BR')} km</span>
                    {fuel.notes && (
                      <>
                        <span>•</span>
                        <span className="italic">{fuel.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-amber-400">
                      {fuel.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {fuel.liters.toFixed(1)} L × R$ {fuel.pricePerLiter.toFixed(3)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setFuelingToEdit(fuel);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Editar abastecimento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm('Excluir este abastecimento?')) {
                          deleteFueling(fuel.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Excluir abastecimento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FuelingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFuelingToEdit(null);
        }}
        fuelingToEdit={fuelingToEdit}
      />

      <DefaultFuelingModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      <QuickFuelingModal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />
    </div>
  );
};
