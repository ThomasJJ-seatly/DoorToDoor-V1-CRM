-- ============================================================
-- D2D Tracker — Initial Schema
-- Run this entire file in the Supabase SQL editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ───────────────────────────────────────────────────
create type user_role as enum ('admin', 'rep');
create type payment_status as enum ('paid', 'pending', 'failed');
create type payment_method as enum ('card', 'cash', 'bank_transfer', 'other');
create type delivery_status as enum ('delivered', 'pending', 'na');

-- ── users ────────────────────────────────────────────────────
-- Extends auth.users — row is auto-created by trigger on signup
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        user_role not null default 'rep',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── daily_activity ───────────────────────────────────────────
create table if not exists public.daily_activity (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  date           date not null,
  suburb         text not null,
  doors_knocked  integer not null default 0,
  conversations  integer not null default 0,
  presentations  integer not null default 0,
  sales_count    integer not null default 0,
  hours_worked   decimal(4,2) not null default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, date)
);

-- ── sales ────────────────────────────────────────────────────
create table if not exists public.sales (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete restrict,
  sale_date               date not null,
  customer_business_name  text not null,
  customer_suburb         text not null,
  customer_address        text,
  customer_contact_name   text,
  customer_phone          text,
  customer_email          text,
  product                 text not null default 'Mechanic VIP Voucher Bundle',
  unit_price              decimal(10,2) not null default 199.00,
  quantity                integer not null default 1,
  total_value             decimal(10,2) not null,
  payment_status          payment_status not null default 'pending',
  payment_method          payment_method,
  delivery_status         delivery_status not null default 'pending',
  commission              decimal(10,2) not null default 0,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── customers ────────────────────────────────────────────────
-- Auto-populated from sales via trigger
create table if not exists public.customers (
  id               uuid primary key default uuid_generate_v4(),
  business_name    text not null unique,
  suburb           text,
  address          text,
  contact_name     text,
  phone            text,
  email            text,
  first_sale_date  date,
  last_sale_date   date,
  total_spend      decimal(10,2) not null default 0,
  total_orders     integer not null default 0,
  notes            text
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- ── Auto-create user profile on signup ──────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_count integer;
  v_role  user_role;
begin
  -- First user becomes admin, all others are reps
  select count(*) into v_count from public.users;
  v_role := case when v_count = 0 then 'admin'::user_role else 'rep'::user_role end;

  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_role
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Commission calculation ───────────────────────────────────
-- Called by trigger; also exposed as RPC for UI preview
create or replace function public.calculate_commission(
  p_user_id   uuid,
  p_sale_date date,
  p_quantity  int
)
returns numeric as $$
declare
  v_role        text;
  v_total_units int;
begin
  select role into v_role from public.users where id = p_user_id;

  -- Admins keep full revenue; commission column is not meaningful for them
  if v_role = 'admin' then
    return 0;
  end if;

  -- Sum all units for this rep on this date (including any already inserted rows)
  select coalesce(sum(quantity), 0)
  into v_total_units
  from public.sales
  where user_id = p_user_id and sale_date = p_sale_date;

  -- Add the incoming quantity to get final day total
  v_total_units := v_total_units + p_quantity;

  return case when v_total_units >= 6 then 100 else 80 end * p_quantity;
end;
$$ language plpgsql stable;

-- ── Retroactive commission recalculation trigger ─────────────
-- Fires after every INSERT / UPDATE / DELETE on sales.
-- Recalculates ALL commissions for the affected (user_id, sale_date) pair(s).
-- This ensures the $80→$100 tier upgrade applies retroactively when the
-- 6th sale unit is logged, and reverts when a sale is deleted.
create or replace function public.recalculate_daily_commissions()
returns trigger as $$
declare
  v_user_id      uuid;
  v_sale_date    date;
  v_old_user_id  uuid;
  v_old_sale_date date;
  v_total_units  int;
  v_rate         numeric;
  v_role         text;
begin
  if TG_OP = 'DELETE' then
    v_old_user_id   := OLD.user_id;
    v_old_sale_date := OLD.sale_date;
  elsif TG_OP = 'UPDATE' then
    v_old_user_id   := OLD.user_id;
    v_old_sale_date := OLD.sale_date;
    v_user_id       := NEW.user_id;
    v_sale_date     := NEW.sale_date;
  else -- INSERT
    v_user_id   := NEW.user_id;
    v_sale_date := NEW.sale_date;
  end if;

  -- Recalculate for the new (user, date)
  if v_user_id is not null then
    select role into v_role from public.users where id = v_user_id;

    if v_role = 'rep' then
      select coalesce(sum(quantity), 0) into v_total_units
      from public.sales
      where user_id = v_user_id and sale_date = v_sale_date;

      v_rate := case when v_total_units >= 6 then 100 else 80 end;

      update public.sales
      set commission = v_rate * quantity
      where user_id = v_user_id and sale_date = v_sale_date;

    elsif v_role = 'admin' then
      update public.sales set commission = 0
      where user_id = v_user_id and sale_date = v_sale_date;
    end if;
  end if;

  -- Recalculate for the old (user, date) if it changed (UPDATE that moved date/user)
  if v_old_user_id is not null and (
    v_old_user_id is distinct from v_user_id or
    v_old_sale_date is distinct from v_sale_date
  ) then
    select role into v_role from public.users where id = v_old_user_id;

    if v_role = 'rep' then
      select coalesce(sum(quantity), 0) into v_total_units
      from public.sales
      where user_id = v_old_user_id and sale_date = v_old_sale_date;

      v_rate := case when v_total_units >= 6 then 100 else 80 end;

      update public.sales
      set commission = v_rate * quantity
      where user_id = v_old_user_id and sale_date = v_old_sale_date;
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create or replace trigger trigger_recalculate_commissions
  after insert or update or delete on public.sales
  for each row execute function public.recalculate_daily_commissions();

-- ── Auto-upsert customers from sales ─────────────────────────
create or replace function public.upsert_customer_from_sale()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    -- Recalculate totals for this customer after deletion
    update public.customers c
    set
      total_spend  = coalesce((
        select sum(total_value) from public.sales
        where customer_business_name = c.business_name
      ), 0),
      total_orders = coalesce((
        select count(*) from public.sales
        where customer_business_name = c.business_name
      ), 0),
      last_sale_date = (
        select max(sale_date) from public.sales
        where customer_business_name = c.business_name
      )
    where c.business_name = OLD.customer_business_name;
    return OLD;
  end if;

  insert into public.customers (
    business_name, suburb, address, contact_name, phone, email,
    first_sale_date, last_sale_date, total_spend, total_orders
  )
  values (
    NEW.customer_business_name,
    NEW.customer_suburb,
    NEW.customer_address,
    NEW.customer_contact_name,
    NEW.customer_phone,
    NEW.customer_email,
    NEW.sale_date,
    NEW.sale_date,
    NEW.total_value,
    1
  )
  on conflict (business_name) do update
  set
    suburb         = coalesce(excluded.suburb, customers.suburb),
    address        = coalesce(excluded.address, customers.address),
    contact_name   = coalesce(excluded.contact_name, customers.contact_name),
    phone          = coalesce(excluded.phone, customers.phone),
    email          = coalesce(excluded.email, customers.email),
    last_sale_date = greatest(customers.last_sale_date, excluded.last_sale_date),
    total_spend    = (
      select coalesce(sum(total_value), 0) from public.sales
      where customer_business_name = NEW.customer_business_name
    ),
    total_orders   = (
      select count(*) from public.sales
      where customer_business_name = NEW.customer_business_name
    );

  return NEW;
end;
$$ language plpgsql;

create or replace trigger trigger_upsert_customer
  after insert or update or delete on public.sales
  for each row execute function public.upsert_customer_from_sale();

-- ── updated_at auto-timestamp ────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create or replace trigger set_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create or replace trigger set_activity_updated_at
  before update on public.daily_activity
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.daily_activity enable row level security;
alter table public.sales enable row level security;
alter table public.customers enable row level security;

-- Helper: is the calling user an admin?
create or replace function public.is_admin()
returns boolean as $$
declare
  v_result boolean;
begin
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'::user_role and u.is_active = true
  ) into v_result;
  return v_result;
end;
$$ language plpgsql stable security definer;

-- ── users policies ───────────────────────────────────────────
create policy "users_select"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

create policy "users_update_self"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_update_admin"
  on public.users for update
  using (public.is_admin());

-- ── daily_activity policies ──────────────────────────────────
create policy "activity_select"
  on public.daily_activity for select
  using (user_id = auth.uid() or public.is_admin());

create policy "activity_insert"
  on public.daily_activity for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "activity_update"
  on public.daily_activity for update
  using (user_id = auth.uid() or public.is_admin());

create policy "activity_delete"
  on public.daily_activity for delete
  using (user_id = auth.uid() or public.is_admin());

-- ── sales policies ───────────────────────────────────────────
create policy "sales_select"
  on public.sales for select
  using (user_id = auth.uid() or public.is_admin());

create policy "sales_insert"
  on public.sales for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "sales_update"
  on public.sales for update
  using (user_id = auth.uid() or public.is_admin());

create policy "sales_delete"
  on public.sales for delete
  using (user_id = auth.uid() or public.is_admin());

-- ── customers policies ───────────────────────────────────────
-- All authenticated users can read; only admins can write
create policy "customers_select"
  on public.customers for select
  using (auth.uid() is not null);

create policy "customers_insert"
  on public.customers for insert
  with check (public.is_admin());

create policy "customers_update"
  on public.customers for update
  using (public.is_admin());

create policy "customers_delete"
  on public.customers for delete
  using (public.is_admin());

-- Note: the upsert_customer_from_sale trigger runs as SECURITY DEFINER
-- so it bypasses RLS when inserting/updating customers from sales.
-- This allows reps to indirectly create customer records through sales.

-- ============================================================
-- INDEXES (for common query patterns)
-- ============================================================
create index if not exists idx_sales_user_date    on public.sales (user_id, sale_date desc);
create index if not exists idx_sales_date         on public.sales (sale_date desc);
create index if not exists idx_sales_customer     on public.sales (customer_business_name);
create index if not exists idx_activity_user_date on public.daily_activity (user_id, date desc);
create index if not exists idx_customers_name     on public.customers (business_name);
