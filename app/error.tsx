'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className="max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-dangerBg flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-status-danger" />
        </div>
        <h1 className="text-xl font-medium mb-2">Something went wrong</h1>
        <p className="text-sm text-text-secondary mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="primary-btn">
            Try again
          </button>
          <a href="/" className="secondary-btn">
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
