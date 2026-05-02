import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-bg-primary">
      <div className="max-w-sm">
        <div className="text-6xl font-mono font-medium text-text-tertiary mb-4 tabular-nums">
          404
        </div>
        <h1 className="text-xl font-medium mb-2">Page not found</h1>
        <p className="text-sm text-text-secondary mb-6">
          We couldn&apos;t find what you were looking for.
        </p>
        <Link href="/" className="primary-btn inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
