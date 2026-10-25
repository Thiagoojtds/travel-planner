import React, { useState } from 'react';
import { MonthlyEvolutionItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Calendar, 
  Check, 
  Sparkles, 
  LineChart, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FinancialEvolutionChartProps {
  data: MonthlyEvolutionItem[];
}

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({ data }) => {
  const { selectedMonth, setSelectedMonth, showToast } = useApp();
  const [viewMode, setViewMode] = useState<'lines' | 'bars'>('lines');
  const [periodMonths, setPeriodMonths] = useState<3 | 6 | 12>(3);
  const [activeSeries, setActiveSeries] = useState<{
    revenue: boolean;
    costs: boolean;
    profit: boolean;
  }>({
    revenue: true,
    costs: true,
    profit: true,
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleSelectMonth = (month: string, label: string) => {
    setSelectedMonth(month);
    showToast(`Dashboard filtrado para ${label}`, 'info');
  };

  if (!data || data.length === 0) {
    return null;
  }

  // Filtrar conforme o período escolhido (ex: últimos 3, 6 ou 12 meses)
  const visibleData = data.slice(-periodMonths);

  // Encontrar valores máximos e mínimos para dimensionamento do eixo Y
  const allValues: number[] = [];
  visibleData.forEach(d => {
    if (activeSeries.revenue) allValues.push(d.grossRevenue);
    if (activeSeries.costs) allValues.push(d.totalCosts);
    if (activeSeries.profit) allValues.push(d.netProfit);
  });

  const rawMax = Math.max(1000, ...allValues, 0);
  const rawMin = Math.min(0, ...allValues);

  // Escalar para valores arredondados limpos
  const yMax = Math.ceil(rawMax * 1.15 / 1000) * 1000;
  const yMin = rawMin < 0 ? Math.floor(rawMin * 1.15 / 1000) * 1000 : 0;
  const yRange = yMax - yMin || 1;

  // Dimensões do SVG proporcionais e padronizadas para perfeito alinhamento no grid
  const width = 900;
  const height = 150;
  const padding = { top: 18, right: 32, bottom: 28, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Função para converter valor em coordenada Y
  const getY = (val: number) => {
    const ratio = (val - yMin) / yRange;
    return padding.top + plotHeight - (ratio * plotHeight);
  };

  const zeroY = getY(0);

  // Coordenadas X para os meses
  const stepX = plotWidth / (visibleData.length - 1 || 1);
  const getX = (idx: number) => padding.left + (idx * stepX);

  // Linhas horizontais do grid (3 linhas limpas)
  const gridTicks = 3;
  const gridLines = Array.from({ length: gridTicks }).map((_, i) => {
    const val = yMin + ((yRange / (gridTicks - 1)) * i);
    return {
      value: val,
      y: getY(val),
    };
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  const formatCompact = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `R$ ${(val / 1000).toFixed(0)}k`;
    }
    return `R$ ${val.toFixed(0)}`;
  };

  // Gerar caminho de curva suave e elegante com tangentes horizontais
  const generateSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    if (values.length === 1) return `M ${getX(0)} ${getY(values[0])}`;

    let path = `M ${getX(0)} ${getY(values[0])}`;
    for (let i = 0; i < values.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(values[i]);
      const x1 = getX(i + 1);
      const y1 = getY(values[i + 1]);
      const cpX1 = x0 + (x1 - x0) / 2;
      const cpY1 = y0;
      const cpX2 = x0 + (x1 - x0) / 2;
      const cpY2 = y1;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
    }
    return path;
  };

  // Gerar área translúcida preenchida abaixo da curva
  const generateAreaPath = (values: number[]) => {
    const linePath = generateSmoothPath(values);
    if (!linePath) return '';
    const lastX = getX(values.length - 1);
    const firstX = getX(0);
    return `${linePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;
  };

  const selectedItem = visibleData.find(d => d.month === selectedMonth) || visibleData[visibleData.length - 1];
  const hoveredItem = hoveredIdx !== null ? visibleData[hoveredIdx] : null;

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-3.5">
      {/* Top Header no estilo Linear/Fintech */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 text-sky-400 shadow-inner">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Evolução Financeira</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {periodMonths === 3 ? '3 Meses' : periodMonths === 6 ? '6 Meses' : '12 Meses'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique no mês para filtrar o Dashboard
            </p>
          </div>
        </div>

        {/* Controles: Seletor de Período, Séries e Alternador de Modo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Seletor de Período (3M / 6M / 12M) */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => { setPeriodMonths(3); setHoveredIdx(null); }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                periodMonths === 3
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3M
            </button>
            <button
              onClick={() => { setPeriodMonths(6); setHoveredIdx(null); }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                periodMonths === 6
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              6M
            </button>
            {data.length > 6 && (
              <button
                onClick={() => { setPeriodMonths(12); setHoveredIdx(null); }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  periodMonths === 12
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                12M
              </button>
            )}
          </div>

          {/* 2. Alternador de Séries (Segmented Pills com Glow) */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSeries(prev => ({ ...prev, revenue: !prev.revenue }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                activeSeries.revenue
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                  : 'text-slate-500 hover:text-slate-300 opacity-60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Receita</span>
            </button>

            <button
              onClick={() => setActiveSeries(prev => ({ ...prev, costs: !prev.costs }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                activeSeries.costs
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                  : 'text-slate-500 hover:text-slate-300 opacity-60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Gastos</span>
            </button>

            <button
              onClick={() => setActiveSeries(prev => ({ ...prev, profit: !prev.profit }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                activeSeries.profit
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'text-slate-500 hover:text-slate-300 opacity-60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Lucro</span>
            </button>
          </div>

          {/* 3. Alternador Linhas / Barras */}
          <div className="flex items-center bg-slate-950/60 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('lines')}
              title="Visualização em Linhas"
              className={`p-1 rounded-lg transition-all ${
                viewMode === 'lines'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('bars')}
              title="Visualização em Barras"
              className={`p-1 rounded-lg transition-all ${
                viewMode === 'bars'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Área do Gráfico */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradientes de Área Translúcida Ultra-Suaves e Minimalistas */}
            <linearGradient id="areaRevenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="areaProfitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradientes de Barras Minimalistas */}
            <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="barCostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="barProfitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade Horizontais Ultra-Discretas */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={gl.y}
                x2={width - padding.right}
                y2={gl.y}
                stroke={gl.value === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(148, 163, 184, 0.05)'}
                strokeDasharray={gl.value === 0 ? 'none' : '3 3'}
                strokeWidth={gl.value === 0 ? 1 : 0.75}
              />
              <text
                x={padding.left - 10}
                y={gl.y + 3.5}
                textAnchor="end"
                className="fill-slate-500 font-mono text-[9px]"
              >
                {formatCompact(gl.value)}
              </text>
            </g>
          ))}

          {/* Zonas Visuais de Foco e Rótulos por Mês */}
          {visibleData.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIdx === idx;
            const isSelected = d.month === selectedMonth;
            const halfCol = (stepX / 2);

            return (
              <g key={`col-${d.month}`} pointerEvents="none">
                {/* Faixa de fundo delicada em hover / selecionado */}
                {(isHovered || isSelected) && (
                  <rect
                    x={x - halfCol + 4}
                    y={padding.top}
                    width={stepX - 8}
                    height={plotHeight}
                    rx="8"
                    fill={isSelected ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255, 255, 255, 0.02)'}
                    stroke={isSelected ? 'rgba(56, 189, 248, 0.25)' : 'transparent'}
                    strokeWidth="1"
                  />
                )}

                {/* Linha vertical de foco no hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="rgba(56, 189, 248, 0.25)"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                )}

                {/* Rótulo do Mês no Eixo X */}
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold transition-colors ${
                    isSelected 
                      ? 'fill-sky-400 font-bold' 
                      : isHovered 
                      ? 'fill-white' 
                      : 'fill-slate-500'
                  }`}
                >
                  {d.label}
                </text>

                {isSelected && (
                  <circle
                    cx={x}
                    cy={height - padding.bottom + 22}
                    r="1.5"
                    fill="#38bdf8"
                  />
                )}
              </g>
            );
          })}

          {/* MODO 1: GRÁFICO DE LINHAS SUAVES & FINAS (MINIMALISTA) */}
          {viewMode === 'lines' && (
            <g pointerEvents="none">
              {/* 1. Áreas Preenchidas Leves */}
              {activeSeries.revenue && (
                <path
                  d={generateAreaPath(visibleData.map(d => d.grossRevenue))}
                  fill="url(#areaRevenueGrad)"
                />
              )}

              {activeSeries.profit && (
                <path
                  d={generateAreaPath(visibleData.map(d => Math.max(0, d.netProfit)))}
                  fill="url(#areaProfitGrad)"
                />
              )}

              {/* 2. Linha de Custos: Fina e discreta */}
              {activeSeries.costs && (
                <path
                  d={generateSmoothPath(visibleData.map(d => d.totalCosts))}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                  className="transition-all"
                />
              )}

              {/* 3. Linha de Faturamento: Fina, nítida e elegante */}
              {activeSeries.revenue && (
                <path
                  d={generateSmoothPath(visibleData.map(d => d.grossRevenue))}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />
              )}

              {/* 4. Linha de Lucro Líquido Real: Fina e vibrante */}
              {activeSeries.profit && (
                <path
                  d={generateSmoothPath(visibleData.map(d => d.netProfit))}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all"
                />
              )}

              {/* 5. Nós delicados: apenas no foco / hover para manter as linhas limpas */}
              {visibleData.map((d, idx) => {
                const x = getX(idx);
                const isHovered = hoveredIdx === idx;
                const isSelected = d.month === selectedMonth;
                const isFocus = isHovered || isSelected;

                if (!isFocus) return null;

                return (
                  <g key={`nodes-${d.month}`}>
                    {/* Nó de Faturamento */}
                    {activeSeries.revenue && (
                      <circle
                        cx={x}
                        cy={getY(d.grossRevenue)}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#0284c7"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    )}

                    {/* Nó de Custos */}
                    {activeSeries.costs && (
                      <circle
                        cx={x}
                        cy={getY(d.totalCosts)}
                        r="3"
                        fill="#ffffff"
                        stroke="#e11d48"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Nó de Lucro */}
                    {activeSeries.profit && (
                      <circle
                        cx={x}
                        cy={getY(d.netProfit)}
                        r="3.5"
                        fill="#ffffff"
                        stroke={d.netProfit >= 0 ? '#059669' : '#e11d48'}
                        strokeWidth="2"
                        className="transition-all"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* MODO 2: BARRAS MODERNAS SELECIONÁVEIS */}
          {viewMode === 'bars' && visibleData.map((d, idx) => {
            const centerX = getX(idx);
            const activeCount = [activeSeries.revenue, activeSeries.costs, activeSeries.profit].filter(Boolean).length;
            const barWidth = Math.min(22, (stepX * 0.45) / (activeCount || 1));
            const totalGroupWidth = activeCount * barWidth;
            let currentOffset = centerX - (totalGroupWidth / 2);

            return (
              <g key={`bars-${d.month}`} pointerEvents="none">
                {activeSeries.revenue && (() => {
                  const barX = currentOffset;
                  currentOffset += barWidth + 2;
                  const barY = getY(Math.max(0, d.grossRevenue));
                  const barH = Math.max(2, Math.abs(zeroY - barY));
                  return (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="3"
                      fill="url(#barRevGrad)"
                    />
                  );
                })()}

                {activeSeries.costs && (() => {
                  const barX = currentOffset;
                  currentOffset += barWidth + 2;
                  const barY = getY(Math.max(0, d.totalCosts));
                  const barH = Math.max(2, Math.abs(zeroY - barY));
                  return (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="3"
                      fill="url(#barCostGrad)"
                    />
                  );
                })()}

                {activeSeries.profit && (() => {
                  const barX = currentOffset;
                  currentOffset += barWidth + 2;
                  const isPositive = d.netProfit >= 0;
                  const barY = isPositive ? getY(d.netProfit) : zeroY;
                  const barH = Math.max(2, Math.abs(zeroY - getY(d.netProfit)));
                  return (
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx="3"
                      fill={isPositive ? 'url(#barProfitGrad)' : '#f43f5e'}
                    />
                  );
                })()}
              </g>
            );
          })}

          {/* Camada Interativa de Clique (Hitboxes em toda a altura da coluna para capturar cliques com precisão) */}
          {visibleData.map((d, idx) => {
            const x = getX(idx);
            const halfCol = (stepX / 2);
            const left = idx === 0 ? padding.left - 20 : x - halfCol;
            const right = idx === visibleData.length - 1 ? width - padding.right + 20 : x + halfCol;
            const colW = right - left;

            return (
              <rect
                key={`hitbox-${d.month}`}
                x={left}
                y={0}
                width={colW}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => handleSelectMonth(d.month, d.label)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Tooltip Glassmorphic (Aparece SOMENTE em hover) */}
        {hoveredItem && hoveredIdx !== null && (
          <div
            className="absolute pointer-events-none z-30 p-3 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 transition-all duration-150 animate-in fade-in zoom-in-95 min-w-[210px]"
            style={{
              left: `${Math.min(80, Math.max(20, (getX(hoveredIdx) / width) * 100))}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>{hoveredItem.label}</span>
                <span className="text-[10px] text-slate-400 font-normal">({hoveredItem.month})</span>
              </div>
              {hoveredItem.month === selectedMonth && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Mês Ativo
                </span>
              )}
            </div>

            <div className="space-y-1 pt-0.5 font-mono text-[11px]">
              {activeSeries.revenue && (
                <div className="flex items-center justify-between text-sky-300">
                  <span className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Receita:
                  </span>
                  <span className="font-bold">{formatCurrency(hoveredItem.grossRevenue)}</span>
                </div>
              )}

              {activeSeries.costs && (
                <div className="flex items-center justify-between text-rose-300">
                  <span className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Gastos:
                  </span>
                  <span className="font-bold">{formatCurrency(hoveredItem.totalCosts)}</span>
                </div>
              )}

              {activeSeries.profit && (
                <div className={`flex items-center justify-between pt-1 border-t border-slate-800 ${
                  hoveredItem.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span className="text-[10px] font-sans text-slate-300 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Lucro Líquido:
                  </span>
                  <span className="font-bold">{formatCurrency(hoveredItem.netProfit)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-sans">
                <span>Margem: {hoveredItem.profitMargin}%</span>
                <span>{hoveredItem.freightsCount} fretes</span>
              </div>
            </div>

            <div className="text-[9px] text-sky-400/80 pt-1 text-center border-t border-slate-800/60 font-sans">
              Clique para selecionar este mês
            </div>
          </div>
        )}
      </div>

      {/* Faixa Comparativa Mês a Mês (MoM) com o Mês Anterior */}
      {(() => {
        const currentFocusItem = hoveredItem || selectedItem;
        const focusFullIdx = currentFocusItem ? data.findIndex(d => d.month === currentFocusItem.month) : -1;
        const prevMonthItem = focusFullIdx > 0 ? data[focusFullIdx - 1] : null;

        if (!prevMonthItem || !currentFocusItem) return null;

        const revDiff = currentFocusItem.grossRevenue - prevMonthItem.grossRevenue;
        const revPercent = prevMonthItem.grossRevenue > 0
          ? Number(((revDiff / prevMonthItem.grossRevenue) * 100).toFixed(1))
          : null;

        const profitDiff = currentFocusItem.netProfit - prevMonthItem.netProfit;
        const profitPercent = prevMonthItem.netProfit !== 0
          ? Number(((profitDiff / Math.abs(prevMonthItem.netProfit)) * 100).toFixed(1))
          : null;

        const marginDiff = Number((currentFocusItem.profitMargin - prevMonthItem.profitMargin).toFixed(1));
        const freightsDiff = currentFocusItem.freightsCount - prevMonthItem.freightsCount;

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            {/* Receita MoM */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block truncate">Receita vs {prevMonthItem.label}</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-xs">
                <span className={revDiff >= 0 ? 'text-emerald-400 flex items-center' : 'text-rose-400 flex items-center'}>
                  {revDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {revPercent !== null ? `${revPercent > 0 ? '+' : ''}${revPercent}%` : (revDiff >= 0 ? `+${formatCompact(revDiff)}` : formatCompact(revDiff))}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({revDiff >= 0 ? `+${formatCompact(revDiff)}` : formatCompact(revDiff)})
                </span>
              </div>
            </div>

            {/* Lucro MoM */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block truncate">Lucro vs {prevMonthItem.label}</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-xs">
                <span className={profitDiff >= 0 ? 'text-emerald-400 flex items-center' : 'text-rose-400 flex items-center'}>
                  {profitDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {profitPercent !== null ? `${profitPercent > 0 ? '+' : ''}${profitPercent}%` : (profitDiff >= 0 ? `+${formatCompact(profitDiff)}` : formatCompact(profitDiff))}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({profitDiff >= 0 ? `+${formatCompact(profitDiff)}` : formatCompact(profitDiff)})
                </span>
              </div>
            </div>

            {/* Margem Líquida Delta */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block truncate">Margem vs {prevMonthItem.label}</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-xs">
                <span className={marginDiff >= 0 ? 'text-emerald-400 flex items-center' : 'text-rose-400 flex items-center'}>
                  {marginDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {marginDiff >= 0 ? `+${marginDiff}` : marginDiff} p.p.
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({currentFocusItem.profitMargin}%)
                </span>
              </div>
            </div>

            {/* Fretes MoM */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block truncate">Fretes vs {prevMonthItem.label}</span>
              <div className="flex items-center gap-1 mt-0.5 font-mono font-bold text-xs">
                <span className={freightsDiff >= 0 ? 'text-sky-400 flex items-center' : 'text-slate-400 flex items-center'}>
                  {freightsDiff >= 0 ? `+${freightsDiff}` : freightsDiff} viagens
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({currentFocusItem.freightsCount} total)
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Faixa Inferior de Resumo Rápido e Elegante */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/70 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>Mês em foco:</span>
          <span className="font-bold text-white uppercase">{selectedItem?.label || ''}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Receita:</span>
          <span className="font-mono font-bold text-sky-400">{formatCurrency(selectedItem?.grossRevenue || 0)}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Lucro:</span>
          <span className={`font-mono font-bold ${(selectedItem?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(selectedItem?.netProfit || 0)}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-sky-400/80" />
          <span>Clique em qualquer mês para filtrar</span>
        </div>
      </div>
    </div>
  );
};
