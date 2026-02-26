import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export function StatCard({ label, value, sub, accent, icon, delay = 0 }: StatCardProps) {
  return (
    <div 
      className="glass rounded-lg p-7 relative overflow-hidden animate-fade-up opacity-0 fill-mode-forwards"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div 
        className="absolute top-0 left-0 right-0 h-0.5" 
        style={{ background: accent || "rgba(255, 255, 255, 0.1)" }} 
      />
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
          {label}
        </span>
      </div>
      <div className="text-4xl font-bold font-code text-foreground leading-none mb-2">
        {value}
      </div>
      {sub && <div className="text-xs text-muted-foreground font-medium">{sub}</div>}
    </div>
  );
}
