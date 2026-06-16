-- Webhook URL configurable por portal
ALTER TABLE converters
  ADD COLUMN IF NOT EXISTS webhook_url text;

-- Log de envíos de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
  id           uuid primary key default gen_random_uuid(),
  converter_id uuid references converters(id) on delete cascade,
  rfq_id       uuid references rfqs(id) on delete set null,
  url          text not null,
  status_code  int,
  success      boolean not null default false,
  attempts     int not null default 1,
  error        text,
  created_at   timestamptz default now()
);
