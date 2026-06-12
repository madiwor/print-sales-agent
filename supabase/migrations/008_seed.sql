-- Seed industries
insert into platform_industries (slug, name) values
  ('etiquetas', 'Etiquetas Autoadhesivas'),
  ('imprenta',  'Imprenta General'),
  ('packaging', 'Packaging y Cajas')
on conflict (slug) do nothing;

-- Seed converters
insert into converters (slug, industry_id, company_name, agent_name, agent_language, description, contact_email, contact_phone, status)
select
  'demo',
  (select id from platform_industries where slug = 'etiquetas'),
  'Etiquetas Demo SA',
  'Sofía',
  'es',
  'Fabricantes de etiquetas autoadhesivas para la industria alimentaria, cosmética e industrial. Trabajamos con todo tipo de sustratos y acabados para adaptarnos a cada proyecto.',
  'ventas@etiquetasdemo.com',
  '+54 11 4000-0000',
  'active'
where not exists (select 1 from converters where slug = 'demo');

insert into converters (slug, industry_id, company_name, agent_name, agent_language, description, contact_email, contact_phone, status)
select
  'nyssa',
  (select id from platform_industries where slug = 'etiquetas'),
  'Nyssa',
  'Sofía',
  'es',
  'Con más de 20 años de trayectoria, Nyssa es líder en soluciones de identificación. Fabricamos etiquetas autoadhesivas personalizadas con impresión flexográfica e impresión digital full color UV. Trabajamos con todo tipo de materiales autoadhesivos para todas las industrias. También somos distribuidores oficiales de impresoras de etiquetas Toshiba (industriales, de oficina y portátiles) y comercializamos ribbons para impresoras termo-transferencia en todas las calidades (cera, cera-resina y resina).',
  'info@nyssa.com.ar',
  '54-11-4756-6718',
  'active'
where not exists (select 1 from converters where slug = 'nyssa');

-- Config: demo
insert into converter_config (converter_id, min_quantity, max_width_mm, max_colors, ships_nationwide, lead_time_days)
select (select id from converters where slug = 'demo'), 1000, 210, 6, true, 10
where not exists (select 1 from converter_config where converter_id = (select id from converters where slug = 'demo'));

-- Config: nyssa
insert into converter_config (converter_id, min_quantity, max_width_mm, max_colors, ships_nationwide, lead_time_days)
select (select id from converters where slug = 'nyssa'), 0, 320, 8, true, 7
where not exists (select 1 from converter_config where converter_id = (select id from converters where slug = 'nyssa'));

-- Materials: demo
insert into converter_materials (converter_id, slug, name, description, sort_order)
select c.id, m.slug, m.name, m.description, m.sort_order from converters c,
(values
  ('vinilo-blanco-brillante', 'Vinilo blanco brillante', 'Alta resistencia a humedad y UV. Ideal para cosmética, limpieza y exterior.', 0),
  ('bopp-transparente',       'BOPP transparente',       'Transparente, look "sin etiqueta". Ideal para frascos de vidrio.', 1),
  ('papel-couche',            'Papel couché',            'Look premium, acabado suave. Ideal para vinos, aceites y productos gourmet.', 2),
  ('papel-kraft',             'Papel kraft',             'Look artesanal y natural. Ideal para productos orgánicos, miel y mermeladas.', 3),
  ('poliester-plateado',      'Poliéster plateado',      'Aspecto metálico, muy resistente. Ideal para industria y cosmética premium.', 4)
) as m(slug, name, description, sort_order)
where c.slug = 'demo'
  and not exists (select 1 from converter_materials where converter_id = c.id and converter_materials.slug = m.slug);

-- Finishes: demo
insert into converter_finishes (converter_id, slug, name, description, sort_order)
select c.id, f.slug, f.name, f.description, f.sort_order from converters c,
(values
  ('barniz-uv',          'Barniz UV',          'Brillo intenso, protege la impresión.', 0),
  ('laminado-mate',      'Laminado mate',      'Acabado suave y elegante, antihuella.',  1),
  ('laminado-brillante', 'Laminado brillante', 'Alta luminosidad y protección.',         2)
) as f(slug, name, description, sort_order)
where c.slug = 'demo'
  and not exists (select 1 from converter_finishes where converter_id = c.id and converter_finishes.slug = f.slug);

-- Materials: nyssa
insert into converter_materials (converter_id, slug, name, description, sort_order)
select c.id, m.slug, m.name, m.description, m.sort_order from converters c,
(values
  ('papel-ilustracion',   'Papel ilustración',       'Papel blanco satinado, ideal para etiquetas de alta calidad visual.', 0),
  ('papel-kraft',         'Papel kraft',             'Look artesanal y natural. Ideal para productos orgánicos y gourmet.', 1),
  ('papel-cartulina',     'Papel cartulina',         'Mayor rigidez. Ideal para etiquetas de colgar y envases.',           2),
  ('papel-fluorescente',  'Papel fluorescente',      'Alta visibilidad. Ideal para señalización y promociones.',           3),
  ('bopp-blanco',         'BOPP blanco',             'Film plástico blanco, resistente a humedad.',                        4),
  ('bopp-transparente',   'BOPP transparente',       'Film transparente, look "sin etiqueta". Ideal para frascos de vidrio.', 5),
  ('void-seguridad-blanco','VOID seguridad blanco',  'Etiqueta de seguridad que deja marca al ser removida.',              6),
  ('void-seguridad-plata', 'VOID seguridad plata',   'Etiqueta de seguridad metálica que deja marca al ser removida.',    7)
) as m(slug, name, description, sort_order)
where c.slug = 'nyssa'
  and not exists (select 1 from converter_materials where converter_id = c.id and converter_materials.slug = m.slug);

-- Finishes: nyssa
insert into converter_finishes (converter_id, slug, name, description, sort_order)
select c.id, f.slug, f.name, f.description, f.sort_order from converters c,
(values
  ('barniz-uv',              'Barniz UV',                     'Protección y brillo intenso sobre la impresión.',                  0),
  ('digital-full-color',     'Impresión digital full color',  'Full color CMYK, ideal para tiradas cortas y diseños complejos.',  1),
  ('troquelado-especial',    'Troquelado especial',           'Cualquier forma personalizada.',                                   2),
  ('troquelado-seguridad',   'Troquelado de seguridad',       'Cortes de seguridad que dificultan la remoción sin evidencia.',    3)
) as f(slug, name, description, sort_order)
where c.slug = 'nyssa'
  and not exists (select 1 from converter_finishes where converter_id = c.id and converter_finishes.slug = f.slug);
