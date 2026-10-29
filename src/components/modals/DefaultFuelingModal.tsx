import React, { useState, useEffect } from 'react';
import { useTruck } from '../../context/TruckContext';
import { FuelTankType } from '../../types';
import { X, Settings, Fuel, CheckCircle2, Clock } from 'lucide-react';

interface DefaultFuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DefaultFuelingModal: React.FC<DefaultFuelingModalProps> = ({ isOpen, onClose }) => {
  const { defaultFuelingConfig, updateDefaultFuelingConfig } = useTruck();

  const [liters, setLiters] = useState<number | string>(300);
  const [pricePerLiter, setPricePerLiter] = useState<number | string>(5.89);
  const [tank, setTank] = useState<FuelTankType>('principal_600');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [city, setCity] = useState('Curitiba');
  const [state, setState] = useState('PR');
  const [notes, setNotes] = useState('Abastecimento Padrão');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && defaultFuelingConfig) {
      setLiters(defaultFuelingConfig.liters);
      setPricePerLiter(defaultFuelingConfig.pricePerLiter);
      setTank(defaultFuelingConfig.tank && defaultFuelingConfig.tank !== 'ambos' ? defaultFuelingConfig.tank : 'principal_600');
      setStatus(defaultFuelingConfig.status);
      setCity(defaultFuelingConfig.city || 'Curitiba');
      setState(defaultFuelingConfig.state || 'PR');
      setNotes(defaultFuelingConfig.notes || 'Abastecimento Padrão');
    }
  }, [isOpen, defaultFuelingConfig]);

  if (!isOpen) return null;

  const numLiters = Number(liters) || 0;
  const numPrice = Number(pricePerLiter) || 0;
  const totalAmount = numLiters * numPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateDefaultFuelingConfig({
        liters: numLiters,
        pricePerLiter: numPrice,
        tank,
        status,
        city: city.trim() || undefined,
        state: state.trim() ? state.trim().toUpperCase() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Configurar Abastecimento Padrão</h2>
              <p className="text-xs text-slate-400">Modelo padrão para lançamentos rápidos e novos fretes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* Tanque Padrão */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanque Padrão</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'principal_600', label: 'Principal (600L)', desc: 'Tanque 1 (Padrão)' },
                { id: 'auxiliar_300', label: 'Auxiliar (300L)', desc: 'Tanque 2' },
                { id: 'ambos', label: 'Ambos (900L)', desc: 'Completo' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTank(t.id as FuelTankType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    tank === t.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Litros e Preço / Litro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Litros Padrão</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={liters}
                  onChange={e => setLiters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 pr-8"
                  placeholder="300"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">L</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preço Médio por Litro (R$)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  required
                  value={pricePerLiter}
                  onChange={e => setPricePerLiter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 pl-8"
                  placeholder="5.890"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">R$</span>
              </div>
            </div>
          </div>

          {/* Card de Valor Calculado */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Custo Total Padrão</span>
            </div>
            <div className="font-mono text-base font-bold text-amber-400">
              {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>

          {/* Status Inicial do Abastecimento */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status Padrão de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pago')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'pago'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pago Imediatamente</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'pendente'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pendente / A Pagar</span>
              </button>
            </div>
          </div>

          {/* Localização Padrão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Cidade do Posto</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: Curitiba"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={e => setState(e.target.value.toUpperCase())}
                placeholder="PR"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
            </div>
          </div>

          {/* Observações / Descrição Padrão */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Identificação / Observação Padrão</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Posto Padrão / Início de viagem"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configuração Padrão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
