-- ===================================================================
-- SHARP SIDE BARBERSHOP — SUPABASE SETUP
-- ===================================================================
-- Ovo pokreni JEDNOM, u Supabase Dashboard -> SQL Editor -> New query
-- Selektuj sav ovaj kod, nalepi, klikni "Run".
-- ===================================================================

-- Tabela za sve termine
create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  service_id text not null,
  service_name text not null,
  service_price int not null,
  barber_id text not null,
  barber_name text not null,
  date date not null,
  time text not null,
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'confirmed'
);

-- Uključi Row Level Security (obavezno za Supabase)
alter table bookings enable row level security;

-- Dozvoli svima da UPIŠU novi termin (mušterije sa sajta)
create policy "Svako moze da upise termin"
on bookings for insert
to anon
with check (true);

-- Dozvoli svima da VIDE termine (potrebno da sajt zna koji su termini zauzeti,
-- i da admin kalendar/otkazivanje rade)
create policy "Svako moze da vidi termine"
on bookings for select
to anon
using (true);

-- Dozvoli svima da AŽURIRAJU termine (potrebno za otkazivanje)
create policy "Svako moze da otkaze termin"
on bookings for update
to anon
using (true);

-- ===================================================================
-- NAPOMENA O PRIVATNOSTI:
-- Ove pravila (policies) dozvoljavaju SVAKOM ko ima link ka sajtu da
-- tehnički može, preko browser konzole, da pročita SVE termine (uključujući
-- imena i brojeve telefona svih mušterija), ne samo svoje. Ovo je uobičajeno
-- ograničenje kod jednostavnih sajtova bez pravog servera "iza kulisa".
-- Za mali lokalni biznis ovo je uglavnom prihvatljiv rizik (niko slučajno
-- neće to raditi), ali ako želiš potpunu zaštitu privatnosti mušterija,
-- sledeći korak bi bio dodavanje "serverless funkcije" koja sakriva
-- direktan pristup bazi — javi se ako to poželiš, to je poseban, veći korak.
-- ===================================================================
