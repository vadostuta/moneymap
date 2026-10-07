# Monthly plan — overview

> Status: built on branch `monthly-plan`, 7 Oct 2026.

## What it is
Each month says where its income is meant to go, and at month end what actually happened.

- **`/plan`** lists the months, newest first. Each month has a state:
  - **Open**
  - **Checkpoint due**: the month is over but still open
  - **Closed**

  A chart compares the planned leftover with the actual leftover (the last 12 months that use the latest plan's currency).
- **`/plan/yyyy-MM`** is the month editor.
  - A month with no plan yet is copied from the latest earlier plan: the same incomes, lines and rates, with no actuals.
  - **Checkpoint mode** shows an actual amount for each line, with a status: under, on plan or over.
  - "Month is closed" sets `closed_at`. Unticking it reopens the month.
- **`/plan/projection`**: pick a source month, the lines (plus the leftover) and 3, 6, 12 or 24 months. It shows running totals, starting from this month or the source month, whichever is later.

## Settled decisions
- Actuals are typed in by hand. Transactions are not used.
- A `percent` line is a share of **total** income.
- Each month has one currency. Income in another currency carries its own rate, which defaults to the ECB/NBU value for the month (today's rate for the current month).
- These are never stored:
  - a line's planned amount
  - the leftover
  - the actual leftover

  They are all computed in `src/app/plan/plan.ts`.
- **Actual leftover** = income − Σ(actual, or planned when the line is not checked yet).
- A line is "on plan" when it is within 1% of the planned amount (at least 0.5 units).
  - For a `spend` line, under is good.
  - For a `save` line, over is good.
- The projection uses planned amounts only. There is no growth rate, and no link to claims or goals yet.

## Data
Migration `supabase/migrations/20261007100353_monthly_plans.sql`:
- `monthly_plans`: one plan per user per month while not deleted, soft-deleted with `is_deleted`.
- `plan_incomes` and `plan_lines`: deleted with their plan (cascade). They use the same RLS shape as `snapshot_lines`.
- RPC `save_monthly_plan(p_plan_id, p_plan, p_incomes, p_lines)` inserts a plan when `p_plan_id` is null, otherwise replaces it, in one transaction. A second plan for the same month raises `23505`.

**Not destructive**: the migration only adds tables and a function. Prod rollout is `supabase db push --dry-run`, then `supabase db push`, before merging.

## Tests
`npm run test:unit` runs `src/app/plan/plan.test.ts` with `vitest.unit.config.ts`. That config is separate from the Storybook browser project.

## Ideas not built
- An expected return % for investment lines (compound growth in the projection)
- Linking a line to a claim or goal ("reach the Car target by March")
- Suggesting actuals from categorised transactions
- Projecting from real checkpoint history instead of the plan
