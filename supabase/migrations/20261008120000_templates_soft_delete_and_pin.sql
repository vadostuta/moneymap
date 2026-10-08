-- Templates: make soft delete work, and let a template be pinned to the sidebar.
--
-- The SELECT policy used to hide is_deleted rows. Postgres checks the new row
-- of an UPDATE against SELECT policies too, so `update ... set is_deleted =
-- true` failed with "new row violates row-level security policy", and a
-- deleted template could never be restored. Like every other table, the app
-- now filters is_deleted itself.

drop policy "Users can view their own templates" on public.templates;

create policy "Users can view their own templates" on public.templates
  for select using (auth.uid() = user_id);

alter table public.templates
  add column is_pinned boolean not null default false;
