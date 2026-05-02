'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DollarSign,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Info,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { previewCommission } from '@/lib/commission'
import { Field } from '@/components/forms/Field'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createSale, updateSale, deleteSale } from '@/app/(app)/sales/actions'
import type { PaymentStatus, PaymentMethod, DeliveryStatus, UserRole } from '@/types/database'

// ─── Schema (mirrors server-side, duplicated for client validation) ───────────

const saleSchema = z.object({
  sale_date: z.string().min(1, 'Date is required'),
  customer_business_name: z.string().min(1, 'Business name is required'),
  customer_suburb: z.string().min(1, 'Suburb is required'),
  customer_address: z.string().optional(),
  customer_contact_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  quantity: z.number().int().min(1, 'Minimum 1').max(100),
  payment_status: z.enum(['paid', 'pending', 'failed']),
  payment_method: z.enum(['card', 'cash', 'bank_transfer', 'other']).optional(),
  delivery_status: z.enum(['delivered', 'pending', 'na']),
  notes: z.string().optional(),
})

type SaleFormValues = z.infer<typeof saleSchema>

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getLastPaymentMethod(): PaymentMethod {
  if (typeof window === 'undefined') return 'card'
  return (localStorage.getItem('last_payment_method') as PaymentMethod) ?? 'card'
}

function saveLastPaymentMethod(method: string) {
  if (typeof window !== 'undefined') localStorage.setItem('last_payment_method', method)
}

// ─── Payment status radio card ────────────────────────────────────────────────

const PAYMENT_OPTIONS: {
  value: PaymentStatus
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  border: string
}[] = [
  {
    value: 'paid',
    label: 'Paid',
    icon: CheckCircle2,
    color: 'text-status-success',
    bg: 'bg-status-successBg',
    border: 'border-status-success',
  },
  {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    color: 'text-status-warning',
    bg: 'bg-status-warningBg',
    border: 'border-status-warning',
  },
  {
    value: 'failed',
    label: 'Failed',
    icon: XCircle,
    color: 'text-status-danger',
    bg: 'bg-status-dangerBg',
    border: 'border-status-danger',
  },
]

// ─── Commission preview panel ─────────────────────────────────────────────────

function CommissionPreview({
  userId,
  userRole,
  quantity,
  saleDate,
  savedCommission,
}: {
  userId: string
  userRole: UserRole
  quantity: number
  saleDate: string
  savedCommission?: number
}) {
  const [preview, setPreview] = useState<{
    commission: number
    rate: number
    willUpgrade: boolean
    currentUnits: number
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchPreview = useCallback(async () => {
    if (!saleDate || quantity < 1) return
    if (userRole === 'admin') return // admins keep full revenue
    setLoading(true)
    try {
      const result = await previewCommission(userId, quantity, saleDate)
      setPreview(result)
    } catch {
      // silently fail — commission preview is non-critical
    } finally {
      setLoading(false)
    }
  }, [userId, userRole, quantity, saleDate])

  useEffect(() => {
    const t = setTimeout(fetchPreview, 400)
    return () => clearTimeout(t)
  }, [fetchPreview])

  if (userRole === 'admin') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-light border border-accent-border">
        <DollarSign className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-accent">Full revenue retained</p>
          <p className="text-xs text-text-secondary mt-0.5">
            As a founder, you keep 100% of the sale value.
          </p>
          {savedCommission !== undefined && (
            <p className="text-xs text-text-secondary mt-1">
              Recorded:{' '}
              <span className="font-mono font-medium text-text-primary">
                {formatCurrency(savedCommission)}
              </span>
            </p>
          )}
        </div>
      </div>
    )
  }

  const totalValue = 199 * quantity

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary border border-border">
      <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-4 w-24 bg-border rounded animate-pulse" />
        ) : preview ? (
          <>
            <p className="text-sm font-medium text-text-primary">
              Commission:{' '}
              <span className="font-mono text-accent">{formatCurrency(preview.commission)}</span>
              <span className="text-xs text-text-secondary ml-1.5">
                (${preview.rate}/unit × {quantity})
              </span>
            </p>
            {preview.willUpgrade && (
              <p className="text-xs text-status-success mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Hitting 6 sales today — rate upgrades to $100 for all today&apos;s sales
              </p>
            )}
            {!preview.willUpgrade && preview.currentUnits < 6 && (
              <p className="text-xs text-text-secondary mt-1">
                {Math.max(0, 6 - (preview.currentUnits + quantity))} more unit
                {Math.max(0, 6 - (preview.currentUnits + quantity)) !== 1 ? 's' : ''} to reach
                $100/unit tier
              </p>
            )}
            {preview.rate === 100 && !preview.willUpgrade && (
              <p className="text-xs text-status-success mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                $100/unit tier active today
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Commission: ~
            <span className="font-mono">{formatCurrency(80 * quantity)}</span>
            <span className="text-xs ml-1">(estimate — $80/unit base rate)</span>
          </p>
        )}
        <p className="text-xs text-text-tertiary mt-1">
          Sale value: <span className="font-mono">{formatCurrency(totalValue)}</span>
        </p>
      </div>
    </div>
  )
}

// ─── Main SaleForm component ──────────────────────────────────────────────────

interface SaleFormProps {
  mode: 'create' | 'edit'
  saleId?: string
  defaultValues?: Partial<SaleFormValues>
  userId: string
  userRole: UserRole
  commission?: number
}

export function SaleForm({
  mode,
  saleId,
  defaultValues,
  userId,
  userRole,
  commission,
}: SaleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      sale_date: defaultValues?.sale_date ?? '',
      customer_business_name: defaultValues?.customer_business_name ?? '',
      customer_suburb: defaultValues?.customer_suburb ?? '',
      customer_address: defaultValues?.customer_address ?? '',
      customer_contact_name: defaultValues?.customer_contact_name ?? '',
      customer_phone: defaultValues?.customer_phone ?? '',
      customer_email: defaultValues?.customer_email ?? '',
      quantity: defaultValues?.quantity ?? 1,
      payment_status: defaultValues?.payment_status ?? 'paid',
      payment_method: defaultValues?.payment_method,
      delivery_status: defaultValues?.delivery_status ?? 'pending',
      notes: defaultValues?.notes ?? '',
    },
  })

  // On create, load last used payment method from localStorage
  useEffect(() => {
    if (mode === 'create' && !defaultValues?.payment_method) {
      const last = getLastPaymentMethod()
      setValue('payment_method', last as PaymentMethod)
    }
  }, [mode, defaultValues?.payment_method, setValue])

  const watchedQuantity = watch('quantity')
  const watchedSaleDate = watch('sale_date')
  const watchedPaymentMethod = watch('payment_method')

  // Save payment method to localStorage whenever it changes
  useEffect(() => {
    if (watchedPaymentMethod) {
      saveLastPaymentMethod(watchedPaymentMethod)
    }
  }, [watchedPaymentMethod])

  const onSubmit = (values: SaleFormValues) => {
    setFormError(null)
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSale(values)
          : await updateSale(saleId!, values)

      if ('error' in result && result.error) {
        if ('_form' in result.error && result.error._form) {
          setFormError(result.error._form)
        } else {
          setFormError('Please fix the errors above.')
        }
        return
      }

      if (mode === 'create') {
        toast.success('Sale logged successfully')
        router.push('/sales')
      } else {
        toast.success('Sale updated')
        router.push('/sales')
      }
    })
  }

  const handleDelete = async () => {
    if (!saleId) return
    const result = await deleteSale(saleId)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Sale deleted')
      router.push('/sales')
    }
  }

  const totalValue = 199 * (watchedQuantity || 1)

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-4">
          {/* ── Section: Sale details ── */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Sale details
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Date"
                name="sale_date"
                error={errors.sale_date?.message}
                required
              >
                <input
                  id="sale_date"
                  type="date"
                  {...register('sale_date')}
                  className="input-base"
                  aria-invalid={!!errors.sale_date}
                />
              </Field>

              <Field
                label="Quantity"
                name="quantity"
                error={errors.quantity?.message}
                required
              >
                <input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  {...register('quantity', { valueAsNumber: true })}
                  className="input-base font-mono"
                  aria-invalid={!!errors.quantity}
                />
              </Field>
            </div>

            {/* Product summary */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-secondary border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Mechanic VIP Voucher Bundle</p>
                <p className="text-xs text-text-secondary mt-0.5">$199.00 per unit</p>
              </div>
              <p className="font-mono font-medium text-text-primary text-lg">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>

          {/* ── Section: Customer ── */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Customer
            </p>

            <Field
              label="Business name"
              name="customer_business_name"
              error={errors.customer_business_name?.message}
              required
            >
              <input
                id="customer_business_name"
                type="text"
                autoCapitalize="words"
                autoComplete="organization"
                placeholder="e.g. Brisbane Auto Repairs"
                {...register('customer_business_name')}
                className="input-base"
                aria-invalid={!!errors.customer_business_name}
              />
            </Field>

            <Field
              label="Suburb"
              name="customer_suburb"
              error={errors.customer_suburb?.message}
              required
            >
              <input
                id="customer_suburb"
                type="text"
                autoCapitalize="words"
                placeholder="e.g. Fortitude Valley"
                {...register('customer_suburb')}
                className="input-base"
                aria-invalid={!!errors.customer_suburb}
              />
            </Field>

            <Field
              label="Address"
              name="customer_address"
              error={errors.customer_address?.message}
            >
              <input
                id="customer_address"
                type="text"
                autoCapitalize="words"
                autoComplete="street-address"
                placeholder="Street address (optional)"
                {...register('customer_address')}
                className="input-base"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Contact name"
                name="customer_contact_name"
                error={errors.customer_contact_name?.message}
              >
                <input
                  id="customer_contact_name"
                  type="text"
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="First & last name"
                  {...register('customer_contact_name')}
                  className="input-base"
                />
              </Field>

              <Field
                label="Phone"
                name="customer_phone"
                error={errors.customer_phone?.message}
              >
                <input
                  id="customer_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="04XX XXX XXX"
                  {...register('customer_phone')}
                  className="input-base"
                />
              </Field>
            </div>

            <Field
              label="Email"
              name="customer_email"
              error={errors.customer_email?.message}
            >
              <input
                id="customer_email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="owner@example.com (optional)"
                {...register('customer_email')}
                className="input-base"
              />
            </Field>
          </div>

          {/* ── Section: Payment ── */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Payment
            </p>

            {/* Payment status — radio cards */}
            <Field
              label="Payment status"
              name="payment_status"
              error={errors.payment_status?.message}
              required
            >
              <Controller
                name="payment_status"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment status">
                    {PAYMENT_OPTIONS.map((opt) => {
                      const Icon = opt.icon
                      const isSelected = field.value === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => field.onChange(opt.value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${opt.bg} ${opt.border} ${opt.color}`
                              : 'border-border bg-bg-elevated text-text-secondary hover:border-border-strong'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            </Field>

            {/* Payment method */}
            <Field
              label="Payment method"
              name="payment_method"
              error={errors.payment_method?.message}
            >
              <select
                id="payment_method"
                {...register('payment_method')}
                className="input-base"
              >
                <option value="">Select method…</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </Field>

            {/* Delivery status */}
            <Field
              label="Delivery status"
              name="delivery_status"
              error={errors.delivery_status?.message}
              required
            >
              <select
                id="delivery_status"
                {...register('delivery_status')}
                className="input-base"
                aria-invalid={!!errors.delivery_status}
              >
                <option value="pending">Pending delivery</option>
                <option value="delivered">Delivered</option>
                <option value="na">N/A</option>
              </select>
            </Field>
          </div>

          {/* ── Section: Commission preview ── */}
          <CommissionPreview
            userId={userId}
            userRole={userRole}
            quantity={watchedQuantity || 1}
            saleDate={watchedSaleDate || ''}
            savedCommission={commission}
          />

          {/* ── Section: Notes ── */}
          <div className="card p-4 space-y-4">
            <Field label="Notes" name="notes" error={errors.notes?.message}>
              <textarea
                id="notes"
                rows={3}
                placeholder="Any notes about this sale…"
                {...register('notes')}
                className="input-base h-auto py-3 resize-none"
              />
            </Field>
          </div>

          {/* ── Form-level error ── */}
          {formError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-status-dangerBg border border-status-danger/30">
              <XCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
              <p className="text-sm text-status-danger">{formError}</p>
            </div>
          )}

          {/* ── Actions ── */}
          {/* Sticky footer on mobile, inline on desktop */}
          <div className="fixed bottom-16 inset-x-0 p-4 bg-bg-primary border-t border-border lg:hidden z-20">
            <div className="flex gap-3 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="secondary-btn"
                disabled={isPending}
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="danger-btn"
                  disabled={isPending}
                  aria-label="Delete sale"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="primary-btn flex-1"
              >
                {isPending
                  ? mode === 'create'
                    ? 'Saving…'
                    : 'Updating…'
                  : mode === 'create'
                  ? 'Save sale'
                  : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Desktop actions (not sticky) */}
          <div className="hidden lg:flex items-center justify-between gap-3 pb-8">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="secondary-btn"
                disabled={isPending}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="danger-btn"
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete sale
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isPending || (mode === 'edit' && !isDirty)}
              className="primary-btn"
            >
              {isPending
                ? mode === 'create'
                  ? 'Saving…'
                  : 'Updating…'
                : mode === 'create'
                ? 'Save sale'
                : 'Save changes'}
            </button>
          </div>

          {/* Spacer so content isn't hidden behind the mobile sticky footer */}
          <div className="h-24 lg:hidden" aria-hidden="true" />
        </div>
      </form>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete this sale?"
          description="This will permanently remove the sale record. This action cannot be undone."
          confirmLabel="Delete sale"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}
