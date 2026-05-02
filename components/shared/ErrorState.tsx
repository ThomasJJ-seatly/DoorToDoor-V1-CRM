import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = "Couldn't load this",
  description = 'Something went wrong. Try again in a moment.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-status-dangerBg flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-status-danger" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-text-secondary mt-1 mb-6 max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="secondary-btn">
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  )
}
