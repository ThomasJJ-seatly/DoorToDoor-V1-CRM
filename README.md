# D2D Tracker — Certus Agency

Internal sales tracking app for door-to-door Mechanic VIP Voucher Bundle sales.

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free tier is fine)
2. Once created, go to **Settings → API** and copy:
   - Project URL
   - `anon` / public key
   - `service_role` key (keep this secret)

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the database migration

1. In your Supabase project, go to **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run**

This creates all tables, RLS policies, commission triggers, and customer sync triggers.

### 4. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create your admin account

1. Go to your Supabase project → **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your email and a password
4. The first user is automatically assigned `admin` role

Then sign in at http://localhost:3000/login

### 6. Invite your cofounder

Once signed in, go to **Users** in the navigation and use **Invite User** to send an invite email to your cofounder. They'll receive an email to set their password.

---

## Deployment (Vercel)

### Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Connect custom domain

1. In Vercel project settings → **Domains**
2. Add `app.certusagency.com.au`
3. Update your DNS at your domain registrar to point to Vercel (CNAME to `cname.vercel-dns.com`)

---

## Commission Logic

- **Admins (founders):** Commission = $0 (you keep full revenue)
- **Reps, 1–5 sales/day:** $80 per unit sold
- **Reps, 6+ sales/day:** $100 per unit sold — **applied retroactively to all sales that day**

The retroactive upgrade is handled entirely by a database trigger (`trigger_recalculate_commissions`). When a rep logs their 6th sale, all earlier sales that day automatically update from $80 to $100 per unit.

> **Decision needed:** Confirm this tier-upgrade logic applies to ALL sales on the day (not just from the 6th sale onwards). Currently built as "tier upgrade applies to ALL sales that day."

---

## Verifying Commission Logic

Run these in the Supabase SQL editor to confirm:

1. Insert 5 sales for a rep on the same day, qty 1 each → each commission = $80, total = $400
2. Insert a 6th sale → all 6 commissions update to $100, total = $600
3. Delete one sale (back to 5) → all commissions revert to $80, total = $400
4. Insert a sale of qty 2 when rep has 4 existing units → total = 6 units, all at $100/unit

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript strict)
- **Styling:** Tailwind CSS with custom design tokens
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod v4
- **Icons:** Lucide React
- **Fonts:** Geist Sans + Geist Mono
- **Deployment:** Vercel
