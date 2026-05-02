import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { CustomersListClient } from '@/components/forms/CustomersListClient'

export default async function CustomersPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('total_spend', { ascending: false })

  return (
    <CustomersListClient
      customers={customers ?? []}
      isAdmin={user.role === 'admin'}
    />
  )
}
