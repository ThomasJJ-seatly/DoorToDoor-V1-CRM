# Skill: Accessibility

A11y is non-negotiable. Costs almost nothing if you build it in from the start, expensive to retrofit. For a daily-use tool, even small a11y wins compound.

---

## Semantic HTML

Use the right element for the job. Don't reach for `<div>` when there's a better option.

| Use case | Element |
|----------|---------|
| Clickable that navigates | `<Link>` (Next.js) → renders `<a>` |
| Clickable that triggers an action | `<button>` |
| Group of fields | `<fieldset>` with `<legend>` |
| Section heading | `<h1>` through `<h6>` (one h1 per page) |
| Page-level navigation | `<nav>` |
| Distinct main content | `<main>` |
| Article/standalone content | `<article>` |
| Sidebar / aside content | `<aside>` |
| List of items | `<ul>` / `<ol>` with `<li>` |

### Common mistakes to avoid
- `<div onClick>` instead of `<button>`. Use button.
- `<a href="#">` for actions. Use button.
- `<button>` to navigate. Use link.
- Skipping heading levels (h1 → h3). Use proper hierarchy.

---

## Labels

Every form input needs a label that's programmatically associated.

### Pattern (preferred)
```tsx
<label htmlFor="business-name" className="...">Business name</label>
<input id="business-name" name="business_name" />
```

### When you can't see a visible label
Use `aria-label` for icon buttons:
```tsx
<button aria-label="Delete sale">
  <Trash2 className="w-4 h-4" />
</button>
```

### When the label is far from the input
Use `aria-labelledby`:
```tsx
<h2 id="filters-heading">Filters</h2>
<input aria-labelledby="filters-heading" />
```

---

## Focus Management

### Visible focus
Never `outline: none` without replacement. Use Tailwind's `focus-visible:` for keyboard-only focus rings:

```tsx
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
```

### Focus trap in modals
When a modal opens, focus should move into it and not escape until closed. Use a library like Radix UI Dialog or React Aria. Don't roll your own.

### Skip links
Add a "skip to main content" link as the first focusable element on the page:

```tsx
<a 
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:p-3 focus:bg-bg-elevated focus:rounded-xl"
>
  Skip to main content
</a>

<main id="main">...</main>
```

---

## Keyboard Navigation

### Test every interactive element with Tab
- All buttons, links, inputs reachable via Tab in logical order
- Tab order matches visual order
- No keyboard traps (you can always Tab out)

### Common keyboard actions
- Enter on a button: triggers it
- Space on a button: triggers it
- Enter in a form: submits the form
- Escape in a modal: closes it
- Arrow keys in a select / dropdown: navigate options

These all "just work" with native HTML elements. They break when you build custom controls in `<div>`.

---

## Colour and Contrast

### Contrast ratios (WCAG AA)
- Body text: at least 4.5:1 against background
- Large text (18pt+ or 14pt+ bold): at least 3:1
- UI components / icons: at least 3:1

### Check your colours
Our design system passes WCAG AA when used as documented:

- `text-primary` (#1A1A18) on `bg-primary` (#FAF9F7): ~16:1 ✓
- `text-secondary` (#6B6B67) on `bg-primary`: ~5:1 ✓
- `accent` (#1A5F5A) on white: ~7:1 ✓
- White on `accent`: ~7:1 ✓

### Never rely on colour alone
Status badges should have icons or text labels, not just colour:

```tsx
<Badge>
  <CheckCircle className="w-3 h-3" />
  Paid
</Badge>
```

A red label that just says "Status" doesn't tell colour-blind users what's wrong.

---

## Screen Reader Considerations

### Hide decorative content from screen readers
```tsx
<Icon aria-hidden="true" />  {/* purely decorative */}
<span aria-hidden="true">→</span>  {/* visual arrow, not info */}
```

### Show content only to screen readers
```tsx
<span className="sr-only">Loading sales</span>
{/* visible spinner */}
```

### Announce dynamic changes
For things like form errors that appear without page navigation, use `aria-live`:

```tsx
<div aria-live="polite" aria-atomic="true">
  {error && <p role="alert">{error}</p>}
</div>
```

For toasts and notifications, set `role="status"` or `role="alert"` depending on urgency.

---

## Forms

### Required field indicators
Indicate required visually AND semantically:

```tsx
<label>
  Email
  <span aria-hidden="true" className="text-status-danger ml-0.5">*</span>
  <span className="sr-only">required</span>
</label>
<input type="email" required aria-required="true" />
```

### Error association
```tsx
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : 'email-helper'}
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

### Group related fields
```tsx
<fieldset>
  <legend>Customer details</legend>
  {/* customer-related fields */}
</fieldset>
```

---

## Tables

### Header cells
Use `<th>` not `<td>` for table headers, with `scope="col"` or `scope="row"`:

```tsx
<table>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">Customer</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>3 Apr</td>
      <td>Acacia Ridge Auto</td>
    </tr>
  </tbody>
</table>
```

### Caption
Add a `<caption>` to describe the table for screen readers:

```tsx
<table>
  <caption className="sr-only">List of recent sales, sorted by date</caption>
  ...
</table>
```

---

## Images

### Alt text
- Decorative: `alt=""` (empty, NOT missing)
- Meaningful: descriptive alt text
- Icons that convey meaning: aria-label on the parent button or `aria-hidden="false"` with descriptive context

For this app, we have no real images. If we add a logo:
```tsx
<img src="/logo.svg" alt="Certus Agency" />
```

---

## Loading and Empty States

### Loading states should be announced
```tsx
<div role="status" aria-live="polite">
  {loading && <span className="sr-only">Loading sales</span>}
  {/* visible skeleton */}
</div>
```

### Empty states should be clear
The visible heading and text should be enough. Screen readers will read it naturally.

---

## Touch Targets

WCAG 2.2 requires 24x24px minimum touch targets, with 44x44px recommended for primary actions. We use 44x44px (`h-11 w-11`) consistently.

This is enforced via the design system. Don't make smaller tap targets.

---

## Motion

### Respect prefers-reduced-motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Add this to `globals.css`. Applies globally — animations effectively turn off for users who prefer that.

---

## Testing

### Quick manual checks
1. Tab through the entire page — every interactive element reachable, in logical order
2. Use only keyboard for all flows (no mouse)
3. Use Mac VoiceOver or Windows Narrator on a few pages
4. Check colour contrast with browser DevTools accessibility panel
5. Run Lighthouse a11y audit — aim for 95+

### Automated checks
- ESLint plugin: `eslint-plugin-jsx-a11y` (catches obvious issues)
- Lighthouse CI in your build pipeline (optional)

---

## Don'ts

- **Don't** use `tabIndex={-1}` to "fix" tab order. Fix the actual structure.
- **Don't** use `tabIndex` greater than 0. Ever.
- **Don't** rely on placeholder text as the only label.
- **Don't** disable form fields without indicating why to screen readers.
- **Don't** auto-focus inputs unless it makes sense (login page yes, every form no).
- **Don't** use `role="button"` on a `<div>`. Just use `<button>`.
- **Don't** announce every change with `aria-live`. Reserve for important updates.
