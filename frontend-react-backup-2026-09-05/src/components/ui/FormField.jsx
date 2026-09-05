const baseInputClasses =
  'w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20'

export default function FormField({
  label,
  required,
  error,
  type = 'text',
  as = 'input',
  options,
  className = '',
  ...inputProps
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-text-secondary">
          {label} {required && <span className="text-p1">*</span>}
        </label>
      )}

      {as === 'select' ? (
        <select
          className={`${baseInputClasses} ${error ? 'border-p1' : ''}`}
          required={required}
          {...inputProps}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className={`${baseInputClasses} ${error ? 'border-p1' : ''}`}
          required={required}
          {...inputProps}
        />
      )}

      {error && <span className="text-[11px] font-medium text-p1">{error}</span>}
    </div>
  )
}
