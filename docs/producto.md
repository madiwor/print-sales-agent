# Visión del producto

## Qué es

Un portal de ventas B2B white-label donde compradores de la industria gráfica describen lo que necesitan en lenguaje natural y un agente de IA captura una solicitud de cotización (RFQ) completa y estructurada.

El portal es operado por **converters** — imprentas, fábricas de etiquetas, productores de packaging — que lo usan como canal de ventas digital para sus clientes.

## Modelo de negocio

- Multi-tenant SaaS con routing dinámico por slug (`/[slug]`)
- Self-service: el converter se registra, configura con el agente, publica
- Trial: 20 RFQs gratuitas
- Planes pagos: Starter / Growth / Pro (limitados por tokens mensuales)
- Billing: Stripe (Fase 2)

## Actores

| Actor | Rol |
|-------|-----|
| **Plataforma** (Ignacio) | Administra tenants, monitorea uso, gestiona rubros |
| **Converter** | Imprenta/fábrica. Se registra, configura portal, recibe RFQs |
| **Buyer** | Cliente del converter. Hace RFQs vía chat |

## Lo que el agente hace y NO hace

**HACE:**
- Captura RFQs completas y estructuradas
- Valida factibilidad contra las capacidades del converter
- Configura el portal del converter vía conversación
- Gestiona materiales, acabados y capacidades

**NO HACE (MVP):**
- No cotiza precios
- No procesa pagos
- No genera órdenes de compra
- No se integra con Madiwor ERP
- No tiene memoria entre sesiones (historial en DB)

## Output de una RFQ

```json
{
  "industry":                 "etiquetas",
  "material":                 "vinilo-blanco-brillante",
  "width_mm":                 50,
  "height_mm":                80,
  "quantity":                 15000,
  "colors":                   4,
  "columns":                  2,
  "gap_between_labels_mm":    3,
  "gap_between_columns_mm":   2,
  "finish":                   ["barniz-uv"],
  "die_cut":                  "rectangular con esquinas redondeadas",
  "end_use":                  "envases de cosmética",
  "has_artwork":              true,
  "needs_die":                false,
  "delivery_zone":            "CABA",
  "deadline":                 "2026-06-30",
  "special_requirements":     [
    "resistente a humedad y contacto con aceites",
    "adhesivo removible sin dejar marca"
  ]
}
```

`special_requirements` es un array de strings libres — el cliente describe con sus palabras, el converter interpreta. El agente nunca filtra ni descarta requisitos.
