const colors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};

const PriorityBadge = ({ priority }) => (
  <span className={`text-xs font-medium px-2 py-1 rounded ${colors[priority] || 'bg-gray-100'}`}>
    {priority}
  </span>
);

export default PriorityBadge;