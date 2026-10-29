import React, { useState, useEffect } from 'react';
import { useTruck } from '../../context/TruckContext';
import { useFreights } from '../../context/FreightContext';
import { X, Zap, Calendar, Gauge, Truck, Fuel, Settings2, CheckCircle2, Clock } from 'lucide-react';

interface QuickFuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const QuickFuelingModal: React.FC<QuickFuelingModalProps> = ({
  isOpen,
  onClose,
  onOpenConfig,
}) => {
  const { defaultFuelingConfig, createDefaultFueling, truck } = useTruck();
  const { freights } = useFreights();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentKm, setCurrentKm] = useState<number | string>('');
  const [freightId, setFreightId] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setCurrentKm('');
      setFreightId('');
      setStatus(defaultFuelingConfig?.status || 'pago');
    }
  }, [isOpen, defaultFuelingConfig]);

  if (!isOpen) return null;

  const liters = defaultFuelingConfig?.liters || 300;
  const pricePerLiter = defaultFuelingConfig?.pricePerLiter || 5.89;
  const totalAmount = liters * pricePerLiter;
  const tank = defaultFuelingConfig?.tank || 'principal_600';
  const tankLabel =
    tank === 'principal_600'
      ? 'Tanque Principal (600L)'
      : tank === 'auxiliar_300'
      ? 'Tanque Auxiliar (300L)'
      : 'Ambos os Tanques (900L)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await createDefaultFueling({
        date,
        currentKm: currentKm !== '' && !isNaN(Number(currentKm)) ? Number(currentKm) : 0,
        freightId: freightId || undefined,
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lançar Abastecimento Padrão</h2>
              <p className="text-xs text-slate-400">Lançamento rápido em 1 clique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Padrão Atual */}
        <div className="mb-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              Configuração Padrão
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConfig();
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
            >
              <Settings2 className="w-3 h-3" />
              Alterar padrão
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="font-mono text-xl font-bold text-amber-400">
              {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {liters.toFixed(1)} L × R$ {pricePerLiter.toFixed(3)}/L
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              {tankLabel}
            </span>
            {defaultFuelingConfig?.city && (
              <span>• {defaultFuelingConfig.city}/{defaultFuelingConfig.state}</span>
            )}
            {defaultFuelingConfig?.notes && (
              <span>• {defaultFuelingConfig.notes}</span>
            )}
          </div>
        </div>

        {/* Form para escolher data, odômetro e frete */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {/* Data do Abastecimento */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Data do Abastecimento
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Odômetro */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                Odômetro do Caminhão (KM)
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
            </label>
            <input
              type="number"
              value={currentKm}
              onChange={e => setCurrentKm(e.target.value)}
              placeholder={truck?.currentKm ? `Opcional (Atual: ${truck.currentKm.toLocaleString('pt-BR')} km)` : "Opcional (Ex: 145000)"}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              KM atual registrado: {truck?.currentKm?.toLocaleString('pt-BR') || 0} km (deixe em branco se não quiser alterar)
            </span>
          </div>

          {/* Viagem / Frete Vinculado */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              Vincular a uma Viagem (Opcional)
            </label>
            <select
              value={freightId}
              onChange={e => setFreightId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Sem vínculo com frete (Avulso / Base)</option>
              {freights.map(f => (
                <option key={f.id} value={f.id}>
                  {f.code} ({f.originCity}/{f.originState} → {f.destCity}/{f.destState})
                </option>
              ))}
            </select>
          </div>

          {/* Status do Pagamento */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status do Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('pago')}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'pago'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('pendente')}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                  status === 'pendente'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? 'Lançando...' : 'Confirmar e Lançar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
