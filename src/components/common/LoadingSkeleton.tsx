import React from 'react';

export const SkeletonPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800/70 rounded-xl ${className}`} />
);

export const KpiCardSkeleton: React.FC = () => (
  <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
    <div className="flex items-center justify-between">
      <SkeletonPulse className="h-3.5 w-24" />
      <SkeletonPulse className="h-7 w-7 rounded-xl" />
    </div>
    <div className="mt-3">
      <SkeletonPulse className="h-7 w-36" />
    </div>
    <div className="mt-2.5 flex items-center gap-2">
      <SkeletonPulse className="h-3 w-16" />
      <SkeletonPulse className="h-3 w-28" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Grid de 4 KPIs */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>

    {/* Gráfico Skeleton */}
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1.5">
          <SkeletonPulse className="h-4 w-44" />
          <SkeletonPulse className="h-3 w-64" />
        </div>
        <SkeletonPulse className="h-8 w-32 rounded-xl" />
      </div>
      <div className="h-64 rounded-xl bg-slate-800/40 flex items-end justify-between p-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div 
              className="w-full bg-slate-700/50 rounded-t-lg" 
              style={{ height: `${30 + (i * 9) % 60}%` }}
            />
            <SkeletonPulse className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    </div>

    {/* Seção Inferior: Próximos 10 Dias e Fretes */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Próximos 10 Dias */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SkeletonPulse className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-3 w-48" />
            </div>
          </div>
          <SkeletonPulse className="h-5 w-20" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonPulse className="h-3.5 w-36" />
                <SkeletonPulse className="h-2.5 w-48" />
              </div>
              <SkeletonPulse className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Fretes do Mês */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-44" />
          </div>
          <SkeletonPulse className="h-4 w-16" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="h-3 w-16" />
                  <SkeletonPulse className="h-3 w-20" />
                </div>
                <SkeletonPulse className="h-3.5 w-44" />
              </div>
              <div className="space-y-1.5 text-right">
                <SkeletonPulse className="h-4 w-24 ml-auto" />
                <SkeletonPulse className="h-3 w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TableRowsSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2.5 animate-pulse">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <SkeletonPulse 
            key={c} 
            className={`h-4 ${c === 0 ? 'w-1/4' : c === cols - 1 ? 'w-20' : 'w-1/6'}`} 
          />
        ))}
      </div>
    ))}
  </div>
);
