import React, { useState, useEffect } from 'react';
import { useTruck } from '../../context/TruckContext';
import { useFreights } from '../../context/FreightContext';
import { Fueling, FuelTankType } from '../../types';
import { X, Fuel, MapPin, Gauge, CheckCircle2, Clock } from 'lucide-react';

interface FuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelingToEdit?: Fueling | null;
}

export const FuelingModal: React.FC<FuelingModalProps> = ({ isOpen, onClose, fuelingToEdit }) => {
  const { addFueling, updateFueling, truck, defaultFuelingConfig } = useTruck();
  const { freights } = useFreights();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentKm, setCurrentKm] = useState<number | string>('');
  const [liters, setLiters] = useState<number | string>(300);
  const [pricePerLiter, setPricePerLiter] = useState<number | string>(5.99);
  const [tank, setTank] = useState<FuelTankType>('principal_600');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [freightId, setFreightId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (fuelingToEdit) {
      setDate(fuelingToEdit.date);
      setCurrentKm(fuelingToEdit.currentKm || '');
      setLiters(fuelingToEdit.liters);
      setPricePerLiter(fuelingToEdit.pricePerLiter);
      setTank(fuelingToEdit.tank || 'principal_600');
      setStatus(fuelingToEdit.status || 'pago');
      setCity(fuelingToEdit.city || '');
      setState(fuelingToEdit.state || '');
      setFreightId(fuelingToEdit.freightId || '');
      setNotes(fuelingToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCurrentKm('');
      setLiters(defaultFuelingConfig?.liters || 300);
      setPricePerLiter(defaultFuelingConfig?.pricePerLiter || 5.99);
      setTank('principal_600');
      setStatus(defaultFuelingConfig?.status || 'pago');
      setCity(defaultFuelingConfig?.city || '');
      setState(defaultFuelingConfig?.state || '');
      setFreightId('');
      setNotes(defaultFuelingConfig?.notes || '');
    }
  }, [isOpen, fuelingToEdit, defaultFuelingConfig]);

  if (!isOpen) return null;

  const numLiters = Number(liters) || 0;
  const numPrice = Number(pricePerLiter) || 0;
  const totalAmount = numLiters * numPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date,
      currentKm: currentKm !== '' && !isNaN(Number(currentKm)) ? Number(currentKm) : 0,
      liters: numLiters,
      pricePerLiter: numPrice,
      totalAmount,
      tank,
      status,
      city: city || undefined,
      state: state ? state.toUpperCase() : undefined,
      freightId: freightId || undefined,
      notes: notes || undefined,
    };

    if (fuelingToEdit) {
      await updateFueling(fuelingToEdit.id, payload);
    } else {
      await addFueling(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {fuelingToEdit ? 'Editar Abastecimento de Diesel' : 'Novo Abastecimento de Diesel'}
              </h2>
              <p className="text-xs text-slate-400">Iveco Stralis • Tanque Duplo (900L Total)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1 pb-1">
          {/* Seleção do Tanque */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Tanque Abastecido</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'principal_600', label: 'Principal (600L)', desc: 'Tanque Primário (Padrão)' },
                { id: 'auxiliar_300', label: 'Auxiliar (300L)', desc: 'Tanque Suplementar' },
                { id: 'ambos', label: 'Ambos (900L)', desc: 'Abastecimento Completo' },
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

          {/* Odômetro e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Odômetro Atual (KM)</span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={currentKm}
                  onChange={e => setCurrentKm(e.target.value)}
                  placeholder={truck?.currentKm ? `Opcional (Atual: ${truck.currentKm.toLocaleString('pt-BR')} km)` : "Opcional (Ex: 145000)"}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <Gauge className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Litros, Preço por Litro e Total */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Litros</label>
              <input
                type="number"
                step="0.01"
                required
                value={liters}
                onChange={e => setLiters(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preço / Litro (R$)</label>
              <input
                type="number"
                step="0.001"
                required
                value={pricePerLiter}
                onChange={e => setPricePerLiter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Total Calculado</label>
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {/* Status do Pagamento (Pago / Pendente) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status do Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pago')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  status === 'pago'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pago</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  status === 'pendente'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </button>
            </div>
            {status === 'pendente' && (
              <p className="text-[11px] text-amber-400/90 mt-1.5">
                O abastecimento constará como despesa pendente a pagar no extrato financeiro.
              </p>
            )}
          </div>

          {/* Localização (Cidade / UF) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Cidade do Abastecimento</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: Registro, Campinas"
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
                placeholder="SP"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Vínculo com Frete Específico */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Vincular a uma Viagem / Frete (Opcional)</label>
            <select
              value={freightId}
              onChange={e => setFreightId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Nenhum vínculo (Custo geral de combustível)</option>
              {freights.map(f => (
                <option key={f.id} value={f.id}>
                  {f.code} • {f.originCity}/{f.originState} → {f.destCity}/{f.destState}
                </option>
              ))}
            </select>
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
            >
              {fuelingToEdit ? 'Salvar Alterações' : 'Registrar Diesel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
