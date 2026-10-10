const EDGE_COLORS = {
  High: 'bg-signal-coral',
  Medium: 'bg-signal-amber',
  Low: 'bg-signal-teal',
  neutral: 'bg-ink-200',
};

/**
 * The one card primitive for the whole app. Every page previously hand-rolled
 * its own "bg-white border rounded-md p-X" wrapper with slightly different
 * radius/padding — this replaces all of them so elevation, radius, and the
 * priority edge stripe are defined in exactly one place.
 *
 * Resting state is a hairline border only (no shadow) — depth only appears
 * on `hoverable` cards, via a real single-direction shadow + lift, not a glow.
 *
 * `edge` accepts a ticket priority string directly ("High"/"Medium"/"Low")
 * so callers can pass `edge={ticket.priority}` without translating it.
 * High priority renders a visibly thicker edge (3px vs 2px) — a quiet signal
 * on close look, invisible as "decoration" from a glance.
 */
const Card = ({ children, edge, hoverable = false, as: Component = 'div', className = '', ...props }) => {
  return (
    <Component
      className={`relative flex bg-white border border-ink-100 rounded-card overflow-hidden transition-all duration-200 ${
        hoverable ? 'hover:-translate-y-0.5 hover:shadow-raised hover:border-ink-200' : ''
      } ${className}`}
      {...props}
    >
      {edge && (
        <div className={`shrink-0 ${edge === 'High' ? 'w-[3px]' : 'w-[2px]'} ${EDGE_COLORS[edge] || EDGE_COLORS.neutral}`} />
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </Component>
  );
};

export default Card;
