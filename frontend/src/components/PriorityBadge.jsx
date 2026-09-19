const colors = {
  Low: 'bg-signal-teal-dim text-signal-teal',
  Medium: 'bg-signal-amber-dim text-ink-700',
  High: 'bg-signal-coral-dim text-signal-coral',
};

const PriorityBadge = ({ priority }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded ${colors[priority] || 'bg-ink-50 text-ink-500'}`}>
    {priority}
  </span>
);

export default PriorityBadge;
