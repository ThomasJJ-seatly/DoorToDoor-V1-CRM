import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { SalesListClient } from '@/components/forms/SalesListClient'

export const metadata = { title: 'Sales — D2D Tracker' }

export default async function SalesPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from('sales')
    .select(
      'id, sale_date, customer_business_name, customer_suburb, quantity, total_value, payment_status, delivery_status, user_id, notes, commission',
    )
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  // Build a user display-name map — admins see everyone, reps see only themselves
  let userMap: Record<string, string> = {}
  if (user.role === 'admin') {
    const { data: users } = await supabase.from('users').select('id, full_name')
    users?.forEach((u) => {
      userMap[u.id] = u.full_name
    })
  } else {
    userMap[user.id] = user.full_name
  }

  return (
    <SalesListClient
      sales={sales ?? []}
      userMap={userMap}
      isAdmin={user.role === 'admin'}
      currentUserId={user.id}
    />
  )
}
