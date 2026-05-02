import { createBrowserClient } from '@supabase/ssr'

// Using untyped client — query results are cast explicitly at each call site
// Once the app is connected to Supabase, run:
//   npx supabase gen types typescript --project-id YOUR_ID > types/database.ts
// to replace this with generated types.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
