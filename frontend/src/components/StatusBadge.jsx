import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyles = (statusVal) => {
    const s = String(statusVal).toLowerCase();
    switch (s) {
      // Available / Active Success States
      case 'available':
      case 'confirmed':
      case 'checked_in':
      case 'seated':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      
      // Warning / Pending States
      case 'pending':
      case 'reserved':
      case 'waiting':
      case 'notified':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';

      // Busy / Danger / Error States
      case 'occupied':
      case 'no_show':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      // Grey / Disabled / Terminated States
      case 'completed':
      case 'expired':
      case 'cancelled':
      case 'out_of_service':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatText = (statusVal) => {
    if (!statusVal) return '';
    return statusVal.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider uppercase ${getStyles(status)}`}>
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
