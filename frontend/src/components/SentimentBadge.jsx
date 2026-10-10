import React from 'react';

const CONFIGS = {
  Frustrated: {
    label: 'Frustrated',
    icon: '⚡',
    bg: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
    dot: 'bg-rose-500'
  },
  Urgent: {
    label: 'Urgent',
    icon: '🔥',
    bg: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    dot: 'bg-amber-500 animate-pulse'
  },
  Neutral: {
    label: 'Neutral',
    icon: '⚖️',
    bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
    dot: 'bg-slate-400'
  },
  Positive: {
    label: 'Positive',
    icon: '✨',
    bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25',
    dot: 'bg-emerald-500'
  }
};

const SentimentBadge = ({ sentiment = 'Neutral', size = 'sm' }) => {
  const config = CONFIGS[sentiment] || CONFIGS.Neutral;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${config.bg} ${
        isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="opacity-80">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default SentimentBadge;
