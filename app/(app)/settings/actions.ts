'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ProfileActionResult =
  | { success: true; error?: never }
  | { success?: never; error: string }

export async function updateProfile(fullName: string): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse({ fullName })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('users')
    .update({ full_name: parsed.data.fullName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/')
  return { success: true }
}

export async function updatePassword(
  newPassword: string,
  confirmPassword: string
): Promise<ProfileActionResult> {
  const parsed = passwordSchema.safeParse({ newPassword, confirmPassword })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  await requireUser()
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword })
  if (error) return { error: error.message }

  return { success: true }
}
