const colors = {
  New: 'bg-ink-100 text-ink-700',
  Assigned: 'bg-ink-100 text-ink-700',
  'In Progress': 'bg-signal-amber-dim text-ink-700',
  Resolved: 'bg-signal-teal-dim text-signal-teal',
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded ${colors[status] || 'bg-ink-50 text-ink-500'}`}>
    {status}
  </span>
);

export default StatusBadge;
