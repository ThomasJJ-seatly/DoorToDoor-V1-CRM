import type { PaymentStatus, DeliveryStatus } from '@/types/database'

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    paid: 'bg-status-successBg text-status-success',
    pending: 'bg-status-warningBg text-status-warning',
    failed: 'bg-status-dangerBg text-status-danger',
  }
  const labels: Record<PaymentStatus, string> = {
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

export function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  const styles: Record<DeliveryStatus, string> = {
    delivered: 'bg-status-successBg text-status-success',
    pending: 'bg-status-warningBg text-status-warning',
    na: 'bg-bg-secondary text-text-secondary',
  }
  const labels: Record<DeliveryStatus, string> = {
    delivered: 'Delivered',
    pending: 'Pending',
    na: 'N/A',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: 'admin' | 'rep' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        role === 'admin'
          ? 'bg-accent-light text-accent'
          : 'bg-bg-secondary text-text-secondary'
      }`}
    >
      {role === 'admin' ? 'Admin' : 'Rep'}
    </span>
  )
}
