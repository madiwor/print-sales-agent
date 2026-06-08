# Print Sales Agent — Documentación

Portal de ventas B2B white-label para la industria gráfica. Los compradores describen su pedido en lenguaje natural y un agente de IA captura una RFQ completa y estructurada.

## Índice

- [Visión del producto](./producto.md)
- [Arquitectura](./arquitectura.md)
- [Modelo de datos](./modelo-de-datos.md)
- [Agente de IA](./agente.md)
- [API Routes](./api-routes.md)
- [Variables de entorno](./env.md)
- [Guía de desarrollo](./desarrollo.md)
- [Plan MVP-0](./mvp-0.md)

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | Vercel |
| IA | Claude API — claude-sonnet-4-6 |
| Email | Resend |

## URLs

```
etiquetas.online/               → landing pública + registro
etiquetas.online/[slug]         → portal público del converter
etiquetas.online/[slug]/cotizar → chat con el agente (buyer)
etiquetas.online/app/...        → dashboard del converter
```

## Orden de build

Ver [mvp-0.md](./mvp-0.md) para la primera etapa y [desarrollo.md](./desarrollo.md) para el roadmap completo.
