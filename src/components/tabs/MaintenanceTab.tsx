import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { MaintenanceRecord } from '../../types';
import { MaintenanceModal } from '../modals/MaintenanceModal';
import { 
  Wrench, 
  PlusCircle, 
  Gauge, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  ShieldCheck, 
  Disc,
  Layers
} from 'lucide-react';

export const MaintenanceTab: React.FC = () => {
  const { maintenances, deleteMaintenance, truck, oilProgress, registerOilChange } = useTruck();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.totalCost, 0);

  const handleQuickOilChange = () => {
    const currentKm = truck?.currentKm || 0;
    const costStr = window.prompt(`Registrar troca de óleo aos ${currentKm} km.\nInforme o custo total (R$):`, '1800');
    if (costStr !== null) {
      const cost = parseFloat(costStr) || 0;
      registerOilChange(currentKm, cost);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas Preventivos por Odômetro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Óleo do Motor (20.000 km) */}
        <div className={`p-4 rounded-2xl border shadow-lg ${
          oilProgress.isCritical ? 'bg-rose-500/10 border-rose-500/30' :
          oilProgress.isWarning ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-slate-900/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-400" /> Óleo do Motor (Cursor)
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              20.000 KM
            </span>
          </div>

          <div className="my-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Uso: {oilProgress.percentage}%</span>
              <span className="font-mono font-bold text-white">
                {(oilProgress.remainingKm || 0).toLocaleString('pt-BR')} km rest.
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  oilProgress.isCritical ? 'bg-rose-500' :
                  oilProgress.isWarning ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${oilProgress.percentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleQuickOilChange}
            className="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            Registrar Troca aos {(truck?.currentKm || 0).toLocaleString('pt-BR')} km
          </button>
        </div>

        {/* Card Sistema de Freios */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-amber-400" /> Freios & Cuícas
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Conjunto
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Inspeção periódica de lonas, tambores e regulagem automática das catracas.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Sistema em Conformidade</span>
          </div>
        </div>

        {/* Card Suspensão Carreta Randon */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" /> Carreta Randon
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Semirreboque
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Verificação de feixes de molas, bolsas pneumáticas, pinos de balança e quinta roda.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Lubrificação e Buchas OK</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Histórico de Manutenções & Consertos</h2>
          <p className="text-xs text-slate-400">Registros de serviços preventivos e corretivos com peças e oficina</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all shadow-md shadow-sky-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Manutenção</span>
        </button>
      </div>

      {/* Maintenances List */}
      {maintenances.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
          <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Nenhuma manutenção registrada</p>
          <p className="text-xs text-slate-500 mt-1">Clique em "Nova Manutenção" para registrar preventivas ou consertos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {maintenances.map(m => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{m.description}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    m.type === 'preventiva' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {m.type === 'preventiva' ? 'Preventiva' : 'Corretiva'}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Oficina: {m.workshop || 'Interna / Pátio'} • Data: {m.date} • Odômetro: {m.maintenanceKm.toLocaleString('pt-BR')} km
                </div>

                {m.partsReplaced && (
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Peças: <span className="text-slate-300">{m.partsReplaced}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-sky-400">
                    {m.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Peças: R$ {m.partsCost.toFixed(2)} | MO: R$ {m.laborCost.toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Excluir registro de manutenção "${m.description}"?`)) {
                      deleteMaintenance(m.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaintenanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
