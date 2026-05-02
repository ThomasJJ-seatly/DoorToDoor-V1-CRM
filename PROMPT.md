# Claude Code Prompt — Door-to-Door Sales Tracker

## Your Task

Build a complete, production-ready internal web app for a door-to-door sales business that sells $199 mechanic voucher bundles. The app is used by two founders to log daily field activity, record sales, track revenue, and manage commissions for future sales reps.

This is an internal tool used daily by two people (and eventually 3-5 sales reps). It must be FAST, mobile-friendly, and reliable. The founders will be entering data on their phones in the field — between sales calls, in the car, after a knock.

Read CLAUDE.md in full before writing any code. It contains the complete business context, commission logic, data schema, and design requirements.

---

## Tech Stack (non-negotiable)

- **Framework:** Next.js 14 (App Router) with TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **Fonts:** Geist Sans (primary) + Geist Mono (numerical data) via next/font
- **Date handling:** date-fns
- **Deployment target:** Vercel
- **Domain target:** app.certusagency.com.au

---

## Build Order

Build in this order. Don't skip steps. Confirm each layer works before moving to the next.

### Phase 1 — Foundations
1. Initialise Next.js 14 project with TypeScript, Tailwind, App Router
2. Install all dependencies (`@supabase/supabase-js`, `@supabase/ssr`, `recharts`, `lucide-react`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`)
3. Set up Tailwind config with the colour palette from CLAUDE.md
4. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` for Supabase access
5. Create `.env.local.example` with all required env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

### Phase 2 — Database
1. Create `supabase/migrations/001_initial_schema.sql` with the full schema from CLAUDE.md
2. Include Row-Level Security policies for all tables:
   - `users`: users can read their own row, admins can read all
   - `daily_activity`: reps can read/write their own; admins can read/write all
   - `sales`: reps can read/write their own; admins can read/write all
   - `customers`: all authenticated users can read; only admins can write
3. Create a database function `calculate_commission(p_user_id, p_sale_date, p_quantity)` that:
   - Returns 0 for admins (they keep full revenue, commission column unused)
   - Returns `$80 × quantity` if rep has fewer than 6 sales that day
   - Returns `$100 × quantity` if rep has 6 or more sales that day
4. Create a trigger `recalculate_daily_commissions` on the `sales` table that:
   - On INSERT/UPDATE/DELETE, recalculates commission for ALL of that rep's sales on that date
   - Ensures the tier upgrade applies retroactively when the 6th sale is logged
5. Create a database function/trigger to upsert into the `customers` table whenever a sale is logged with a new business name

### Phase 3 — Auth
1. Build `/login` page with email/password form
2. Build middleware (`middleware.ts`) that protects all routes except `/login`
3. After successful login, redirect to `/` (dashboard)
4. Implement logout
5. The first user to sign up should be assigned `admin` role automatically (use a database trigger or seed). Subsequent users default to `rep` role until promoted.

### Phase 4 — Layout
1. Build the app shell:
   - **Desktop:** Left sidebar nav + main content area
   - **Mobile:** Bottom tab bar (Home, Activity, +Sale (prominent), Sales, More)
2. The "+ Sale" button on mobile is the primary action — make it visually prominent (teal circle, raised, in the centre of the tab bar)
3. Top header on every page shows: page title, user avatar/name, logout
4. Use Lucide React icons consistently

### Phase 5 — Dashboard (`/`)
1. Top KPI cards (responsive grid):
   - Today's Revenue
   - Today's Sales Count
   - Today's Conversion Rate (based on today's activity log)
   - Today's Commission (per logged-in user)
   - Week-to-date Revenue
   - Month-to-date Revenue
2. Charts (Recharts):
   - Revenue over last 30 days (line chart)
   - Sales by rep, last 30 days (bar chart, only shows for admins; reps see only their own data)
   - Sales by suburb, last 30 days (bar chart)
   - Daily sales count, last 14 days (bar chart)
3. "Recent Sales" widget — last 5 sales with quick-view info
4. "Today's Activity" widget — today's stats from activity log

### Phase 6 — Sales (`/sales`)
1. **Sales list page:**
   - Table view on desktop, card list on mobile
   - Columns: Date, Customer, Suburb, Quantity, Total, Payment Status, Rep
   - Filters: date range, rep (admin only), payment status, suburb
   - Sort by any column
   - Search by customer name
   - Pagination or infinite scroll
2. **Add Sale (`/sales/new`):**
   - This is the most-used page on mobile. It must be FAST.
   - Pre-filled defaults: date = today, product = Mechanic VIP Voucher Bundle, unit_price = 199.00, quantity = 1, payment_method = last used (stored in localStorage)
   - Required fields: customer_business_name, customer_suburb, payment_status
   - Optional fields: address, contact name, phone, email, payment_method, delivery_status, notes
   - Auto-calculate total_value as user types quantity
   - Show preview of commission earned before save (use the database function via RPC)
   - On save: persist sale, update commissions trigger fires, redirect to dashboard with success toast
3. **Edit Sale (`/sales/[id]`):**
   - Same form, pre-filled with existing data
   - Allow delete (with confirmation modal)

### Phase 7 — Daily Activity (`/activity`)
1. **Activity list page:**
   - Calendar view OR table view (your choice — pick what's clearest on mobile)
   - Shows: date, suburb, doors_knocked, conversations, sales_count, hours_worked, conversion_rate, sales_per_hour
   - Filter by date range, rep (admin only)
2. **Add/Edit Activity (`/activity/new`):**
   - Pre-fill: date = today, sales_count = today's actual sales count from sales table (calculated on form load)
   - Required: date, suburb, doors_knocked, conversations, hours_worked
   - Auto-calculated and shown live as user types: conversion_rate, sales_per_hour
   - One entry per rep per date — if entry exists for today, redirect to edit
   - On save: redirect to dashboard with success toast

### Phase 8 — Customers (`/customers`)
1. **Customer list:**
   - Auto-populated from sales records
   - Searchable, sortable
   - Columns: Business Name, Suburb, Total Spend, Total Orders, Last Sale Date
2. **Customer detail (`/customers/[id]`):**
   - Full contact info
   - Sales history table
   - Notes (editable by all users)

### Phase 9 — Reports (`/reports`)
1. Date range picker (presets: today, this week, this month, last month, custom)
2. Filters: rep (admin only), suburb, payment status
3. Summary cards: total revenue, total sales, average sale, total commission paid
4. Detailed table of all sales in range
5. Export to CSV button
6. Charts: revenue over time, sales by rep (admin), top suburbs, top customers

### Phase 10 — User Management (`/users`)
1. Admin-only page (redirect non-admins)
2. List all users with role, status, sales count, total revenue generated
3. "Add User" form — sends Supabase invite email
4. Edit user role (admin / rep)
5. Deactivate user (soft delete — sets is_active to false)

### Phase 11 — Polish
1. Add loading states for all data fetches (skeleton UI)
2. Add error states (graceful error messages, retry buttons)
3. Add empty states ("No sales yet — log your first one")
4. Add success toasts for save/delete actions
5. Confirm modals for destructive actions (delete sale, delete user)
6. Page transitions feel smooth
7. All forms have proper validation with helpful error messages
8. Test full flow on mobile viewport (390px)
9. Add a 404 page
10. Add favicon and basic OG tags

---

## File Structure

```
d2d-tracker/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx (app shell with nav)
│   │   ├── page.tsx (dashboard)
│   │   ├── sales/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── activity/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── users/page.tsx
│   │   └── settings/page.tsx
│   ├── api/ (any API routes if needed)
│   ├── layout.tsx (root)
│   └── globals.css
├── components/
│   ├── ui/ (button, input, card, table, etc.)
│   ├── nav/ (sidebar, bottom-tabs, header)
│   ├── dashboard/ (kpi-cards, charts)
│   ├── forms/ (sale-form, activity-form)
│   └── shared/ (loading, error, empty-state)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils.ts
│   ├── format.ts (currency, date, percent formatters)
│   └── commission.ts (commission calculation utilities)
├── types/
│   └── database.ts (generated Supabase types)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── middleware.ts
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── README.md (setup instructions for Thomas)
├── .env.local.example
└── CLAUDE.md
```

---

## Setup Instructions to Include in README.md

Write a clear README.md with these steps for Thomas to get the app running:

1. Create a Supabase project at supabase.com (free tier)
2. Copy the project URL and anon key into `.env.local`
3. Copy the service role key into `.env.local`
4. Run the SQL migration in Supabase SQL editor
5. `npm install`
6. `npm run dev`
7. Open http://localhost:3000 → sign up (first user becomes admin)
8. To deploy: push to GitHub, connect to Vercel, add env vars, deploy
9. Connect custom domain `app.certusagency.com.au` in Vercel settings

---

## Critical Quality Standards

- **TypeScript strict mode.** No `any` types. Use generated Supabase types.
- **Mobile-first.** Test every page at 390px before moving on.
- **Performance.** No client-side data fetching where server components can do it.
- **Accessibility.** Proper semantic HTML, labelled inputs, keyboard navigation.
- **Error handling.** Every async operation has try/catch and user-facing error states.
- **Defensive coding.** Handle missing data gracefully (no crashes if a customer has no sales yet).
- **Commission logic must be correct.** Test it. Add comments explaining the logic. Future-Thomas needs to understand why retroactive recalculation happens.

---

## Design Standards

- Match the brand from CLAUDE.md exactly — colour palette, typography, aesthetic
- Cards: `bg-white border border-[#E5E4E0] rounded-xl p-6`
- Buttons: primary = teal, secondary = outline
- No gradients. No heavy shadows. Generous whitespace.
- Numbers in Geist Mono. Headings and body in Geist Sans.
- Bottom tab bar on mobile is sticky, has subtle border-top, white background
- The "+ Sale" centre button is teal, raised, white plus icon, tactile

---

## When You're Done

Show Thomas a summary of:
1. What was built
2. Production build size and load time
3. Any TODO comments left in the code
4. Setup steps (link to README.md)
5. Anything that needs his decision before going live (e.g. confirming the tier-upgrade commission logic)

This is a tool Thomas and his cofounder will use every day. Build it like you're proud of it.
