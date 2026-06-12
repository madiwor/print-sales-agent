create table if not exists converter_token_usage (
  id            uuid primary key default gen_random_uuid(),
  converter_id  uuid references converters(id),
  month         text not null,
  input_tokens  bigint not null default 0,
  output_tokens bigint not null default 0,
  updated_at    timestamptz default now(),
  unique(converter_id, month)
);

create or replace function increment_token_usage(
  p_converter_id uuid,
  p_month        text,
  p_input        bigint,
  p_output       bigint
) returns void language plpgsql as $$
begin
  insert into converter_token_usage(converter_id, month, input_tokens, output_tokens)
  values (p_converter_id, p_month, p_input, p_output)
  on conflict (converter_id, month)
  do update set
    input_tokens  = converter_token_usage.input_tokens  + excluded.input_tokens,
    output_tokens = converter_token_usage.output_tokens + excluded.output_tokens,
    updated_at    = now();
end;
$$;
