# Skill: Data Tables

The sales list, customer directory, and reports tables share patterns. One consistent approach across the app.

---

## Core Principle: Tables on Desktop, Cards on Mobile

Don't try to make a horizontal-scrolling table work on mobile. Show tables on desktop only; show data as cards on mobile.

---

## Standard Table (Desktop)

```tsx
<div className="hidden md:block overflow-hidden rounded-xl border border-border bg-bg-elevated">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border-subtle bg-bg-secondary/50">
        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
          Date
        </th>
        <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
          Customer
        </th>
        <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
          Total
        </th>
      </tr>
    </thead>
    <tbody>
      {sales.map(sale => (
        <tr
          key={sale.id}
          className="border-b border-border-subtle last:border-0 hover:bg-bg-secondary/30 transition-colors"
        >
          <td className="px-4 py-3 text-sm">{formatDate(sale.sale_date)}</td>
          <td className="px-4 py-3 text-sm font-medium">{sale.customer_business_name}</td>
          <td className="px-4 py-3 text-sm font-mono tabular-nums text-right">
            {formatCurrency(sale.total_value)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Table rules
- Header row uses `bg-bg-secondary/50` for subtle distinction
- Header text is uppercase, small, tracking-wide
- Body rows have `hover:` state for desktop interactivity
- Row borders use `border-subtle` (very faint)
- Numerical columns are right-aligned with `font-mono tabular-nums`
- Last row has no border (`last:border-0`)
- Click anywhere in a row navigates to detail (use a `<Link>` wrapping each `<tr>` content via CSS, or use `onClick` with proper accessibility)

---

## Mobile Card List

```tsx
<div className="md:hidden space-y-3">
  {sales.map(sale => (
    <Link
      key={sale.id}
      href={`/sales/${sale.id}`}
      className="block bg-bg-elevated border border-border rounded-xl p-4 hover:border-accent-border transition-colors"
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-medium truncate">{sale.customer_business_name}</div>
          <div className="text-sm text-text-secondary truncate">{sale.customer_suburb}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono font-medium tabular-nums">
            {formatCurrency(sale.total_value)}
          </div>
          <Badge status={sale.payment_status} />
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-text-tertiary">
        <span>{formatDate(sale.sale_date)}</span>
        <span>{sale.user.full_name}</span>
      </div>
    </Link>
  ))}
</div>
```

---

## Filters

Filters live above the table. On desktop, they sit inline. On mobile, they live in a bottom sheet triggered by a "Filter" button.

### Desktop filter bar
```tsx
<div className="hidden md:flex items-center gap-3 mb-4">
  <SearchInput placeholder="Search customers..." />
  <DateRangePicker />
  <Select label="Rep" options={reps} />
  <Select label="Status" options={statuses} />
  <button className="ghost-btn" onClick={resetFilters}>Reset</button>
</div>
```

### Mobile filter button + sheet
```tsx
<div className="md:hidden flex gap-2 mb-4">
  <SearchInput className="flex-1" placeholder="Search..." />
  <button onClick={openFilterSheet} className="h-11 px-4 rounded-xl border border-border flex items-center gap-2">
    <SlidersHorizontal className="w-4 h-4" />
    <span className="text-sm font-medium">Filter</span>
    {activeFilterCount > 0 && (
      <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {activeFilterCount}
      </span>
    )}
  </button>
</div>

{/* Bottom sheet with filters */}
```

---

## Sorting

Show sort indicators in column headers. Click to toggle asc/desc/none.

```tsx
<th>
  <button
    onClick={() => toggleSort('sale_date')}
    className="flex items-center gap-1 text-xs font-medium text-text-secondary uppercase tracking-wide hover:text-text-primary"
  >
    Date
    {sortKey === 'sale_date' && (
      sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
    )}
  </button>
</th>
```

Default sort: most recent first (descending by date).

---

## Pagination

Use "load more" button rather than paginated page numbers. Better for mobile, simpler to build, easier to scan.

```tsx
{hasMore && (
  <div className="flex justify-center mt-6">
    <button onClick={loadMore} className="secondary-btn">
      Load 25 more
    </button>
  </div>
)}
```

For very large datasets (1000+), implement proper pagination with page numbers. Not relevant for this app at MVP scale.

---

## Search

Always debounce search input by 250-300ms.

```tsx
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

// Use debouncedSearch in your query, not search
```

For client-side filtering of already-loaded data, no debounce needed — filter live. Only debounce when each keystroke triggers a server query.

---

## Empty States

If the underlying table has no data ever:

```tsx
<EmptyState
  icon={<ShoppingBag />}
  title="No sales yet"
  description="Once you log your first sale, it'll appear here."
  action={<Link href="/sales/new">Add a sale</Link>}
/>
```

If filters return no results:

```tsx
<EmptyState
  icon={<SearchX />}
  title="No results"
  description="Try adjusting your filters or search."
  action={<button onClick={resetFilters}>Reset filters</button>}
/>
```

Different copy for "no data ever" vs "no data matches filter" — the action you want them to take is different.

---

## Loading States

### Initial load (skeleton)
Show a skeleton in the same shape as the eventual content.

```tsx
{loading && (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-bg-elevated border border-border rounded-xl p-4">
        <div className="h-4 bg-bg-secondary rounded animate-pulse w-1/2 mb-2" />
        <div className="h-3 bg-bg-secondary rounded animate-pulse w-1/3" />
      </div>
    ))}
  </div>
)}
```

### Filter/search re-fetch
Show subtle loading indicator at top of table, don't replace the whole thing with a skeleton. Users want to see filtered results merge in, not a flash of skeleton.

```tsx
{refetching && (
  <div className="absolute top-0 right-0 p-3">
    <Loader2 className="w-4 h-4 animate-spin text-accent" />
  </div>
)}
```

---

## Row Actions

For each row, common actions: View, Edit, Delete.

### Mobile: tap row to view detail
The whole card is a link to the detail page. From the detail page, edit and delete are available.

### Desktop: hover-revealed actions or always-visible
For frequently-used actions, keep them always visible:
```tsx
<td className="px-4 py-3 text-right">
  <div className="flex justify-end gap-1">
    <button className="icon-btn"><Eye className="w-4 h-4" /></button>
    <button className="icon-btn"><Pencil className="w-4 h-4" /></button>
  </div>
</td>
```

For destructive actions (delete), put them in a dropdown menu so they're not tap-by-mistake.

---

## Bulk Actions (Future)

Not needed for V1. If implemented later:
- Checkbox column on left for selection
- Top toolbar appears when items are selected: "3 selected | Delete | Export"
- Don't allow bulk delete without confirmation

---

## Export

For reports, always offer CSV export:

```tsx
function exportToCSV(rows: Sale[]) {
  const headers = ['Date', 'Customer', 'Suburb', 'Quantity', 'Total', 'Status', 'Rep']
  const data = rows.map(r => [
    r.sale_date,
    r.customer_business_name,
    r.customer_suburb,
    r.quantity,
    r.total_value,
    r.payment_status,
    r.user.full_name,
  ])
  
  const csv = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## Don'ts

- **Don't** show 50 columns — pick the 4-6 most important and put the rest in detail view
- **Don't** use horizontal scroll on mobile — switch to cards
- **Don't** use truncation without a tooltip / detail view to see the full content
- **Don't** show pagination controls for fewer than 25 items
- **Don't** make rows too tall — 48-56px is a good range
- **Don't** use heavy borders between rows (use very subtle ones)
