create table if not exists converter_materials (
  id           uuid primary key default gen_random_uuid(),
  converter_id uuid references converters(id) on delete cascade,
  slug         text not null,
  name         text not null,
  description  text,
  active       boolean not null default true,
  sort_order   int not null default 0
);

create table if not exists converter_finishes (
  id           uuid primary key default gen_random_uuid(),
  converter_id uuid references converters(id) on delete cascade,
  slug         text not null,
  name         text not null,
  description  text,
  active       boolean not null default true,
  sort_order   int not null default 0
);
