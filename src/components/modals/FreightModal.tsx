import React, { useState, useEffect } from 'react';
import { useFreights } from '../../context/FreightContext';
import { Freight, FreightWaypoint, RouteType } from '../../types';
import { addBusinessDays, getNextMonday } from '../../utils/dateUtils';
import { 
  X, 
  Sparkles, 
  Truck, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  ArrowLeftRight,
  Repeat,
  Plus,
  Trash2,
  Milestone,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface FreightModalProps {
  isOpen: boolean;
  onClose: () => void;
  freightToEdit?: Freight | null;
}

export const FreightModal: React.FC<FreightModalProps> = ({ isOpen, onClose, freightToEdit }) => {
  const { freights, addFreight, updateFreight } = useFreights();

  const [originCity, setOriginCity] = useState('Curitiba');
  const [originState, setOriginState] = useState('PR');
  const [destCity, setDestCity] = useState('São Paulo');
  const [destState, setDestState] = useState('SP');
  const [routeType, setRouteType] = useState<RouteType>('ida_volta');
  const [returnCity, setReturnCity] = useState('Curitiba');
  const [returnState, setReturnState] = useState('PR');
  const [waypoints, setWaypoints] = useState<FreightWaypoint[]>([]);

  const handleSwapRoute = () => {
    const prevOriginCity = originCity;
    const prevOriginState = originState;
    setOriginCity(destCity);
    setOriginState(destState);
    setDestCity(prevOriginCity);
    setDestState(prevOriginState);
    if (routeType === 'ida_volta') {
      setReturnCity(destCity);
      setReturnState(destState);
    }
  };

  const handleAddWaypoint = () => {
    setWaypoints(prev => [
      ...prev,
      {
        city: '',
        state: 'SP',
        arrivalDate: departureDate || new Date().toISOString().split('T')[0],
        departureDate: deliveryDate || new Date().toISOString().split('T')[0],
        notes: ''
      }
    ]);
  };

  const handleUpdateWaypoint = (index: number, field: keyof FreightWaypoint, value: string) => {
    setWaypoints(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  };

  const [client, setClient] = useState('');
  const [cargoType, setCargoType] = useState('Carga Seca');
  const [cargoWeightTons, setCargoWeightTons] = useState<number | string>(28);
  const [distanceKm, setDistanceKm] = useState<number | string>(840);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptDate, setReceiptDate] = useState('');
  const [grossValue, setGrossValue] = useState<number | string>(4500);
  const [advanceValue, setAdvanceValue] = useState<number | string>(3000);
  const [driverPay, setDriverPay] = useState<number | string>(700);
  const [status, setStatus] = useState<Freight['status']>('planejado');
  const [paymentStatus, setPaymentStatus] = useState<Freight['paymentStatus']>('pendente');
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');

  // Auto-generate unique code when cities, date or route changes if not editing existing
  useEffect(() => {
    if (!freightToEdit) {
      const cleanStr = (s?: string) => (s || 'XYZ').trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'VIA';
      const orig = cleanStr(originCity);
      const dest = cleanStr(destCity);
      const parts = (departureDate || '').split('-');
      const ym = parts.length >= 2 ? `${parts[0]}${parts[1]}` : '202610';
      const suffix = routeType === 'ida_volta' || !routeType ? '-RT' : '';
      const prefix = `FRT-${orig}-${dest}${suffix}-${ym}`;

      let seq = 1;
      let candidate = `${prefix}-${String(seq).padStart(2, '0')}`;
      while (freights.some(f => f.code === candidate)) {
        seq++;
        candidate = `${prefix}-${String(seq).padStart(2, '0')}`;
      }
      setCode(candidate);
    }
  }, [originCity, destCity, departureDate, routeType, freightToEdit, freights]);

  // Synchronize or reset form on open/edit
  useEffect(() => {
    if (!isOpen) return;

    if (freightToEdit) {
      setCode(freightToEdit.code);
      setOriginCity(freightToEdit.originCity);
      setOriginState(freightToEdit.originState);
      setDestCity(freightToEdit.destCity);
      setDestState(freightToEdit.destState);
      setRouteType(freightToEdit.routeType || 'ida_volta');
      setReturnCity(freightToEdit.returnCity || freightToEdit.originCity);
      setReturnState(freightToEdit.returnState || freightToEdit.originState);
      setWaypoints(
        Array.isArray(freightToEdit.waypoints)
          ? freightToEdit.waypoints
          : typeof freightToEdit.waypoints === 'string'
          ? JSON.parse(freightToEdit.waypoints || '[]')
          : []
      );
      setClient(freightToEdit.client);
      setCargoType(freightToEdit.cargoType);
      setCargoWeightTons(freightToEdit.cargoWeightTons);
      setDistanceKm(freightToEdit.distanceKm);
      setDepartureDate(freightToEdit.departureDate);
      setDeliveryDate(freightToEdit.deliveryDate);
      setReceiptDate(
        freightToEdit.receiptDate || 
        getNextMonday(freightToEdit.deliveryDate || freightToEdit.departureDate)
      );
      setGrossValue(freightToEdit.grossValue);
      setAdvanceValue(freightToEdit.advanceValue);
      setDriverPay(freightToEdit.driverPay ?? 700);
      setStatus(freightToEdit.status === 'entregue' ? 'finalizado' : freightToEdit.status);
      setPaymentStatus(freightToEdit.paymentStatus);
      setNotes(freightToEdit.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setOriginCity('Curitiba');
      setOriginState('PR');
      setDestCity('São Paulo');
      setDestState('SP');
      setRouteType('ida_volta');
      setReturnCity('Curitiba');
      setReturnState('PR');
      setWaypoints([]);
      setClient('');
      setCargoType('Carga Seca');
      setCargoWeightTons(28);
      setDistanceKm(840);
      setDepartureDate(today);
      setDeliveryDate(today);
      setReceiptDate(getNextMonday(today));
      setGrossValue(4500);
      setAdvanceValue(3000);
      setDriverPay(700);
      setStatus('planejado');
      setPaymentStatus('pendente');
      setNotes('');
    }
  }, [isOpen, freightToEdit]);

  const handleDepartureDateChange = (newDepartureDate: string) => {
    setDepartureDate(newDepartureDate);
    if (!freightToEdit && (!deliveryDate || deliveryDate < newDepartureDate)) {
      setDeliveryDate(newDepartureDate);
      setReceiptDate(getNextMonday(newDepartureDate));
    }
  };

  const handleDeliveryDateChange = (newDeliveryDate: string) => {
    setDeliveryDate(newDeliveryDate);
    if (newDeliveryDate) {
      setReceiptDate(getNextMonday(newDeliveryDate));
    }
  };

  if (!isOpen) return null;

  const numGross = Number(grossValue) || 0;
  const numAdvance = Number(advanceValue) || 0;
  const balanceDue = Math.max(0, numGross - numAdvance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      originCity,
      originState,
      destCity,
      destState,
      returnCity: routeType === 'so_ida' ? null : returnCity,
      returnState: routeType === 'so_ida' ? null : returnState,
      routeType,
      waypoints,
      client: client || 'Cliente Geral',
      cargoType,
      cargoWeightTons: Number(cargoWeightTons),
      distanceKm: Number(distanceKm),
      departureDate,
      deliveryDate,
      receiptDate: receiptDate || getNextMonday(deliveryDate || departureDate),
      grossValue: numGross,
      advanceValue: numAdvance,
      balanceDue,
      driverPay: Number(driverPay) || 700,
      status,
      paymentStatus,
      notes,
    };

    if (freightToEdit) {
      await updateFreight(freightToEdit.id, payload);
    } else {
      await addFreight(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl sm:rounded-2xl rounded-t-2xl bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-0 sm:my-6 max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {freightToEdit ? 'Editar Frete' : 'Novo Frete (Iveco Stralis Randon)'}
              </h2>
              <p className="text-xs text-slate-400">Circuito de ida e volta, paradas e controle de custos</p>
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
          {/* Código Gerado */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-400">Código da Viagem:</span>
              <span className="font-mono text-sm font-bold text-sky-400">{code}</span>
            </div>
            <span className="text-[11px] text-slate-500">Gerado automaticamente</span>
          </div>

          {/* Seletor de Tipo de Rota: Ida e Volta vs Só Ida */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/70 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white block">Formato do Percurso</span>
                <span className="text-[11px] text-slate-400">Ida e volta (circuito padrão) ou viagem direta</span>
              </div>
            </div>

            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRouteType('ida_volta');
                  if (Number(distanceKm) === 420) setDistanceKm(840);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  routeType === 'ida_volta'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ida e Volta (Circuito)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRouteType('so_ida');
                  if (Number(distanceKm) === 840) setDistanceKm(420);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  routeType === 'so_ida'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Só Ida
              </button>
            </div>
          </div>

          {/* Rota (Origem <-> Destino) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-end gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Origem (Cidade / UF)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={originCity}
                  onChange={e => {
                    setOriginCity(e.target.value);
                    if (routeType === 'ida_volta' && returnCity === originCity) {
                      setReturnCity(e.target.value);
                    }
                  }}
                  placeholder="Cidade"
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  required
                  value={originState}
                  onChange={e => {
                    const uf = e.target.value.toUpperCase();
                    setOriginState(uf);
                    if (routeType === 'ida_volta' && returnState === originState) {
                      setReturnState(uf);
                    }
                  }}
                  placeholder="UF"
                  maxLength={2}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Botão de Inversão de Rota */}
            <div className="flex justify-center md:pb-0.5">
              <button
                type="button"
                onClick={handleSwapRoute}
                title="Inverter Origem e Destino"
                className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-sky-500/60 hover:bg-sky-500/10 text-slate-400 hover:text-sky-300 transition-all shadow-sm flex items-center justify-center group"
              >
                <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destino Principal (Cidade / UF)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={destCity}
                  onChange={e => setDestCity(e.target.value)}
                  placeholder="Cidade"
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  required
                  value={destState}
                  onChange={e => setDestState(e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Cidades Intermediárias / Paradas da Rota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5 text-amber-400" />
                <span>Cidades Intermediárias / Paradas ({waypoints.length})</span>
              </label>
              <button
                type="button"
                onClick={handleAddWaypoint}
                className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/20 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Cidade/Parada</span>
              </button>
            </div>

            {waypoints.length > 0 && (
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                {waypoints.map((wp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
                    {/* Linha 1: Parada X, Cidade, UF e Lixeira */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1 shrink-0">
                        <Milestone className="w-3.5 h-3.5" />
                        Parada {idx + 1}:
                      </span>
                      <input
                        type="text"
                        required
                        value={wp.city}
                        onChange={e => handleUpdateWaypoint(idx, 'city', e.target.value)}
                        placeholder="Nome da Cidade (ex: Joinville)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                      <input
                        type="text"
                        required
                        value={wp.state}
                        onChange={e => handleUpdateWaypoint(idx, 'state', e.target.value.toUpperCase())}
                        placeholder="UF"
                        maxLength={2}
                        className="w-14 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveWaypoint(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover esta parada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Linha 2: Data de Parada e Data de Saída */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">
                          Data de Parada (Chegada)
                        </label>
                        <input
                          type="date"
                          value={wp.arrivalDate || ''}
                          onChange={e => handleUpdateWaypoint(idx, 'arrivalDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">
                          Data de Saída (Continuação)
                        </label>
                        <input
                          type="date"
                          value={wp.departureDate || ''}
                          onChange={e => handleUpdateWaypoint(idx, 'departureDate', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Linha 3: Motivo / Observação */}
                    <div>
                      <input
                        type="text"
                        value={wp.notes || ''}
                        onChange={e => handleUpdateWaypoint(idx, 'notes', e.target.value)}
                        placeholder="Observação da parada (ex: descarga parcial, coleta adicional, pernoite)"
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-750 text-[11px] text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cidade de Retorno do Circuito (Quando Ida e Volta) */}
          {routeType === 'ida_volta' && (
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-300 font-medium">
                  Retorno final do caminhão para:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={returnCity}
                  onChange={e => setReturnCity(e.target.value)}
                  placeholder="Cidade de Retorno"
                  className="w-40 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  required
                  value={returnState}
                  onChange={e => setReturnState(e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                  className="w-12 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white text-center uppercase focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Fita Visual do Itinerário */}
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] uppercase font-bold text-sky-400 shrink-0">Itinerário:</span>
            <div className="flex items-center gap-1.5 shrink-0 text-white font-medium">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">{originCity || 'Origem'}/{originState}</span>
              {waypoints.map((wp, i) => (
                <React.Fragment key={i}>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1">
                    <span>{wp.city || `Parada ${i+1}`}/{wp.state}</span>
                    {(wp.arrivalDate || wp.departureDate) && (
                      <span className="text-[10px] text-amber-200/80 font-mono">
                        ({wp.arrivalDate ? wp.arrivalDate.slice(5) : ''}{wp.arrivalDate && wp.departureDate ? ' → ' : ''}{wp.departureDate ? wp.departureDate.slice(5) : ''})
                      </span>
                    )}
                  </span>
                </React.Fragment>
              ))}
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">{destCity || 'Destino'}/{destState}</span>
              {routeType === 'ida_volta' && (
                <>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold flex items-center gap-1">
                    <RotateCcw className="w-2.5 h-2.5" />
                    {returnCity || originCity}/{returnState || originState}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Cliente, Carga e Distância */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cliente / Embarcador</label>
              <input
                type="text"
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="Ex: Bunge, Cargill"
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Peso (Toneladas)</label>
              <input
                type="number"
                step="0.1"
                value={cargoWeightTons}
                onChange={e => setCargoWeightTons(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Distância (KM)</label>
              <input
                type="number"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Datas (Saída, Chegada, Saldo Segunda Posterior) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data de Saída</label>
              <input
                type="date"
                required
                value={departureDate}
                onChange={e => handleDepartureDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Data de Chegada / Entrega</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={e => handleDeliveryDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recebimento do Saldo (Segunda posterior)</label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Valores Financeiros & Custo do Motorista (R$ 700) */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Valor Bruto (R$)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={grossValue}
                  onChange={e => setGrossValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adiantamento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceValue}
                  onChange={e => setAdvanceValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Saldo a Receber (R$)</label>
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-sky-400">
                  {balanceDue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Motorista Viagem (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={driverPay}
                  onChange={e => setDriverPay(e.target.value)}
                  placeholder="700.00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Status e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status da Viagem</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Freight['status'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="planejado">Planejado</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="finalizado">Finalizado (Aguardando Saldo)</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status do Pagamento</label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as Freight['paymentStatus'])}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="pendente">Pendente</option>
                <option value="parcial">Adiantamento Pago</option>
                <option value="pago">Quitado 100%</option>
              </select>
            </div>
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
              {freightToEdit ? 'Salvar Alterações' : 'Criar Frete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
