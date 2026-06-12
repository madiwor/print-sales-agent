create table if not exists rfqs (
  id              uuid primary key default gen_random_uuid(),
  converter_id    uuid references converters(id),
  contact_name    text,
  contact_email   text,
  contact_company text,
  specs           jsonb not null default '{}',
  status          text not null default 'submitted',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists rfqs_converter_id_idx on rfqs(converter_id);
create index if not exists rfqs_created_at_idx on rfqs(created_at desc);
