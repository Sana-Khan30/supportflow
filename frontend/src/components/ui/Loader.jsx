import { motion } from "framer-motion";

/**
 * Loader — brand-colored ring spinner.
 * Drop-in replacement for the default browser-style spinner.
 *
 * Usage:
 *   <Loader size={18} />
 *   <Loader size={18} className="text-white" />   // inherits color via currentColor
 */
export function Loader({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      className={className}
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="4"
        opacity="0.15"
      />
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="34 94"
        style={{ transformOrigin: "25px 25px" }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
      />
    </svg>
  );
}

/**
 * ButtonLoader — full button content swap for async actions
 * (e.g. "Analyzing with AI…", "Logging in…", "Saving…").
 *
 * Usage inside a <button>:
 *   <button disabled={loading} className="...">
 *     {loading ? <ButtonLoader label="Analyzing with AI" /> : "Analyze"}
 *   </button>
 *
 * The label cycles through soft variants so long AI calls don't feel stuck —
 * pass a single fixed label if you'd rather it stay static.
 */
export function ButtonLoader({ label = "Loading", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Loader size={16} className="text-current" />
      <span>{label}…</span>
    </span>
  );
}

export default Loader;