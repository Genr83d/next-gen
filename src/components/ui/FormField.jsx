const FormField = ({ label, labelFor, required, hint, error, children }) => {
  const errorId = error ? `${labelFor}-error` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={labelFor} className="text-sm font-semibold text-slate-200">
          {label} {required && <span className="text-electric-orange">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="space-y-1">
        {typeof children === 'function' ? children({ errorId }) : children}
        {error && (
          <p id={errorId} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormField;
