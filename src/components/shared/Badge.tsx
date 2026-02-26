import React from 'react';
import { cn } from '@/lib/utils';

type BadgeColor = 'red' | 'yellow' | 'green' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colors: Record<BadgeColor, string> = {
  red: "bg-[rgba(255,80,80,0.12)] text-[#ff6b6b] border-[rgba(255,80,80,0.2)]",
  yellow: "bg-[rgba(255,200,50,0.1)] text-[#f0c040] border-[rgba(255,200,50,0.2)]",
  green: "bg-[rgba(80,220,120,0.1)] text-[#50dc78] border-[rgba(80,220,120,0.2)]",
  blue: "bg-[rgba(80,160,255,0.1)] text-[#60a0ff] border-[rgba(80,160,255,0.2)]",
  gray: "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.1)]",
  purple: "bg-[rgba(160,100,255,0.1)] text-[#b080ff] border-[rgba(160,100,255,0.2)]",
};

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-block px-[10px] py-[3px] rounded-[6px] text-[11px] font-semibold tracking-[0.03em] border",
      colors[color],
      className
    )}>
      {children}
    </span>
  );
}
