import { supabase } from './client'
import type { PortalInfo } from '@/types/agent'

export async function getPortalBySlug(slug: string): Promise<PortalInfo | null> {
  const { data, error } = await supabase
    .from('converters')
    .select(`
      *,
      converter_config (*),
      converter_materials (*),
      converter_finishes (*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !data) return null

  const cfg = data.converter_config as any
  return {
    company_name:    data.company_name,
    agent_name:      data.agent_name,
    agent_language:  data.agent_language,
    industry:        'etiquetas',
    description:     data.description ?? '',
    contact_email:   data.contact_email,
    contact_phone:   data.contact_phone ?? undefined,
    custom_greeting: data.custom_greeting ?? undefined,
    products_knowledge: data.products_knowledge ?? undefined,
    materials: ((data.converter_materials as any[]) ?? [])
      .filter(m => m.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(m => ({ slug: m.slug, name: m.name, description: m.description })),
    finishes: ((data.converter_finishes as any[]) ?? [])
      .filter(f => f.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(f => ({ slug: f.slug, name: f.name, description: f.description })),
    capabilities: cfg ? {
      min_quantity:     cfg.min_quantity,
      max_width_mm:     cfg.max_width_mm,
      max_colors:       cfg.max_colors,
      ships_nationwide: cfg.ships_nationwide,
      lead_time_days:   cfg.lead_time_days,
    } : {
      min_quantity: 0, max_width_mm: 320, max_colors: 8,
      ships_nationwide: true, lead_time_days: 10,
    },
  }
}
