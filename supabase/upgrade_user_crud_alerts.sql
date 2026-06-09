-- Run this once if you already ran the old schema.sql before this update.
-- It adds account status and automatic alert generation from unsafe readings.

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


-- Profile editing support: students/admins can store a profile picture URL.
alter table public.users add column if not exists avatar_url text;

-- Supabase Storage bucket for profile pictures.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Users can view avatars" on storage.objects;
create policy "Users can view avatars"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
