'use client'

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
import { format } from 'date-fns'
import {
  TrendingUp,
  ShoppingBag,
  BarChart3,
  MapPin,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  ClipboardList,
  Percent,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercent, formatDate } from '@/lib/format'
import { chartTheme, chartTooltipStyle } from '@/lib/chart-theme'
import { PaymentBadge } from '@/components/shared/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import type { UserProfile, PaymentStatus } from '@/types/database'

// ── Types ──────────────────────────────────────────────────────────────────

interface KPIs {
  todayRevenue: number
  todaySalesCount: number
  todayCommission: number
  todayConversionRate: number | null
  wtdRevenue: number
  mtdRevenue: number
}

interface TodayActivitySummary {
  doors_knocked: number
  conversations: number
  sales_count: number
  hours_worked: number
  suburb: string
}

interface RevenueDataPoint {
  date: string
  revenue: number
}

interface SalesCountDataPoint {
  date: string
  count: number
}

interface SuburbDataPoint {
  suburb: string
  revenue: number
}

interface RepDataPoint {
  name: string
  revenue: number
}

interface LatestSale {
  id: string
  sale_date: string
  customer_business_name: string
  customer_suburb: string
  total_value: number
  payment_status: PaymentStatus
  user_id: string
  quantity: number
}

interface DashboardClientProps {
  user: UserProfile
  kpis: KPIs
  todayActivity: TodayActivitySummary | null
  revenueChartData: RevenueDataPoint[]
  salesCountChartData: SalesCountDataPoint[]
  suburbChartData: SuburbDataPoint[]
  repChartData: RepDataPoint[]
  latestSales: LatestSale[]
  isAdmin: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAxisDate(date: string) {
  try {
    return format(new Date(date + 'T00:00:00'), 'd MMM')
  } catch {
    return date
  }
}

function shortAxisDate(date: string) {
  try {
    return format(new Date(date + 'T00:00:00'), 'd/M')
  } catch {
    return date
  }
}

// Only label every nth tick to avoid crowding
function makeTickFormatter(data: unknown[], every = 5) {
  return (value: string, index: number) => {
    if (index % every === 0) return formatAxisDate(value)
    return ''
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">{title}</h2>
      </div>
      {action}
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

interface KpiCardProps {
  label: string
  value: string
  subtext?: string
  hero?: boolean
  icon: React.ComponentType<{ className?: string }>
}

function KpiCard({ label, value, subtext, hero, icon: Icon }: KpiCardProps) {
  return (
    <div
      className={`card p-5 relative overflow-hidden ${
        hero ? 'border-t-2 border-t-accent' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums truncate">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-text-tertiary mt-1">{subtext}</p>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-accent" />
        </div>
      </div>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle}>
      <p className="text-xs text-text-tertiary mb-1">
        {label ? formatAxisDate(label) : ''}
      </p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

function CountTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle}>
      <p className="text-xs text-text-tertiary mb-1">
        {label ? formatAxisDate(label) : ''}
      </p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {payload[0].value} {payload[0].value === 1 ? 'sale' : 'sales'}
      </p>
    </div>
  )
}

function SuburbTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={chartTooltipStyle}>
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DashboardClient({
  user,
  kpis,
  todayActivity,
  revenueChartData,
  salesCountChartData,
  suburbChartData,
  repChartData,
  latestSales,
  isAdmin,
}: DashboardClientProps) {
  const firstName = user.full_name.split(' ')[0]
  const hasRevenueData = revenueChartData.some(d => d.revenue > 0)
  const hasSalesCountData = salesCountChartData.some(d => d.count > 0)
  const hasSuburbData = suburbChartData.length > 0
  const hasRepData = repChartData.length > 0

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <Link href="/sales/new" className="primary-btn shrink-0 hidden sm:inline-flex">
          <ShoppingBag className="w-4 h-4" />
          New Sale
        </Link>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 lg:gap-4">
        {/* Hero: Today's Revenue */}
        <div className="col-span-2">
          <KpiCard
            label="Today's Revenue"
            value={formatCurrency(kpis.todayRevenue)}
            subtext={`${kpis.todaySalesCount} ${kpis.todaySalesCount === 1 ? 'sale' : 'sales'} today`}
            hero
            icon={DollarSign}
          />
        </div>

        {/* Today's Sales Count */}
        <KpiCard
          label="Today's Sales"
          value={String(kpis.todaySalesCount)}
          subtext={kpis.todaySalesCount === 0 ? 'No sales yet' : 'Keep going!'}
          icon={ShoppingBag}
        />

        {/* Conversion Rate */}
        <KpiCard
          label="Conversion Rate"
          value={
            kpis.todayConversionRate !== null
              ? formatPercent(kpis.todayConversionRate, 0)
              : '—'
          }
          subtext={
            kpis.todayConversionRate !== null
              ? 'Conversations → sales'
              : 'Log activity to track'
          }
          icon={Percent}
        />

        {/* Commission / Revenue (label differs by role) */}
        <KpiCard
          label={isAdmin ? "Today's Revenue" : "Today's Commission"}
          value={formatCurrency(isAdmin ? kpis.todayRevenue : kpis.todayCommission)}
          subtext={isAdmin ? 'Full sale value' : 'Your earnings today'}
          icon={TrendingUp}
        />

        {/* WTD Revenue */}
        <KpiCard
          label="Week to Date"
          value={formatCurrency(kpis.wtdRevenue, { compact: true })}
          subtext="Mon – today"
          icon={Activity}
        />

        {/* MTD Revenue */}
        <KpiCard
          label="Month to Date"
          value={formatCurrency(kpis.mtdRevenue, { compact: true })}
          subtext={format(new Date(), 'MMMM yyyy')}
          icon={BarChart3}
        />
      </div>

      {/* ── Today's Activity ── */}
      {todayActivity ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                Today's Activity
              </h2>
            </div>
            <Link
              href="/activity"
              className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1"
            >
              Edit <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Suburb</p>
              <p className="text-sm font-medium text-text-primary">{todayActivity.suburb || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Doors Knocked</p>
              <p className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                {todayActivity.doors_knocked}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Conversations</p>
              <p className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                {todayActivity.conversations}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Hours Worked</p>
              <p className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                {todayActivity.hours_worked}h
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 border-dashed">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">No activity logged today</p>
                <p className="text-xs text-text-tertiary">Track doors, conversations, and hours</p>
              </div>
            </div>
            <Link href="/activity/new" className="secondary-btn shrink-0 text-sm">
              Log Activity
            </Link>
          </div>
        </div>
      )}

      {/* ── Charts: Revenue + Daily Sales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Revenue Line Chart (30 days) */}
        <div className="card p-5">
          <SectionHeader
            icon={TrendingUp}
            title="Revenue — Last 30 Days"
            action={
              <Link
                href="/reports"
                className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1"
              >
                Reports <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="h-52">
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
                    tickFormatter={makeTickFormatter(revenueChartData, 5)}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTheme.axis }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => formatCurrency(v, { compact: true })}
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
              <ChartEmptyState label="No revenue data yet" />
            )}
          </div>
        </div>

        {/* Daily Sales Count Bar Chart (14 days) */}
        <div className="card p-5">
          <SectionHeader
            icon={BarChart3}
            title="Sales Count — Last 14 Days"
          />
          <div className="h-52">
            {hasSalesCountData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesCountChartData}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                  barCategoryGap="30%"
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
                    tickFormatter={shortAxisDate}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartTheme.axis }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip
                    content={<CountTooltip />}
                    cursor={{ fill: chartTheme.grid, opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="count"
                    fill={chartTheme.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState label="No sales data yet" />
            )}
          </div>
        </div>
      </div>

      {/* ── Charts: Suburb + Rep ── */}
      <div className={`grid grid-cols-1 gap-4 lg:gap-6 ${isAdmin ? 'lg:grid-cols-2' : ''}`}>
        {/* Sales by Suburb */}
        <div className="card p-5">
          <SectionHeader icon={MapPin} title="Revenue by Suburb — Last 30 Days" />
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
                    tickFormatter={v => formatCurrency(v, { compact: true })}
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
                    content={<SuburbTooltip />}
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
              <ChartEmptyState label="No suburb data yet" />
            )}
          </div>
        </div>

        {/* Sales by Rep (admin only) */}
        {isAdmin && (
          <div className="card p-5">
            <SectionHeader icon={Users} title="Revenue by Rep — Last 30 Days" />
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
                      tickFormatter={v => formatCurrency(v, { compact: true })}
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
                      content={<SuburbTooltip />}
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
                <ChartEmptyState label="No rep data yet" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Sales ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
              Recent Sales
            </h2>
          </div>
          <Link
            href="/sales"
            className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {latestSales.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-5 h-5" />}
            title="No sales yet"
            description="Start logging sales to see them here."
            action={
              <Link href="/sales/new" className="primary-btn">
                <ShoppingBag className="w-4 h-4" />
                Add First Sale
              </Link>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-primary">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Business
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Suburb
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Value
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">
                      Status
                    </th>
                    <th className="w-8 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {latestSales.map(sale => (
                    <tr
                      key={sale.id}
                      className="hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/sales/${sale.id}`
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-text-primary">
                          {sale.customer_business_name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {sale.customer_suburb}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-mono font-semibold text-text-primary tabular-nums">
                          {formatCurrency(sale.total_value)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={sale.payment_status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ArrowRight className="w-4 h-4 text-text-tertiary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border-subtle">
              {latestSales.map(sale => (
                <Link
                  key={sale.id}
                  href={`/sales/${sale.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-bg-secondary transition-colors active:bg-bg-secondary"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {sale.customer_business_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-text-tertiary">{sale.customer_suburb}</p>
                      <span className="text-text-tertiary opacity-40">·</span>
                      <p className="text-xs text-text-tertiary">{formatDate(sale.sale_date)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-mono text-sm font-semibold text-text-primary tabular-nums">
                      {formatCurrency(sale.total_value)}
                    </span>
                    <PaymentBadge status={sale.payment_status} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
