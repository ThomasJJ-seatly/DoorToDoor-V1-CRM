# Skill: Supabase Patterns

Standard patterns for talking to Supabase across the app. Follow these exactly to keep behaviour consistent and avoid auth/security bugs.

---

## Client Setup

### `lib/supabase/client.ts` (browser)
```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` (server components, server actions)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### `lib/supabase/middleware.ts` (edge middleware for auth refresh)
Standard Supabase SSR middleware pattern. Use it as-is from official docs.

### `lib/supabase/admin.ts` (server-only, bypasses RLS)
```ts
// Only use for admin-level operations like creating users
// NEVER import this in client components
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

---

## Default to Server Components

Fetch data in server components whenever possible. Only use client components when you need interactivity, state, or browser APIs.

### Server component pattern (preferred)
```tsx
// app/(app)/sales/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function SalesPage() {
  const supabase = await createClient()
  
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('sale_date', { ascending: false })
    .limit(50)
  
  if (error) {
    return <ErrorState message="Couldn't load sales" />
  }
  
  if (!sales || sales.length === 0) {
    return <EmptyState />
  }
  
  return <SalesList sales={sales} />
}
```

### Client component data fetching (only when needed)
```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Use SWR or just useEffect for client-side fetching
// Only do this when you need live updates or user interactions trigger refetches
```

---

## Mutations: Always Use Server Actions

Never POST to Supabase from the client directly for mutations. Always use server actions. This keeps validation server-side and lets us use the auth-aware server client.

### Server action pattern
```ts
// app/(app)/sales/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saleSchema } from '@/lib/schemas'

export async function createSale(formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Validate
  const parsed = saleSchema.safeParse({
    customer_business_name: formData.get('customer_business_name'),
    customer_suburb: formData.get('customer_suburb'),
    quantity: Number(formData.get('quantity')),
    payment_status: formData.get('payment_status'),
    // ...
  })
  
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }
  
  // Insert
  const { data, error } = await supabase
    .from('sales')
    .insert({
      ...parsed.data,
      user_id: user.id,
      sale_date: new Date().toISOString().split('T')[0],
      unit_price: 199.00,
      total_value: 199.00 * parsed.data.quantity,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Sale creation failed:', error)
    return { error: { _form: ['Could not save sale. Please try again.'] } }
  }
  
  revalidatePath('/sales')
  revalidatePath('/')
  redirect(`/sales/${data.id}`)
}
```

---

## Type Safety

### Generate Supabase types
After every schema change, regenerate the types:

```bash
npx supabase gen types typescript --project-id YOUR_ID > types/database.ts
```

### Always type your queries
```ts
// Good — fully typed
const { data, error } = await supabase
  .from('sales')
  .select('id, customer_business_name, total_value, sale_date')
  .returns<SalesListItem[]>()

// Bad — implicit any
const { data, error } = await supabase
  .from('sales')
  .select('*')
```

### Define view models in `types/`
Don't pass raw database rows around. Define what each component needs:

```ts
// types/sales.ts
export type SalesListItem = {
  id: string
  customer_business_name: string
  customer_suburb: string
  total_value: number
  sale_date: string
  payment_status: 'paid' | 'pending' | 'failed'
  user: { full_name: string }
}
```

---

## RLS-Aware Querying

### Trust RLS, don't second-guess it
RLS handles "this user can only see their own data" at the database level. Don't add redundant `.eq('user_id', user.id)` filters in queries — that's belt and braces and can mask bugs.

```ts
// Good — RLS handles access
const { data } = await supabase.from('sales').select('*')

// Bad — duplicates RLS, can hide bugs if RLS is misconfigured
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', user.id) // unnecessary
```

### Exception: Admin queries
Admins should see all data. RLS allows this. But if you're explicitly filtering for one rep's data as an admin (e.g. on a user detail page), filter explicitly:

```ts
// Admin viewing a specific rep's sales
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', repId)
```

---

## Joins and Relationships

### Use Supabase's nested select
```ts
const { data } = await supabase
  .from('sales')
  .select(`
    id,
    customer_business_name,
    total_value,
    user:users!sales_user_id_fkey (
      full_name
    )
  `)
```

### When you need complex joins, use a view
For dashboard queries that aggregate across tables, create a Postgres view:

```sql
create view dashboard_today as
select
  user_id,
  count(*) as sales_count,
  sum(total_value) as revenue,
  sum(commission) as commission
from sales
where sale_date = current_date
group by user_id;
```

Then query the view like a table.

---

## Error Handling

### Standardise error UX
Every database call has three states: success, error, empty. Always handle all three.

```tsx
const { data, error } = await supabase.from('sales').select('*')

if (error) {
  // Log for debugging
  console.error('Failed to load sales:', error)
  return <ErrorState onRetry={...} />
}

if (!data || data.length === 0) {
  return <EmptyState />
}

return <SalesList sales={data} />
```

### Don't expose Supabase errors to users
Map them to friendly messages:

```ts
function getErrorMessage(error: PostgrestError): string {
  if (error.code === '23505') return 'A record with this name already exists.'
  if (error.code === '23503') return 'Cannot delete — this record is in use.'
  if (error.code === '42501') return "You don't have permission to do that."
  return 'Something went wrong. Please try again.'
}
```

---

## Real-time Subscriptions

For the dashboard, set up real-time subscriptions so KPIs update live when a sale is logged from another device.

### Pattern
```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DashboardLiveUpdates() {
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('sales-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sales',
      }, () => {
        router.refresh() // Re-runs server components
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [router, supabase])
  
  return null
}
```

Mount this component in the dashboard layout and KPIs auto-update.

---

## Auth Patterns

### Get current user in server components
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) redirect('/login')

// Get user's role from your own users table
const { data: profile } = await supabase
  .from('users')
  .select('role, full_name')
  .eq('id', user.id)
  .single()
```

### Role checks
Centralise role checks in `lib/auth.ts`:

```ts
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (data?.role !== 'admin') {
    redirect('/')
  }
}
```

---

## Don'ts

- **Don't** use the service role key in client components
- **Don't** store tokens in localStorage (Supabase handles cookies)
- **Don't** disable RLS to "make things work" — fix the policy
- **Don't** fetch data in `useEffect` when a server component would do
- **Don't** mutate state from a client component without a server action
- **Don't** skip `revalidatePath` after mutations — your UI will be stale
