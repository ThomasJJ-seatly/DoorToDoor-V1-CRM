import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { SaleForm } from '@/components/forms/SaleForm'
import { formatCurrency, formatDate } from '@/lib/format'

export const metadata = { title: 'Edit Sale — D2D Tracker' }

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from('sales')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!sale) notFound()

  // Reps can only see their own sales (RLS handles DB-level, but guard UI too)
  if (user.role !== 'admin' && sale.user_id !== user.id) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Edit Sale</h1>
        <p className="text-sm text-text-secondary mt-1">
          {sale.customer_business_name} — {formatCurrency(sale.total_value)} on{' '}
          {formatDate(sale.sale_date)}
        </p>
      </div>
      <SaleForm
        mode="edit"
        saleId={sale.id}
        defaultValues={{
          sale_date: sale.sale_date,
          customer_business_name: sale.customer_business_name,
          customer_suburb: sale.customer_suburb,
          customer_address: sale.customer_address ?? '',
          customer_contact_name: sale.customer_contact_name ?? '',
          customer_phone: sale.customer_phone ?? '',
          customer_email: sale.customer_email ?? '',
          quantity: sale.quantity,
          payment_status: sale.payment_status,
          payment_method: sale.payment_method ?? undefined,
          delivery_status: sale.delivery_status,
          notes: sale.notes ?? '',
        }}
        userId={user.id}
        userRole={user.role}
        commission={sale.commission}
      />
    </div>
  )
}
