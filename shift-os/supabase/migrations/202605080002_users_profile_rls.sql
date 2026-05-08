alter table public.users_profile enable row level security;

alter table public.users_profile force row level security;

drop policy if exists "users_profile_select_own" on public.users_profile;
drop policy if exists "users_profile_update_own" on public.users_profile;
drop policy if exists "users_profile_shift_admin_select_all" on public.users_profile;

drop policy if exists "Users can read their own row only" on public.users_profile;
drop policy if exists "Users can update their own row only" on public.users_profile;
drop policy if exists "shift_admin can read all rows" on public.users_profile;


create policy "Users can read their own row only"
on public.users_profile
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own row only"
on public.users_profile
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "shift_admin can read all rows"
on public.users_profile
for select
to authenticated
using (
  exists (
    select 1
    from public.users_profile admin_profile
    where admin_profile.user_id = auth.uid()
      and admin_profile.system_role = 'shift_admin'
  )
);
