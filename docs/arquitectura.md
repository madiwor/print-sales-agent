# Arquitectura

## Diagrama general

```
Browser (Buyer)          Browser (Converter)
      │                        │
      ▼                        ▼
  /[slug]/cotizar          /app/configurar
      │                        │
      └──────────┬─────────────┘
                 ▼
          Next.js (Vercel)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
 Supabase    Claude API    Resend
 (DB + Auth)  (IA)         (Email)
```

## Decisiones de diseño clave

### /[slug] en vez de subdominios
Routing dinámico nativo de Next.js. Un solo deploy, cero configuración por tenant, SEO acumulativo en el dominio raíz.

### specs como jsonb
Cada rubro tiene atributos distintos. Una etiqueta tiene `width_mm` y `die_cut`. Una caja tiene `box_style` y `board_type`. El jsonb permite agregar un rubro nuevo con solo un registro en `platform_industries`.

### rfq_events inmutable
Log de auditoría. Cada cambio de estado queda registrado con actor, timestamp y payload.

### agent_sessions guarda el array de messages
Claude API no tiene memoria entre requests. El historial completo se persiste en Supabase y se inyecta en cada llamada.

### increment_token_usage es función SQL atómica
Evita race conditions en tenants con múltiples sesiones concurrentes.

### Token check solo al crear sesión
Conversaciones activas siempre terminan. Cortar una sesión a la mitad perjudica al buyer. El exceso máximo por sesión (~40.000 tokens ≈ $0.12) es aceptable y queda registrado en `overage_tokens`.

### System prompt compilado en runtime
Mismo agente para todos los tenants y rubros. La personalización ocurre en el prompt, no en el código.

## Estructura del proyecto

```
app/
├── layout.tsx
├── page.tsx                        landing pública
├── registro/page.tsx               onboarding del converter
├── login/page.tsx
├── [slug]/                         portal público del converter
│   ├── page.tsx                    perfil + CTA
│   └── cotizar/page.tsx            chat (buyer)
├── app/                            dashboard del converter
│   ├── layout.tsx
│   ├── page.tsx
│   ├── rfqs/
│   ├── configurar/page.tsx         chat admin
│   └── snippet/page.tsx
└── api/
    ├── public/...
    ├── auth/...
    ├── chat/[slug]/route.ts        agente cliente
    ├── chat/admin/route.ts         agente admin
    ├── agent/...
    └── converter/...

lib/
├── supabase/
├── agent/
│   ├── client-tools.ts            toolset A
│   ├── admin-tools.ts             toolset B
│   ├── tool-handlers.ts           handleTool()
│   ├── prompt.ts                  buildSystemPrompt()
│   └── session.ts
├── api/
│   ├── middleware.ts
│   └── responses.ts
├── feasibility.ts
├── slug.ts
├── notifications.ts
└── tokens.ts

types/
├── database.ts
├── agent.ts
├── rfq.ts
└── api.ts
```
