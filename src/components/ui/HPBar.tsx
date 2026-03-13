import React from 'react';

export default function HPBar({ current, max }: { current: number, max: number }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
      <div 
        className={`h-full transition-all duration-500 ${getColor()}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
