import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  maxVal?: number;
}

export function BarChart({ data, maxVal }: BarChartProps) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-24 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right flex-shrink-0">
            {d.label}
          </div>
          <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden relative">
            <div 
              className="h-full rounded-md transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1)"
              style={{
                background: d.color || "linear-gradient(90deg, #60a0ff, #b080ff)",
                width: `${(d.value / max) * 100}%`,
                transitionDelay: `${i * 100}ms`
              }} 
            />
          </div>
          <div className="w-8 text-sm font-bold font-code text-foreground/80">
            {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}
