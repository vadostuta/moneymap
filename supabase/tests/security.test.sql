-- Run with `supabase test db`. Guards against the holes closed in
-- 20261009120000_security_lockdown.sql coming back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select is_empty(
  $$ select c.relname
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
        and not c.relrowsecurity $$,
  'every public table has RLS enabled'
);

select is_empty(
  $$ select p.oid::regprocedure::text
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon cannot execute any public function'
);

select is_empty(
  $$ select p.oid::regprocedure::text
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prosecdef
        and has_function_privilege('authenticated', p.oid, 'execute')
        and p.proname not in ('get_available_months', 'set_primary_wallet') $$,
  'authenticated can only execute the reviewed SECURITY DEFINER functions'
);

select * from finish();
rollback;
