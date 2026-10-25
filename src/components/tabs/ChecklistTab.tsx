import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { ChecklistRecord } from '../../types';
import { ChecklistModal } from '../modals/ChecklistModal';
import { ClipboardCheck, PlusCircle, CheckCircle2, AlertTriangle, XCircle, Calendar, User } from 'lucide-react';

export const ChecklistTab: React.FC = () => {
  const { checklists } = useTruck();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Checklists Diários Pré-Viagem</h2>
          <p className="text-xs text-slate-400">Inspeção dos 6 itens vitais para liberação da saída do Iveco Stralis Randon</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Checklist Diário</span>
        </button>
      </div>

      {checklists.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800">
          <ClipboardCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Nenhum checklist registrado</p>
          <p className="text-xs text-slate-500 mt-1">Realize a inspeção diária antes de liberar o caminhão para viagem.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map(c => {
            const isApproved = c.status === 'aprovado';
            const isWarning = c.status === 'alerta';
            const isRejected = c.status === 'reprovado';

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Inspeção Diária</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isWarning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-3">
                    <span>Data: {c.date}</span>
                    <span>•</span>
                    <span className="font-mono">Odômetro: {c.truckKm.toLocaleString('pt-BR')} km</span>
                    <span>•</span>
                    <span>Inspetor: {c.driverName}</span>
                  </div>

                  {c.notes && (
                    <div className="text-[11px] text-slate-500 italic pt-0.5">
                      Obs: {c.notes}
                    </div>
                  )}
                </div>

                {/* Badges dos itens verificados */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                    c.oilLevel ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    Óleo: {c.oilLevel ? 'OK' : 'Baixo'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                    c.brakesOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    Freios: {c.brakesOk ? 'OK' : 'Falha'}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                    c.trailerCouplingRandon ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    Carreta Randon: {c.trailerCouplingRandon ? 'Travada' : 'Atenção'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChecklistModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
