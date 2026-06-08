# Variables de entorno

Copiar `.env.example` a `.env.local` y completar los valores.

## Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=           # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Anon key (pública)
SUPABASE_SERVICE_ROLE_KEY=          # Service role key — SOLO server-side, nunca al browser
```

## Anthropic

```bash
ANTHROPIC_API_KEY=                  # SOLO server-side
```

## Resend

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@etiquetas.online
```

## Stripe (Fase 2 — declarar pero no implementar en MVP)

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## App

```bash
NEXT_PUBLIC_APP_URL=https://etiquetas.online
```

## Trial y billing

```bash
NEXT_PUBLIC_TRIAL_RFQ_LIMIT=20
TOKEN_LIMIT_STARTER=2000000
TOKEN_LIMIT_GROWTH=10000000
TOKEN_LIMIT_PRO=50000000
```

## Seguridad del agente

```bash
MAX_TOKENS_PER_SESSION=60000
```

## Notas de seguridad

- `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` nunca deben estar en variables `NEXT_PUBLIC_*`
- En Vercel, configurar todas las variables en el panel de Environment Variables
- Nunca commitear `.env.local`
