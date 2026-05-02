'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getDbErrorMessage } from '@/lib/errors'

const activitySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  doors_knocked: z.coerce.number().int().min(0),
  conversations: z.coerce.number().int().min(0),
  presentations: z.coerce.number().int().min(0),
  sales_count: z.coerce.number().int().min(0),
  hours_worked: z.coerce.number().min(0).max(24),
  notes: z.string().optional(),
})

export type ActivityFormData = z.infer<typeof activitySchema>

export async function upsertActivity(data: ActivityFormData) {
  const parsed = activitySchema.safeParse(data)
  if (!parsed.success) {
    return { error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const d = parsed.data

  const { error } = await supabase
    .from('daily_activity')
    .upsert(
      {
        user_id: user.id,
        date: d.date,
        suburb: d.suburb,
        doors_knocked: d.doors_knocked,
        conversations: d.conversations,
        presentations: d.presentations,
        sales_count: d.sales_count,
        hours_worked: d.hours_worked,
        notes: d.notes || null,
      },
      { onConflict: 'user_id,date' },
    )

  if (error) {
    console.error('Activity upsert failed:', error)
    return { error: { _form: getDbErrorMessage(error) } }
  }

  revalidatePath('/activity')
  revalidatePath('/')
  return { success: true }
}

export async function deleteActivity(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('daily_activity').delete().eq('id', id)
  if (error) return { error: getDbErrorMessage(error) }

  revalidatePath('/activity')
  revalidatePath('/')
  return { success: true }
}
