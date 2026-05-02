import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { PaymentStatus } from '@/types/database'

// Local shapes for partial selects
interface TodaySaleRow {
  total_value: number
  commission: number
  quantity: number
}

interface ValueRow {
  total_value: number
}

interface ActivityRow {
  doors_knocked: number
  conversations: number
  sales_count: number
  hours_worked: number
  suburb: string
}

interface RecentSaleRow {
  sale_date: string
  total_value: number
  customer_suburb: string
  user_id: string
}

interface LatestSaleRow {
  id: string
  sale_date: string
  customer_business_name: string
  customer_suburb: string
  total_value: number
  payment_status: PaymentStatus
  user_id: string
  quantity: number
}

interface UserRow {
  id: string
  full_name: string
}

export default async function DashboardPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const fourteenDaysAgo = format(subDays(new Date(), 13), 'yyyy-MM-dd')

  // Today's stats for current user
  const { data: todaySalesRaw } = await supabase
    .from('sales')
    .select('total_value, commission, quantity')
    .eq('sale_date', today)
    .eq('user_id', user.id)
  const todaySales = (todaySalesRaw ?? []) as TodaySaleRow[]

  // WTD + MTD (RLS handles visibility)
  const { data: wtdSalesRaw } = await supabase
    .from('sales')
    .select('total_value')
    .gte('sale_date', weekStart)
    .lte('sale_date', today)
  const wtdSales = (wtdSalesRaw ?? []) as ValueRow[]

  const { data: mtdSalesRaw } = await supabase
    .from('sales')
    .select('total_value')
    .gte('sale_date', monthStart)
    .lte('sale_date', today)
  const mtdSales = (mtdSalesRaw ?? []) as ValueRow[]

  // Today's activity log for current user
  const { data: todayActivityRaw } = await supabase
    .from('daily_activity')
    .select('doors_knocked, conversations, sales_count, hours_worked, suburb')
    .eq('date', today)
    .eq('user_id', user.id)
    .maybeSingle()
  const todayActivity = (todayActivityRaw ?? null) as ActivityRow | null

  // Last 30 days: all sales visible to user
  const { data: recentSalesRaw } = await supabase
    .from('sales')
    .select('sale_date, total_value, customer_suburb, user_id')
    .gte('sale_date', thirtyDaysAgo)
    .lte('sale_date', today)
    .order('sale_date', { ascending: true })
  const recentSales = (recentSalesRaw ?? []) as RecentSaleRow[]

  // Last 5 sales for recent activity widget
  const { data: latestSalesRaw } = await supabase
    .from('sales')
    .select('id, sale_date, customer_business_name, customer_suburb, total_value, payment_status, user_id, quantity')
    .order('created_at', { ascending: false })
    .limit(5)
  const latestSales = (latestSalesRaw ?? []) as LatestSaleRow[]

  // User list for rep name resolution (admin only)
  let users: UserRow[] = []
  if (user.role === 'admin') {
    const { data } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('is_active', true)
    users = (data ?? []) as UserRow[]
  }

  // ── Compute KPIs ──
  const todayRevenue = todaySales.reduce((s, x) => s + Number(x.total_value), 0)
  const todaySalesCount = todaySales.length
  const todayCommission = todaySales.reduce((s, x) => s + Number(x.commission), 0)
  const wtdRevenue = wtdSales.reduce((s, x) => s + Number(x.total_value), 0)
  const mtdRevenue = mtdSales.reduce((s, x) => s + Number(x.total_value), 0)

  const todayConversionRate =
    todayActivity && todayActivity.conversations > 0
      ? todayActivity.sales_count / todayActivity.conversations
      : null

  // ── Revenue by day (last 30 days) ──
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    revenueByDay[d] = 0
  }
  recentSales.forEach(s => {
    if (revenueByDay[s.sale_date] !== undefined) {
      revenueByDay[s.sale_date] += Number(s.total_value)
    }
  })
  const revenueChartData = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // ── Sales count by day (last 14 days) ──
  const salesByDay: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    salesByDay[d] = 0
  }
  recentSales.forEach(s => {
    if (s.sale_date >= fourteenDaysAgo && salesByDay[s.sale_date] !== undefined) {
      salesByDay[s.sale_date]++
    }
  })
  const salesCountChartData = Object.entries(salesByDay).map(([date, count]) => ({
    date,
    count,
  }))

  // ── Sales by suburb (top 8 by revenue, last 30 days) ──
  const suburbMap: Record<string, number> = {}
  recentSales.forEach(s => {
    const key = s.customer_suburb || 'Unknown'
    suburbMap[key] = (suburbMap[key] ?? 0) + Number(s.total_value)
  })
  const suburbChartData = Object.entries(suburbMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([suburb, revenue]) => ({ suburb, revenue }))

  // ── Sales by rep (admin only, last 30 days) ──
  const repChartData =
    user.role === 'admin'
      ? (() => {
          const repMap: Record<string, number> = {}
          recentSales.forEach(s => {
            repMap[s.user_id] = (repMap[s.user_id] ?? 0) + Number(s.total_value)
          })
          return Object.entries(repMap).map(([uid, revenue]) => ({
            name: users.find(u => u.id === uid)?.full_name ?? 'Unknown',
            revenue,
          }))
        })()
      : []

  return (
    <DashboardClient
      user={user}
      kpis={{
        todayRevenue,
        todaySalesCount,
        todayCommission,
        todayConversionRate,
        wtdRevenue,
        mtdRevenue,
      }}
      todayActivity={todayActivity}
      revenueChartData={revenueChartData}
      salesCountChartData={salesCountChartData}
      suburbChartData={suburbChartData}
      repChartData={repChartData}
      latestSales={latestSales}
      isAdmin={user.role === 'admin'}
    />
  )
}
