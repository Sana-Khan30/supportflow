import React from 'react';

const PRIORITY_MAP = {
  High: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500 animate-pulse'
  },
  Medium: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500'
  },
  Low: {
    bg: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dot: 'bg-teal-500'
  }
};

const PriorityBadge = ({ priority = 'Medium', size = 'sm' }) => {
  const config = PRIORITY_MAP[priority] || PRIORITY_MAP.Medium;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${config.bg} ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{priority}</span>
    </span>
  );
};

export default PriorityBadge;
