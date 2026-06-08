# Guía de desarrollo

## Setup local

```bash
# Clonar y instalar
git clone https://github.com/madiwor/print-sales-agent
cd print-sales-agent
npm install

# Configurar entorno
cp .env.example .env.local
# Editar .env.local con las variables reales

# Iniciar Supabase local (opcional)
npx supabase start

# Correr migraciones
npx supabase db push

# Iniciar servidor de desarrollo
npm run dev
```

## Convenciones de código

| Contexto | Convención |
|----------|-----------|
| Columnas y campos de DB | `snake_case` |
| Variables y funciones TypeScript | `camelCase` |
| Componentes y tipos | `PascalCase` |
| Constantes | `UPPER_SNAKE_CASE` |
| Archivos de route handler | siempre `route.ts` |
| Componentes | siempre `PascalCase.tsx` |

## Versiones requeridas

```json
{
  "next": "^15.0.0",
  "typescript": "^5.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@anthropic-ai/sdk": "latest",
  "resend": "^3.0.0"
}
```

## Roadmap de build

### Semana 1 — Fundación de datos
- Proyecto Supabase + 17 migraciones
- Verificar RLS con tests de aislamiento
- Tipos TypeScript con Supabase CLI
- Seed de rubros

### Semana 2 — Auth y portal estático
- Registro de converter y buyer
- Página /[slug] con perfil estático
- APIs públicas del portal
- Middleware de auth global

### Semana 3 — Agente cliente básico
- `buildSystemPrompt()` con todas las secciones
- Toolset A en `client-tools.ts`
- `/api/chat/[slug]` con loop básico
- `ChatWindow.tsx` funcional
- Persistencia en `agent_sessions`

### Semana 4 — Tools del agente cliente
- `handleTool()` con los 8 tools
- Todas las routes `/api/agent/...`
- Middleware de trial y token budget
- Email al converter (Resend) en `submit_rfq`

### Semana 5 — Agente admin y dashboard
- Toolset B en `admin-tools.ts`
- `/api/chat/admin`
- Dashboard: lista de RFQs + trial status
- Chat admin en `/app/configurar`

### Semana 6 — Polish y edge cases
- Manejo de códigos de error (402, 422, 429)
- Portal pausado: página informativa
- Rate limiting en `/api/chat/`
- Landing pública
- Deploy en Vercel

## MVP-0 (primera iteración)

Ver [mvp-0.md](./mvp-0.md) para el plan de validación rápida antes del build completo.
