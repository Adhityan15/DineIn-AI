import React from 'react';

const AnimatedProgressBar = ({ value, label, max = 100, color = 'bg-primary-500' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span className="text-slate-900 dark:text-white">{value} / {max}</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
