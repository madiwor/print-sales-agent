create table if not exists converter_config (
  id               uuid primary key default gen_random_uuid(),
  converter_id     uuid unique references converters(id) on delete cascade,
  min_quantity     int not null default 0,
  max_width_mm     int not null default 320,
  max_colors       int not null default 8,
  ships_nationwide boolean not null default true,
  lead_time_days   int not null default 10,
  created_at       timestamptz default now()
);
