-- AquaSense UJ Supabase schema
create extension if not exists "pgcrypto";

create table if not exists public.nodes (
  node_id uuid primary key default gen_random_uuid(),
  campus text not null,
  location_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'SAFE' check (status in ('SAFE','CAUTION','UNSAFE','OFFLINE')),
  last_seen timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  campus_preference text default 'APK',
  push_token text,
  push_enabled boolean default true,
  email_reports boolean default false,
  avatar_url text,
  status text not null default 'active' check (status in ('active','suspended')),
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references public.nodes(node_id) on delete cascade,
  ph double precision not null,
  tds double precision not null,
  turbidity double precision not null,
  temperature double precision not null,
  sans_status text not null check (sans_status in ('SAFE','CAUTION','UNSAFE')),
  created_at timestamptz default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references public.nodes(node_id) on delete cascade,
  reading_id uuid references public.readings(id) on delete set null,
  parameter text not null,
  value double precision not null,
  threshold double precision not null,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  node_id uuid references public.nodes(node_id) on delete set null,
  issue_type text not null,
  description text not null,
  status text default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz default now()
);

create table if not exists public.readings_daily (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references public.nodes(node_id) on delete cascade,
  date date not null,
  avg_ph double precision,
  avg_tds double precision,
  avg_turbidity double precision,
  avg_temperature double precision,
  min_sans_status text,
  unique(node_id, date)
);

create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  amount_ml integer not null,
  drink_type text default 'Water',
  created_at timestamptz default now()
);

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

alter table public.nodes enable row level security;
alter table public.users enable row level security;
alter table public.readings enable row level security;
alter table public.alerts enable row level security;
alter table public.reports enable row level security;
alter table public.readings_daily enable row level security;
alter table public.hydration_logs enable row level security;

drop policy if exists "Students can read nodes" on public.nodes;
create policy "Students can read nodes" on public.nodes for select to authenticated using (true);
drop policy if exists "Admins manage nodes" on public.nodes;
create policy "Admins manage nodes" on public.nodes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own profile or admin all" on public.users;
create policy "Users read own profile or admin all" on public.users for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "Users update own profile or admin all" on public.users;
drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile or admin all" on public.users for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
drop policy if exists "Users insert own profile" on public.users;
create policy "Users insert own profile" on public.users for insert to authenticated with check (id = auth.uid());

drop policy if exists "Students read readings" on public.readings;
create policy "Students read readings" on public.readings for select to authenticated using (true);
drop policy if exists "Admins or service insert readings" on public.readings;
create policy "Admins or service insert readings" on public.readings for insert to authenticated with check (public.is_admin());

drop policy if exists "Students read alerts" on public.alerts;
create policy "Students read alerts" on public.alerts for select to authenticated using (true);
drop policy if exists "Admins manage alerts" on public.alerts;
create policy "Admins manage alerts" on public.alerts for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users submit reports" on public.reports;
create policy "Users submit reports" on public.reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users read reports" on public.reports;
create policy "Users read reports" on public.reports for select to authenticated using (true);
drop policy if exists "Admins update reports" on public.reports;
create policy "Admins update reports" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete reports" on public.reports;
create policy "Admins delete reports" on public.reports for delete to authenticated using (public.is_admin());

drop policy if exists "Students read daily" on public.readings_daily;
create policy "Students read daily" on public.readings_daily for select to authenticated using (true);

drop policy if exists "Users manage own hydration" on public.hydration_logs;
create policy "Users manage own hydration" on public.hydration_logs for all to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users(id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'student')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.aggregate_daily_readings(target_date date)
returns void language plpgsql as $$
begin
  insert into public.readings_daily(node_id,date,avg_ph,avg_tds,avg_turbidity,avg_temperature,min_sans_status)
  select node_id, target_date, avg(ph), avg(tds), avg(turbidity), avg(temperature),
    case when bool_or(sans_status='UNSAFE') then 'UNSAFE' when bool_or(sans_status='CAUTION') then 'CAUTION' else 'SAFE' end
  from public.readings
  where created_at::date = target_date
  group by node_id
  on conflict(node_id,date) do update set avg_ph=excluded.avg_ph, avg_tds=excluded.avg_tds, avg_turbidity=excluded.avg_turbidity, avg_temperature=excluded.avg_temperature, min_sans_status=excluded.min_sans_status;
end; $$;

-- User CRUD + automatic alert upgrades
alter table public.users add column if not exists status text not null default 'active' check (status in ('active','suspended'));

create or replace function public.create_alerts_from_reading()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ph < 5.0 then
    insert into public.alerts(node_id, reading_id, parameter, value, threshold)
    values (new.node_id, new.id, 'pH low', new.ph, 5.0);
  elsif new.ph > 9.7 then
    insert into public.alerts(node_id, reading_id, parameter, value, threshold)
    values (new.node_id, new.id, 'pH high', new.ph, 9.7);
  end if;

  if new.tds > 1200 then
    insert into public.alerts(node_id, reading_id, parameter, value, threshold)
    values (new.node_id, new.id, 'TDS', new.tds, 1200);
  end if;

  if new.turbidity > 5 then
    insert into public.alerts(node_id, reading_id, parameter, value, threshold)
    values (new.node_id, new.id, 'Turbidity', new.turbidity, 5);
  end if;

  update public.nodes
  set status = new.sans_status, last_seen = now()
  where node_id = new.node_id;

  return new;
end; $$;

drop trigger if exists on_reading_create_alerts on public.readings;
create trigger on_reading_create_alerts
after insert on public.readings
for each row execute function public.create_alerts_from_reading();
