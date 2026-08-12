import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({ 
  title = "No data found", 
  desc = "There are no records matching your current filter selection.", 
  icon: Icon = HelpCircle 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 bg-white/50 dark:bg-slate-900/10 backdrop-blur-sm">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-md border border-indigo-500/20 animate-float">
        <Icon size={28} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

export default EmptyState;
