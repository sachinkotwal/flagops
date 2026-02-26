import React, { useEffect, useState } from 'react';

interface HealthGaugeProps {
  score: number;
}

export function HealthGauge({ score }: HealthGaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setCurrentScore(score), 300);
    return () => clearTimeout(timeout);
  }, [score]);

  const color = currentScore >= 80 ? "#50dc78" : currentScore >= 50 ? "#f0c040" : "#ff6b6b";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (currentScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-[140px] h-[140px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle 
            cx="60" cy="60" r="54" 
            fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="8" 
          />
          <circle 
            cx="60" cy="60" r="54" 
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} 
            strokeDashoffset={offset}
            className="transition-all duration-1500 cubic-bezier(0.23, 1, 0.32, 1)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
          <span className="text-3xl font-bold font-code text-foreground leading-none">
            {Math.round(currentScore)}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mt-1">
            / 100
          </span>
        </div>
      </div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
        Overall Health Score
      </div>
    </div>
  );
}
