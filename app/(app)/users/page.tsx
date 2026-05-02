import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { UsersClient } from '@/components/forms/UsersClient'

export default async function UsersPage() {
  const admin = await requireAdmin()
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: salesCounts } = await supabase.from('sales').select('user_id, total_value')

  const userStats: Record<string, { count: number; revenue: number }> = {}
  salesCounts?.forEach((s) => {
    if (!userStats[s.user_id]) userStats[s.user_id] = { count: 0, revenue: 0 }
    userStats[s.user_id].count++
    userStats[s.user_id].revenue += Number(s.total_value)
  })

  return (
    <UsersClient
      users={users ?? []}
      userStats={userStats}
      currentUserId={admin.id}
    />
  )
}
