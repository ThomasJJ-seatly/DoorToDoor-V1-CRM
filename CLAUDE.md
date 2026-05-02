# Door-to-Door Sales Tracker — Project Context

## What is this?

An internal web app for a door-to-door sales business that sells **Mechanic VIP voucher bundles** (priced at $199 each) directly to auto repair shops in the Brisbane area. The app is used by the two founders (Thomas and his cofounder) to log daily field activity, record sales, track revenue, and manage future sales rep commissions.

This is a private internal tool — not customer-facing. Only the two founders log in (with the option to add sales reps with limited access later).

**Hosted at:** `app.certusagency.com.au` (subdomain of an existing domain)

---

## The Business

The business sells $199 voucher bundles on behalf of mechanic shops. Each bundle contains $199 worth of bundled labour services that the mechanic shop redeems for their own customers as a customer-acquisition or loyalty offering.

Sales happen face-to-face through door-to-door cold visits to potential customers. The two founders currently do all sales themselves and keep 100% of sale revenue. As they hire reps, the app needs to handle commission tracking.

### Commission Structure (for future sales reps)
- 1–5 sales in a day: **$80 per sale**
- 6 or more sales in a day: **$100 per sale** (applied to ALL sales for that day, not just the 6th onwards — this needs to be confirmed with Thomas, but build it as "tier upgrade applies to all sales that day" for now)

For founders (Thomas and cofounder), commission = full sale value ($199 minus product cost if applicable).

### The Product
- **Mechanic VIP Voucher Bundle**
- Sale price: $199
- Currently the only product
- Sale price can be discounted at the discretion of sales rep (e.g sales rep may choose to sell it for $150 to select customers)

---

## Users

- **Two founders** with full admin access (Thomas + cofounder)
- **Future:** sales reps with restricted access (can only see their own data)

For now, just build for the two founders. Build user roles in the schema (`admin`, `rep`) so reps can be added later without rebuilding auth.

---

## Core Features Required

### 0. Welcome Page
Welcome to the Certus Agency door-to-door sales tracker. This app is used to track daily field activity, sales records, and revenue. 
- Include a button to each section (1, 2, 3, 4, 5, 6)

### 1. Daily Activity Log
Each user logs their daily field activity:
- Campaign (store)
- Date
- Suburb/area worked
- Number of doors knocked
- Number of conversations had (door opened, conversation started)
- Number of presentations
- Number of sales closed
- Hours worked
- Notes

Auto-calculated metrics displayed:
- Conversion rate (conversations → sales)
- Knock-to-sale ratio
- Sales per hour

### 2. Sales Records
Each individual sale logged separately:
- Date
- Sales rep (logged-in user, or selected from dropdown if admin)
- Customer name
- Customer address/suburb
- Customer contact (phone, email)
- Product (Mechanic VIP Voucher Bundle, $199)
- Quantity (default 1, but support multi-quantity)
- Total sale value (auto-calculated: quantity × $199)
- Discount (If applicable: total sale value - discount = total value)
- Payment method (Card, Cash, Bank Transfer, Other)
- Commission earned (auto-calculated based on commission rules, potential discount and rep)
- Notes

### 3. Dashboard (Home page after login)
Top-level KPIs at a glance:
- Today's revenue
- Today's sales count
- Week-to-date revenue
- Week-to-date sales count
- Month-to-date revenue
- Month-to-date sales count
- Today's conversion rate
- Today's commission earned (per-user view)

Charts:
- Revenue over last 30 days (line chart)
- Sales by rep (bar chart, last 30 days)
- Sales by suburb (bar chart, last 30 days)
- Daily sales count (bar chart, last 14 days)

### 4. Revenue & Reporting
- View revenue by day, week, month, custom date range
- Filter by rep
- Filter by suburb
- Export to CSV

### 5. Customer Directory
- Auto-populated from sales records
- Searchable list of all customers sold to
- Last sale date per customer
- Total spend per customer
- Notes/follow-up status

### 6. User Management (Admin only)
- View all users
- Add new users (sales reps in future)
- Set user role (admin or rep)
- Deactivate users

---

## Brand & Design

This app is internal, but it should feel premium and pleasant to use — Thomas and his cofounder will be in it daily. 

### Colour Palette
- **Background:** Warm off-white `#FAF9F7`
- **Primary text:** Near-black `#1A1A18`
- **Secondary text:** Warm grey `#6B6B67`
- **Accent (CTAs, highlights):** Deep teal `#1A5F5A`
- **Accent light:** `#E8F4F3`
- **Border:** `#E5E4E0`
- **Success:** Green `#2D7A3F`
- **Warning:** Amber `#C97A1A`
- **Danger:** Red `#A8362F`

### Typography
- Headings: Geist Sans, weight 500–600
- Body: Geist Sans, weight 400
- Numbers/data: Geist Mono for monetary values and large stats

### Aesthetic
- Clean, generous whitespace
- Subtle borders, no heavy drop shadows
- No gradients
- Card-based layouts
- Mobile-first — both founders will use this on their phones in the field

### Mobile-first priority
The app will be used on phones during the workday. Sales logging needs to be 3 taps maximum. Daily activity logging needs to be possible from the phone in under 60 seconds. Dashboard needs to be readable on a 6.1" screen.

---

## Technical Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth)
- **Auth:** Supabase Auth (email/password)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod for validation
- **Deployment:** Vercel
- **Domain:** app.certusagency.com.au

---

## Database Schema (Supabase)

### `users` (extends Supabase auth.users)
- `id` — UUID, primary key (matches auth.users.id)
- `email` — text
- `full_name` — text
- `role` — enum ('admin', 'rep')
- `is_active` — boolean, default true
- `created_at` — timestamp

### `daily_activity`
- `id` — UUID, primary key
- `user_id` — foreign key → users.id
- `date` — date
- `suburb` — text
- `doors_knocked` — integer
- `conversations` — integer
- `sales_count` — integer
- `hours_worked` — decimal(4,2)
- `notes` — text
- `created_at` — timestamp
- `updated_at` — timestamp
- Unique constraint on (user_id, date) — one entry per rep per day

### `sales`
- `id` — UUID, primary key
- `user_id` — foreign key → users.id (the rep who made the sale)
- `sale_date` — date
- `customer_business_name` — text
- `customer_suburb` — text
- `customer_address` — text
- `customer_contact_name` — text
- `customer_phone` — text
- `customer_email` — text
- `product` — text (default 'Mechanic VIP Voucher Bundle')
- `unit_price` — decimal(10,2) (default 199.00)
- `quantity` — integer (default 1)
- `total_value` — decimal(10,2) (computed: unit_price × quantity)
- `payment_status` — enum ('paid', 'pending', 'failed')
- `payment_method` — enum ('card', 'cash', 'bank_transfer', 'other')
- `delivery_status` — enum ('delivered', 'pending', 'na')
- `commission` — decimal(10,2) (calculated based on commission logic)
- `notes` — text
- `created_at` — timestamp
- `updated_at` — timestamp

### `customers` (auto-populated from sales)
- `id` — UUID, primary key
- `business_name` — text, unique
- `suburb` — text
- `address` — text
- `contact_name` — text
- `phone` — text
- `email` — text
- `first_sale_date` — date
- `last_sale_date` — date
- `total_spend` — decimal(10,2) (sum of all sales)
- `total_orders` — integer
- `notes` — text

---

## Commission Calculation Logic

When a sale is recorded, calculate commission as follows:

```
IF user.role == 'admin' (founder):
    commission = full sale value (no commission deduction, founder keeps revenue)
    
IF user.role == 'rep':
    Count rep's total sales for that calendar day (including this one)
    IF total_sales_today < 6:
        commission = $80 × sale_quantity
    ELSE:
        commission = $100 × sale_quantity
        ALSO: retroactively update earlier sales today for this rep to $100/sale
```

Implementation note: Commission needs to be recalculated whenever a rep's daily sale count crosses 6. Use a database trigger OR a server-side function that runs after each sale insert/update/delete. Document this clearly in the code.

---

## Pages / Routes

- `/login` — login page
- `/` — Dashboard (requires auth)
- `/activity` — Daily Activity Log (list + add/edit)
- `/activity/new` — Add new daily activity
- `/sales` — Sales Records (list + filters)
- `/sales/new` — Add new sale (this should be FAST — primary mobile action)
- `/sales/[id]` — View/edit individual sale
- `/customers` — Customer Directory
- `/customers/[id]` — Individual customer detail page
- `/reports` — Reports & exports
- `/users` — User management (admin only)
- `/settings` — Personal settings

---

## Mobile UX Requirements

**Bottom navigation bar on mobile** with quick access to:
- Dashboard
- Add Sale (prominent + button in centre)
- Activity
- Sales
- Menu (more)

**The "Add Sale" flow on mobile must be optimised:**
1. Tap + button
2. Form pre-fills date (today), product (Voucher Bundle), unit price ($199), quantity (1), payment method (last used)
3. User enters: business name, suburb, contact name, phone
4. Tap save
5. Total time: under 30 seconds

**The "Log Today's Activity" flow on mobile:**
1. Tap activity button
2. Form pre-fills date (today), pulls today's sales count automatically
3. User enters: suburb, doors knocked, conversations, hours worked
4. Tap save
5. Total time: under 60 seconds

---

## Auth & Security

- Email/password login via Supabase Auth
- Row-Level Security (RLS) on all tables
- Admins can see all data
- Reps can only see their own activity, sales, and commission
- Customer directory is shared (all users see it, but only admins can edit/delete)
- No public access to anything — login required for every route except /login

---

## What NOT to build (yet)

These are out of scope for V1. Do not build them:
- Expense tracking
- Multi-product catalog (only Mechanic VIP Voucher Bundles for now)
- Customer-facing portal
- Email/SMS notifications
- Integration with payment providers
- Inventory tracking (we're not tracking voucher stock for now)
- Calendar/scheduling
- Team chat/messaging

---

## Quality Bar

This is a tool the founders will use daily. Bugs, slow load times, or clunky mobile UX will frustrate them and reduce daily logging — which defeats the purpose.

Before considering V1 done:
- [ ] Loads in under 2 seconds on a simulated 4G connection
- [ ] All flows work perfectly on iPhone 14 (390px)
- [ ] Adding a sale takes under 30 seconds on mobile
- [ ] Logging daily activity takes under 60 seconds on mobile
- [ ] Dashboard renders correctly with no data, with one rep's data, and with multi-rep data
- [ ] Commission calculation is provably correct under all 3 scenarios (admin, rep <6 sales, rep ≥6 sales)
- [ ] No console errors, no TypeScript errors, no failed builds
- [ ] Both users can log in successfully
- [ ] Data persists correctly (don't lose entries on refresh)

The visual execution should match the premium positioning of the Certus Agency brand — clean, confident, no-nonsense. This is a tool the founders should be proud to open every day.
