import React, { useState } from 'react';
import { useTruck } from '../../context/TruckContext';
import { Calculator, ArrowRight, DollarSign, Fuel, ShieldAlert, Sparkles } from 'lucide-react';

export const SimulatorTab: React.FC = () => {
  const { truck } = useTruck();

  const [distanceKm, setDistanceKm] = useState<number | string>(550);
  const [dieselPrice, setDieselPrice] = useState<number | string>(5.99);
  const [avgConsumption, setAvgConsumption] = useState<number | string>(truck?.avgConsumption || 2.2);
  const [driverPay, setDriverPay] = useState<number | string>(truck?.driverTripPay || 700);
  const [tollsCost, setTollsCost] = useState<number | string>(180);
  const [otherExpenses, setOtherExpenses] = useState<number | string>(100);
  const [desiredProfit, setDesiredProfit] = useState<number | string>(2000);

  const dist = Number(distanceKm) || 0;
  const price = Number(dieselPrice) || 0;
  const cons = Number(avgConsumption) || 2.2;
  const driver = Number(driverPay) || 700;
  const tolls = Number(tollsCost) || 0;
  const other = Number(otherExpenses) || 0;
  const profit = Number(desiredProfit) || 0;

  // Cálculos
  const estimatedLiters = cons > 0 ? dist / cons : 0;
  const estimatedFuelCost = estimatedLiters * price;
  const totalTripCost = estimatedFuelCost + driver + tolls + other;
  const suggestedMinFreight = totalTripCost + profit;
  const costPerKm = dist > 0 ? totalTripCost / dist : 0;
  const freightPerKm = dist > 0 ? suggestedMinFreight / dist : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Simulador de Rentabilidade de Frete</h2>
            <p className="text-xs text-slate-400">
              Calcule custos de diesel, pedágio e motorista (R$ 700) antes de fechar a viagem
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parâmetros da Viagem */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Parâmetros da Rota
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Distância Ida (KM)</label>
              <input
                type="number"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Preço do Diesel (R$/L)</label>
                <input
                  type="number"
                  step="0.01"
                  value={dieselPrice}
                  onChange={e => setDieselPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Consumo Iveco (km/L)</label>
                <input
                  type="number"
                  step="0.1"
                  value={avgConsumption}
                  onChange={e => setAvgConsumption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Motorista (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={driverPay}
                  onChange={e => setDriverPay(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-purple-500/40 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pedágios (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tollsCost}
                  onChange={e => setTollsCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Outros (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={otherExpenses}
                  onChange={e => setOtherExpenses(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Margem de Lucro Desejada (R$)</label>
              <input
                type="number"
                step="0.01"
                value={desiredProfit}
                onChange={e => setDesiredProfit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-emerald-500/40 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Resultado da Simulação */}
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                <Sparkles className="w-4 h-4" />
                <span>Resultado Operacional Sugerido</span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Frete Mínimo Recomendado</div>
                <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                  {suggestedMinFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Preço por KM: <strong className="text-white font-mono">{freightPerKm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/km</strong>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Combustível ({estimatedLiters.toFixed(1)} L):</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {estimatedFuelCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Pagamento Motorista (Fixo):</span>
                  <span className="font-mono font-semibold text-purple-400">
                    {driver.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/60">
                  <span className="text-slate-400">Pedágios & Outros:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {(tolls + other).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-200">
                  <span>Custo Total Estimado da Viagem:</span>
                  <span className="font-mono text-rose-400">
                    {totalTripCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              💡 Garantindo este valor de frete, sobram exatamente{' '}
              <strong className="font-bold">{profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> de lucro líquido limpo no bolso.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
