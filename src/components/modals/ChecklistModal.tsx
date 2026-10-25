import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { X, ClipboardCheck, Check, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose }) => {
  const { addChecklist, truck } = useTruck();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [truckKm, setTruckKm] = useState<number | string>(truck?.currentKm || '');
  const [driverName, setDriverName] = useState(truck?.driverName || 'Motorista');
  const [oilLevel, setOilLevel] = useState(true);
  const [coolantLevel, setCoolantLevel] = useState(true);
  const [visibleLeaks, setVisibleLeaks] = useState(false);
  const [lightsAndTires, setLightsAndTires] = useState(true);
  const [brakesOk, setBrakesOk] = useState(true);
  const [trailerCouplingRandon, setTrailerCouplingRandon] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addChecklist({
      date,
      truckKm: Number(truckKm) || 0,
      driverName,
      oilLevel,
      coolantLevel,
      visibleLeaks,
      lightsAndTires,
      brakesOk,
      trailerCouplingRandon,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Novo Checklist Pré-Viagem</h2>
              <p className="text-xs text-slate-400">Inspeção diária dos itens de segurança do conjunto</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Odômetro Atual (KM)</label>
              <input
                type="number"
                required
                value={truckKm}
                onChange={e => setTruckKm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Motorista</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Lista de Itens do Checklist */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            {[
              {
                title: 'Nível do Óleo do Motor (Cursor)',
                checked: oilLevel,
                toggle: () => setOilLevel(!oilLevel),
                desc: 'Vareta entre mínimo e máximo',
              },
              {
                title: 'Fluído de Arrefecimento',
                checked: coolantLevel,
                toggle: () => setCoolantLevel(!coolantLevel),
                desc: 'Nível do reservatório de expansão',
              },
              {
                title: 'Vazamentos Visíveis (Óleo / Diesel / Água)',
                checked: !visibleLeaks,
                toggle: () => setVisibleLeaks(!visibleLeaks),
                desc: 'Sem poças ou gotejamento no pátio',
                invert: true,
              },
              {
                title: 'Faróis, Lanternas e Calibragem dos Pneus',
                checked: lightsAndTires,
                toggle: () => setLightsAndTires(!lightsAndTires),
                desc: 'Sistema de sinalização e sulcos dos pneus',
              },
              {
                title: 'Sistema de Freios e Cuícas',
                checked: brakesOk,
                toggle: () => setBrakesOk(!brakesOk),
                desc: 'Pressão do ar e lonas/pastilhas',
              },
              {
                title: 'Engate e Travamento da Carreta Randon',
                checked: trailerCouplingRandon,
                toggle: () => setTrailerCouplingRandon(!trailerCouplingRandon),
                desc: 'Quinta roda, pino rei e mangueiras de ar',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={item.toggle}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  item.checked
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{item.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    item.checked ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}
                >
                  {item.checked ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '✕'}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observações Pré-Viagem</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Pneu dianteiro direito calibrado a 110 psi"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
            >
              Concluir Checklist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
