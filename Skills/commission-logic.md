# Skill: Commission Logic

The commission calculation is the most error-prone part of this app. Get it wrong and you pay reps incorrectly. Read this carefully and follow the implementation exactly.

---

## The Rules

### For founders (role = 'admin')
Commission is not tracked. The founder keeps full sale revenue. Set `commission = 0` in the database for admin sales (the column exists but is unused for admins).

### For sales reps (role = 'rep')
Commission is calculated per sale, but the rate depends on how many sales the rep made that day:

- **Day total of 1–5 sales:** $80 per sale (per unit, not per sale record)
- **Day total of 6 or more sales:** $100 per sale (per unit, applies to ALL sales that day, retroactively)

### What "per unit" means
A sale record has a `quantity` field. If a rep sells a single voucher: `quantity = 1`, commission = `$80 × 1` = $80. If they sell two vouchers in one transaction: `quantity = 2`, commission = `$80 × 2` = $160. The unit count contributes to the daily total.

### What "retroactively" means
A rep's first 5 sales of the day earn $80 each. The moment they log their 6th sale (or 6th unit total), ALL of that day's sales upgrade to $100 each — including the earlier ones that were already saved at $80.

---

## Worked Examples

### Example 1: Rep does 4 sales of qty 1 each on the same day
- Sale 1: $80 (running total: 1 unit)
- Sale 2: $80 (running total: 2 units)
- Sale 3: $80 (running total: 3 units)
- Sale 4: $80 (running total: 4 units)
- Total commission: $320

### Example 2: Rep does 6 sales of qty 1 each on the same day
- Sale 1 logged: $80
- Sale 2 logged: $80
- ...
- Sale 5 logged: $80 (running total: 5 units)
- Sale 6 logged: 6th unit reached → ALL sales today recalculate to $100 each
  - Sales 1-5 update from $80 → $100
  - Sale 6 records at $100
- Total commission: $600 (not $580)

### Example 3: Rep does 3 sales of qty 2 each on the same day (6 units total)
- Sale 1 (qty 2): $80 × 2 = $160 (running total: 2 units)
- Sale 2 (qty 2): $80 × 2 = $160 (running total: 4 units)
- Sale 3 (qty 2): 6th unit reached → ALL sales today recalculate
  - Sale 1 updates: $100 × 2 = $200
  - Sale 2 updates: $100 × 2 = $200
  - Sale 3 records: $100 × 2 = $200
- Total commission: $600

### Example 4: A sale is deleted
- Rep had 6 sales today, all at $100 (total commission $600)
- One sale is deleted, dropping unit count to 5
- ALL remaining sales recalculate to $80 each
- Total commission: $400 (5 × $80)

### Example 5: A sale is back-dated
- Rep enters a sale today for yesterday's date
- Yesterday's sale count goes up
- Yesterday's commissions recalculate
- Today's commissions are unaffected

---

## Implementation: Database Function

Create a Postgres function that calculates commission for a single sale:

```sql
create or replace function calculate_commission(
  p_user_id uuid,
  p_sale_date date,
  p_quantity int
)
returns numeric as $$
declare
  v_role text;
  v_total_units int;
  v_rate numeric;
begin
  -- Get user role
  select role into v_role from users where id = p_user_id;
  
  -- Admins keep full revenue, no commission tracked
  if v_role = 'admin' then
    return 0;
  end if;
  
  -- Sum total units for this rep on this date
  select coalesce(sum(quantity), 0)
  into v_total_units
  from sales
  where user_id = p_user_id and sale_date = p_sale_date;
  
  -- Determine rate based on total units (including this sale's quantity)
  if v_total_units >= 6 then
    v_rate := 100;
  else
    v_rate := 80;
  end if;
  
  return v_rate * p_quantity;
end;
$$ language plpgsql;
```

---

## Implementation: Trigger for Retroactive Recalculation

Whenever a sale is inserted, updated, or deleted, recalculate ALL of that rep's commissions for the affected date(s).

```sql
create or replace function recalculate_daily_commissions()
returns trigger as $$
declare
  v_user_id uuid;
  v_sale_date date;
  v_old_user_id uuid;
  v_old_sale_date date;
  v_total_units int;
  v_rate numeric;
  v_role text;
begin
  -- Determine which (user, date) combinations need recalculation
  if TG_OP = 'DELETE' then
    v_old_user_id := OLD.user_id;
    v_old_sale_date := OLD.sale_date;
  elsif TG_OP = 'UPDATE' then
    v_old_user_id := OLD.user_id;
    v_old_sale_date := OLD.sale_date;
    v_user_id := NEW.user_id;
    v_sale_date := NEW.sale_date;
  else -- INSERT
    v_user_id := NEW.user_id;
    v_sale_date := NEW.sale_date;
  end if;
  
  -- Recalculate for new (user, date)
  if v_user_id is not null then
    select role into v_role from users where id = v_user_id;
    
    if v_role = 'rep' then
      select coalesce(sum(quantity), 0) into v_total_units
      from sales where user_id = v_user_id and sale_date = v_sale_date;
      
      v_rate := case when v_total_units >= 6 then 100 else 80 end;
      
      update sales
      set commission = v_rate * quantity
      where user_id = v_user_id and sale_date = v_sale_date;
    elsif v_role = 'admin' then
      update sales set commission = 0
      where user_id = v_user_id and sale_date = v_sale_date;
    end if;
  end if;
  
  -- Also recalculate for old (user, date) if it changed
  if v_old_user_id is not null and (v_old_user_id != v_user_id or v_old_sale_date != v_sale_date) then
    select role into v_role from users where id = v_old_user_id;
    
    if v_role = 'rep' then
      select coalesce(sum(quantity), 0) into v_total_units
      from sales where user_id = v_old_user_id and sale_date = v_old_sale_date;
      
      v_rate := case when v_total_units >= 6 then 100 else 80 end;
      
      update sales
      set commission = v_rate * quantity
      where user_id = v_old_user_id and sale_date = v_old_sale_date;
    end if;
  end if;
  
  return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger trigger_recalculate_commissions
after insert or update or delete on sales
for each row execute function recalculate_daily_commissions();
```

---

## Implementation: Preview Commission in the UI

When the user is filling out the "Add Sale" form, show them the commission they'll earn before they save.

This is tricky because the actual commission depends on their day's other sales. The preview should reflect the value AFTER this sale is added.

### Pattern in client component
```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

async function previewCommission(userId: string, quantity: number): Promise<number> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('sales')
    .select('quantity')
    .eq('user_id', userId)
    .eq('sale_date', today)
  
  const existingUnits = existing?.reduce((sum, s) => sum + s.quantity, 0) ?? 0
  const newTotal = existingUnits + quantity
  
  const rate = newTotal >= 6 ? 100 : 80
  return rate * quantity
}
```

Show in the form:
> "Commission for this sale: $80
> 
> If you reach 6+ sales today, all your sales today will upgrade to $100 each."

When the rate would be $100:
> "Commission for this sale: $100 ✓ (Tier 2 unlocked)"

---

## Reporting Commission

For reports, show total commission per rep across a date range. The trigger keeps individual records correct, so reports just sum them:

```sql
select
  user_id,
  sum(commission) as total_commission,
  count(*) as sales_count,
  sum(quantity) as units_sold
from sales
where sale_date between :start_date and :end_date
group by user_id;
```

---

## Edge Cases to Handle

### A user changes role from rep to admin
- All their existing sales should set commission to 0 (handled by trigger if you trigger an update)
- Practical approach: when changing role, run a manual recalc:
  ```sql
  update sales set commission = 0 where user_id = :user_id;
  ```

### Quantity is updated
- Trigger handles it — recalculates the date

### Sale date is changed
- Trigger handles both old and new dates

### Multiple time zones (not relevant for now)
- Currently all dates assumed Brisbane time
- Don't worry about UTC vs local — just store date as `date` not `timestamp`

---

## Verification Tests

Before considering this done, manually verify these scenarios in Supabase SQL editor:

1. Insert 5 sales for a rep on the same day, qty 1 each. Each commission = $80. Total = $400.
2. Insert a 6th sale. All 6 commissions should now be $100 each. Total = $600.
3. Delete one sale (down to 5). All remaining commissions revert to $80. Total = $400.
4. Insert a sale of qty 2 when rep has 4 existing units. New total = 6 units, all commissions = $100/unit.
5. Insert a sale for an admin. Commission = 0.
6. Move a sale to a different date. Both dates recalculate correctly.

If any of these fail, the trigger logic is wrong. Don't ship until they all pass.

---

## Don'ts

- **Don't** calculate commission in JavaScript and store it. Always use the database function/trigger.
- **Don't** display "raw" commission from the form before save — use the preview function above.
- **Don't** assume a sale can be edited freely — when commission tier changes, the user should be aware. Show a confirmation modal if changing quantity could affect commission tier.
- **Don't** allow direct edits to the `commission` column in the UI. It's always calculated.
