# Skill: Error Handling

Errors will happen. The difference between an app that feels reliable and one that feels broken is how it handles them.

---

## Three Levels of Errors

### 1. User errors (form validation)
The user typed something wrong. Show inline, friendly, actionable.

Handled by React Hook Form + Zod. See `forms.md`.

### 2. Expected operational errors
The thing the user wanted to do can't happen right now (network down, permission denied, record not found). Show friendly explanation with retry.

### 3. Unexpected errors (bugs)
Something broke. The app should not crash — it should show a graceful error boundary and let the user recover.

---

## Error Boundaries

Next.js has built-in error.tsx files. Create one at the root of the app and at each major route segment.

### `app/error.tsx` (root)
```tsx
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-status-dangerBg flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-status-danger" />
        </div>
        <h1 className="text-xl font-medium mb-2">Something went wrong</h1>
        <p className="text-sm text-text-secondary mb-6">
          We hit an unexpected error. It's been logged and we'll look into it.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="primary-btn">
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="secondary-btn"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
```

### `app/(app)/error.tsx` (app shell)
Same pattern but keeps the app layout. Errors inside specific routes won't blow away the whole app.

---

## Server Action Error Handling

Server actions can fail. Catch errors and return user-friendly results.

### Pattern
```ts
'use server'

export async function createSale(data: SaleInput) {
  try {
    // Validate
    const parsed = saleSchema.safeParse(data)
    if (!parsed.success) {
      return { error: { fields: parsed.error.flatten().fieldErrors } }
    }
    
    // Get user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: { _form: 'You need to be signed in.' } }
    }
    
    // Insert
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({ /* ... */ })
      .select()
      .single()
    
    if (error) {
      console.error('Sale insert error:', error)
      return { error: { _form: getDbErrorMessage(error) } }
    }
    
    revalidatePath('/sales')
    return { success: true, sale }
  } catch (e) {
    console.error('Unexpected sale creation error:', e)
    return { error: { _form: 'Something went wrong. Please try again.' } }
  }
}
```

### Database error mapping
```ts
// lib/errors.ts
import type { PostgrestError } from '@supabase/supabase-js'

export function getDbErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case '23505': // unique_violation
      return 'A record with this name already exists.'
    case '23503': // foreign_key_violation
      return "This record can't be deleted because it's in use elsewhere."
    case '23502': // not_null_violation
      return 'A required field is missing.'
    case '42501': // insufficient_privilege
      return "You don't have permission to do that."
    case 'PGRST116': // no rows returned (single)
      return 'Record not found.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
```

---

## Network Error Handling (Client)

For client-side fetches that aren't via server actions:

```tsx
async function fetchData() {
  try {
    const { data, error } = await supabase.from('sales').select('*')
    
    if (error) {
      throw error
    }
    
    return { data, error: null }
  } catch (e) {
    console.error('Failed to fetch sales:', e)
    return { 
      data: null, 
      error: e instanceof Error ? e.message : 'Network error' 
    }
  }
}
```

---

## User-Facing Error UX

### Error State Component
```tsx
// components/shared/ErrorState.tsx
import { AlertCircle, RefreshCw } from 'lucide-react'

type ErrorStateProps = {
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
    <div className="text-center py-12 px-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-status-dangerBg flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-status-danger" />
      </div>
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="secondary-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </button>
      )}
    </div>
  )
}
```

---

## Toast Notifications for Async Errors

For errors that happen after a user action (e.g. saving a sale that fails server-side):

```tsx
import { toast } from 'sonner' // or your toast library

async function handleSave() {
  const result = await createSale(data)
  
  if (result.error) {
    toast.error(typeof result.error === 'string' ? result.error : 'Could not save sale.')
    return
  }
  
  toast.success('Sale saved')
}
```

### Toast guidelines
- Success: brief, confirming, no "great job!" — just "Sale saved"
- Error: actionable, suggests next step, no jargon
- Don't auto-dismiss critical errors — let user dismiss
- Don't stack 5 toasts — collapse repeats

---

## Logging

For now, errors get logged to the browser/server console. That's enough for V1.

### What to log
- All caught exceptions (full stack)
- All Supabase errors (with the operation context)
- All unexpected user-facing failures

### What NOT to log
- User passwords (obviously)
- API keys
- Personally identifiable info you don't need

### Logging pattern
```ts
console.error('Failed to insert sale:', {
  error,
  user_id: user?.id,
  attempted_data: { /* sanitised */ },
  timestamp: new Date().toISOString(),
})
```

For V2, add a real logging service (Axiom, Logtail, BetterStack) and pipe these through it.

---

## Retry Logic

### When to auto-retry
- Network errors on idempotent reads (GET requests)
- Auth token refresh failures (Supabase handles this)

### When NOT to auto-retry
- Failed mutations (could result in duplicate writes)
- Validation errors (no point — they'll fail again)
- Permission errors (no point — they'll keep failing)

### Manual retry pattern
Provide a "Try again" button rather than silent retries for anything important. Users want to know.

---

## Empty States vs Error States

These are different and need different UX. Don't confuse them.

| State | When | UX |
|-------|------|-----|
| **Loading** | Data is being fetched | Skeleton matching final shape |
| **Empty** | No data exists yet | Friendly empty state + CTA to create |
| **No results** | Filter returned nothing | "No matches" + reset filters CTA |
| **Error** | Fetch failed | Error icon + retry button |
| **Forbidden** | User lacks permission | Polite explanation, redirect to home |

---

## 404 Page

Required. Don't ship without it.

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <div className="text-6xl font-medium text-text-tertiary mb-4">404</div>
        <h1 className="text-xl font-medium mb-2">Page not found</h1>
        <p className="text-sm text-text-secondary mb-6">
          We couldn't find what you were looking for.
        </p>
        <Link href="/" className="primary-btn inline-flex">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
```

---

## "Cannot find record" Pattern

When a user navigates to `/sales/[id]` for a deleted or non-existent sale:

```tsx
const { data: sale } = await supabase.from('sales').select('*').eq('id', id).single()

if (!sale) {
  notFound() // Triggers Next.js's not-found.tsx
}
```

---

## Don'ts

- **Don't** swallow errors silently. Always log.
- **Don't** show users raw error messages from APIs.
- **Don't** show different errors to admins vs users in the same UI (other than what's gated by RLS).
- **Don't** retry mutations automatically.
- **Don't** put error messages in `alert()`. Ever.
