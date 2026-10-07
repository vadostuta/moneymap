-- Monthly money plan: where a month's income is meant to go, and (at the
-- end-of-month checkpoint) where it actually went. See plans/plan/00-overview.md.
--
-- Planned line amounts and the leftover are never stored: a percent line is
-- computed from the month's income, the leftover from income − Σ lines.

create table public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- Always the first day of the month
  month date not null check (extract(day from month) = 1),
  currency text not null default 'EUR'
    check (currency in ('USD', 'EUR', 'UAH', 'GBP', 'PLN')),
  note text,
  -- Set when the end-of-month checkpoint is done; null while the month is open
  closed_at timestamptz,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index monthly_plans_user_month_uniq
  on public.monthly_plans (user_id, month) where is_deleted = false;

create trigger monthly_plans_set_updated_at
  before update on public.monthly_plans
  for each row execute function public.set_updated_at();

-- One row per income source. converted_amount = amount × rate, in the plan's
-- currency (rate is 1 when the currencies match).
create table public.plan_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plan_id uuid not null references public.monthly_plans on delete cascade,
  label text not null,
  currency text not null
    check (currency in ('USD', 'EUR', 'UAH', 'GBP', 'PLN')),
  amount numeric not null check (amount >= 0),
  rate numeric not null check (rate > 0),
  rate_source text,
  converted_amount numeric not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index plan_incomes_plan_id_idx on public.plan_incomes (plan_id);

-- Where the money goes. kind 'fixed': value is an amount in the plan currency;
-- kind 'percent': value is a percentage of the month's total income.
-- flow says whether the money is spent (rent) or kept (investments).
-- actual_amount is filled in at the checkpoint; null = not checked yet.
create table public.plan_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  plan_id uuid not null references public.monthly_plans on delete cascade,
  label text not null,
  kind text not null check (kind in ('fixed', 'percent')),
  value numeric not null
    check (value >= 0 and (kind = 'fixed' or value <= 100)),
  flow text not null default 'spend' check (flow in ('spend', 'save')),
  actual_amount numeric check (actual_amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index plan_lines_plan_id_idx on public.plan_lines (plan_id);

-- ─── RLS: same shape as "own snapshots" / "own lines" in the baseline ───────
alter table public.monthly_plans enable row level security;
alter table public.plan_incomes enable row level security;
alter table public.plan_lines enable row level security;

create policy "own plans" on public.monthly_plans
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own plan incomes" on public.plan_incomes
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.monthly_plans p
       where p.id = plan_incomes.plan_id and p.user_id = auth.uid()
    )
  );

create policy "own plan lines" on public.plan_lines
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.monthly_plans p
       where p.id = plan_lines.plan_id and p.user_id = auth.uid()
    )
  );

grant all on table public.monthly_plans to authenticated, service_role;
grant all on table public.plan_incomes to authenticated, service_role;
grant all on table public.plan_lines to authenticated, service_role;

-- ─── Save a month in one transaction ────────────────────────────────────────
-- p_plan_id null inserts a new plan; otherwise the plan's header is updated
-- and its incomes and lines are replaced. Runs as the caller, so RLS applies.
-- Returns the plan id. A second plan for the same month raises 23505.
create or replace function public.save_monthly_plan(
  p_plan_id uuid,
  p_plan jsonb,
  p_incomes jsonb,
  p_lines jsonb
) returns uuid
language plpgsql
set search_path to 'public'
as $$
declare
  v_id uuid := p_plan_id;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if v_id is null then
    insert into monthly_plans (user_id, month, currency, note, closed_at)
    values (
      auth.uid(),
      (p_plan ->> 'month')::date,
      p_plan ->> 'currency',
      p_plan ->> 'note',
      (p_plan ->> 'closed_at')::timestamptz
    )
    returning id into v_id;
  else
    update monthly_plans
       set month     = (p_plan ->> 'month')::date,
           currency  = p_plan ->> 'currency',
           note      = p_plan ->> 'note',
           closed_at = (p_plan ->> 'closed_at')::timestamptz
     where id = v_id
       and user_id = auth.uid()
       and is_deleted = false;

    if not found then
      raise exception 'Plan not found' using errcode = 'P0002';
    end if;

    delete from plan_incomes where plan_id = v_id;
    delete from plan_lines where plan_id = v_id;
  end if;

  insert into plan_incomes (
    user_id, plan_id, label, currency, amount, rate, rate_source,
    converted_amount, sort_order
  )
  select auth.uid(), v_id, x.label, x.currency, x.amount, x.rate,
         x.rate_source, x.converted_amount, x.sort_order
    from jsonb_to_recordset(p_incomes) as x (
      label text, currency text, amount numeric, rate numeric,
      rate_source text, converted_amount numeric, sort_order integer
    );

  insert into plan_lines (
    user_id, plan_id, label, kind, value, flow, actual_amount, sort_order
  )
  select auth.uid(), v_id, x.label, x.kind, x.value, x.flow,
         x.actual_amount, x.sort_order
    from jsonb_to_recordset(p_lines) as x (
      label text, kind text, value numeric, flow text,
      actual_amount numeric, sort_order integer
    );

  return v_id;
end;
$$;

revoke all on function public.save_monthly_plan(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_monthly_plan(uuid, jsonb, jsonb, jsonb) to authenticated, service_role;
