import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { ActivityForm } from '@/components/forms/ActivityForm'
import { format } from 'date-fns'

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const { edit } = searchParams
  const user = await requireUser()
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Check if editing an existing entry
  let existingEntry = null
  if (edit) {
    const { data } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('id', edit)
      .single()
    existingEntry = data
  } else {
    // Check if today's entry already exists — if so, load it for editing
    const { data } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
    existingEntry = data
  }

  // Pull today's actual sales count from sales table
  const { data: todaySales } = await supabase
    .from('sales')
    .select('quantity')
    .eq('user_id', user.id)
    .eq('sale_date', existingEntry?.date ?? today)

  const actualSalesCount = todaySales?.length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-tight">
          {existingEntry ? 'Edit Activity' : 'Log Activity'}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {existingEntry
            ? `Updating entry for ${format(new Date(existingEntry.date + 'T00:00:00'), 'd MMMM yyyy')}`
            : "Log today's field activity"}
        </p>
      </div>
      <ActivityForm
        defaultValues={{
          date: existingEntry?.date ?? today,
          suburb: existingEntry?.suburb ?? '',
          doors_knocked: existingEntry?.doors_knocked ?? 0,
          conversations: existingEntry?.conversations ?? 0,
          sales_count: existingEntry?.sales_count ?? actualSalesCount,
          hours_worked: existingEntry?.hours_worked ?? 0,
          notes: existingEntry?.notes ?? '',
        }}
        entryId={existingEntry?.id}
        actualSalesCount={actualSalesCount}
      />
    </div>
  )
}
