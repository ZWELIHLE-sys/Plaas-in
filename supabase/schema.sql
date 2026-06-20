-- Plaas-In — Phase 1 (Livestock Core) database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- Phase 1 uses only `farmers` and `animals`. health_log + sales are included now so the
-- design is future-proof, but the first build loop only writes to farmers + animals.

-- ---------------------------------------------------------------------------
-- farmers — one row per WhatsApp user, keyed to their phone number.
-- ---------------------------------------------------------------------------
create table if not exists farmers (
  id                  uuid primary key default gen_random_uuid(),
  name                text,
  farm_name           text,
  phone               text unique not null,          -- WhatsApp number, e.g. 27821234567
  language            text default 'English',         -- 'Zulu' | 'English'
  location            text,
  subscription_status text default 'trial',           -- trial | active | inactive
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- animals — the Livestock Master. Records are NEVER deleted; status changes instead.
-- ---------------------------------------------------------------------------
create table if not exists animals (
  id               uuid primary key default gen_random_uuid(),
  animal_id        text,                              -- human tag, e.g. BOR-001 (unique per farmer)
  farmer_id        uuid not null references farmers(id) on delete cascade,
  species          text,                              -- Cattle | Goat | Sheep | Pig
  breed            text,                              -- Nguni, Boran, Boer, Dorper, ...
  gender           text,                              -- Male | Female
  primary_product  text,                              -- Beef | Dairy | Wool | Mutton | Pork
  coat_color       text,
  breeding_status  text default 'Intact',             -- Intact | Castrated
  castration_reason text,
  castration_date  date,
  mother_id        uuid references animals(id),       -- bloodline → prevents inbreeding
  father_id        uuid references animals(id),
  generation       integer default 1,
  status           text default 'Active',             -- Active | Sold | Deceased | Breeding
  birth_date       date,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (farmer_id, animal_id)
);

create index if not exists animals_farmer_idx on animals (farmer_id);
create index if not exists animals_status_idx on animals (farmer_id, status);

-- ---------------------------------------------------------------------------
-- health_log — Phase 1+ (dipping / vaccination / treatment / disease history)
-- ---------------------------------------------------------------------------
create table if not exists health_log (
  id              uuid primary key default gen_random_uuid(),
  farmer_id       uuid not null references farmers(id) on delete cascade,
  date            date not null default current_date,
  section         text default 'Livestock',           -- Livestock | Poultry | Crops
  target          text,                               -- which animals/batch
  action_type     text,                               -- Dipping | Vaccination | Treatment | ...
  chemical_used   text,
  withdrawal_until date,                              -- auto-calc for crop spraying (later)
  notes           text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sales — Phase 1+ (auction / direct / butchery + buyer + price)
-- ---------------------------------------------------------------------------
create table if not exists sales (
  id            uuid primary key default gen_random_uuid(),
  farmer_id     uuid not null references farmers(id) on delete cascade,
  date          date not null default current_date,
  product_type  text,                                 -- e.g. Bull, Goat, Eggs
  item_details  text,                                 -- e.g. Bull-02
  sale_type     text,                                 -- Direct | Auction | Butchery
  buyer_name    text,
  sale_location text,
  amount        numeric(12,2),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Privileges — the server connects as `service_role`. On some projects the
-- automatic grants are missing, causing "permission denied for table".
-- These statements are idempotent and safe to re-run.
-- ---------------------------------------------------------------------------
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
