import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface PortalUser {
  id:             string
  email:          string
  converter_slug: string
}

export async function getPortalUser(): Promise<PortalUser | null> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // Server components can't set cookies — middleware refreshes the session
        setAll(_items: { name: string; value: string; options?: CookieOptions }[]) {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.user_metadata?.converter_slug) return null

  return {
    id:             user.id,
    email:          user.email ?? '',
    converter_slug: user.user_metadata.converter_slug as string,
  }
}
