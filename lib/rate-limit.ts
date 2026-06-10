/**
 * Rate limiter in-memory por IP (sliding window).
 *
 * Limitación conocida: en Vercel cada instancia serverless tiene su propia
 * memoria, así que el límite real puede ser N × instancias. Para el tráfico
 * actual es protección suficiente contra abuso; si el producto escala,
 * migrar a Upstash Redis (@upstash/ratelimit) sin cambiar la interfaz.
 */

interface WindowEntry {
  timestamps: number[]
}

const WINDOW_MS = 60_000

const store = new Map<string, WindowEntry>()

// Evita crecimiento sin límite de la Map en instancias long-lived
const MAX_KEYS = 10_000

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function checkRateLimit(key: string, maxPerMinute: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }

  entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)

  if (entry.timestamps.length >= maxPerMinute) {
    const oldest = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + WINDOW_MS - now) / 1000),
    }
  }

  entry.timestamps.push(now)

  if (!store.has(key) && store.size >= MAX_KEYS) {
    const firstKey = store.keys().next().value
    if (firstKey) store.delete(firstKey)
  }
  store.set(key, entry)

  return {
    allowed: true,
    remaining: maxPerMinute - entry.timestamps.length,
    retryAfterSeconds: 0,
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
