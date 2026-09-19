const DarkInput = ({ label, error, className = "", id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border border-ink-600 bg-ink-900/60 px-3.5 py-2.5 text-sm text-paper placeholder:text-ink-500 focus:border-signal-coral focus:outline-none transition-colors ${
          error ? "border-signal-coral" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-signal-coral">{error}</p>}
    </div>
  );
};

export default DarkInput;