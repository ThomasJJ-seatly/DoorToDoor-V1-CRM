interface FieldProps {
  label: string
  name: string
  error?: string
  helper?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, name, error, helper, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-text-secondary">
        {label}
        {required && (
          <span className="text-status-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-xs text-status-danger" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={`${name}-helper`} className="text-xs text-text-tertiary">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
