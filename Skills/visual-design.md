# Skill: Visual Design

This skill is the taste layer — the set of design instincts that separate a generic app from one that feels considered. Reference this whenever making layout, hierarchy, or aesthetic decisions.

This sits on top of the design-system skill. Design system = tokens and components. This skill = how to use them well.

---

## Core Principles

### 1. Confidence through restraint
The app should feel like it knows what it's doing. That means:
- Don't decorate. Every element earns its place by serving information or function.
- Don't add visual noise to "fill" space. Whitespace is the design.
- Don't compete with the data. The numbers are the hero — the chrome supports them.

### 2. Hierarchy through scale and space, not colour and weight
- 80% of the visual hierarchy should come from typographic scale and whitespace
- Use colour sparingly — primarily for the accent (teal) on key actions and brand moments
- Use weight changes (medium vs regular) for subtle distinction, not bold-everywhere

### 3. Numbers are the hero
This is a data app. The KPIs, totals, and metrics are why people open it.
- Numbers should be larger than their labels, not smaller
- Numbers should use Geist Mono with tabular-nums for stability
- Numbers should sit comfortably with breathing room around them
- Don't shrink numbers to fit; resize the container

### 4. Premium feel = quiet confidence
- No emojis in UI (only allowed if user inputs them)
- No exclamation marks in copy ("Sale recorded" not "Sale recorded!")
- No motivational nudges ("Great work!" — cringe)
- No over-the-top success states (checkmark + "Sale recorded", that's it)

---

## Layout Composition

### The 12-column rule
Build all desktop layouts on a 12-column mental grid. Standard splits:

- Dashboard KPI row: 4 cards × 3 columns each (or 6 cards × 2 columns each)
- Two-up content: 8 columns + 4 columns (main + sidebar)
- Three-up cards: 4 + 4 + 4
- Forms: max-width 480px, centred

### Responsive breakpoints
Build mobile first, then add desktop:

```
Default (mobile): single column, stacked
md (768px+):      two columns where it makes sense
lg (1024px+):     three columns, sidebars appear
xl (1280px+):     full layouts, more density
```

### Page container widths
- Forms and detail views: `max-w-2xl mx-auto` (672px)
- Standard content: `max-w-6xl mx-auto` (1152px)
- Wide tables and dashboards: `max-w-7xl mx-auto` (1280px)
- Never let content stretch full-width on huge monitors — it looks unloved

### Vertical rhythm
- Top of page to first content: `pt-8` (32px) on desktop, `pt-6` on mobile
- Between major sections: `space-y-8` or `space-y-12`
- Between cards in a list: `space-y-4`
- Within a card: `space-y-4` for content blocks, `space-y-2` for tight stacks

---

## Information Density

### Be generous, not stingy
The instinct to "fit more on screen" makes apps feel cheap. Better to scroll than cram.

- Tables: 14-18px body text, 12-14px tight rows is fine but not crammed
- Cards: at least 24px (p-6) internal padding
- KPI numbers: 28-32px on desktop, 24-28px on mobile
- Labels above values: 12-14px, never below 12px

### When density matters
- Long tables with 50+ rows: tighter row height (40-44px)
- Reports with lots of data: smaller fonts justified
- Mobile bottom nav and headers: tight by necessity

### When density hurts
- Dashboard KPIs (let them breathe)
- Form fields (44px minimum touch target)
- Empty states (generous padding, never cramped)
- Single-screen primary actions

---

## Colour Discipline

### The accent (teal) is precious
Use the deep teal `#1A5F5A` for:
- Primary CTA on each page (one button, ideally)
- Active state on nav items
- The "+ Sale" button on bottom nav (it's the hero action)
- Links inside body text
- Selected/highlighted state in lists
- Single-line dividers between major moments

### Don't use teal for:
- Decoration
- Section backgrounds (unless using accent-light)
- Hover states on every interactive element
- Borders on every card
- Anything purely visual

### Status colours
Reserve for actual status:
- Green: paid, completed, successful
- Amber: pending, waiting, in-progress
- Red: failed, overdue, error

Never use status colours as decoration. A green card is not "vibrant" — it's "successful."

### Greys carry the weight
Most of the UI is in greys: text, borders, backgrounds. Get the grey hierarchy right and the app looks expensive even with no other colour.

```
Background:    #FAF9F7 (warm white)
Card:          #FFFFFF (true white, contrasts gently with bg)
Border:        #E5E4E0 (subtle but visible)
Text muted:    #6B6B67 (warm grey, not cold)
Text body:     #1A1A18 (off-black, never #000)
```

The warmth in these greys (slight yellow undertone) is what makes the app feel premium rather than corporate-cold.

---

## Typography Composition

### Pair Geist Sans + Geist Mono carefully
- Geist Sans: everything except numbers
- Geist Mono: monetary values, percentages, counts, IDs
- Never use mono for headings or body text — it looks dated

### Hierarchy through scale, not aggression
A good rule: between adjacent levels, scale up by 1.25x to 1.5x.

Bad hierarchy: 48px → 14px (too violent)
Good hierarchy: 30px → 20px → 16px → 14px → 12px

### Line height
- Headings: tight (`leading-tight` or `tracking-tight`)
- Body: relaxed (`leading-relaxed` ~1.625)
- Tables and dense data: normal (`leading-normal` ~1.5)

### Tracking
- Large headings (text-2xl+): use `tracking-tight` for confidence
- Body text: default tracking
- All caps labels: use `tracking-wide`

---

## Imagery and Iconography

### Icons (Lucide React)
- Use 16-20px icons in body text and labels
- Use 20-24px icons for nav and buttons
- Use 24-32px icons for hero/empty states
- Stroke width 1.5 (default in Lucide) — never use bold variants
- Always pair icons with text labels in nav, never icon-only

### No images, no illustrations
This is a data app. No stock photos, no robot icons, no AI imagery, no abstract gradients. The data is the visual.

The exception: empty states can use a single Lucide icon at 24px in a circular accent-light background. Nothing else.

### Avatars
For users, use initials in a coloured circle:
```tsx
<div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-medium">
  TM
</div>
```

---

## Motion and Transitions

### Subtle, fast, never bouncy
- Hover transitions: 150ms
- Active state transitions: 100ms
- Page transitions: not custom, just let Next.js do its thing
- Skeleton loading: `animate-pulse` is fine

### What NOT to animate
- No spring physics ever
- No scroll-triggered animations
- No parallax
- No "delight" micro-animations on every interaction
- No animated chart entrance (just render with the data)

### What's worth animating
- Modal in/out (fade + slight slide)
- Toast in/out
- Bottom nav active indicator
- Number changes in KPIs (only if you can do it cleanly with a library — otherwise skip)

---

## Charts (Recharts specifically)

### Style guide for charts
- Use a single accent colour (teal) for the primary metric
- Secondary metrics: use grey (#9C9B96) so the primary stands out
- Grid lines: very subtle (#EDEBE7), or none at all
- Axes: no axis lines, just labels
- Tooltips: white card with subtle border, mono font for numbers
- No legends if there's only one series
- No 3D, no fancy gradients in chart fills

### Chart sizing
- KPI sparkline (small): 80px tall, no axes
- Dashboard chart: 240-280px tall on desktop, 200px on mobile
- Reports chart (large): 360-400px tall

### Empty chart states
A blank chart with no data is jarring. Always show a friendly empty state:
```
"No sales recorded in this period"
[small Lucide chart icon]
```

---

## Specific App Moments

### Dashboard
- Top row: 4 KPI cards in a grid
- Hero metric (Today's Revenue) gets visual emphasis: slightly larger card or accent-coloured top border
- Charts below KPIs, two-up on desktop, stacked on mobile
- Recent activity feed at the bottom

### Add Sale form
- Single column, max-w-md
- Defaults pre-filled
- Submit button is full-width, primary teal, sticky at bottom on mobile
- Success: brief toast, redirect to dashboard

### Sales list
- Mobile: cards with key info (customer, date, total)
- Desktop: data table with columns
- Filters at the top, collapsible on mobile
- Empty state when no results match filters

### Login
- Centred card, max-w-sm
- Logo or wordmark above
- Single column form
- No "remember me", no social login, no clutter

---

## The "Would I pay for this?" test

Before considering any page done, ask: "If I saw this in an app I was paying for, would it feel premium or cheap?"

Premium means:
- Considered spacing
- Restrained colour
- Numbers that feel solid
- Forms that feel quick
- Empty states that feel intentional, not broken
- Loading states that feel like the app is thinking, not stuck

Cheap means:
- Cramped layouts
- Inconsistent spacing
- Multiple competing colours
- Stretched-thin proportions on big screens
- Generic empty states ("No data")
- Tiny touch targets

---

## Final rule: less is more, but not lazy

"Minimal" doesn't mean unfinished. A truly considered design looks effortless because every detail is decided. If something feels bare, it might be missing intentional craft (a subtle animation, a clearer empty state, a better number format) rather than missing more elements.

When in doubt: remove visual noise, refine what remains.
