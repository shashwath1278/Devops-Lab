-- Run once in Supabase SQL Editor if you use LOCAL auth (not Supabase Auth signup).
-- Fixes: documents_uploaded_by_fkey / users not in public.users

-- Allow public.users rows without auth.users (local JWT user ids)
alter table public.users drop constraint if exists users_id_fkey;

-- Service role can insert profiles for local auth
drop policy if exists "Service can manage users for local auth." on public.users;
create policy "Service can manage users for local auth."
  on public.users for all
  using ( true )
  with check ( true );

-- Optional: re-add documents FK (uploaded_by must exist in public.users after register sync)
-- alter table public.documents drop constraint if exists documents_uploaded_by_fkey;
-- alter table public.documents
--   add constraint documents_uploaded_by_fkey
--   foreign key (uploaded_by) references public.users (id) on delete set null;
