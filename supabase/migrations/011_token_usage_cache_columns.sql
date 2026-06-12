-- Add cache token columns to converter_token_usage
alter table converter_token_usage
  add column if not exists cache_read_tokens  bigint not null default 0,
  add column if not exists cache_write_tokens bigint not null default 0;

-- Replace increment function to include cache columns
create or replace function increment_token_usage(
  p_converter_id   uuid,
  p_input_tokens   bigint,
  p_output_tokens  bigint,
  p_cache_read     bigint default 0,
  p_cache_write    bigint default 0
) returns void language plpgsql security definer as $$
begin
  insert into converter_token_usage
    (converter_id, date, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, request_count)
  values
    (p_converter_id, current_date, p_input_tokens, p_output_tokens, p_cache_read, p_cache_write, 1)
  on conflict (converter_id, date) do update set
    input_tokens        = converter_token_usage.input_tokens        + excluded.input_tokens,
    output_tokens       = converter_token_usage.output_tokens       + excluded.output_tokens,
    cache_read_tokens   = converter_token_usage.cache_read_tokens   + excluded.cache_read_tokens,
    cache_write_tokens  = converter_token_usage.cache_write_tokens  + excluded.cache_write_tokens,
    request_count       = converter_token_usage.request_count       + 1;
end;
$$;
