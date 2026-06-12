create table if not exists converters (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  industry_id     uuid references platform_industries(id),
  company_name    text not null,
  agent_name      text not null default 'Sofía',
  agent_language  text not null default 'es',
  description     text,
  contact_email   text not null,
  contact_phone   text,
  custom_greeting text,
  status          text not null default 'active',
  created_at      timestamptz default now()
);
