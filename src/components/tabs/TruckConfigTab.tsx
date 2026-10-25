import React, { useState, useEffect } from 'react';
import { useTruck } from '../../context/TruckContext';
import { useAuth } from '../../context/AuthContext';
import { Truck, Settings, KeyRound, Save, Fuel, Gauge, DollarSign } from 'lucide-react';

export const TruckConfigTab: React.FC = () => {
  const { truck, updateTruck } = useTruck();
  const { changePin } = useAuth();

  const [plate, setPlate] = useState(truck?.plate || 'BRA2E19');
  const [model, setModel] = useState(truck?.model || 'Iveco Stralis');
  const [trailerModel, setTrailerModel] = useState(truck?.trailerModel || 'Carreta Randon');
  const [trailerPlate, setTrailerPlate] = useState(truck?.trailerPlate || 'ABC1D23');
  const [currentKm, setCurrentKm] = useState<number | string>(truck?.currentKm || 0);
  const [driverName, setDriverName] = useState(truck?.driverName || 'Motorista');
  const [driverTripPay, setDriverTripPay] = useState<number | string>(truck?.driverTripPay || 700);
  const [avgConsumption, setAvgConsumption] = useState<number | string>(truck?.avgConsumption || 2.2);
  const [oilChangeIntervalKm, setOilChangeIntervalKm] = useState<number | string>(truck?.oilChangeIntervalKm || 20000);
  const [monthlyTargetRevenue, setMonthlyTargetRevenue] = useState<number | string>(truck?.monthlyTargetRevenue || 35000);
  const [monthlyTargetProfit, setMonthlyTargetProfit] = useState<number | string>(truck?.monthlyTargetProfit || 12000);

  // Alteração de PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  useEffect(() => {
    if (truck) {
      setPlate(truck.plate);
      setModel(truck.model);
      setTrailerModel(truck.trailerModel);
      setTrailerPlate(truck.trailerPlate);
      setCurrentKm(truck.currentKm);
      setDriverName(truck.driverName);
      setDriverTripPay(truck.driverTripPay ?? 700);
      setAvgConsumption(truck.avgConsumption);
      setOilChangeIntervalKm(truck.oilChangeIntervalKm);
      setMonthlyTargetRevenue(truck.monthlyTargetRevenue);
      setMonthlyTargetProfit(truck.monthlyTargetProfit);
    }
  }, [truck]);

  const handleSaveTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateTruck({
      plate,
      model,
      trailerModel,
      trailerPlate,
      currentKm: Number(currentKm),
      driverName,
      driverTripPay: Number(driverTripPay),
      avgConsumption: Number(avgConsumption),
      oilChangeIntervalKm: Number(oilChangeIntervalKm),
      monthlyTargetRevenue: Number(monthlyTargetRevenue),
      monthlyTargetProfit: Number(monthlyTargetProfit),
    });
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    try {
      await changePin(currentPin, newPin);
      setPinMessage('PIN de acesso alterado com sucesso!');
      setCurrentPin('');
      setNewPin('');
    } catch (err: any) {
      setPinMessage(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Dados do Conjunto */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Configurações do Conjunto Operacional</h2>
            <p className="text-xs text-slate-400">Iveco Stralis & Carreta Randon</p>
          </div>
        </div>

        <form onSubmit={handleSaveTruck} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Modelo do Cavalo</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Placa do Cavalo</label>
              <input
                type="text"
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Semirreboque / Carreta</label>
              <input
                type="text"
                value={trailerModel}
                onChange={e => setTrailerModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Placa da Carreta</label>
              <input
                type="text"
                value={trailerPlate}
                onChange={e => setTrailerPlate(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white uppercase font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Odômetro Geral (KM)</label>
              <input
                type="number"
                value={currentKm}
                onChange={e => setCurrentKm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Intervalo Troca de Óleo (KM)</label>
              <input
                type="number"
                value={oilChangeIntervalKm}
                onChange={e => setOilChangeIntervalKm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Consumo Médio (km/L)</label>
              <input
                type="number"
                step="0.1"
                value={avgConsumption}
                onChange={e => setAvgConsumption(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Motorista Responsável</label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pagamento Motorista / Frete (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={driverTripPay}
                onChange={e => setDriverTripPay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-purple-500/40 text-xs font-bold text-purple-400 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">Padrão configurável (R$ 700)</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Capacidade de Tanque</label>
              <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400">
                600L Princ. + 300L Aux. (900L)
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>

      {/* Segurança & Troca de PIN */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Segurança & PIN de Acesso</h2>
            <p className="text-xs text-slate-400">Proteja as informações financeiras e operacionais do caminhão</p>
          </div>
        </div>

        <form onSubmit={handleChangePin} className="space-y-4 max-w-md">
          {pinMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium ${
              pinMessage.startsWith('Erro') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}>
              {pinMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">PIN Atual</label>
            <input
              type="password"
              maxLength={8}
              required
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value)}
              placeholder="Digite o PIN atual (padrão: 1234)"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Novo PIN (mínimo 4 dígitos)</label>
            <input
              type="password"
              maxLength={8}
              required
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              placeholder="Digite o novo PIN"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Atualizar PIN</span>
          </button>
        </form>
      </div>
    </div>
  );
};
