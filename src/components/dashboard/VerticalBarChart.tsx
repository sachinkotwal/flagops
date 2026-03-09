import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface VerticalBarChartProps {
  data: BarChartData[];
  maxVal?: number;
}

export function VerticalBarChart({ data, maxVal }: VerticalBarChartProps) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-3 h-48 w-full justify-start">
      {data.map((d, i) => (
        <div key={d.label} className="flex flex-col items-center gap-2 h-full justify-end w-14 flex-shrink-0">
          <span className="text-[11px] font-bold font-code text-foreground/70">{d.value}</span>
          <div className="w-full rounded-t-md overflow-hidden" style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px', width: '100%' }}>
            <div
              className="w-full h-full rounded-t-md transition-all duration-1000"
              style={{
                background: d.color || 'linear-gradient(180deg, #60a0ff, #b080ff)',
                transitionDelay: `${i * 80}ms`,
              }}
            />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
