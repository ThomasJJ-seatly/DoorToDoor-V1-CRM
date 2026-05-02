'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, TrendingUp, Info, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Field } from '@/components/forms/Field'
import { upsertActivity } from '@/app/(app)/activity/actions'
import type { ActivityFormData } from '@/app/(app)/activity/actions'

// ─── Schema (mirrors server schema for client-side validation) ────────────────

const activitySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  suburb: z.string().min(1, 'Suburb is required'),
  doors_knocked: z.number().int().min(0, 'Must be 0 or more'),
  conversations: z.number().int().min(0, 'Must be 0 or more'),
  presentations: z.number().int().min(0, 'Must be 0 or more'),
  sales_count: z.number().int().min(0, 'Must be 0 or more'),
  hours_worked: z.number().min(0, 'Must be 0 or more').max(24, 'Max 24 hours'),
  notes: z.string().optional(),
})

type ActivityFormValues = z.infer<typeof activitySchema>

// ─── Metric pill ──────────────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-secondary border border-border">
      <span className="text-accent shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-text-tertiary leading-none mb-0.5">{label}</p>
        <p className="text-sm font-medium font-mono text-text-primary">
          {value ?? <span className="text-text-tertiary">—</span>}
        </p>
      </div>
    </div>
  )
}

// ─── ActivityForm ─────────────────────────────────────────────────────────────

interface ActivityFormProps {
  defaultValues: ActivityFormData
  entryId?: string
  actualSalesCount: number
}

export function ActivityForm({ defaultValues, entryId, actualSalesCount }: ActivityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      date: defaultValues.date,
      suburb: defaultValues.suburb,
      doors_knocked: defaultValues.doors_knocked,
      conversations: defaultValues.conversations,
      presentations: defaultValues.presentations,
      sales_count: defaultValues.sales_count,
      hours_worked: defaultValues.hours_worked,
      notes: defaultValues.notes ?? '',
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  // Live metrics
  const conversations = watch('conversations')
  const sales = watch('sales_count')
  const hours = watch('hours_worked')

  const convRate =
    Number(conversations) > 0
      ? `${((Number(sales) / Number(conversations)) * 100).toFixed(0)}%`
      : null

  const salesPerHour =
    Number(hours) > 0 ? `${(Number(sales) / Number(hours)).toFixed(2)}/hr` : null

  const onSubmit = (values: ActivityFormValues) => {
    setFormError(null)
    startTransition(async () => {
      const result = await upsertActivity(values)

      if ('error' in result && result.error) {
        if ('_form' in result.error && result.error._form) {
          setFormError(result.error._form)
        } else {
          setFormError('Please check the form and try again.')
        }
        return
      }

      toast.success(entryId ? 'Activity updated' : 'Activity logged')
      router.push('/activity')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        {/* ── Section: When & where ── */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            When &amp; where
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" name="date" error={errors.date?.message} required>
              <input
                id="date"
                type="date"
                {...register('date')}
                className="input-base"
                aria-invalid={!!errors.date}
              />
            </Field>

            <Field
              label="Suburb / Area"
              name="suburb"
              error={errors.suburb?.message}
              required
            >
              <input
                id="suburb"
                type="text"
                autoCapitalize="words"
                placeholder="e.g. Fortitude Valley"
                {...register('suburb')}
                className="input-base"
                aria-invalid={!!errors.suburb}
              />
            </Field>
          </div>
        </div>

        {/* ── Section: Activity numbers ── */}
        <div className="card p-4 space-y-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Activity numbers
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Doors knocked"
              name="doors_knocked"
              error={errors.doors_knocked?.message}
              required
            >
              <input
                id="doors_knocked"
                type="number"
                inputMode="numeric"
                min={0}
                {...register('doors_knocked', { valueAsNumber: true })}
                className="input-base font-mono"
                aria-invalid={!!errors.doors_knocked}
              />
            </Field>

            <Field
              label="Conversations"
              name="conversations"
              error={errors.conversations?.message}
              required
            >
              <input
                id="conversations"
                type="number"
                inputMode="numeric"
                min={0}
                {...register('conversations', { valueAsNumber: true })}
                className="input-base font-mono"
                aria-invalid={!!errors.conversations}
              />
            </Field>
          </div>

          <Field
            label="Presentations"
            name="presentations"
            error={errors.presentations?.message}
            required
          >
            <input
              id="presentations"
              type="number"
              inputMode="numeric"
              min={0}
              {...register('presentations', { valueAsNumber: true })}
              className="input-base font-mono"
              aria-invalid={!!errors.presentations}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Sales closed"
              name="sales_count"
              error={errors.sales_count?.message}
              helper={
                actualSalesCount > 0
                  ? `${actualSalesCount} recorded in sales log`
                  : undefined
              }
              required
            >
              <div className="relative">
                <input
                  id="sales_count"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  {...register('sales_count', { valueAsNumber: true })}
                  className="input-base font-mono pr-10"
                  aria-invalid={!!errors.sales_count}
                />
                {actualSalesCount > 0 && (
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-accent"
                    title="Auto-filled from your sales records"
                    aria-label="Auto-filled from your sales records"
                  >
                    <Info className="w-4 h-4" />
                  </span>
                )}
              </div>
            </Field>

            <Field
              label="Hours worked"
              name="hours_worked"
              error={errors.hours_worked?.message}
              helper="e.g. 3.5 for 3.5 hrs"
              required
            >
              <input
                id="hours_worked"
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                {...register('hours_worked', { valueAsNumber: true })}
                className="input-base font-mono"
                aria-invalid={!!errors.hours_worked}
              />
            </Field>
          </div>

          {/* Live metrics */}
          {(convRate !== null || salesPerHour !== null) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <MetricPill
                label="Conversion rate"
                value={convRate}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricPill
                label="Sales per hour"
                value={salesPerHour}
                icon={<TrendingUp className="w-4 h-4" />}
              />
            </div>
          )}
        </div>

        {/* ── Section: Notes ── */}
        <div className="card p-4 space-y-4">
          <Field label="Notes" name="notes" error={errors.notes?.message}>
            <textarea
              id="notes"
              rows={3}
              placeholder="Anything notable about today? Areas to revisit, leads to follow up…"
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

        {/* ── Sticky footer (mobile) ── */}
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
            <button type="submit" disabled={isPending} className="primary-btn flex-1">
              {isPending
                ? entryId
                  ? 'Updating…'
                  : 'Saving…'
                : entryId
                ? 'Save changes'
                : 'Log activity'}
            </button>
          </div>
        </div>

        {/* ── Desktop actions (inline, not sticky) ── */}
        <div className="hidden lg:flex items-center justify-between gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="secondary-btn"
            disabled={isPending}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={isPending || (!!entryId && !isDirty)}
            className="primary-btn"
          >
            {isPending
              ? entryId
                ? 'Updating…'
                : 'Saving…'
              : entryId
              ? 'Save changes'
              : 'Log activity'}
          </button>
        </div>

        {/* Spacer so content isn't hidden behind mobile sticky footer */}
        <div className="h-24 lg:hidden" aria-hidden="true" />
      </div>
    </form>
  )
}
