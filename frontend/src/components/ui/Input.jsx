const Input = ({ label, error, className = "", id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-ink-900 focus:outline-none transition-colors ${
          error ? "border-signal-coral" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-signal-coral">{error}</p>}
    </div>
  );
};

export const Textarea = ({ label, error, className = "", id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full rounded-md border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-ink-900 focus:outline-none transition-colors ${
          error ? "border-signal-coral" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-signal-coral">{error}</p>}
    </div>
  );
};

export default Input;
