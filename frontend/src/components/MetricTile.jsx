import React from 'react';
import AnimatedCard, { CountUp } from './AnimatedCard';

const MetricTile = ({ 
  label, 
  value, 
  desc, 
  prefix = "", 
  suffix = "", 
  trendVal = null, 
  trendType = 'up',
  color = 'text-primary-500',
  delay = 0 
}) => {
  return (
    <AnimatedCard delay={delay} className="flex flex-col justify-between p-4 min-h-[110px]">
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">{label}</span>
        {trendVal && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            trendType === 'up' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
          }`}>
            {trendType === 'up' ? '▲' : '▼'} {trendVal}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className={`text-2xl font-black ${color}`}>
          <CountUp to={value} prefix={prefix} suffix={suffix} />
        </span>
      </div>
      {desc && <span className="text-[9px] text-slate-400 mt-1 leading-normal">{desc}</span>}
    </AnimatedCard>
  );
};

export default MetricTile;
