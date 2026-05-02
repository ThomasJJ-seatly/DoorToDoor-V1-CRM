import { requireUser } from '@/lib/auth'
import { SaleForm } from '@/components/forms/SaleForm'
import { format } from 'date-fns'

export const metadata = { title: 'New Sale — D2D Tracker' }

export default async function NewSalePage() {
  const user = await requireUser()
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">New Sale</h1>
        <p className="text-sm text-text-secondary mt-1">Log a sale — takes under 30 seconds</p>
      </div>
      <SaleForm
        mode="create"
        defaultValues={{
          sale_date: today,
          quantity: 1,
          payment_status: 'paid',
          delivery_status: 'pending',
        }}
        userId={user.id}
        userRole={user.role}
      />
    </div>
  )
}
