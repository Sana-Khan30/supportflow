const colors = {
  New: 'bg-gray-200 text-gray-800',
  Assigned: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
};

const StatusBadge = ({ status }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded ${colors[status] || 'bg-gray-100'}`}>
    {status}
  </span>
);

export default StatusBadge;