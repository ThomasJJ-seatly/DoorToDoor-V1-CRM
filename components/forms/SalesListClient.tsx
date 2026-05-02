'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, ChevronRight, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentBadge, DeliveryBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { PaymentStatus } from '@/types/database'

interface SaleSummary {
  id: string
  sale_date: string
  customer_business_name: string
  customer_suburb: string
  quantity: number
  total_value: number
  payment_status: PaymentStatus
  delivery_status: 'delivered' | 'pending' | 'na'
  user_id: string
  notes: string | null
  commission: number
}

interface SalesListClientProps {
  sales: SaleSummary[]
  userMap: Record<string, string>
  isAdmin: boolean
  currentUserId: string
}

export function SalesListClient({
  sales,
  userMap,
  isAdmin,
  currentUserId,
}: SalesListClientProps) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [visibleCount, setVisibleCount] = useState(50)

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (
        search &&
        !s.customer_business_name.toLowerCase().includes(search.toLowerCase()) &&
        !s.customer_suburb.toLowerCase().includes(search.toLowerCase())
      ) {
        return false
      }
      if (dateFrom && s.sale_date < dateFrom) return false
      if (dateTo && s.sale_date > dateTo) return false
      if (paymentFilter !== 'all' && s.payment_status !== paymentFilter) return false
      return true
    })
  }, [sales, search, dateFrom, dateTo, paymentFilter])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount
  const hasFilters = !!search || !!dateFrom || !!dateTo || paymentFilter !== 'all'

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total_value, 0)
  const totalSales = filtered.length

  function clearFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPaymentFilter('all')
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Sales</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalSales} {totalSales === 1 ? 'sale' : 'sales'}
            {hasFilters && ' (filtered)'}
            {totalSales > 0 && (
              <span className="ml-1 font-mono">— {formatCurrency(totalRevenue)}</span>
            )}
          </p>
        </div>
        <Link href="/sales/new" className="primary-btn shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add sale</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* ── Search + Filters ── */}
      <div className="card p-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="search"
            placeholder="Search by business or suburb…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn w-7 h-7"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-base h-9 text-sm px-3 flex-1 min-w-0"
              aria-label="From date"
              title="From date"
            />
            <span className="text-text-tertiary text-sm shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-base h-9 text-sm px-3 flex-1 min-w-0"
              aria-label="To date"
              title="To date"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
            className="input-base h-9 text-sm px-3 w-auto"
            aria-label="Filter by payment status"
          >
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="ghost-btn h-9 px-3 text-sm text-text-secondary">
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Empty / No-results states ── */}
      {sales.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-6 h-6" />}
          title="No sales yet"
          description="Log your first sale to start tracking revenue and commissions."
          action={
            <Link href="/sales/new" className="primary-btn">
              <Plus className="w-4 h-4" />
              Log your first sale
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-text-secondary text-sm">No sales match your filters.</p>
          <button onClick={clearFilters} className="secondary-btn mt-4 mx-auto">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Suburb</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Total</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Payment</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Delivery</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Rep</th>
                    )}
                    <th className="px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {visible.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-bg-secondary/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate">
                        {sale.customer_business_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{sale.customer_suburb}</td>
                      <td className="px-4 py-3 text-right text-text-secondary font-mono">
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
                        <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[120px]">
                          {userMap[sale.user_id] ?? 'Unknown'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="icon-btn w-8 h-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Edit ${sale.customer_business_name}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-2">
            {visible.map((sale) => (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className="card flex items-start gap-3 p-4 hover:bg-bg-secondary/50 transition-colors active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-text-primary truncate">
                      {sale.customer_business_name}
                    </span>
                    <span className="font-mono font-medium text-text-primary shrink-0 text-sm">
                      {formatCurrency(sale.total_value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-text-secondary">{sale.customer_suburb}</span>
                    <span className="text-text-tertiary text-xs">·</span>
                    <span className="text-xs text-text-secondary">{formatDate(sale.sale_date)}</span>
                    {sale.quantity > 1 && (
                      <>
                        <span className="text-text-tertiary text-xs">·</span>
                        <span className="text-xs text-text-secondary">×{sale.quantity}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <PaymentBadge status={sale.payment_status} />
                    <DeliveryBadge status={sale.delivery_status} />
                    {isAdmin && sale.user_id !== currentUserId && (
                      <span className="text-xs text-text-tertiary truncate">
                        {userMap[sale.user_id] ?? 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>

          {/* ── Load more ── */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((c) => c + 50)}
                className="secondary-btn"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
