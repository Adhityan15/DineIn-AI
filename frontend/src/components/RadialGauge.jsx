import React from 'react';

const RadialGauge = ({ value = 90, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  // Determine indicator colors based on health/burnout levels
  const getColor = () => {
    if (value >= 75) return 'stroke-emerald-500';
    if (value >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="relative flex flex-col items-center justify-center animate-float">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          className="stroke-slate-200 dark:stroke-slate-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Fill progress circle */}
        <circle
          className={`${getColor()} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Absolute text label */}
      <div className="absolute text-center">
        <span className="text-2xl font-black text-slate-900 dark:text-white">{value}%</span>
      </div>
    </div>
  );
};

export default RadialGauge;
