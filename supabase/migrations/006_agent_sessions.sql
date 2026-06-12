create table if not exists agent_sessions (
  id            uuid primary key default gen_random_uuid(),
  converter_id  uuid references converters(id),
  contact_email text,
  messages      jsonb not null default '[]',
  rfq_id        uuid references rfqs(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
