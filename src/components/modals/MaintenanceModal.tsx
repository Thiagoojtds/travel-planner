import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { MaintenanceCategory, MaintenanceType } from '../../types';
import { X, Wrench, Gauge, DollarSign } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ isOpen, onClose }) => {
  const { addMaintenance, truck } = useTruck();

  const [type, setType] = useState<MaintenanceType>('preventiva');
  const [category, setCategory] = useState<MaintenanceCategory>('oleo_filtros');
  const [description, setDescription] = useState('');
  const [maintenanceKm, setMaintenanceKm] = useState<number | string>(truck?.currentKm || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [workshop, setWorkshop] = useState('');
  const [partsCost, setPartsCost] = useState<number | string>('');
  const [laborCost, setLaborCost] = useState<number | string>('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const pCost = Number(partsCost) || 0;
  const lCost = Number(laborCost) || 0;
  const totalCost = pCost + lCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMaintenance({
      type,
      category,
      description,
      maintenanceKm: Number(maintenanceKm) || 0,
      date,
      workshop: workshop || undefined,
      partsCost: pCost,
      laborCost: lCost,
      totalCost,
      partsReplaced: partsReplaced || undefined,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registrar Manutenção</h2>
              <p className="text-xs text-slate-400">Iveco Stralis & Carreta Randon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('preventiva')}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                type === 'preventiva'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              Manutenção Preventiva
            </button>
            <button
              type="button"
              onClick={() => setType('corretiva')}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                type === 'corretiva'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              Manutenção Corretiva (Conserto)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as MaintenanceCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="oleo_filtros">Troca de Óleo e Filtros (20.000 km)</option>
                <option value="freios">Sistema de Freios (Cuícas / Lonas)</option>
                <option value="suspensao_randon">Suspensão Carreta Randon</option>
                <option value="pneus">Pneus / Rodízio / Alinhamento</option>
                <option value="motor">Motor / Injeção Eletrônica</option>
                <option value="eletrica">Elétrica / Iluminação</option>
                <option value="revisao_geral">Revisão Geral Preventiva</option>
              </select>
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

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descrição do Serviço</label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Troca de tambores de freio da carreta Randon"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Odômetro na Manutenção (KM)</label>
              <input
                type="number"
                required
                value={maintenanceKm}
                onChange={e => setMaintenanceKm(e.target.value)}
                placeholder="Ex: 154000"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Oficina / Mecânico</label>
              <input
                type="text"
                value={workshop}
                onChange={e => setWorkshop(e.target.value)}
                placeholder="Ex: Scania/Iveco Center, Posto Gaúcho"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Peças (R$)</label>
              <input
                type="number"
                step="0.01"
                value={partsCost}
                onChange={e => setPartsCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Mão de Obra (R$)</label>
              <input
                type="number"
                step="0.01"
                value={laborCost}
                onChange={e => setLaborCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Custo Total</label>
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-sky-400">
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Peças Substituídas / Detalhes</label>
            <input
              type="text"
              value={partsReplaced}
              onChange={e => setPartsReplaced(e.target.value)}
              placeholder="Ex: Lonas de freio Fras-le, Catracas de ajuste"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
            />
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
              Salvar Manutenção
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
