import { createClient } from '@/lib/supabase/client'

export async function previewCommission(userId: string, quantity: number, saleDate: string): Promise<{
  commission: number
  rate: number
  willUpgrade: boolean
  currentUnits: number
}> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('sales')
    .select('quantity')
    .eq('user_id', userId)
    .eq('sale_date', saleDate)

  const existingUnits = existing?.reduce((sum, s) => sum + (s.quantity as number), 0) ?? 0
  const newTotal = existingUnits + quantity

  const rate = newTotal >= 6 ? 100 : 80
  const willUpgrade = existingUnits < 6 && newTotal >= 6

  return {
    commission: rate * quantity,
    rate,
    willUpgrade,
    currentUnits: existingUnits,
  }
}
