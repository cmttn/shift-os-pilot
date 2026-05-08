alter table public.clubs
  add column if not exists badge_scale numeric default 1.0,
  add column if not exists badge_offset_x integer default 0,
  add column if not exists badge_offset_y integer default 0;
