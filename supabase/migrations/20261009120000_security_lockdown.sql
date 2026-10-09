-- Security lockdown. See plans/security-privacy.md, phase 0.
--
-- The baseline (pulled from prod) granted EXECUTE on every public function to
-- anon, via default privileges. Two of them were SECURITY DEFINER and owned by
-- postgres, so anyone holding the public anon key could call them over REST:
--   exec_sql(text)          ran any SQL as postgres
--   delete_user_data(uuid)  wiped any user's data, with no auth.uid() check
--
-- From here on, public functions are default-deny: anon gets nothing, and
-- authenticated gets only the RPCs the app calls (grep "\.rpc(" src).

drop function if exists public.exec_sql(text);

-- Only /api/user/delete calls this, with the service-role key
revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;
alter function public.delete_user_data(uuid) set search_path = public;

revoke execute on all functions in schema public from public, anon, authenticated;

-- Trigger functions need no EXECUTE grant to fire, so only the RPCs come back
grant execute on function
  public.get_available_months(uuid, integer),
  public.set_primary_wallet(uuid),
  public.update_wealth_snapshot(uuid, jsonb, jsonb, jsonb),
  public.save_monthly_plan(uuid, jsonb, jsonb, jsonb)
  to authenticated;

alter function public.set_primary_wallet(uuid) set search_path = public;

-- New functions and tables are no longer public by default. A new RPC needs an
-- explicit `grant execute ... to authenticated`; a new table an explicit grant.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
