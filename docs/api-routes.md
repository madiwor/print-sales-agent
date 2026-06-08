# API Routes

## Convención de prefijos

| Prefijo | Auth | Descripción |
|---------|------|-------------|
| `/api/public/...` | Sin auth | Datos públicos del portal |
| `/api/auth/...` | Sin auth | Registro y sesión |
| `/api/chat/...` | Auth | Endpoint principal del agente |
| `/api/agent/...` | Auth | Tools del agente (internas) |
| `/api/converter/...` | Auth converter | Dashboard |
| `/api/platform/...` | Auth plataforma | Administración |

## Rutas públicas

```
GET /api/public/portal/[slug]
GET /api/public/portal/[slug]/materials
GET /api/public/portal/[slug]/finishes
GET /api/public/portal/[slug]/capabilities
GET /api/public/industries
GET /api/auth/check-slug/[slug]
```

## Auth

```
POST /api/auth/converter/register
     Body: { email, password, company_name, slug, industry_id, country }
     → crea auth.user + converters + converter_config + converter_trial_usage
     → envía email de verificación

POST /api/auth/buyer/register
     Body: { email, password, full_name, company_name, country }
     → crea auth.user + buyers
```

## Chat (agente)

```
POST /api/chat/[slug]     agente cliente (buyer auth)
     Body: { message, session_id? }
     → { response, session_id }

POST /api/chat/admin      agente admin (converter auth)
     Body: { message, session_id? }
     → { response, session_id }
```

## Tools del agente (internas)

```
GET  /api/agent/portal/[slug]/info
POST /api/agent/portal/[slug]/check-feasibility
POST /api/agent/rfq/draft
PATCH /api/agent/rfq/[rfq_id]/draft
POST  /api/agent/rfq/[rfq_id]/submit

GET  /api/agent/converter/config
GET  /api/agent/converter/rfqs
GET  /api/agent/converter/rfqs/[rfq_id]
GET  /api/agent/converter/trial
PATCH /api/agent/converter/info
PATCH /api/agent/converter/capabilities
POST  /api/agent/converter/materials
DELETE /api/agent/converter/materials/[slug]
POST  /api/agent/converter/finishes
DELETE /api/agent/converter/finishes/[slug]
PATCH /api/agent/converter/portal-status
PATCH /api/agent/converter/rfqs/[rfq_id]/status
```

## Dashboard converter

```
GET  /api/converter/dashboard
GET  /api/converter/rfqs
GET  /api/converter/rfqs/[rfq_id]
PATCH /api/converter/rfqs/[rfq_id]
GET  /api/converter/snippet
```

## Middleware (en orden)

1. **Auth** — token Supabase válido
2. **Tenant** — converter_id coincide con recurso (403 si no)
3. **Trial** — solo en `submit_rfq`: rfqs_used < rfqs_limit (402 si no)
4. **Token budget** — solo al crear sesión nueva (402 si sobre límite)

## Códigos de respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 400 | Input inválido |
| 401 | No autenticado |
| 402 | Límite alcanzado (trial o tokens) |
| 403 | Sin permiso sobre este recurso |
| 404 | Portal no existe o inactivo |
| 409 | Slug ya tomado |
| 422 | Pedido no factible |
| 429 | Hard cap de sesión superado |
| 500 | Error interno |
