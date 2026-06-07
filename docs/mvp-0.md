# MVP-0 — Validación del agente

## Objetivo

Validar que el agente captura correctamente una RFQ estructurada en lenguaje natural **antes** de construir toda la infraestructura.

El riesgo más alto del producto no es técnico — es que el agente haga preguntas torpes, en el orden equivocado, o que no infiera bien el material de la aplicación. Eso se valida rápido.

## Enfoque

```
Loop real:  Claude API + Toolset A definido + Tool handlers mockeados
Sin DB:     Los handlers responden con datos fijos en memoria
Sin auth:   Converter hardcodeado en el handler de get_portal_info
```

Los handlers mockeados permiten validar el comportamiento del agente (inferencia, orden de preguntas, confirmación) sin depender de Supabase.

## Alcance del MVP-0

### Incluye
- `lib/agent/prompt.ts` — `buildSystemPrompt()` completo (4 secciones, rubro etiquetas)
- `lib/agent/client-tools.ts` — Toolset A (8 tools, definiciones JSON completas)
- `lib/agent/tool-handlers.ts` — Handlers mockeados con datos fijos
- `app/api/chat/[slug]/route.ts` — Loop Claude → tool_use → tool_result → Claude
- `app/[slug]/cotizar/page.tsx` — ChatWindow mínimo funcional
- `components/chat/ChatWindow.tsx` — UI del chat

### No incluye (se agrega en MVP-1)
- Supabase (DB real)
- Auth (buyer / converter)
- Persistencia de sesión (historial se pierde al recargar)
- Email (Resend)
- Trial limits / token budget
- Dashboard del converter
- Agente admin

## Estructura de archivos del MVP-0

```
lib/
└── agent/
    ├── prompt.ts           buildSystemPrompt()
    ├── client-tools.ts     8 tools definidos
    └── tool-handlers.ts    handlers mockeados

app/
├── api/
│   └── chat/
│       └── [slug]/
│           └── route.ts    loop principal
└── [slug]/
    └── cotizar/
        └── page.tsx        UI del chat

components/
└── chat/
    └── ChatWindow.tsx
```

## Converter mockeado (get_portal_info)

```typescript
const MOCK_PORTAL = {
  company_name:    "Etiquetas Demo SA",
  agent_name:      "Sofía",
  agent_language:  "es",
  industry:        "etiquetas",
  description:     "Fabricantes de etiquetas autoadhesivas para la industria alimentaria, cosmética e industrial.",
  materials: [
    { name: "Vinilo blanco brillante",     slug: "vinilo-blanco-brillante" },
    { name: "BOPP transparente",           slug: "bopp-transparente" },
    { name: "Papel couché",                slug: "papel-couche" },
    { name: "Papel kraft",                 slug: "papel-kraft" },
    { name: "Poliéster plateado",          slug: "poliester-plateado" },
  ],
  finishes: [
    { name: "Barniz UV",          slug: "barniz-uv" },
    { name: "Laminado mate",      slug: "laminado-mate" },
    { name: "Laminado brillante", slug: "laminado-brillante" },
  ],
  capabilities: {
    min_quantity:      1000,
    max_width_mm:      210,
    max_colors:        6,
    ships_nationwide:  true,
    lead_time_days:    10,
  }
}
```

## Criterios de éxito

El MVP-0 está completo cuando el agente:

- [ ] Infiere el material correcto de la descripción del producto sin preguntar
- [ ] Agrupa preguntas (máximo 2 por mensaje)
- [ ] Nunca repregunta algo que el usuario ya dijo
- [ ] Detecta "full color" → 4 colores
- [ ] Pregunta por `special_requirements` antes del resumen
- [ ] Presenta el resumen en el formato definido
- [ ] Llama `submit_rfq` solo con confirmación explícita
- [ ] Loguea en consola el JSON completo de la RFQ al confirmar

## Siguiente paso: MVP-1

Una vez validado el comportamiento del agente, MVP-1 agrega:
1. Supabase con 6 tablas mínimas (sin billing, sin events)
2. Auth básica del buyer (magic link)
3. Persistencia de sesión en `agent_sessions`
4. Email de notificación al converter (Resend)
