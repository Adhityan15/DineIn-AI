import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <>
        {items.map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-sm animate-pulse">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (type === 'row') {
    return (
      <div className="space-y-3 w-full">
        {items.map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center w-full animate-pulse">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex-shrink-0"></div>
            <div className="space-y-2 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden w-full animate-pulse">
        <div className="bg-slate-50 dark:bg-slate-900 h-10 border-b border-slate-200 dark:border-slate-800"></div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((_, idx) => (
            <div key={idx} className="h-12 bg-white dark:bg-slate-950 flex items-center px-4 gap-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/12 ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
