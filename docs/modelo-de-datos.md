# Modelo de datos

## Diagrama

```
platform_industries
       │
       ▼
   converters ──────────────── converter_users
       │
       ├──── converter_config
       ├──── converter_trial_usage
       ├──── converter_token_usage
       ├──── converter_materials
       ├──── converter_finishes
       │
       ├──── rfqs ──────────── rfq_items
       │       │
       │       └────────────── rfq_events
       │
       ├──── agent_sessions
       └──── notifications

buyers ────────────────────────────── rfqs
```

## Tablas

| Tabla | Descripción |
|-------|-------------|
| `platform_industries` | Rubros: etiquetas, folding-carton, flexografía, imprenta |
| `converters` | Tenants. Un registro por imprenta. |
| `converter_users` | Usuarios del converter (owner/admin/viewer) |
| `converter_config` | Capacidades, billing, onboarding |
| `converter_trial_usage` | Conteo de RFQs en trial |
| `converter_token_usage` | Uso de tokens por mes |
| `converter_materials` | Catálogo de materiales por converter |
| `converter_finishes` | Catálogo de acabados por converter |
| `buyers` | Compradores. Un registro por usuario. |
| `rfqs` | Solicitudes de cotización |
| `rfq_items` | Ítems de una RFQ (multi-producto, futuro) |
| `rfq_events` | Log inmutable de eventos de cada RFQ |
| `agent_sessions` | Sesiones del agente con historial de messages |
| `notifications` | Cola de emails enviados |

## RFQ specs (jsonb)

El campo `rfqs.specs` es jsonb para soportar múltiples rubros sin migraciones:

```typescript
// Etiquetas
interface EtiquetasSpecs {
  industry:                 'etiquetas'
  material:                 string
  width_mm:                 number
  height_mm:                number
  quantity:                 number
  colors:                   number
  columns?:                 number
  gap_between_labels_mm?:   number
  gap_between_columns_mm?:  number
  finish?:                  string[]
  die_cut:                  string
  end_use?:                 string
  has_artwork?:             boolean
  needs_die?:               boolean
  delivery_zone?:           string
  deadline?:                string
  special_requirements?:    string[]
}
```

## Estados de RFQ

```
draft → submitted → reviewing → quoted → accepted
                             ↘ rejected
                             ↘ expired
```

## Migraciones

17 archivos SQL en `supabase/migrations/`:

```
001_industries.sql
002_converters.sql
003_converter_users.sql
004_converter_config.sql
005_converter_trial_usage.sql
006_converter_token_usage.sql
007_materials_finishes.sql
008_buyers.sql
009_rfqs.sql
010_rfq_items.sql
011_rfq_events.sql
012_agent_sessions.sql
013_notifications.sql
014_rls_policies.sql
015_views.sql
016_functions.sql
017_seed_industries.sql
```

## RLS — políticas clave

- **converters**: cada converter ve solo su registro
- **rfqs**: converter ve sus RFQs; buyer ve las suyas
- **agent_sessions**: actor ve solo sus sesiones
- **platform_industries**: lectura pública
