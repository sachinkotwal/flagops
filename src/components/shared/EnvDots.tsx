import React from 'react';

interface EnvDotsProps {
  environments: Record<string, { enabled?: boolean } | boolean>;
}

export function EnvDots({ environments }: EnvDotsProps) {
  const envs = [
    { key: 'development', label: 'Dev', color: '#60a0ff' },
    { key: 'staging', label: 'Staging', color: '#f0c040' },
    { key: 'production', label: 'Prod', color: '#50dc78' },
  ];

  return (
    <div className="flex gap-1.5 items-center">
      {envs.map(env => {
        const envData = environments?.[env.key];
        const isEnabled = typeof envData === 'object' ? !!envData.enabled : !!envData;

        return (
          <div 
            key={env.key} 
            title={`${env.label}: ${isEnabled ? 'ON' : 'OFF'}`}
            className="w-2 h-2 rounded-full transition-all duration-300 border"
            style={{
              background: isEnabled ? env.color : 'rgba(255, 255, 255, 0.08)',
              borderColor: isEnabled ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isEnabled ? `0 0 8px ${env.color}44` : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
