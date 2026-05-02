'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, role: 'admin' | 'rep') {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('users').update({ role }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/users')
  return { success: true }
}

export async function deactivateUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/users')
  return { success: true }
}

export async function reactivateUser(userId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/users')
  return { success: true }
}

export async function inviteUser(email: string, fullName: string, role: 'admin' | 'rep') {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/`,
  })

  if (error) return { error: error.message }

  // Update role after invite (DB trigger creates the user row on sign-up)
  if (data.user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient.from('users') as any)
      .update({ full_name: fullName, role })
      .eq('id', data.user.id)
  }

  revalidatePath('/users')
  return { success: true }
}
