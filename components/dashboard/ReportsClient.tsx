'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, startOfWeek, startOfMonth, subMonths, parseISO } from 'date-fns'
import { Download, Filter, TrendingUp, BarChart3, DollarSign, ShoppingBag, Users, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { chartTheme, chartTooltipStyle } from '@/lib/chart-theme'
import { PaymentBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { PaymentStatus } from '@/types/database'

interface SaleRow {
  id: string
  sale_date: string
  customer_business_name: string
  customer_suburb: string
  quantity: number
  total_value: number
  payment_status: PaymentStatus
  commission: number
  user_id: string
}

interface ReportsClientProps {
  allSales: SaleRow[]
  userMap: Record<string, string>
  isAdmin: boolean
  currentUserId: string
  defaultDateRange: { start: string; end: string }
}

// ── CSV Export ─────────────────────────────────────────────────────────────

function exportCSV(sales: SaleRow[], userMap: Record<string, string>) {
  const headers = ['Date', 'Customer', 'Suburb', 'Qty', 'Total', 'Status', 'Commission', 'Rep']
  const rows = sales.map((s) => [
    s.sale_date,
    s.customer_business_name,
    s.customer_suburb,
    s.quantity,
    s.total_value,
    s.payment_status,
    s.commission,
    userMap[s.user_id] ?? 'Unknown',
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAxisDate(date: string) {
  try {
    return format(parseISO(date + 'T00:00:00'), 'd MMM')
  } catch {
    return date
  }
}

function makeTickFormatter(data: unknown[], every = 5) {
  return (value: string, index: number) => {
    if (index % every === 0) return formatAxisDate(value)
    return ''
  }
}

// ── Custom Tooltips ────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle}>
      <p className="text-xs text-text-tertiary mb-1">{label ? formatAxisDate(label) : ''}</p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

function BarTooltip({
  active,
  payload,
  label,
  isCurrency = true,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  isCurrency?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle}>
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {isCurrency ? formatCurrency(payload[0].value) : payload[0].value}
      </p>
    </div>
  )
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary">
      <BarChart3 className="w-8 h-8 opacity-40" />
      <p className="text-xs">{label}</p>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-accent" />
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h2>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ReportsClient({
  allSales,
  userMap,
  isAdmin,
  currentUserId,
  defaultDateRange,
}: ReportsClientProps) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [dateFrom, setDateFrom] = useState(defaultDateRange.start)
  const [dateTo, setDateTo] = useState(defaultDateRange.end)
  const [repFilter, setRepFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')

  // ── Preset buttons ──
  function setPreset(preset: 'today' | 'week' | 'month' | 'last-month') {
    const now = new Date()
    if (preset === 'today') {
      setDateFrom(today)
      setDateTo(today)
    } else if (preset === 'week') {
      setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setDateTo(today)
    } else if (preset === 'month') {
      setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'))
      setDateTo(today)
    } else if (preset === 'last-month') {
      const lastMonth = subMonths(now, 1)
      setDateFrom(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
      setDateTo(format(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0), 'yyyy-MM-dd'))
    }
  }

  // ── Filtered sales (client-side) ──
  const filtered = useMemo(() => {
    return allSales.filter((s) => {
      if (dateFrom && s.sale_date < dateFrom) return false
      if (dateTo && s.sale_date > dateTo) return false
      if (repFilter !== 'all' && s.user_id !== repFilter) return false
      if (paymentFilter !== 'all' && s.payment_status !== paymentFilter) return false
      return true
    })
  }, [allSales, dateFrom, dateTo, repFilter, paymentFilter])

  // ── Summary KPIs ──
  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total_value), 0)
  const totalSales = filtered.length
  const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0
  const totalCommission = filtered.reduce((sum, s) => sum + Number(s.commission), 0)

  // ── Revenue over time chart data ──
  const revenueChartData = useMemo(() => {
    const byDate: Record<string, number> = {}
    filtered.forEach((s) => {
      byDate[s.sale_date] = (byDate[s.sale_date] ?? 0) + Number(s.total_value)
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }))
  }, [filtered])

  // ── Top suburbs chart data ──
  const suburbChartData = useMemo(() => {
    const bySuburb: Record<string, number> = {}
    filtered.forEach((s) => {
      const suburb = s.customer_suburb || 'Unknown'
      bySuburb[suburb] = (bySuburb[suburb] ?? 0) + Number(s.total_value)
    })
    return Object.entries(bySuburb)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([suburb, revenue]) => ({ suburb, revenue }))
  }, [filtered])

  // ── Sales by rep chart data (admin only) ──
  const repChartData = useMemo(() => {
    const byRep: Record<string, number> = {}
    filtered.forEach((s) => {
      const name = userMap[s.user_id] ?? 'Unknown'
      byRep[name] = (byRep[name] ?? 0) + Number(s.total_value)
    })
    return Object.entries(byRep)
      .sort(([, a], [, b]) => b - a)
      .map(([name, revenue]) => ({ name, revenue }))
  }, [filtered, userMap])

  // ── Unique reps for filter dropdown ──
  const repOptions = useMemo(() => {
    const ids = Array.from(new Set(allSales.map((s) => s.user_id)))
    return ids.map((id) => ({ id, name: userMap[id] ?? 'Unknown' }))
  }, [allSales, userMap])

  const hasRevenueData = revenueChartData.some((d) => d.revenue > 0)
  const hasSuburbData = suburbChartData.length > 0
  const hasRepData = repChartData.length > 0

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Reports</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalSales} {totalSales === 1 ? 'sale' : 'sales'} ·{' '}
            <span className="font-mono">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered, userMap)}
          className="secondary-btn shrink-0"
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-secondary">Filters</span>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { label: 'Today', preset: 'today' },
              { label: 'This Week', preset: 'week' },
              { label: 'This Month', preset: 'month' },
              { label: 'Last Month', preset: 'last-month' },
            ] as const
          ).map(({ label, preset }) => (
            <button
              key={preset}
              onClick={() => setPreset(preset)}
              className="ghost-btn h-8 px-3 text-xs"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range + other filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-base h-9 text-sm px-3 flex-1 min-w-0"
              aria-label="From date"
            />
            <span className="text-text-tertiary text-sm shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-base h-9 text-sm px-3 flex-1 min-w-0"
              aria-label="To date"
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

          {isAdmin && repOptions.length > 1 && (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="input-base h-9 text-sm px-3 w-auto"
              aria-label="Filter by rep"
            >
              <option value="all">All reps</option>
              {repOptions.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border-t-2 border-t-accent">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Total Revenue
              </p>
              <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Total Sales
              </p>
              <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                {totalSales}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Avg Sale Value
              </p>
              <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                {formatCurrency(avgSaleValue)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Total Commission
              </p>
              <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                {formatCurrency(totalCommission)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      {filtered.length > 0 && (
        <>
          {/* Revenue over time */}
          <div className="card p-5">
            <SectionHeader icon={TrendingUp} title="Revenue Over Time" />
            <div className="h-56">
              {hasRevenueData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueChartData}
                    margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={chartTheme.grid}
                      strokeDasharray="4 4"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: chartTheme.axis }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={makeTickFormatter(revenueChartData, Math.max(1, Math.ceil(revenueChartData.length / 7)))}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: chartTheme.axis }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatCurrency(v, { compact: true })}
                      width={52}
                    />
                    <Tooltip
                      content={<RevenueTooltip />}
                      cursor={{ stroke: chartTheme.grid, strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartTheme.primary}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: chartTheme.primary, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmptyState label="No revenue data in range" />
              )}
            </div>
          </div>

          {/* Suburb + Rep side by side */}
          <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'lg:grid-cols-2' : ''}`}>
            {/* Top Suburbs */}
            <div className="card p-5">
              <SectionHeader icon={MapPin} title="Revenue by Suburb" />
              <div className="h-52">
                {hasSuburbData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={suburbChartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid
                        horizontal={false}
                        stroke={chartTheme.grid}
                        strokeDasharray="4 4"
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: chartTheme.axis }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatCurrency(v, { compact: true })}
                      />
                      <YAxis
                        type="category"
                        dataKey="suburb"
                        tick={{ fontSize: 11, fill: chartTheme.axis }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        content={<BarTooltip />}
                        cursor={{ fill: chartTheme.grid, opacity: 0.5 }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill={chartTheme.primary}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState label="No suburb data" />
                )}
              </div>
            </div>

            {/* Sales by Rep (admin only) */}
            {isAdmin && (
              <div className="card p-5">
                <SectionHeader icon={Users} title="Revenue by Rep" />
                <div className="h-52">
                  {hasRepData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={repChartData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid
                          horizontal={false}
                          stroke={chartTheme.grid}
                          strokeDasharray="4 4"
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: chartTheme.axis }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatCurrency(v, { compact: true })}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: chartTheme.axis }}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip
                          content={<BarTooltip />}
                          cursor={{ fill: chartTheme.grid, opacity: 0.5 }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill={chartTheme.secondary}
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartEmptyState label="No rep data" />
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Sales Table ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Sales Detail
          </h2>
          <span className="text-xs text-text-tertiary font-mono tabular-nums">
            {filtered.length} rows
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-5 h-5" />}
            title="No sales in range"
            description="Adjust the date range or filters to see data."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-text-secondary">Suburb</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Qty</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Total</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-text-secondary">Commission</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-medium text-text-secondary">Rep</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/sales/${sale.id}`
                      }}
                    >
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate">
                        {sale.customer_business_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{sale.customer_suburb}</td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(Number(sale.total_value))}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={sale.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        {formatCurrency(Number(sale.commission))}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-text-secondary text-xs truncate max-w-[120px]">
                          {userMap[sale.user_id] ?? 'Unknown'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border-subtle">
              {filtered.map((sale) => (
                <div
                  key={sale.id}
                  className="px-5 py-4 hover:bg-bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = `/sales/${sale.id}`
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-text-primary truncate">
                      {sale.customer_business_name}
                    </span>
                    <span className="font-mono font-semibold text-text-primary shrink-0 text-sm">
                      {formatCurrency(Number(sale.total_value))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-secondary">{sale.customer_suburb}</span>
                    <span className="text-text-tertiary text-xs">·</span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(sale.sale_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <PaymentBadge status={sale.payment_status} />
                    <span className="text-xs text-text-tertiary font-mono">
                      comm. {formatCurrency(Number(sale.commission))}
                    </span>
                    {isAdmin && (
                      <span className="text-xs text-text-tertiary">
                        {userMap[sale.user_id] ?? 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
