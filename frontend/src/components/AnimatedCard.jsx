import React, { useState, useEffect } from 'react';

export const CountUp = ({ to, duration = 1000, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(to);
    if (isNaN(end)) {
      setCount(to);
      return;
    }
    
    if (end === 0) return;
    
    const totalMiliseconds = duration;
    const incrementTime = Math.max(10, Math.floor(totalMiliseconds / end));
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / 30));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [to, duration]);

  const formatCount = () => {
    if (typeof count === 'number') {
      return count.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return count;
  };

  return <span>{prefix}{formatCount()}{suffix}</span>;
};

const AnimatedCard = ({ children, className = "", delay = 0 }) => {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl hover-lift shadow-sm ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
