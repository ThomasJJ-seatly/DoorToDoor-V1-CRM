'use client'

import { useTransition } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30">
      <div className="card w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-status-dangerBg' : 'bg-accent-light'
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${
                variant === 'danger' ? 'text-status-danger' : 'text-accent'
              }`}
            />
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="secondary-btn flex-1">
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={`flex-1 ${variant === 'danger' ? 'danger-btn' : 'primary-btn'}`}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
