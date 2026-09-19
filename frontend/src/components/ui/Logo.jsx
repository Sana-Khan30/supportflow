const Logo = ({ size = "md", dark = false, showWordmark = true }) => {
  const dims = size === "sm" ? 20 : size === "lg" ? 28 : 22;
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  const stroke = dark ? "#FFFFFF" : "#0A0A0B";

  return (
    <div className="flex items-center gap-2">
      <svg width={dims} height={dims} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={stroke} strokeWidth="1.6" />
        <path
          d="M9 5 V19"
          stroke={stroke}
          strokeWidth="1.6"
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
        />
        <circle cx="9" cy="5" r="1.4" fill={dark ? "#0A0A0B" : "#FFFFFF"} stroke={stroke} strokeWidth="1.2" />
        <circle cx="9" cy="19" r="1.4" fill={dark ? "#0A0A0B" : "#FFFFFF"} stroke={stroke} strokeWidth="1.2" />
        <circle cx="15.2" cy="12" r="2" fill="#FF4319" />
      </svg>
      {showWordmark && (
        <span className={`font-display font-bold ${textSize} ${dark ? "text-paper" : "text-ink-900"}`}>
          SupportFlow
        </span>
      )}
    </div>
  );
};

export default Logo;