import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { CustomerDetailClient } from '@/components/forms/CustomerDetailClient'

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!customer) notFound()

  const { data: sales } = await supabase
    .from('sales')
    .select('id, sale_date, quantity, total_value, payment_status, delivery_status, user_id')
    .eq('customer_business_name', customer.business_name)
    .order('sale_date', { ascending: false })

  let userMap: Record<string, string> = {}
  if (user.role === 'admin') {
    const { data: users } = await supabase.from('users').select('id, full_name')
    users?.forEach((u) => {
      userMap[u.id] = u.full_name
    })
  }

  return (
    <CustomerDetailClient
      customer={customer}
      sales={sales ?? []}
      userMap={userMap}
      isAdmin={user.role === 'admin'}
    />
  )
}
