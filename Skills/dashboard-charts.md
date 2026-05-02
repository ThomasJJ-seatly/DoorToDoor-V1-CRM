# Skill: Dashboard & Charts

Charts are powerful but easy to make ugly. This skill enforces consistent, premium chart styling using Recharts.

---

## Recharts Theme

Use this exact theme across all charts. Define it once and import.

```tsx
// lib/chart-theme.ts
export const chartTheme = {
  // Series colours
  primary: '#1A5F5A',      // teal — main metric
  secondary: '#9C9B96',    // grey — secondary metric
  tertiary: '#C9C7C1',     // light grey — context series
  
  // Status (when relevant)
  success: '#2D7A3F',
  warning: '#C97A1A',
  danger: '#A8362F',
  
  // Chrome
  axis: '#9C9B96',
  grid: '#EDEBE7',
  background: '#FFFFFF',
  text: '#1A1A18',
  textMuted: '#6B6B67',
  border: '#E5E4E0',
}

export const chartFont = {
  fontFamily: 'var(--font-geist-sans)',
  fontSize: 12,
}

export const chartTooltipStyle = {
  background: '#FFFFFF',
  border: '1px solid #E5E4E0',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 13,
  fontFamily: 'var(--font-geist-sans)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
}
```

---

## Chart Defaults

Every chart should:

1. Use `<ResponsiveContainer>` to fill its parent
2. Use the theme colours, not custom hex
3. Have minimal axes (no axis lines, just labels)
4. Use Geist font for all text
5. Have a tooltip (always)
6. Use Geist Mono for numerical values in tooltips
7. Render gracefully with empty/loading data

### Standard line chart
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

<ResponsiveContainer width="100%" height={280}>
  <LineChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
    <CartesianGrid stroke={chartTheme.grid} strokeDasharray="0" vertical={false} />
    <XAxis
      dataKey="date"
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartTheme.textMuted, fontSize: 12 }}
      tickFormatter={(date) => format(new Date(date), 'd MMM')}
    />
    <YAxis
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartTheme.textMuted, fontSize: 12 }}
      tickFormatter={(value) => formatCurrency(value, { compact: true })}
    />
    <Tooltip
      contentStyle={chartTooltipStyle}
      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
      labelFormatter={(date) => format(new Date(date), 'EEE d MMM')}
    />
    <Line
      type="monotone"
      dataKey="revenue"
      stroke={chartTheme.primary}
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 4, fill: chartTheme.primary }}
    />
  </LineChart>
</ResponsiveContainer>
```

### Standard bar chart
```tsx
<ResponsiveContainer width="100%" height={280}>
  <BarChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
    <CartesianGrid stroke={chartTheme.grid} strokeDasharray="0" vertical={false} />
    <XAxis
      dataKey="name"
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartTheme.textMuted, fontSize: 12 }}
    />
    <YAxis
      tickLine={false}
      axisLine={false}
      tick={{ fill: chartTheme.textMuted, fontSize: 12 }}
    />
    <Tooltip contentStyle={chartTooltipStyle} />
    <Bar dataKey="value" fill={chartTheme.primary} radius={[6, 6, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

---

## Chart Sizing

| Use case | Height (desktop) | Height (mobile) |
|----------|------------------|------------------|
| Sparkline (in KPI card) | 60px | 60px |
| Inline trend chart | 160px | 140px |
| Dashboard chart | 280px | 220px |
| Reports chart | 360px | 280px |

Use `<ResponsiveContainer width="100%">` and set `height` explicitly.

---

## Empty State for Charts

Never show a blank or broken chart. If there's no data, show an empty state in place of the chart:

```tsx
function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] text-center">
        <BarChart3 className="w-8 h-8 text-text-tertiary mb-3" />
        <p className="text-sm font-medium text-text-secondary">No sales yet</p>
        <p className="text-xs text-text-tertiary mt-1">
          Once you log sales they'll appear here
        </p>
      </div>
    )
  }
  
  return <ResponsiveContainer>...</ResponsiveContainer>
}
```

---

## KPI Cards

KPIs are the most important visual element on the dashboard. Get these right.

### Standard KPI card
```tsx
<div className="bg-bg-elevated border border-border rounded-xl p-5">
  <div className="text-sm font-medium text-text-secondary">Today's Revenue</div>
  <div className="mt-2 text-3xl font-mono font-medium tabular-nums text-text-primary">
    $1,194
  </div>
  <div className="mt-2 flex items-center gap-1 text-xs">
    <TrendingUp className="w-3 h-3 text-status-success" />
    <span className="text-status-success font-medium">+12%</span>
    <span className="text-text-tertiary">vs yesterday</span>
  </div>
</div>
```

### Hero KPI (main metric)
Slightly more prominent — accent border or accent text colour:

```tsx
<div className="bg-bg-elevated border border-accent-border rounded-xl p-5 relative overflow-hidden">
  <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
  <div className="text-sm font-medium text-text-secondary">Today's Revenue</div>
  <div className="mt-2 text-3xl font-mono font-medium tabular-nums text-text-primary">
    $1,194
  </div>
  {/* ... */}
</div>
```

### KPI with sparkline
```tsx
<div className="bg-bg-elevated border border-border rounded-xl p-5">
  <div className="flex items-start justify-between gap-4">
    <div>
      <div className="text-sm font-medium text-text-secondary">Revenue (7d)</div>
      <div className="mt-2 text-3xl font-mono font-medium tabular-nums">$8,427</div>
    </div>
    <div className="w-24 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <Line type="monotone" dataKey="value" stroke={chartTheme.primary} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>
```

---

## Number Formatting

Always format numbers consistently. Build utilities once and reuse.

```tsx
// lib/format.ts

export function formatCurrency(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    }
    return `$${(value / 1000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-AU').format(value)
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (format === 'short') return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
```

---

## Dashboard Layout

### Desktop (lg+)
```
┌─────────────────────────────────────────────────────────┐
│  Today's Revenue   │  Today's Sales  │  Conversion │  Commission  │
│  (hero — accent)   │                 │             │              │
├─────────────────────────────────────────────────────────┤
│  WTD Revenue       │  MTD Revenue    │  ...        │  ...         │
├─────────────────────────────────────────────────────────┤
│  Revenue (30 days)              │  Sales by Rep             │
│  [line chart]                   │  [bar chart, admin only]  │
├─────────────────────────────────────────────────────────┤
│  Sales by Suburb                │  Daily Sales Count        │
│  [bar chart]                    │  [bar chart]              │
├─────────────────────────────────────────────────────────┤
│  Recent Sales (latest 5)                                  │
└─────────────────────────────────────────────────────────┘
```

### Mobile
- KPI cards stack to 2 columns
- Charts go full-width, single column
- Recent sales at bottom

---

## Real-Time Updates

The dashboard should feel alive. When a sale is logged from another device, the dashboard updates within seconds.

Use Supabase real-time (see supabase-patterns.md) to call `router.refresh()` when the `sales` table changes. This re-runs server components and updates KPIs without a full page reload.

---

## Don'ts

- **Don't** use pie charts. They're hard to read for similar values. Use bar charts instead.
- **Don't** use 3D charts ever.
- **Don't** add chart legends if there's only one data series.
- **Don't** use gradient fills under lines unless you really need to. Solid lines look cleaner.
- **Don't** use stacked bars unless you've thought hard — they're often confusing.
- **Don't** hardcode chart colours. Always use the theme.
- **Don't** show negative space (axis area) larger than the chart itself.
- **Don't** show a chart that's loading without a skeleton in the same shape.
