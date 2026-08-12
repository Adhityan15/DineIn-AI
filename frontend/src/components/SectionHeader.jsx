import React from 'react';

const SectionHeader = ({ title, subtitle, icon: Icon, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          {Icon && <Icon className="text-primary-500" size={24} />}
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
};

export default SectionHeader;
