# Skill: Mobile-First

This app is used by two people in the field, on their phones, between sales calls. If mobile UX is bad, daily logging won't happen, and the whole tool is useless. Mobile-first isn't a buzzword here — it's the actual primary surface.

---

## Build Order: Mobile First, Always

For every page or component, build in this order:

1. **Mobile (390px wide)** — make it work, look good, be fast
2. **Tablet (768px)** — add breathing room, two-column layouts where useful
3. **Desktop (1024px+)** — full layouts, sidebars, more density

Never build desktop-first and add a media query for mobile. The result is always cramped, awkward, or broken.

### Mental model
- Default Tailwind classes = mobile styles
- `md:` prefix = tablet upgrades
- `lg:` prefix = desktop layouts
- `xl:` prefix = large desktop refinements (rarely needed)

```tsx
// Good — mobile defaults, desktop additions
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">

// Bad — desktop defaults with mobile patches
<div className="flex gap-8 sm:flex-col sm:gap-4">
```

---

## Touch Targets

### 44x44px minimum
Apple's HIG. Anything smaller is too easy to mis-tap. Use `h-11 w-11` (44px) as the absolute floor.

For buttons: `h-11 px-5` (height 44px, comfortable horizontal padding)
For icon buttons: `h-11 w-11` (square)
For small icon buttons in toolbars: `h-10 w-10` (40px, acceptable)

### Spacing between tap targets
At least 8px between adjacent buttons. `gap-2` minimum.

### Don't use icon-only buttons in nav
Always pair icons with labels — `<Icon />` + `<span>` — even if the label is small. Icon-only nav is hostile.

---

## The Thumb Zone

When a user holds a phone one-handed, only the bottom-third of the screen is comfortably reachable. Design accordingly.

### What goes at the bottom
- Primary CTAs ("Save Sale", "Log Activity")
- Bottom navigation (always)
- Floating action button (the "+" sale button)
- Toast notifications

### What goes at the top
- Page title
- Secondary actions (filter, search)
- Back navigation
- User avatar / settings

### What goes in the middle
- Content. The middle is for scanning, not tapping.

### Sticky bottom bars for forms
On mobile, when a form is long enough to scroll, the submit button must be sticky at the bottom:

```tsx
<form>
  <div className="space-y-4 pb-24"> {/* space for sticky button */}
    {/* form fields */}
  </div>
  
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-elevated border-t border-border md:relative md:p-0 md:bg-transparent md:border-0 md:mt-6">
    <button type="submit" className="w-full md:w-auto primary-btn">
      Save sale
    </button>
  </div>
</form>
```

---

## Bottom Navigation

5-tab pattern with the centre slot being the primary action.

```
[Home] [Sales] [+ Sale] [Activity] [More]
```

- Active tab: teal text and icon
- Inactive: grey
- Centre "+ Sale" button: elevated, teal circle, white plus icon

### Sticky always
Bottom nav is fixed-bottom on mobile, hidden on desktop (replaced by sidebar).

### Don't put critical destructive actions in bottom nav
Delete, sign out, etc. should be buried in "More" or settings, not one tap away from the thumb zone.

---

## Form Inputs on Mobile

### Input height: 44px minimum
`h-11` for all text inputs. Same as buttons.

### Use proper input modes for keyboards
This makes the right keyboard appear:

```tsx
<input type="email" inputMode="email" autoComplete="email" />
<input type="tel" inputMode="tel" autoComplete="tel" />
<input type="number" inputMode="numeric" pattern="[0-9]*" />
<input type="text" inputMode="decimal" /> // for $ amounts
```

### Auto-capitalise where appropriate
```tsx
<input autoCapitalize="words" /> // names, business names
<input autoCapitalize="sentences" /> // notes, descriptions
<input autoCapitalize="none" /> // emails, codes
```

### Date inputs
On mobile, `<input type="date" />` triggers the native date picker. Use it. Don't ship a custom date picker for mobile.

For date ranges, two `type="date"` inputs side by side beats any custom picker on phones.

### Avoid placeholder-only labels
Placeholders disappear when typing. Always have a real label above the input.

```tsx
// Good
<label>Customer business name</label>
<input placeholder="e.g. Acacia Ridge Auto" />

// Bad
<input placeholder="Customer business name" />
```

---

## Tables → Cards on Mobile

Data tables don't fit on phones. At mobile sizes, render data as cards instead.

```tsx
{/* Desktop: table */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* Mobile: cards */}
<div className="md:hidden space-y-3">
  {sales.map(sale => (
    <div className="bg-bg-elevated border border-border rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium">{sale.customer_business_name}</div>
          <div className="text-sm text-text-secondary">{sale.customer_suburb}</div>
        </div>
        <div className="font-mono font-medium">{formatCurrency(sale.total_value)}</div>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-tertiary">{formatDate(sale.sale_date)}</span>
        <Badge status={sale.payment_status} />
      </div>
    </div>
  ))}
</div>
```

---

## Avoid Hover-Only Interactions

Touch devices have no hover. Anything that's only revealed on hover is invisible to mobile users.

### Don't hide actions on hover
Bad: a row of "..." that only shows on hover and reveals "edit / delete"
Good: visible action buttons or a tap-to-open detail page

### Use "long press" sparingly
Most users don't know it exists. If you use it, also offer a tap alternative.

### Tooltips
Tooltips don't work on touch. If information is important, show it inline. If it's just helpful, use a small "?" icon that opens a sheet on tap.

---

## Performance on Mobile

Mobile users are often on patchy 4G or moving between WiFi and cellular.

### Target metrics
- First Contentful Paint: under 1.5s
- Time to Interactive: under 3s
- Total page weight: under 500KB if possible

### Practical rules
- Server-render whenever possible (Next.js server components)
- No heavy client-side libraries unless essential
- Lazy-load charts (they're only on dashboard and reports)
- Compress images (you don't have many — keep it that way)
- Cache aggressively — Supabase data can be stale by 30s without anyone noticing

### Connection-aware
Show clear loading states. A blank screen for 3 seconds feels broken; a skeleton for 3 seconds feels fast.

---

## Page-by-Page Mobile Specifics

### Dashboard
- KPI cards stack to 2 columns on mobile (not 4)
- Charts go full-width, single column
- "Today's revenue" gets the most prominent card

### Add Sale
- Full screen on mobile (not a modal)
- Single column form
- Sticky submit at bottom
- Number-pad keyboard for quantity, dollar amounts
- Pre-filled defaults so most fields are already correct

### Sales list
- Search bar at top, filter button next to it
- Filter opens a bottom sheet, not a sidebar
- Cards instead of table
- Pagination via "load more" button (not infinite scroll — easier to control)

### Activity
- Calendar view doesn't work on mobile — use a list view instead
- Today's entry pinned at top with "edit today" button
- Past entries below, newest first

### Customer detail
- Contact info at top (with tap-to-call and tap-to-email)
- Sales history scrollable below
- Notes editable inline

---

## Tap-to-Call and Tap-to-Email

For customer phone numbers and emails, always use proper links:

```tsx
<a href={`tel:${customer.phone}`} className="text-accent">
  {formatPhone(customer.phone)}
</a>

<a href={`mailto:${customer.email}`} className="text-accent">
  {customer.email}
</a>
```

This lets the user tap a number to call directly. Big UX win for field work.

---

## Test on Real Mobile

After every page is built:

1. Open it in browser DevTools at 390px width (iPhone 14 size)
2. Use only your thumb (no mouse) to navigate
3. Try filling out forms
4. Try the primary action

If anything feels awkward, rebuild it. The founders use this in moving cars and shop carparks. It has to be effortless.
