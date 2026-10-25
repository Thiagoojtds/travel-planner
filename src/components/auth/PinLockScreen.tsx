import React, { useState } from 'react';
import { KeyRound, Truck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PinLockScreen: React.FC = () => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    const pinToSubmit = customPin || pin;
    if (!pinToSubmit) return;
    setLoading(true);
    setError(null);
    const success = await login(pinToSubmit);
    if (!success) {
      setError('PIN incorreto. Tente novamente.');
      setPin('');
    }
    setLoading(false);
  };

  const handleQuickDemoAccess = () => {
    setPin('1234');
    handleSubmit(undefined, '1234');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/80 border border-slate-700/60 p-6 shadow-2xl text-center">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/10">
          <Truck className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white tracking-wide">TransFrete Pro</h1>
        <p className="text-xs text-slate-400 mt-1">Gestão Operacional • Iveco Stralis Randon</p>

        {/* PIN Dots */}
        <div className="my-6">
          <div className="flex justify-center items-center gap-3 h-10">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  idx < pin.length
                    ? 'bg-sky-400 scale-125 shadow-md shadow-sky-400/50'
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700/40 text-lg font-semibold text-white transition-all duration-150 flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-xs font-medium text-slate-400 transition-colors flex items-center justify-center"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700/40 text-lg font-semibold text-white transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-sm font-medium text-slate-400 transition-colors flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading || pin.length < 4}
          className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-98"
        >
          <KeyRound className="w-4 h-4" />
          {loading ? 'Validando...' : 'Acessar Sistema'}
        </button>

        {/* Card de Acesso de Demonstração para Portfólio */}
        <div className="mt-5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400 text-left">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acesso Portfólio / Teste
            </span>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
            >
              Testar Agora (1234)
            </button>
          </div>
          <p className="text-slate-400 mt-1">
            Digite <strong className="text-amber-400 font-mono">1234</strong> para navegar livremente com dados simulados.
          </p>
        </div>
      </div>
    </div>
  );
};
