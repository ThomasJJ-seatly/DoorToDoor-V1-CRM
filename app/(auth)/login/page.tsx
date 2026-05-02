'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(getAuthErrorMessage(error.message))
        return
      }

      router.push('/')
      router.refresh()
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-bg-elevated focus:rounded-xl"
      >
        Skip to main content
      </a>
      <div id="main" className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-text-primary">
            Certus D2D Tracker
          </h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                autoFocus
                className="input-base"
                placeholder="you@certusagency.com.au"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                className="input-base"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm text-status-danger bg-status-dangerBg px-3 py-2 rounded-lg"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="primary-btn w-full mt-2"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function getAuthErrorMessage(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'Email or password is incorrect.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in.'
  }
  return 'Something went wrong. Please try again.'
}
