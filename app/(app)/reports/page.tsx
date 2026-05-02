import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { ReportsClient } from '@/components/dashboard/ReportsClient'
import { format, startOfMonth } from 'date-fns'

export default async function ReportsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const today = format(new Date(), 'yyyy-MM-dd')
  const defaultStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: allSales } = await supabase
    .from('sales')
    .select(
      'id, sale_date, customer_business_name, customer_suburb, quantity, total_value, payment_status, commission, user_id'
    )
    .order('sale_date', { ascending: false })

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
    <ReportsClient
      allSales={allSales ?? []}
      userMap={userMap}
      isAdmin={user.role === 'admin'}
      currentUserId={user.id}
      defaultDateRange={{ start: defaultStart, end: today }}
    />
  )
}
