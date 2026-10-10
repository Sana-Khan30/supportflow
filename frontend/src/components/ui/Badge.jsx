/**
 * One badge primitive shared by PriorityBadge and StatusBadge so sizing,
 * padding, and radius can't drift apart between the two anymore.
 * `dot` renders a small filled dot before the label — used for High priority,
 * a quiet extra signal that's perceptible on close look, invisible as
 * decoration from a glance.
 */
const Badge = ({ children, className = '', dot = false }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-control ${className}`}>
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
    {children}
  </span>
);

export default Badge;
