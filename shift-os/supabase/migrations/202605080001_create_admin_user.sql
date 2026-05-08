insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'Cmttn@yahoo.co.uk',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Chris North"}'::jsonb,
  now(),
  now()
)
on conflict (email) do nothing;

update public.users_profile up
set full_name = 'Chris North',
    system_role = 'shift_admin',
    updated_at = now()
from auth.users au
where up.user_id = au.id
  and au.email = 'Cmttn@yahoo.co.uk';
