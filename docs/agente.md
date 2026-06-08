# Agente de IA

## Modelo

`claude-sonnet-4-6` vía Anthropic SDK.

## Dos modos

| Modo | Actor | Toolset | Endpoint |
|------|-------|---------|----------|
| `rfq` | Buyer | Toolset A | `/api/chat/[slug]` |
| `admin_config` | Converter | Toolset B | `/api/chat/admin` |

Los toolsets nunca se mezclan.

## System prompt — arquitectura

```typescript
buildSystemPrompt(converter, config, industry, materials, finishes, mode)
  → Sección 1: Base estática    (~300 tokens)
  → Sección 2: Rubro            (~400 tokens)
  → Sección 3: Tenant           (~200 tokens)
  → Sección 4: Modo             (~300 tokens)
  ─────────────────────────────────────────
  Total:                        ~1.200 tokens
```

## Toolset A — Agente cliente (modo rfq)

| Tool | Descripción |
|------|-------------|
| `get_portal_info` | Info pública + capabilities + materials + finishes |
| `get_available_materials` | Materiales activos del converter |
| `get_available_finishes` | Acabados activos del converter |
| `get_capabilities` | Tiraje mínimo, ancho máx, colores, zonas |
| `check_feasibility` | Valida specs → `{ feasible, issues[] }` |
| `create_rfq_draft` | Crea borrador — NO notifica, NO cuenta trial |
| `update_rfq_draft` | Actualiza borrador existente |
| `submit_rfq` | Confirma y envía — notifica, cuenta trial |

**Regla crítica:** `submit_rfq` solo se llama con confirmación **explícita** del buyer.

## Toolset B — Agente admin (modo admin_config)

| Tool | Descripción |
|------|-------------|
| `get_portal_config` | Config completa del portal |
| `get_rfqs` | Lista de RFQs |
| `get_rfq_detail` | Detalle de una RFQ |
| `get_trial_status` | RFQs usadas/límite |
| `update_portal_info` | Nombre, descripción, saludo |
| `update_capabilities` | Tiraje, ancho, colores, zonas |
| `add_material` / `remove_material` | Catálogo de materiales |
| `add_finish` / `remove_finish` | Catálogo de acabados |
| `set_portal_status` | Activar / pausar portal |
| `update_rfq_status` | Cambiar estado de RFQ |

## Flujo de un mensaje

```
1. Middleware valida auth
2. Crea o recupera agent_session
3. Carga historial de messages
4. Carga contexto del portal
5. Compila system prompt (buildSystemPrompt)
6. Llama Claude API con historial + tools
7. Si hay tool_use:
   a. Ejecuta handleTool()
   b. Agrega tool_result
   c. Vuelve a llamar Claude
   d. Repite hasta no haber tool_use
8. Persiste historial en agent_sessions
9. Actualiza token usage (increment_token_usage)
10. Devuelve { response, session_id }
```

## Catálogo de campos — etiquetas

### Indispensables (no confirmar RFQ sin estos)
- `width_mm` — ancho en mm
- `height_mm` — alto en mm
- `quantity` — cantidad de etiquetas
- `colors` — número de tintas (full color → 4)
- `material` — sustrato
- `die_cut` — forma de corte

### Inferibles (deducir antes de preguntar)
- `material` — inferir de la aplicación (cosmética → vinilo/BOPP, miel → kraft)
- `needs_die` — deducir de `die_cut`
- `finish` — sugerir si menciona "premium" o "lujo"
- `has_artwork` — inferir de "tengo el arte" / "necesito diseño"

### Opcionales con contexto
- `columns` — solo si hay aplicadora automática
- `gap_between_labels_mm` / `gap_between_columns_mm` — solo si `columns > 1`
- `delivery_zone` — solo si cobertura limitada
- `deadline` — preguntar al final

### Siempre al final
Preguntar por `special_requirements` antes del resumen. Capturar todo con las palabras del cliente, sin filtrar.

## Lógica de captura

El agente NO ejecuta un checklist. Razona:
1. Extrae todo lo implícito o explícito del primer mensaje
2. Infiere lo que puede con confianza
3. Pregunta solo lo que genuinamente falta (máximo 2 por mensaje)
4. Nunca pregunta algo que ya se dijo
5. Con todos los indispensables → valida factibilidad
6. Pregunta sobre requerimientos especiales
7. Presenta resumen y pide confirmación
8. Solo con confirmación explícita → llama `submit_rfq`
