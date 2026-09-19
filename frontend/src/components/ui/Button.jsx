const VARIANTS = {
  primary: "bg-ink-900 text-paper hover:bg-ink-700",
  // Reserved for the single most important action on a page (the hero's
  // main CTA) — spends the one bold accent color deliberately rather than
  // scattering it across every button.
  accent: "bg-signal-coral text-white hover:brightness-110",
  outline: "border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper",
  ghost: "text-ink-500 hover:text-ink-900 hover:bg-ink-50",
  danger: "bg-signal-coral text-paper hover:opacity-90",
  // For use on dark surfaces (the console auth card, the dark hero band)
  // where the light-background variants above would have no contrast.
  light: "bg-paper text-ink-900 hover:bg-white",
  "outline-light": "border border-ink-500 text-paper hover:bg-white/10",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;