import type { PortalInfo, FeasibilityResult } from '@/types/agent'
import type { ToolContext } from '@/types/agent'
import { getPortalBySlug } from '@/lib/supabase/portals'

const MOCK_PORTAL: PortalInfo = {
  id:             'mock-demo',
  company_name:   'Etiquetas Demo SA',
  agent_name:     'Sofía',
  agent_language: 'es',
  industry:       'etiquetas',
  description:    'Fabricantes de etiquetas autoadhesivas para la industria alimentaria, cosmética e industrial. Trabajamos con todo tipo de sustratos y acabados para adaptarnos a cada proyecto.',
  contact_email:  'ventas@etiquetasdemo.com',
  contact_phone:  '+54 11 4000-0000',
  materials: [
    { name: 'Vinilo blanco brillante',  slug: 'vinilo-blanco-brillante',  description: 'Alta resistencia a humedad y UV. Ideal para cosmética, limpieza y exterior.' },
    { name: 'BOPP transparente',        slug: 'bopp-transparente',        description: 'Transparente, look “sin etiqueta”. Ideal para frascos de vidrio.' },
    { name: 'Papel couché',             slug: 'papel-couche',             description: 'Look premium, acabado suave. Ideal para vinos, aceites y productos gourmet.' },
    { name: 'Papel kraft',              slug: 'papel-kraft',              description: 'Look artesanal y natural. Ideal para productos orgánicos, miel y mermeladas.' },
    { name: 'Poliéster plateado',       slug: 'poliester-plateado',       description: 'Aspecto metálico, muy resistente. Ideal para industria y cosmética premium.' },
  ],
  finishes: [
    { name: 'Barniz UV',          slug: 'barniz-uv',          description: 'Brillo intenso, protege la impresión.' },
    { name: 'Laminado mate',      slug: 'laminado-mate',      description: 'Acabado suave y elegante, antihuella.' },
    { name: 'Laminado brillante', slug: 'laminado-brillante', description: 'Alta luminosidad y protección.' },
  ],
  capabilities: {
    min_quantity:     1000,
    max_width_mm:     210,
    max_colors:       6,
    ships_nationwide: true,
    lead_time_days:   10,
  },
}

const NYSSA_PORTAL: PortalInfo = {
  id:             'mock-nyssa',
  company_name:   'Nyssa',
  agent_name:     'Sofía',
  agent_language: 'es',
  industry:       'etiquetas',
  description:    'Con más de 20 años de trayectoria, Nyssa es líder en soluciones de identificación. Fabricamos etiquetas autoadhesivas personalizadas con impresión flexográfica e impresión digital full color UV. Trabajamos con todo tipo de materiales autoadhesivos para todas las industrias. También somos distribuidores oficiales de impresoras de etiquetas Toshiba (industriales, de oficina y portátiles) y comercializamos ribbons para impresoras termo-transferencia en todas las calidades (cera, cera-resina y resina).',
  contact_email:  'info@nyssa.com.ar',
  contact_phone:  '54-11-4756-6718',
  materials: [
    { name: 'Papel ilustración', slug: 'papel-ilustracion', description: 'Papel blanco satinado, ideal para etiquetas de alta calidad visual.' },
    { name: 'Papel kraft', slug: 'papel-kraft', description: 'Look artesanal y natural. Ideal para productos orgánicos y gourmet.' },
    { name: 'Papel cartulina', slug: 'papel-cartulina', description: 'Mayor rigidez. Ideal para etiquetas de colgar y envases.' },
    { name: 'Papel fluorescente', slug: 'papel-fluorescente', description: 'Alta visibilidad. Ideal para señalización y promociones.' },
    { name: 'BOPP blanco', slug: 'bopp-blanco', description: 'Film plástico blanco, resistente a humedad. Ideal para productos de limpieza y cosmética.' },
    { name: 'BOPP transparente', slug: 'bopp-transparente', description: 'Film transparente, look “sin etiqueta”. Ideal para frascos de vidrio.' },
    { name: 'VOID seguridad blanco', slug: 'void-seguridad-blanco', description: 'Etiqueta de seguridad que deja marca al ser removida.' },
    { name: 'VOID seguridad plata', slug: 'void-seguridad-plata', description: 'Etiqueta de seguridad metálica que deja marca al ser removida.' },
  ],
  finishes: [
    { name: 'Barniz UV', slug: 'barniz-uv', description: 'Protección y brillo intenso sobre la impresión.' },
    { name: 'Impresión digital full color', slug: 'digital-full-color', description: 'Full color CMYK, ideal para tiradas cortas y diseños complejos.' },
    { name: 'Troquelado especial', slug: 'troquelado-especial', description: 'Cualquier forma personalizada.' },
    { name: 'Troquelado de seguridad', slug: 'troquelado-seguridad', description: 'Cortes de seguridad que dificultan la remoción sin evidencia.' },
  ],
  capabilities: {
    min_quantity:     0,
    max_width_mm:     320,
    max_colors:       8,
    print_types:      ['Flexografía', 'Digital UV'],
    ships_nationwide: true,
    lead_time_days:   7,
  },
}

function getPortal(slug: string): PortalInfo {
  if (slug === 'nyssa') return NYSSA_PORTAL
  return MOCK_PORTAL
}

function checkFeasibilityLogic(specs: Record<string, unknown>, portal: PortalInfo): FeasibilityResult {
  const issues: string[] = []

  const quantity = specs.quantity as number | undefined
  if (quantity !== undefined && portal.capabilities.min_quantity > 0 && quantity < portal.capabilities.min_quantity) {
    issues.push(
      `El tiraje mínimo es ${portal.capabilities.min_quantity} unidades. Tu pedido es de ${quantity}.`
    )
  }

  const widthMm = specs.width_mm as number | undefined
  if (widthMm !== undefined && widthMm > portal.capabilities.max_width_mm) {
    issues.push(
      `El ancho máximo de impresión es ${portal.capabilities.max_width_mm} mm. Tu etiqueta mide ${widthMm} mm de ancho.`
    )
  }

  const colors = specs.colors as number | undefined
  if (colors !== undefined && colors > portal.capabilities.max_colors) {
    issues.push(
      `El máximo de colores es ${portal.capabilities.max_colors}. Soicitás ${colors} colores.`
    )
  }

  const material = specs.material as string | undefined
  if (material) {
    const materialExists = portal.materials.some(m => m.slug === material || m.name.toLowerCase() === material.toLowerCase())
    if (!materialExists) {
      issues.push(
        `El material “${material}” no está en el catálogo. Materiales disponibles: ${portal.materials.map(m => m.name).join(', ')}.`
      )
    }
  }

  return { feasible: issues.length === 0, issues }
}

export async function handleTool(
  toolName:  string,
  toolInput: Record<string, unknown>,
  _context:  ToolContext
): Promise<unknown> {
  const slug = _context.converterSlug

  // Try DB first; fall back to hardcoded portals if unavailable
  const portal = await getPortalBySlug(slug).catch(() => null) ?? getPortal(slug)

  switch (toolName) {
    case 'get_portal_info':
      return portal

    case 'get_available_materials':
      return portal.materials

    case 'get_available_finishes':
      return portal.finishes

    case 'get_capabilities':
      return portal.capabilities

    case 'check_feasibility': {
      const specs = (toolInput.specs ?? {}) as Record<string, unknown>
      return checkFeasibilityLogic(specs, portal)
    }

    case 'create_rfq_draft': {
      console.log('\n=== RFQ DRAFT CREADO ===')
      console.log(JSON.stringify(toolInput.specs, null, 2))
      if (toolInput.buyer_notes) {
        console.log('Notas del buyer:', toolInput.buyer_notes)
      }
      console.log('========================\n')
      return { rfq_id: 'mock-draft-1', status: 'draft' }
    }

    case 'update_rfq_draft': {
      console.log('\n=== RFQ DRAFT ACTUALIZADO ===')
      console.log('rfq_id:', toolInput.rfq_id)
      console.log(JSON.stringify(toolInput.specs, null, 2))
      if (toolInput.buyer_notes) {
        console.log('Notas del buyer:', toolInput.buyer_notes)
      }
      console.log('=============================\n')
      return { rfq_id: toolInput.rfq_id, status: 'draft', updated: true }
    }

    case 'submit_rfq': {
      console.log('\n╔══════════════════════════════╗')
      console.log('║       ✅ RFQ ENVIADA         ║')
      console.log('╚══════════════════════════════╝')
      console.log('rfq_id:', toolInput.rfq_id)
      console.log('Resumen:', toolInput.summary)
      console.log('================================\n')
      return { rfq_id: toolInput.rfq_id, status: 'submitted' }
    }

    default:
      throw new Error(`Tool desconocido: ${toolName}`)
  }
}
