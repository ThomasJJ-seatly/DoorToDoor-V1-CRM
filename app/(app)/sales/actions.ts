'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getDbErrorMessage } from '@/lib/errors'
import type { PaymentStatus, PaymentMethod, DeliveryStatus } from '@/types/database'

const saleSchema = z.object({
  sale_date: z.string().min(1, 'Date is required'),
  customer_business_name: z.string().min(1, 'Business name is required'),
  customer_suburb: z.string().min(1, 'Suburb is required'),
  customer_address: z.string().optional(),
  customer_contact_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  quantity: z.coerce.number().int().min(1, 'Minimum 1').max(100),
  payment_status: z.enum(['paid', 'pending', 'failed']),
  payment_method: z.enum(['card', 'cash', 'bank_transfer', 'other']).optional(),
  delivery_status: z.enum(['delivered', 'pending', 'na']),
  notes: z.string().optional(),
})

export type SaleFormData = z.infer<typeof saleSchema>

export type SaleActionResult =
  | { success: true; error?: never }
  | { success?: never; error: { fields?: Record<string, string[] | undefined>; _form?: string } }

export async function createSale(data: SaleFormData): Promise<SaleActionResult> {
  const parsed = saleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const d = parsed.data
  const totalValue = 199.0 * d.quantity

  const { error } = await supabase.from('sales').insert({
    user_id: user.id,
    sale_date: d.sale_date,
    customer_business_name: d.customer_business_name,
    customer_suburb: d.customer_suburb,
    customer_address: d.customer_address || null,
    customer_contact_name: d.customer_contact_name || null,
    customer_phone: d.customer_phone || null,
    customer_email: d.customer_email || null,
    product: 'Mechanic VIP Voucher Bundle',
    unit_price: 199.0,
    quantity: d.quantity,
    total_value: totalValue,
    payment_status: d.payment_status as PaymentStatus,
    payment_method: (d.payment_method || null) as PaymentMethod | null,
    delivery_status: d.delivery_status as DeliveryStatus,
    notes: d.notes || null,
    commission: 0, // set by DB trigger after insert
  })

  if (error) {
    console.error('Sale creation failed:', error)
    return { error: { _form: getDbErrorMessage(error) } }
  }

  revalidatePath('/sales')
  revalidatePath('/')
  return { success: true }
}

export async function updateSale(id: string, data: SaleFormData): Promise<SaleActionResult> {
  const parsed = saleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: { fields: parsed.error.flatten().fieldErrors } }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const d = parsed.data
  const totalValue = 199.0 * d.quantity

  const { error } = await supabase
    .from('sales')
    .update({
      sale_date: d.sale_date,
      customer_business_name: d.customer_business_name,
      customer_suburb: d.customer_suburb,
      customer_address: d.customer_address || null,
      customer_contact_name: d.customer_contact_name || null,
      customer_phone: d.customer_phone || null,
      customer_email: d.customer_email || null,
      quantity: d.quantity,
      total_value: totalValue,
      payment_status: d.payment_status as PaymentStatus,
      payment_method: (d.payment_method || null) as PaymentMethod | null,
      delivery_status: d.delivery_status as DeliveryStatus,
      notes: d.notes || null,
    })
    .eq('id', id)

  if (error) {
    console.error('Sale update failed:', error)
    return { error: { _form: getDbErrorMessage(error) } }
  }

  revalidatePath('/sales')
  revalidatePath('/')
  revalidatePath(`/sales/${id}`)
  return { success: true }
}

export async function deleteSale(
  id: string,
): Promise<{ success: true } | { success?: never; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('sales').delete().eq('id', id)

  if (error) {
    console.error('Sale deletion failed:', error)
    return { error: getDbErrorMessage(error) }
  }

  revalidatePath('/sales')
  revalidatePath('/')
  return { success: true }
}
