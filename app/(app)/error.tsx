'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-dangerBg flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-status-danger" />
        </div>
        <h2 className="text-xl font-medium mb-2">Something went wrong</h2>
        <p className="text-sm text-text-secondary mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="primary-btn">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <a href="/" className="secondary-btn">
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
