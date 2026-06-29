-- =====================================================================
-- MilkBankMS — Supabase / PostgreSQL Schema & Mock Data Seed
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- For Blowfish hashing (crypt)

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type public.user_role            as enum ('donor', 'staff', 'admin');
create type public.status_variant       as enum ('verified', 'pending', 'fail', 'neutral');
create type public.priority_level       as enum ('critical', 'standard');
create type public.milk_type            as enum ('Fresh', 'Frozen');
create type public.terminal_batch_state as enum ('OPEN', 'SHIPPED');
create type public.logistics_point_type as enum ('hospital', 'shipping');
create type public.logistics_status     as enum ('active', 'busy', 'idle');

-- ---------------------------------------------------------------------
-- USERS (Custom Credential Database with Hashed Passwords)
-- ---------------------------------------------------------------------
create table public.users (
  id                 uuid primary key default gen_random_uuid(),
  auth_user_id       uuid unique references auth.users (id) on delete cascade,
  email              text unique not null,
  encrypted_password text not null,
  role               public.user_role not null default 'donor',
  is_active          boolean not null default true,
  created_at         timestamp with time zone default now(),
  updated_at         timestamp with time zone default now()
);

comment on table public.users is 'Contains secure emails and bcrypt-hashed passwords for credentials.';

-- Password Hashing Trigger using pgcrypto's Blowfish (bf) crypt function
create or replace function public.hash_user_password()
returns trigger as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.encrypted_password <> old.encrypted_password) then
    new.encrypted_password := crypt(new.encrypted_password, gen_salt('bf'));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_hash_user_password
  before insert or update on public.users
  for each row execute function public.hash_user_password();

-- ---------------------------------------------------------------------
-- DONOR PROFILES
-- ---------------------------------------------------------------------
create table public.donor_profiles (
  id                 uuid primary key references public.users (id) on delete cascade,
  display_id         text unique not null,
  full_name          text not null,
  status             public.status_variant not null default 'pending',
  status_label       text not null default 'Pending',
  last_donation_at   date,
  total_volume_ml    numeric(12,2) not null default 0,
  screening_due      boolean not null default true,
  contact_phone      text,
  donation_cycles    integer not null default 0,
  verification_note  text,
  avatar_url         text,
  region             text,
  area               text,
  latitude           numeric(9,6),
  longitude          numeric(9,6),
  created_at         timestamp with time zone default now(),
  updated_at         timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- STAFF PROFILES
-- ---------------------------------------------------------------------
create table public.staff_profiles (
  id               uuid primary key references public.users (id) on delete cascade,
  full_name        text not null,
  role_title       text not null,
  avatar_initials  text,
  avatar_url       text,
  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- COLLECTION POINTS
-- ---------------------------------------------------------------------
create table public.collection_points (
  id               text primary key,
  name             text not null,
  address          text not null,
  region           text,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  active_donors    integer not null default 0,
  volume_today_ml  numeric(12,2) not null default 0,
  status           public.status_variant not null default 'pending',
  status_label     text not null,
  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);



-- ---------------------------------------------------------------------
-- INVENTORY BATCHES
-- ---------------------------------------------------------------------
create table public.inventory_batches (
  batch_id          text primary key,
  donor_id          uuid not null references public.donor_profiles (id),
  volume_ml         numeric(10,2) not null,
  collected_at      timestamp with time zone not null,
  expiry_date       date not null,
  lab_status        public.status_variant not null default 'pending',
  lab_label         text not null,
  storage_location  text,
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- BENEFICIARIES
-- ---------------------------------------------------------------------
create table public.beneficiaries (
  id                       uuid primary key default gen_random_uuid(),
  infant_name              text not null,
  date_of_birth            date,
  gestational_age          text,
  medical_record_number    text unique,
  hospital_name            text,
  attending_physician      text,
  ward                     text,
  guardian_name            text,
  guardian_relationship    text,
  guardian_contact         text,
  daily_volume_ml          numeric(10,2),
  feeding_frequency        text,
  special_instructions     text,
  created_at               timestamp with time zone default now(),
  updated_at               timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- DISPENSING RECORDS
-- ---------------------------------------------------------------------
create table public.dispensing_records (
  id              text primary key,
  beneficiary_id  uuid not null references public.beneficiaries (id),
  batch_id        text references public.inventory_batches (batch_id),
  ward            text not null,
  volume_ml       numeric(10,2) not null,
  dispensed_date  date not null default current_date,
  priority        public.priority_level not null default 'standard',
  status          public.status_variant not null default 'pending',
  status_label    text not null,
  dispensed_by    uuid references public.staff_profiles (id),
  created_at      timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- TERMINAL SESSIONS
-- ---------------------------------------------------------------------
create table public.terminal_sessions (
  id            text primary key,
  donor_id      uuid references public.donor_profiles (id),
  staff_id      uuid references public.staff_profiles (id),
  batch_id      text references public.inventory_batches (batch_id),
  volume_ml     numeric(10,2) not null,
  session_time  timestamp with time zone default now(),
  status        public.status_variant not null default 'pending',
  status_label  text,
  created_at    timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- TERMINAL BATCHES
-- ---------------------------------------------------------------------
create table public.terminal_batches (
  id          text primary key,
  entries     integer not null default 0,
  volume_l    numeric(10,2) not null default 0,
  status      public.terminal_batch_state not null default 'OPEN',
  time_label  text,
  shipped_at  timestamp with time zone,
  created_at  timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- LOGISTICS POINTS
-- ---------------------------------------------------------------------
create table public.logistics_points (
  id                  text primary key,
  name                text not null,
  type                public.logistics_point_type not null,
  status              public.logistics_status not null default 'idle',
  capacity_percentage numeric(5,2),
  departure_time      time,
  expiry_interval     interval,
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  created_at          timestamp with time zone default now(),
  updated_at          timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- EXPORT JOBS
-- ---------------------------------------------------------------------
create table public.export_jobs (
  id            text primary key,
  dataset       text not null,
  format        text not null,
  row_count     integer not null default 0,
  status        public.status_variant not null default 'pending',
  status_label  text not null,
  requested_by  uuid references public.users (id),
  requested_at  timestamp with time zone default now(),
  completed_at  timestamp with time zone,
  file_url      text
);

-- ---------------------------------------------------------------------
-- ACTIVITY LOGS
-- ---------------------------------------------------------------------
create table public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  actor_id    uuid references public.users (id),
  created_at  timestamp with time zone default now()
);

-- ---------------------------------------------------------------------
-- SYSTEM CONFIG
-- ---------------------------------------------------------------------
create table public.system_config (
  key         text primary key,
  value       text not null,
  updated_at  timestamp with time zone default now()
);

insert into public.system_config (key, value) values
  ('app_version', 'V2.4.1-Stable'),
  ('copyright_notice', '© 2024 MilkBankMS Systems'),
  ('export_encryption', 'AES-256 Bit')
on conflict (key) do update set value = excluded.value;

-- ---------------------------------------------------------------------
-- TIMESTAMP MAINTENANCE TRIGGER
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at             before update on public.users             for each row execute function public.set_updated_at();
create trigger trg_donor_profiles_updated_at    before update on public.donor_profiles    for each row execute function public.set_updated_at();
create trigger trg_staff_profiles_updated_at    before update on public.staff_profiles    for each row execute function public.set_updated_at();
create trigger trg_collection_points_updated_at  before update on public.collection_points  for each row execute function public.set_updated_at();
create trigger trg_inventory_batches_updated_at  before update on public.inventory_batches  for each row execute function public.set_updated_at();
create trigger trg_beneficiaries_updated_at     before update on public.beneficiaries     for each row execute function public.set_updated_at();
create trigger trg_logistics_points_updated_at  before update on public.logistics_points  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.donor_profiles    enable row level security;
alter table public.staff_profiles    enable row level security;
alter table public.collection_points enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.dispensing_records enable row level security;
alter table public.terminal_sessions enable row level security;
alter table public.terminal_batches  enable row level security;
alter table public.beneficiaries     enable row level security;
alter table public.logistics_points  enable row level security;
alter table public.export_jobs       enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.system_config     enable row level security;

-- Policies utilizing token-based user role checks
create policy "users_select_own_or_staff" on public.users
  for select to authenticated
  using (auth_user_id = auth.uid() or (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin')));

create policy "donor_profiles_owner_or_staff" on public.donor_profiles
  for all to authenticated
  using (
    id = (select id from public.users where auth_user_id = auth.uid())
    or (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  )
  with check (
    id = (select id from public.users where auth_user_id = auth.uid())
    or (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  );

create policy "staff_profiles_read_all" on public.staff_profiles
  for select to authenticated
  using (true);

create policy "staff_profiles_admin_write" on public.staff_profiles
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin');

create policy "collection_points_read_all" on public.collection_points
  for select using (true);

create policy "collection_points_staff_write" on public.collection_points
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));



create policy "inventory_staff_all" on public.inventory_batches
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "dispensing_staff_all" on public.dispensing_records
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "terminal_sessions_staff_all" on public.terminal_sessions
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "terminal_batches_staff_all" on public.terminal_batches
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "beneficiaries_staff_all" on public.beneficiaries
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "logistics_points_read_all" on public.logistics_points
  for select using (true);

create policy "logistics_points_staff_write" on public.logistics_points
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "export_jobs_staff_all" on public.export_jobs
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'))
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "activity_logs_select_staff" on public.activity_logs
  for select to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') in ('staff', 'admin'));

create policy "activity_logs_insert_all" on public.activity_logs
  for insert to authenticated
  with check (true);

create policy "system_config_read_all" on public.system_config
  for select using (true);

create policy "system_config_admin_write" on public.system_config
  for all to authenticated
  using (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
  with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin');

-- ---------------------------------------------------------------------
-- SECURITY INVOKER VIEWS (Mirror precomputed mock structures)
-- ---------------------------------------------------------------------
create or replace view public.view_inventory_stats
with (security_invoker = true) as
select
  coalesce(sum(volume_ml), 0) as total_volume_ml,
  count(*) filter (where collected_at::date = current_date) as batches_today,
  round(100.0 * count(*) filter (where lab_status = 'verified') / nullif(count(*), 0), 1) as pass_rate_pct
from public.inventory_batches;

create or replace view public.view_donation_log_stats
with (security_invoker = true) as
select
  coalesce(sum(volume_ml), 0) as total_volume_ml,
  count(*) as donations_count
from public.inventory_batches
where collected_at >= date_trunc('month', now());

create or replace view public.view_donor_directory_stats
with (security_invoker = true) as
select
  count(*) filter (where status = 'verified') as active_donors,
  coalesce(sum(total_volume_ml), 0) as total_volume_ml,
  count(*) filter (where created_at >= date_trunc('month', now())) as new_this_month,
  count(*) filter (where screening_due) as due_screening
from public.donor_profiles;

create or replace view public.view_map_legend_stats
with (security_invoker = true) as
select
  count(*) filter (where status = 'verified') as active,
  count(*) filter (where status = 'neutral')  as inactive,
  count(*) filter (where status = 'pending')  as unverified
from public.donor_profiles;

create or replace view public.view_regional_activity
with (security_invoker = true) as
select
  region,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as percentage
from public.donor_profiles
where region is not null
group by region;

create or replace view public.view_logistics_stats
with (security_invoker = true) as
select
  (select count(*) from public.logistics_points where type = 'shipping') as active_hubs,
  (select coalesce(sum(volume_ml), 0) from public.inventory_batches where collected_at::date = current_date) as today_intake_ml,
  (select count(*) from public.donor_profiles where status = 'verified') as live_donors;

create or replace view public.view_export_hub_stats
with (security_invoker = true) as
select
  (select row_count from public.export_jobs order by requested_at desc limit 1) as preview_rows,
  (select value from public.system_config where key = 'export_encryption') as encryption;

-- ---------------------------------------------------------------------
-- MOCK DATA SEED STATEMENTS
-- ---------------------------------------------------------------------

-- Seed Users (Bcrypt Passwords automatically processed by trigger)
insert into public.users (id, email, encrypted_password, role) values
  ('11111111-1111-1111-1111-111111111111', 'dr.rivera@milkbank.org', 'securepassword123', 'staff'),
  ('22222222-2222-2222-2222-222222222222', 'elena@example.com', 'donorpassword123', 'donor'),
  ('33333333-3333-3333-3333-333333333333', 'maya@example.com', 'donorpassword123', 'donor'),
  ('44444444-4444-4444-4444-444444444444', 'chloe@example.com', 'donorpassword123', 'donor'),
  ('55555555-5555-5555-5555-555555555555', 'rebecca@example.com', 'donorpassword123', 'donor'),
  ('66666666-6666-6666-6666-666666666666', 'jessica@example.com', 'donorpassword123', 'donor')
on conflict (id) do nothing;

-- Seed Staff Profiles
insert into public.staff_profiles (id, full_name, role_title, avatar_initials) values
  ('11111111-1111-1111-1111-111111111111', 'Dr. Rivera', 'Lab Technician', 'DR')
on conflict (id) do nothing;

-- Seed Donor Profiles
insert into public.donor_profiles (id, display_id, full_name, status, status_label, last_donation_at, total_volume_ml, screening_due, contact_phone, donation_cycles, verification_note, avatar_url, region, area, latitude, longitude) values
  ('22222222-2222-2222-2222-222222222222', 'DON-8821', 'Elena Sorvino', 'verified', 'Active', '2023-10-12', 42500, false, '+1 (555) 293-1022', 24, 'Verified', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8e1GmQgQoHs2cryXymjEKe9DUNjdUOI705hWgCOdPteBBPQwZoiuStVQI2KHVmCLxBMHoo5Nm77dtzO4kWyAzQVm44glK0Ib_4MfBACNlYCENdP8qLuhUyXirrMH2ggjxV0OySm2Qn1HV11IATg7yKeyDsq14HHZ7zXI-Ewo6tBcGvGjFkJkJowaeyeVcJzfmVAXgEc5zNqw83zL8IhIAOYlEa-HlJfx2ovL1b22jG6Ogfa-3XPAgNCyO1S2LQdL-J2oB_UnlZiM', 'Metropolitan North', 'Mission District', 37.7599, -122.4148),
  ('33333333-3333-3333-3333-333333333333', 'DON-7712', 'Maya Patel', 'verified', 'Active', '2023-10-09', 18200, false, '+1 (555) 102-8832', 9, 'Verified', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM_CnJo0yCpCMQWEV7wqiDczc9dX6qXmuKQFycNzE4b_9ZR08dYBb3VOG71dqRRkOI__fDQo8GmTZlwDgZncpWv7LiMTDRvPII3FXkHPZ1hCcYbFPXJZyiPDH3HIYlpjSBv34EHgK92eLfg36zYYP_8l_JEJUGP982X-TZO4OLNVEydVpIW3z1NoNEj4guL8U0N6eJ8OKMWYnwSlAOJEH6qdzX1_NcDYaa92Q7EEZZa3WV0ZBOq430QkG9ZqhZXcpSRz9DzpzUgno', 'Metropolitan North', 'SOMA', 37.7785, -122.4056),
  ('44444444-4444-4444-4444-444444444444', 'DON-3109', 'Chloe Henderson', 'neutral', 'Inactive', '2023-09-28', 3100, true, '+1 (555) 921-0045', 2, 'Pending Re-cert', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8bk4fLcpGFAFndtYYDhMieb79vqsFEr5p35frcRUbIAPkxW2RkG7aSQI8uoKBAmG5dBdVf_d0PWNJKNFYhHaAO9D6BbxGkOyoBhenUZPYUerfsqL8BmAwPB8ihlh_kNdlw1lzoiNUKREB_d23Takp2FKL9z4xl-39LrBus2rBH0F_a1xbag3V536qmsI1HOEIeqa-SGCB1XCKLgZdiOvFbH9t-0Yi0jJG4BSMPpOj1K04VjDBOecnN3ZjvaiWHfcwRwrFr6kiuEE', 'Central Valley', 'Castro', 37.7609, -122.4350),
  ('55555555-5555-5555-5555-555555555555', 'DON-2201', 'Rebecca Bloom', 'verified', 'Active', '2023-10-14', 65800, false, '+1 (555) 441-1234', 41, 'Verified', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOkmElQlZZJ_OBo_ZXgLwHRYcRhMGYE9-PL0vNrLCroVjZqBEhdi-vnE-FbJ06ibyqTBBDlCm4UVP2iOhGbVr-GPawnFFE4CIRmG6ZJhc6MXcb-qsbMILUxkNKtCvMAkE6uBJa83RGJnk74I3O6qUNHAvPkfRLKKbA7ruU3Q5-cF-xPjjapDE_Hc9buIKxOBxCr_HmlcuJdOJCuos1SPjxOq-xB4sNO6jdy48XXrdFJePf3MyI_nn6uJJPZZVtisIV055mN8utBDM', 'Central Valley', 'Mission District', 37.7599, -122.4148),
  ('66666666-6666-6666-6666-666666666666', 'DON-1194', 'Jessica Sterling', 'fail', 'Flagged', '2023-10-01', 12400, true, '+1 (555) 309-8871', 6, 'Expired Labs', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJHVWn7EaTj4ucNGNYwOu4ingb7JlaXkwVDQTSJDnwz-rUFF-d0q51QhnwluUNtJkkZoxq8q61XpDlIesSX3E_2wnxdlr1i-lGBRHJHKUegeKWSNup_cYUTAD7NHqqNxh1Aky0p2rSCjUuftiVk2A6yz6I5s55BYd8zSM3W5FTECr_TO8Dt-EDBXssm0Ida2R_uIU3-sYGUBslkek08WwBvczpgiTf_pIhQHBbkv-wa2Tj9zrXwz1Qvzs3wj2QJndwG4OhNt1ybdI', 'Central Valley', 'SOMA', 37.7785, -122.4056)
on conflict (id) do nothing;

-- Seed Collection Points
insert into public.collection_points (id, name, address, region, latitude, longitude, active_donors, volume_today_ml, status, status_label) values
  ('CP-01', 'Mission District Unit B', '2840 Mission St, San Francisco', 'Metropolitan North', 37.7599, -122.4148, 8, 12400, 'verified', 'Operational'),
  ('CP-02', 'Bayview Collection Hub', '1450 Evans Ave, San Francisco', 'Metropolitan North', 37.7388, -122.3892, 5, 8200, 'pending', 'Restocking')
on conflict (id) do nothing;

-- Seed Inventory Batches
insert into public.inventory_batches (batch_id, donor_id, volume_ml, collected_at, expiry_date, lab_status, lab_label, storage_location) values
  ('MB-2024-0892', '22222222-2222-2222-2222-222222222222', 450, '2026-06-17 08:30:00+00', '2026-08-15', 'verified', 'Verified', 'Freezer A-12'),
  ('MB-2024-0891', '33333333-3333-3333-3333-333333333333', 380, '2026-06-17 07:15:00+00', '2026-08-14', 'pending', 'Pending QC', 'Freezer A-08'),
  ('MB-2024-0890', '33333333-3333-3333-3333-333333333333', 520, '2026-06-16 16:45:00+00', '2026-08-13', 'verified', 'Verified', 'Freezer B-03'),
  ('MB-2024-0889', '22222222-2222-2222-2222-222222222222', 290, '2026-06-16 14:20:00+00', '2026-08-13', 'fail', 'Failed', 'Quarantine Q-01')
on conflict (batch_id) do nothing;

-- Seed Beneficiaries
insert into public.beneficiaries (id, infant_name, date_of_birth, gestational_age, medical_record_number, hospital_name, attending_physician, ward, guardian_name, guardian_relationship, guardian_contact, daily_volume_ml, feeding_frequency, special_instructions) values
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Baby A. Thorne', '2026-06-01', '28 weeks', 'MRN-88122', 'St. Jude Medical Plaza', 'Dr. Rivera', 'NICU-3A', 'Sarah Thorne', 'Mother', '+1 (555) 392-0012', 120, '8x daily', 'Keep refrigerated, thaw in warm water'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Baby M. Chen', '2026-06-10', '32 weeks', 'MRN-77182', 'St. Jude Medical Plaza', 'Dr. Rivera', 'NICU-2B', 'Elena Chen', 'Mother', '+1 (555) 993-8821', 85, '12x daily', 'Standard mature donor milk only'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Baby L. Santos', '2026-05-15', '36 weeks', 'MRN-33019', 'City General Hospital', 'Dr. Alvarez', 'Pediatrics-4', 'Carlos Santos', 'Father', '+1 (555) 203-9944', 200, '6x daily', 'No colostrum assignments')
on conflict (id) do nothing;

-- Seed Dispensing Records
insert into public.dispensing_records (id, beneficiary_id, batch_id, ward, volume_ml, dispensed_date, priority, status, status_label, dispensed_by) values
  ('DISP-4421', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'MB-2024-0892', 'NICU-3A', 120, '2026-06-17', 'critical', 'verified', 'Dispensed', '11111111-1111-1111-1111-111111111111'),
  ('DISP-4420', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'MB-2024-0891', 'NICU-2B', 85, '2026-06-17', 'critical', 'pending', 'Scheduled', '11111111-1111-1111-1111-111111111111'),
  ('DISP-4419', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'MB-2024-0890', 'Pediatrics-4', 200, '2026-06-16', 'standard', 'verified', 'Dispensed', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

-- Seed Logistics Points
insert into public.logistics_points (id, name, type, status, capacity_percentage, departure_time, expiry_interval, latitude, longitude) values
  ('FC-01', 'St. Jude Medical Plaza', 'hospital', 'active', null, null, null, 37.7599, -122.4148),
  ('FC-02', 'City General Hospital', 'hospital', 'active', null, null, null, 37.7785, -122.4056),
  ('MH-01', 'Mission District Unit B', 'shipping', 'busy', 84.0, '16:30:00', interval '2 hours 14 minutes', 37.7609, -122.4350),
  ('MH-02', 'Bayview Collection Hub', 'shipping', 'idle', 32.0, '18:00:00', interval '3 hours 45 minutes', 37.7388, -122.3892)
on conflict (id) do nothing;

-- Seed Export Jobs
insert into public.export_jobs (id, dataset, format, row_count, status, status_label, requested_by, requested_at, completed_at, file_url) values
  ('EXP-901', 'Inventory & Lab Results', 'CSV', 1402, 'verified', 'Complete', '11111111-1111-1111-1111-111111111111', '2026-06-19 14:00:00+00', '2026-06-19 14:02:00+00', 'https://example.com/exports/EXP-901.csv'),
  ('EXP-900', 'Donor Registry', 'XLSX', 142, 'pending', 'Processing', '11111111-1111-1111-1111-111111111111', '2026-06-16 10:00:00+00', null, null)
on conflict (id) do nothing;

-- Seed Terminal Sessions
insert into public.terminal_sessions (id, donor_id, staff_id, batch_id, volume_ml, session_time, status, status_label) values
  ('SES-881', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'MB-2024-0892', 450, '2026-06-19 09:15:00+00', 'verified', 'Verified'),
  ('SES-880', null, '11111111-1111-1111-1111-111111111111', 'MB-2024-0891', 320, '2026-06-19 08:40:00+00', 'verified', 'Verified')
on conflict (id) do nothing;

-- Seed Terminal Batches
insert into public.terminal_batches (id, entries, volume_l, status, time_label, shipped_at) values
  ('B-202310-04', 6, 1.40, 'OPEN', null, null),
  ('B-202310-03', 12, 3.20, 'SHIPPED', 'Handed over to logistics at 08:30 AM', '2026-06-19 08:30:00+00')
on conflict (id) do nothing;

-- Seed Activity Logs
insert into public.activity_logs (message, actor_id) values
  ('Screening completed for Maya Patel', '11111111-1111-1111-1111-111111111111'),
  ('New donation logged — 450ml from Sarah Jenkins', '11111111-1111-1111-1111-111111111111'),
  ('Batch MB-2024-0889 flagged for retest', '11111111-1111-1111-1111-111111111111');
