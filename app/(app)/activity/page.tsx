import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { ActivityListClient } from '@/components/forms/ActivityListClient'
import { format } from 'date-fns'

export default async function ActivityPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: activities } = await supabase
    .from('daily_activity')
    .select('*')
    .order('date', { ascending: false })
    .limit(100)

  // User map for admin view
  let userMap: Record<string, string> = {}
  if (user.role === 'admin') {
    const { data: users } = await supabase.from('users').select('id, full_name')
    users?.forEach((u) => {
      userMap[u.id] = u.full_name
    })
  }

  const todayEntry =
    activities?.find((a) => a.date === today && a.user_id === user.id) ?? null

  return (
    <ActivityListClient
      activities={activities ?? []}
      userMap={userMap}
      isAdmin={user.role === 'admin'}
      today={today}
      todayEntry={todayEntry}
    />
  )
}
