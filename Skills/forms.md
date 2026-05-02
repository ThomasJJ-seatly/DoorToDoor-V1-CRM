# Skill: Forms

Every form in this app uses the same patterns. Forms are the most-used interaction (logging sales, daily activity), so getting them right compounds.

Stack: React Hook Form + Zod for schema/validation, server actions for submission.

---

## Standard Form Pattern

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSale } from './actions'

const saleSchema = z.object({
  customer_business_name: z.string().min(1, 'Required'),
  customer_suburb: z.string().min(1, 'Required'),
  customer_phone: z.string().optional(),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1).max(100),
  payment_status: z.enum(['paid', 'pending', 'failed']),
  payment_method: z.enum(['card', 'cash', 'bank_transfer', 'other']).optional(),
  notes: z.string().optional(),
})

type SaleFormData = z.infer<typeof saleSchema>

export function SaleForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      quantity: 1,
      payment_method: getLastUsedPaymentMethod(),
      payment_status: 'paid',
    },
  })
  
  const onSubmit = (data: SaleFormData) => {
    startTransition(async () => {
      const result = await createSale(data)
      
      if (result?.error) {
        if (typeof result.error === 'object' && '_form' in result.error) {
          form.setError('root', { message: result.error._form[0] })
        } else {
          // Map field-level errors back to form
          Object.entries(result.error).forEach(([key, messages]) => {
            form.setError(key as keyof SaleFormData, { message: messages?.[0] })
          })
        }
        return
      }
      
      // Success
      saveLastUsedPaymentMethod(data.payment_method)
      toast.success('Sale recorded')
      router.push('/')
    })
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* fields */}
      
      {form.formState.errors.root && (
        <div className="text-sm text-status-danger">
          {form.formState.errors.root.message}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isPending}
        className="primary-btn w-full md:w-auto"
      >
        {isPending ? 'Saving…' : 'Save sale'}
      </button>
    </form>
  )
}
```

---

## Field Component Pattern

Build reusable field components instead of repeating label/input/error markup.

```tsx
// components/forms/Field.tsx
type FieldProps = {
  label: string
  name: string
  error?: string
  helper?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, name, error, helper, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-status-danger ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-status-danger">{error}</p>
      ) : helper ? (
        <p className="text-xs text-text-tertiary">{helper}</p>
      ) : null}
    </div>
  )
}
```

Usage:
```tsx
<Field
  label="Customer business"
  name="customer_business_name"
  error={form.formState.errors.customer_business_name?.message}
  required
>
  <input
    {...form.register('customer_business_name')}
    id="customer_business_name"
    autoCapitalize="words"
    className="input-base"
  />
</Field>
```

---

## Validation Timing

### Validate on blur, not on every keystroke
Showing red errors as someone types is hostile. Wait until they leave the field.

```tsx
useForm({
  mode: 'onBlur', // validate on blur
  reValidateMode: 'onChange', // once a field has been touched, validate live to clear errors
})
```

### Validate on submit before letting it through
React Hook Form does this automatically with `handleSubmit`.

---

## Error Messages

### Be specific, kind, actionable
- Bad: "Required"
- Good: "Customer business name is needed"

- Bad: "Invalid"
- Good: "Phone number should be 10 digits, e.g. 0412 345 678"

### Where errors appear
- Field-specific errors: directly below the field
- Form-level errors (e.g. server failure): at top of form OR in toast
- Network errors: toast with retry option

### Never show stack traces or technical errors to users
Wrap server-side errors in try/catch and return user-friendly messages from server actions.

---

## Required vs Optional

### Mark required fields, not optional
```tsx
<label>Customer business <span className="text-danger">*</span></label>
```

If most fields are optional, this gets noisy. In that case, mark optional ones instead.

For this app's sales form: business name, suburb, payment status are required. Mark them with `*`.

---

## Defaults That Save Time

The "Add Sale" form is logged 5-10 times a day. Pre-fill aggressively.

### From localStorage (last-used preferences)
- Last used payment method
- Last used suburb (debatable — user often moves between suburbs)

### From context (always)
- Date = today
- Product = Mechanic VIP Voucher Bundle
- Unit price = $199
- Quantity = 1
- User_id = current user

### Pattern
```ts
function getLastUsedPaymentMethod(): PaymentMethod {
  if (typeof window === 'undefined') return 'card'
  return (localStorage.getItem('last_payment_method') as PaymentMethod) ?? 'card'
}

function saveLastUsedPaymentMethod(method: PaymentMethod | undefined) {
  if (!method) return
  localStorage.setItem('last_payment_method', method)
}
```

---

## Loading State

Always disable the submit button while submitting. Show different label.

```tsx
<button disabled={isPending}>
  {isPending ? 'Saving…' : 'Save sale'}
</button>
```

Disable other actions too if relevant (don't let user navigate away mid-save).

---

## Optimistic Updates (For Quick Wins)

For low-risk, fast operations, show success optimistically and roll back if it fails.

For the sales form: the operation isn't fast enough for true optimism (insert + commission recalculation), so don't bother. Just show a clean loading state.

For toggle-like operations (mark notes as read, update settings), use optimism.

---

## Auto-save for Long Forms

The Daily Activity form has more fields. If a user starts filling it and gets distracted, they shouldn't lose their work.

### Pattern: localStorage backup
```tsx
const formId = `activity-form-${userId}-${date}`

// Save on change
useEffect(() => {
  const subscription = form.watch((value) => {
    localStorage.setItem(formId, JSON.stringify(value))
  })
  return () => subscription.unsubscribe()
}, [form])

// Restore on mount
useEffect(() => {
  const saved = localStorage.getItem(formId)
  if (saved) {
    try {
      form.reset(JSON.parse(saved))
    } catch {}
  }
}, [])

// Clear on successful submit
const onSuccess = () => {
  localStorage.removeItem(formId)
}
```

---

## Confirmation Modals for Destructive Actions

Delete a sale? Always confirm. Use a modal, not a `window.confirm()`.

```tsx
<ConfirmModal
  title="Delete this sale?"
  description="This sale will be removed and commission recalculated. This cannot be undone."
  confirmLabel="Delete sale"
  confirmStyle="danger"
  onConfirm={handleDelete}
/>
```

---

## Checkbox & Radio Patterns

### Checkboxes for multi-select
```tsx
<label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-bg-secondary cursor-pointer">
  <input type="checkbox" className="w-4 h-4 accent-accent" />
  <span>Mark as priority</span>
</label>
```

### Radio for single-select with few options
For 2-4 options, use radio cards instead of dropdowns. Better thumbable on mobile.

```tsx
<div className="grid grid-cols-3 gap-2">
  {['paid', 'pending', 'failed'].map(status => (
    <label key={status} className="flex items-center justify-center h-11 rounded-xl border border-border cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-light has-[:checked]:text-accent">
      <input type="radio" value={status} {...form.register('payment_status')} className="sr-only" />
      <span className="capitalize">{status}</span>
    </label>
  ))}
</div>
```

### Select dropdowns for many options
For 5+ options or when a radio group would be too wide, use a `<select>`. Native select on mobile gives a better UX than custom components.

---

## Accessibility

- Every input has a `<label>` with matching `id` / `htmlFor`
- Use `aria-invalid` on fields with errors
- Use `aria-describedby` to link error messages to fields
- Submit buttons have meaningful labels (not "OK")
- Error states aren't communicated by colour alone (icon + text)
