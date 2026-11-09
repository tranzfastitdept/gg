-- ============================================================
--  DATE SCHEDULER — Supabase setup (copy & paste, run once)
-- ------------------------------------------------------------
--  HOW TO USE
--    1. Open https://supabase.com/dashboard  →  your project
--    2. Left sidebar → "SQL Editor" → "New query"
--    3. Paste THIS WHOLE FILE, then press "Run"
--    4. Wait until it says "Success. No rows returned"
--    5. Refresh the site.
--
--  This file is written to be safe to run again and again:
--  every step either does nothing or drops/recreates itself.
--
--  What it creates:
--    • public.dates     -> the scheduled dates
--    • public.memories  -> the photos for each date
--    • storage bucket "memories" (public read, upload allowed)
--    • Row Level Security policies for both tables + the bucket
--
--  NOTE: there is no login. Anyone who has the site link can
--  read and add dates and photos. Keep the link between you
--  two, or put a password on the hosting side.
-- ============================================================

-- ---------- 0. helpers ----------
create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated;

-- keeps updated_at honest on every edit
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- 1. dates ----------
create table if not exists public.dates (
  id          uuid        primary key default gen_random_uuid(),
  date        date        not null,
  activity    text        not null default '',
  note        text        not null default '',
  status      text        not null default 'scheduled'
                          check (status in ('scheduled', 'completed', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists dates_date_idx on public.dates (date);

drop trigger if exists dates_touch_updated_at on public.dates;
create trigger dates_touch_updated_at
before update on public.dates
for each row execute function public.touch_updated_at();

-- ---------- 2. memories (photos of a date) ----------
create table if not exists public.memories (
  id           uuid        primary key default gen_random_uuid(),
  date_id      uuid        not null references public.dates (id) on delete cascade,
  photo_url    text        not null,
  storage_path text,
  caption      text        not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists memories_date_id_idx on public.memories (date_id);

-- ---------- 3. Row Level Security ----------
alter table public.dates    enable row level security;
alter table public.memories enable row level security;

-- dates
drop policy if exists "dates read"   on public.dates;
drop policy if exists "dates insert" on public.dates;
drop policy if exists "dates update" on public.dates;
drop policy if exists "dates delete" on public.dates;

create policy "dates read"
  on public.dates for select to anon, authenticated using (true);
create policy "dates insert"
  on public.dates for insert to anon, authenticated with check (true);
create policy "dates update"
  on public.dates for update to anon, authenticated using (true) with check (true);
create policy "dates delete"
  on public.dates for delete to anon, authenticated using (true);

-- memories
drop policy if exists "memories read"   on public.memories;
drop policy if exists "memories insert" on public.memories;
drop policy if exists "memories update" on public.memories;
drop policy if exists "memories delete" on public.memories;

create policy "memories read"
  on public.memories for select to anon, authenticated using (true);
create policy "memories insert"
  on public.memories for insert to anon, authenticated with check (true);
create policy "memories update"
  on public.memories for update to anon, authenticated using (true) with check (true);
create policy "memories delete"
  on public.memories for delete to anon, authenticated using (true);

-- ---------- 4. let the site read/write these tables ----------
grant select, insert, update, delete on public.dates    to anon, authenticated;
grant select, insert, update, delete on public.memories to anon, authenticated;

-- ---------- 5. photo storage bucket ----------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do update set public = true;

drop policy if exists "memories bucket read"   on storage.objects;
drop policy if exists "memories bucket insert" on storage.objects;
drop policy if exists "memories bucket update" on storage.objects;
drop policy if exists "memories bucket delete" on storage.objects;

create policy "memories bucket read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'memories');

create policy "memories bucket insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'memories');

create policy "memories bucket update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'memories') with check (bucket_id = 'memories');

create policy "memories bucket delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'memories');

-- ---------- 6. tell the API about the new tables ----------
-- (this is the step that stops "Could not find the table" errors)
notify pgrst, 'reload schema';

-- Done. Refresh the site and the banner at the bottom disappears.
