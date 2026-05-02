'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { formatCurrency, formatDate, formatPhone } from '@/lib/format'
import { PaymentBadge, DeliveryBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { createClient } from '@/lib/supabase/client'
import type { Customer, PaymentStatus, DeliveryStatus } from '@/types/database'

interface SaleRow {
  id: string
  sale_date: string
  quantity: number
  total_value: number
  payment_status: PaymentStatus
  delivery_status: DeliveryStatus
  user_id: string
}

interface CustomerDetailClientProps {
  customer: Customer
  sales: SaleRow[]
  userMap: Record<string, string>
  isAdmin: boolean
}

export function CustomerDetailClient({
  customer,
  sales,
  userMap,
  isAdmin,
}: CustomerDetailClientProps) {
  const [notes, setNotes] = useState(customer.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  const handleNotesSave = useCallback(
    async (value: string) => {
      const supabase = createClient()
      await supabase.from('customers').update({ notes: value }).eq('id', customer.id)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    },
    [customer.id]
  )

  return (
    <div className="space-y-6">
      {/* ── Back + Header ── */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Customers
        </Link>
        <h1 className="text-2xl font-medium tracking-tight text-text-primary">
          {customer.business_name}
        </h1>
        {customer.suburb && (
          <p className="text-text-secondary mt-0.5 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5" />
            {customer.suburb}
          </p>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            Total Spend
          </p>
          <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
            {formatCurrency(customer.total_spend)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            Orders
          </p>
          <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
            {customer.total_orders}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            First Sale
          </p>
          <p className="text-sm font-medium text-text-primary">
            {customer.first_sale_date ? formatDate(customer.first_sale_date) : '—'}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            Last Sale
          </p>
          <p className="text-sm font-medium text-text-primary">
            {customer.last_sale_date ? formatDate(customer.last_sale_date) : '—'}
          </p>
        </div>
      </div>

      {/* ── Contact Info ── */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customer.contact_name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Contact</p>
                <p className="text-sm font-medium text-text-primary">{customer.contact_name}</p>
              </div>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Phone</p>
                <a
                  href={`tel:${customer.phone}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {formatPhone(customer.phone)}
                </a>
              </div>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Email</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {customer.email}
                </a>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Address</p>
                <p className="text-sm font-medium text-text-primary">{customer.address}</p>
              </div>
            </div>
          )}
          {!customer.contact_name && !customer.phone && !customer.email && !customer.address && (
            <p className="text-sm text-text-tertiary col-span-2">No contact information on file.</p>
          )}
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Notes
          </h2>
          {notesSaved && (
            <span className="text-xs text-status-success font-medium">Saved</span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={(e) => handleNotesSave(e.target.value)}
          placeholder="Add notes, follow-up reminders, or context about this customer…"
          rows={4}
          className="input-base h-auto py-3 resize-none text-sm"
        />
        <p className="text-xs text-text-tertiary">Notes save automatically when you click away.</p>
      </div>

      {/* ── Sales History ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Sales History
          </h2>
          <span className="text-xs text-text-tertiary font-mono tabular-nums">
            {sales.length} {sales.length === 1 ? 'sale' : 'sales'}
          </span>
        </div>

        {sales.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-5 h-5" />}
            title="No sales recorded"
            description="Sales will appear here once logged against this customer."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Total</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Payment</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Delivery</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Rep</th>
                    )}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-bg-secondary/50 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/sales/${sale.id}`
                      }}
                    >
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(sale.total_value)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={sale.payment_status} />
                      </td>
                      <td className="px-4 py-3">
                        <DeliveryBadge status={sale.delivery_status} />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {userMap[sale.user_id] ?? 'Unknown'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="icon-btn w-8 h-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="View sale"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border-subtle">
              {sales.map((sale) => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-bg-secondary/50 transition-colors active:bg-bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-text-primary">
                        {formatCurrency(sale.total_value)}
                      </span>
                      {sale.quantity > 1 && (
                        <span className="text-xs text-text-tertiary">×{sale.quantity}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-secondary">
                        {formatDate(sale.sale_date)}
                      </span>
                      <span className="text-text-tertiary text-xs">·</span>
                      <PaymentBadge status={sale.payment_status} />
                    </div>
                    {isAdmin && (
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {userMap[sale.user_id] ?? 'Unknown'}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
