-- Student Hub — run this entire file in Supabase SQL Editor (new project)

-- ---------------------------------------------------------------------------
-- 1. Public user profiles (local auth + optional Supabase Auth trigger)
-- id is assigned by the backend on register (no auth.users FK required)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key,
  username text unique,
  email text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.users;
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

drop policy if exists "Users can insert their own profile." on public.users;
create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on public.users;
create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

drop policy if exists "Service can manage users for local auth." on public.users;
create policy "Service can manage users for local auth."
  on public.users for all
  using ( true )
  with check ( true );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data ->> 'username');
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Document metadata (files live in Storage bucket "textbooks")
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text,
  tags text[] default '{}',
  file_url text not null,
  file_path text not null,
  uploaded_by uuid references public.users (id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.documents enable row level security;

drop policy if exists "Documents are viewable by everyone." on public.documents;
create policy "Documents are viewable by everyone."
  on public.documents for select
  using ( true );

drop policy if exists "Authenticated users can insert documents." on public.documents;
create policy "Authenticated users can insert documents."
  on public.documents for insert
  with check ( true );

drop policy if exists "Users can delete own documents." on public.documents;
create policy "Users can delete own documents."
  on public.documents for delete
  using ( true );
