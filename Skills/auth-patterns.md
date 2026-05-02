# Skill: Auth Patterns

Authentication and authorisation patterns. Done right, this is invisible. Done wrong, it's a security hole or a UX nightmare.

---

## Stack

- Supabase Auth (email + password only for V1)
- Next.js middleware for route protection
- Server-side session management via cookies (handled by `@supabase/ssr`)

---

## Middleware

Protect every route except `/login`. The middleware runs on every request and refreshes the auth session.

```ts
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

```ts
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect to login if not authenticated and not on login page
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // Redirect to dashboard if authenticated and on login page
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  
  return response
}
```

---

## Login Page

```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  async function handleLogin(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    setError(null)
    
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        setError(getAuthErrorMessage(error))
        return
      }
      
      router.push('/')
      router.refresh()
    })
  }
  
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium text-center mb-2">Welcome back</h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Sign in to your account
        </p>
        
        <form action={handleLogin} className="space-y-4">
          <Field label="Email" name="email" required>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="input-base"
            />
          </Field>
          
          <Field label="Password" name="password" required>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="input-base"
            />
          </Field>
          
          {error && (
            <div className="text-sm text-status-danger bg-status-dangerBg/50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isPending}
            className="w-full primary-btn"
          >
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}

function getAuthErrorMessage(error: { message: string }): string {
  if (error.message.includes('Invalid login credentials')) {
    return 'Email or password is incorrect.'
  }
  if (error.message.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in.'
  }
  return 'Something went wrong. Please try again.'
}
```

---

## Sign-Up Flow

For V1, sign-up is invitation-only. Users are added by an admin via the `/users` page (which sends a Supabase invite email).

The first user (the seed admin) signs up via Supabase dashboard manually OR via a special signup page that's removed after first use.

### First admin setup
Use a one-time setup page that only works if no users exist yet:

```ts
// In a server action
const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
if (count && count > 0) redirect('/login') // Already set up

// Otherwise allow signup, set role = 'admin'
```

---

## Logout

```ts
// app/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

```tsx
// In header/menu
<form action={logout}>
  <button type="submit" className="...">Sign out</button>
</form>
```

---

## Getting the Current User

### In server components
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) redirect('/login')
```

`auth.getUser()` is preferred over `auth.getSession()` because it validates the JWT against the server. Use it for anything security-sensitive.

### Get the user's profile (with role)
```ts
const { data: profile } = await supabase
  .from('users')
  .select('id, email, full_name, role, is_active')
  .eq('id', user.id)
  .single()
```

### Helper function
Create a single helper to do both:
```ts
// lib/auth.ts
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?reason=inactive')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/')
  return user
}
```

---

## Role-Based Access

### In server components
```tsx
export default async function UsersPage() {
  await requireAdmin() // Redirects if not admin
  // ... admin-only content
}
```

### In client components
Pass the user role as a prop from server components. Don't call `getUser` in client components.

```tsx
// Server component
const user = await getCurrentUser()
return <Layout user={user}>{children}</Layout>

// Client component receives user as prop
'use client'
function Nav({ user }: { user: UserProfile }) {
  if (user.role === 'admin') {
    return <AdminNav />
  }
  return <RepNav />
}
```

### In Supabase RLS
The most important layer. RLS at the database level ensures even if a UI bug exposes data, the database refuses the query.

```sql
-- Users can read their own row, admins can read all
create policy "Users read self or admin reads all"
on users for select
using (
  auth.uid() = id 
  or exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- Sales: reps see own; admins see all
create policy "Sales access"
on sales for select
using (
  user_id = auth.uid()
  or exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- Sales: reps insert/update own; admins all
create policy "Sales mutations"
on sales for all
using (
  user_id = auth.uid()
  or exists (select 1 from users where id = auth.uid() and role = 'admin')
);
```

---

## Session Management

### Expiry
Default Supabase session is 1 week. For an internal tool like this, that's fine. Users will mostly stay logged in.

### Refreshing
The middleware handles auto-refresh. Users won't see explicit refresh prompts.

### Multiple devices
Supabase supports multi-device sessions natively. No special handling needed.

---

## "Remember me" / Persistent Login

Skip this. By default Supabase session cookies persist across browser restarts. That's "remembered" for this app's purposes.

---

## Forgot Password

For V1, skip in-app password reset. If a user forgets their password, an admin can reset it via Supabase dashboard.

For V2, add `/auth/reset-password` flow using Supabase's built-in:
```ts
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/auth/callback`,
})
```

---

## Don'ts

- **Don't** check auth in client components for protection (only for UX). RLS + middleware are the security.
- **Don't** put service role key in client bundle. Ever.
- **Don't** disable RLS to make a query work. Fix the policy.
- **Don't** rely on `localStorage` for tokens (Supabase handles cookies).
- **Don't** show "Invalid email or password" — be vague to avoid info leakage.
- **Don't** allow social login for V1. Email/password is enough.
- **Don't** roll your own JWT validation. Use `supabase.auth.getUser()`.
