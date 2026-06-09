insert into public.nodes (node_id, campus, location_name, latitude, longitude, status, last_seen) values
('11111111-1111-1111-1111-111111111111','APK','Science Hall Fountain',-26.1824,28.0009,'SAFE',now()),
('22222222-2222-2222-2222-222222222222','APK','Student Union Main Lobby',-26.1816,28.0017,'CAUTION',now()),
('33333333-3333-3333-3333-333333333333','APK','Engineering Hall Room 304',-26.1831,28.0022,'SAFE',now())
on conflict (node_id) do update set status=excluded.status, last_seen=now();

insert into public.readings (node_id, ph, tds, turbidity, temperature, sans_status) values
('11111111-1111-1111-1111-111111111111',7.2,142,0.4,18.5,'SAFE'),
('22222222-2222-2222-2222-222222222222',6.8,380,6.2,19.1,'CAUTION'),
('33333333-3333-3333-3333-333333333333',7.5,155,0.8,18.1,'SAFE');
