import React from 'react';

const STATUS_MAP = {
  New: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-400'
  },
  Assigned: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/70',
    dot: 'bg-blue-500'
  },
  'In Progress': {
    bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500 animate-pulse'
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-600'
  }
};

const StatusBadge = ({ status = 'New', size = 'sm' }) => {
  const config = STATUS_MAP[status] || STATUS_MAP.New;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${config.bg} ${
        isSm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
