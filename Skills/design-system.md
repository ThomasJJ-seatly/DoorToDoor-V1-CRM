# Skill: Design System

This skill defines the exact design tokens, components, and patterns to be used consistently across every page of the d2d tracker. Reference this for every UI decision. Never invent new tokens or patterns — extend these.

---

## Design Tokens

### Colours (Tailwind config + CSS variables)

```ts
// tailwind.config.ts colors
{
  bg: {
    primary: '#FAF9F7',     // page background
    secondary: '#F4F2EE',   // subtle section background
    elevated: '#FFFFFF',    // cards, modals
    inverse: '#1A1A18',     // dark sections (rare)
  },
  text: {
    primary: '#1A1A18',     // body, headings
    secondary: '#6B6B67',   // labels, helper
    tertiary: '#9C9B96',    // muted, placeholder
    inverse: '#FAF9F7',     // text on dark bg
    accent: '#1A5F5A',      // teal links
  },
  accent: {
    DEFAULT: '#1A5F5A',     // primary teal
    hover: '#154D49',       // teal hover state
    active: '#0F3D3A',      // teal active state
    light: '#E8F4F3',       // teal background tint
    border: '#B8DCD8',      // teal border tint
  },
  border: {
    subtle: '#EDEBE7',      // hairline dividers
    DEFAULT: '#E5E4E0',     // standard borders
    strong: '#D5D3CD',      // emphasised borders
  },
  status: {
    success: '#2D7A3F',
    successBg: '#E8F3EA',
    warning: '#C97A1A',
    warningBg: '#FBF1E2',
    danger: '#A8362F',
    dangerBg: '#F7E5E3',
    info: '#1A5F5A',
    infoBg: '#E8F4F3',
  },
}
```

### Typography Scale

Use these exact classes — never custom font sizes.

| Use case | Tailwind classes |
|----------|------------------|
| Page H1 | `text-3xl font-medium tracking-tight text-text-primary` |
| Section H2 | `text-2xl font-medium tracking-tight text-text-primary` |
| Card title | `text-lg font-medium text-text-primary` |
| Subhead | `text-base font-medium text-text-primary` |
| Body | `text-base text-text-primary leading-relaxed` |
| Body small | `text-sm text-text-primary` |
| Label | `text-sm font-medium text-text-secondary` |
| Helper text | `text-xs text-text-tertiary` |
| Stat large (dashboard KPI) | `text-3xl font-mono font-medium tracking-tight tabular-nums` |
| Stat medium | `text-xl font-mono font-medium tabular-nums` |
| Stat small (in tables) | `text-sm font-mono tabular-nums` |

**Always use `font-mono tabular-nums` for monetary values, percentages, and counts.** Use `Geist Mono`. This stops numbers from jumping around as values change.

### Spacing Scale

Use Tailwind's default scale (`p-2`, `p-4`, `p-6`, `p-8`). Standard rules:

- Card internal padding: `p-6` (desktop), `p-4` (mobile)
- Section vertical spacing: `py-8` (desktop), `py-6` (mobile)
- Form field vertical gap: `space-y-4`
- Stack of cards: `space-y-4`
- Inline element gap: `gap-3` for buttons, `gap-2` for inline icons+text
- Page horizontal padding: `px-6` (desktop), `px-4` (mobile)

### Border Radius

- Cards, buttons, inputs: `rounded-xl` (12px)
- Pills, badges: `rounded-full`
- Small chips: `rounded-md` (6px)
- Modal/sheet: `rounded-2xl` (16px)

### Shadows

Use sparingly. Shadows = elevation, not decoration.

- Resting cards: NO shadow, use border instead
- Floating elements (dropdowns, tooltips): `shadow-md`
- Modals: `shadow-2xl`
- Bottom nav: `shadow-[0_-1px_0_0_rgb(0_0_0_/_0.06)]` (subtle top border)

---

## Components

These are the canonical patterns. When building anything new, check here first.

### Button

```tsx
// Primary — main CTA per page
<button className="h-11 px-5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover active:bg-accent-active transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

// Secondary — outline
<button className="h-11 px-5 rounded-xl border border-border bg-bg-elevated text-text-primary font-medium hover:bg-bg-secondary transition-colors">

// Ghost — minimal
<button className="h-11 px-5 rounded-xl text-text-primary font-medium hover:bg-bg-secondary transition-colors">

// Danger — destructive
<button className="h-11 px-5 rounded-xl bg-status-danger text-white font-medium hover:opacity-90 transition-opacity">

// Sizes
// sm: h-9 px-4 text-sm
// md: h-11 px-5 (default)
// lg: h-12 px-6 text-base

// Icon button (square)
<button className="h-11 w-11 rounded-xl flex items-center justify-center hover:bg-bg-secondary">
```

### Card

```tsx
// Standard
<div className="bg-bg-elevated border border-border rounded-xl p-6">

// Section card with title
<div className="bg-bg-elevated border border-border rounded-xl">
  <div className="px-6 py-4 border-b border-border-subtle">
    <h3 className="text-lg font-medium">Title</h3>
  </div>
  <div className="p-6">...</div>
</div>

// KPI card
<div className="bg-bg-elevated border border-border rounded-xl p-5">
  <div className="text-sm font-medium text-text-secondary">Today's Revenue</div>
  <div className="mt-2 text-3xl font-mono font-medium tabular-nums">$1,194</div>
  <div className="mt-1 text-xs text-text-tertiary">+12% vs yesterday</div>
</div>
```

### Input

```tsx
// Text input
<div className="space-y-1.5">
  <label className="text-sm font-medium text-text-secondary">Label</label>
  <input className="h-11 w-full px-4 rounded-xl border border-border bg-bg-elevated text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
  <p className="text-xs text-text-tertiary">Helper text (optional)</p>
</div>

// Error state
<input className="h-11 w-full px-4 rounded-xl border border-status-danger bg-status-dangerBg/50 ..." />
<p className="text-xs text-status-danger">Error message</p>
```

### Badge / Status pill

```tsx
// Generic
<span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">

// Success
<span className="bg-status-successBg text-status-success">Paid</span>

// Warning
<span className="bg-status-warningBg text-status-warning">Pending</span>

// Danger
<span className="bg-status-dangerBg text-status-danger">Failed</span>

// Neutral
<span className="bg-bg-secondary text-text-secondary">Draft</span>
```

### Bottom Nav (mobile)

```tsx
<nav className="fixed bottom-0 inset-x-0 h-16 bg-bg-elevated border-t border-border-subtle md:hidden z-40">
  <div className="grid grid-cols-5 h-full">
    {/* Tab items */}
    <button className="flex flex-col items-center justify-center gap-0.5 text-text-tertiary data-[active=true]:text-accent">
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    
    {/* Centre + button — elevated */}
    <button className="flex items-center justify-center">
      <div className="w-12 h-12 rounded-full bg-accent text-white shadow-md flex items-center justify-center -mt-4 hover:bg-accent-hover transition-colors">
        <Plus className="w-6 h-6" />
      </div>
    </button>
  </div>
</nav>
```

### Toast

```tsx
// Bottom-right (desktop), bottom-centre (mobile)
<div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-bg-elevated border border-border rounded-xl shadow-md p-4 flex items-start gap-3">
  <CheckCircle className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
  <div className="flex-1">
    <div className="font-medium text-text-primary">Sale recorded</div>
    <div className="text-sm text-text-secondary">+$199 added</div>
  </div>
</div>
```

### Empty State

```tsx
<div className="text-center py-12 px-6">
  <div className="mx-auto w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-4">
    <Icon className="w-6 h-6 text-accent" />
  </div>
  <h3 className="text-lg font-medium text-text-primary">No sales yet</h3>
  <p className="mt-1 text-sm text-text-secondary max-w-sm mx-auto">
    Once you log your first sale, it'll show up here.
  </p>
  <button className="mt-6 ...primary button...">
    Log first sale
  </button>
</div>
```

---

## Patterns

### Page header
```tsx
<header className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-3xl font-medium tracking-tight">Sales</h1>
    <p className="text-sm text-text-secondary mt-1">All recorded sales</p>
  </div>
  <button className="primary button">Add sale</button>
</header>
```

### Section header
```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-medium">Recent activity</h2>
  <Link className="text-sm text-accent hover:underline">View all</Link>
</div>
```

### Loading skeleton
- Use `bg-bg-secondary animate-pulse rounded-xl` for skeleton blocks
- Match the shape of what's being loaded
- Don't show skeletons for under-200ms loads — flash is worse than nothing

---

## Rules

1. **Never use raw hex codes in JSX.** Always use the Tailwind tokens above.
2. **Never invent new colours.** If you need a new shade, check whether an existing token works.
3. **Never use heavy shadows or gradients.** Borders convey hierarchy.
4. **Always use `tabular-nums` for numbers.** Especially in tables and dashboards.
5. **Always use `font-mono` for currency.** Geist Mono.
6. **Hover states only matter on desktop.** Use `hover:` modifier but don't depend on hover for primary UX.
7. **Touch targets minimum 44px tall.** Use `h-11` (44px) as default for buttons and inputs.
8. **Generous padding always.** When in doubt, more space.
