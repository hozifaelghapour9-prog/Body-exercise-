-- BODY RESET - ADMIN SECURITY SETUP

-- 1. Enable publishing columns
alter table public.exercises
add column if not exists is_published boolean not null default false;

alter table public.programs
add column if not exists is_published boolean not null default false;

-- 2. Admin users table
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 3. Admin verification function
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 4. Register the admin account
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where lower(email) = lower('hozifaelghapour9@gmail.com')
on conflict (user_id)
do update set email = excluded.email;

-- 5. Remove old policies
drop policy if exists "Users manage own exercises" on public.exercises;
drop policy if exists "Users manage own programs" on public.programs;
drop policy if exists "Users manage own clients" on public.clients;

drop policy if exists "Public read published exercises" on public.exercises;
drop policy if exists "Admin manage exercises" on public.exercises;

drop policy if exists "Public read published programs" on public.programs;
drop policy if exists "Admin manage programs" on public.programs;

drop policy if exists "Admin manage clients" on public.clients;

-- 6. Enable RLS
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.clients enable row level security;

-- 7. Public can read published exercises
create policy "Public read published exercises"
on public.exercises
for select
to anon, authenticated
using (is_published = true);

-- 8. Admin manages exercises
create policy "Admin manage exercises"
on public.exercises
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 9. Public can read published programs
create policy "Public read published programs"
on public.programs
for select
to anon, authenticated
using (is_published = true);

-- 10. Admin manages programs
create policy "Admin manage programs"
on public.programs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 11. Admin manages clients
create policy "Admin manage clients"
on public.clients
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 12. Table permissions
grant select on public.exercises, public.programs to anon;

grant select, insert, update, delete
on public.exercises, public.programs, public.clients
to authenticated;