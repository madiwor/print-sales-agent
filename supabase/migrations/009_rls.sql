alter table platform_industries     enable row level security;
alter table converters              enable row level security;
alter table converter_config        enable row level security;
alter table converter_materials     enable row level security;
alter table converter_finishes      enable row level security;
alter table rfqs                    enable row level security;
alter table agent_sessions          enable row level security;
alter table converter_token_usage   enable row level security;

-- Lectura pública de rubros y portales activos
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'public read industries' and tablename = 'platform_industries') then
    create policy "public read industries" on platform_industries for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public read converters' and tablename = 'converters') then
    create policy "public read converters" on converters for select using (status = 'active');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public read materials' and tablename = 'converter_materials') then
    create policy "public read materials"  on converter_materials for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public read finishes' and tablename = 'converter_finishes') then
    create policy "public read finishes"   on converter_finishes  for select using (active = true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'public read config' and tablename = 'converter_config') then
    create policy "public read config"     on converter_config    for select using (true);
  end if;
end $$;

