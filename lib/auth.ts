import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserProfile } from '@/types/database'

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as UserProfile | null
}

export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!user.is_active) redirect('/login?reason=inactive')
  return user
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/')
  return user
}
