import type { NextRequest } from 'next/server'
import { updateRFQStatus } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = process.env.ADMIN_SECRET
  if (secret) {
    const cookie = request.cookies.get('admin_token')?.value
    if (cookie !== secret) return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const { status } = await request.json() as { status: string }

  const allowed = ['submitted', 'in_progress', 'quoted', 'closed']
  if (!allowed.includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 })

  await updateRFQStatus(id, status)
  return Response.json({ ok: true })
}
