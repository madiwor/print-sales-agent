import type { PortalInfo, FeasibilityResult } from '@/types/agent'
import type { ToolContext } from '@/types/agent'

const MOCK_PORTAL: PortalInfo = {
  company_name:   'Etiquetas Demo SA',
  agent_name:     'Sofía',
  agent_language: 'es',
  industry:       'etiquetas',
  description:    'Fabricantes de etiquetas autoadhesivas para la industria alimentaria, cosmética e industrial. Trabajamos con todo tipo de sustratos y acabados para adaptarnos a cada proyecto.',
  contact_email:  'ventas@etiquetasdemo.com',
  contact_phone:  '+54 11 4000-0000',
  materials: [
    { name: 'Vinilo blanco brillante',  slug: 'vinilo-blanco-brillante',  description: 'Alta resistencia a humedad y UV. Ideal para cosmética, limpieza y exterior.' },
    { name: 'BOPP transparente',        slug: 'bopp-transparente',        description: 'Transparente, look "sin etiqueta". Ideal para frascos de vidrio.' },
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

function checkFeasibilityLogic(specs: Record<string, unknown>): FeasibilityResult {
  const issues: string[] = []

  const quantity = specs.quantity as number | undefined
  if (quantity !== undefined && quantity < MOCK_PORTAL.capabilities.min_quantity) {
    issues.push(
      `El tiraje mínimo es ${MOCK_PORTAL.capabilities.min_quantity} unidades. Tu pedido es de ${quantity}.`
    )
  }

  const widthMm = specs.width_mm as number | undefined
  if (widthMm !== undefined && widthMm > MOCK_PORTAL.capabilities.max_width_mm) {
    issues.push(
      `El ancho máximo de impresión es ${MOCK_PORTAL.capabilities.max_width_mm} mm. Tu etiqueta mide ${widthMm} mm de ancho.`
    )
  }

  const colors = specs.colors as number | undefined
  if (colors !== undefined && colors > MOCK_PORTAL.capabilities.max_colors) {
    issues.push(
      `El máximo de colores es ${MOCK_PORTAL.capabilities.max_colors}. Solicitás ${colors} colores.`
    )
  }

  const material = specs.material as string | undefined
  if (material) {
    const materialExists = MOCK_PORTAL.materials.some(m => m.slug === material || m.name.toLowerCase() === material.toLowerCase())
    if (!materialExists) {
      issues.push(
        `El material "${material}" no está en el catálogo. Materiales disponibles: ${MOCK_PORTAL.materials.map(m => m.name).join(', ')}.`
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
  switch (toolName) {
    case 'get_portal_info':
      return MOCK_PORTAL

    case 'get_available_materials':
      return MOCK_PORTAL.materials

    case 'get_available_finishes':
      return MOCK_PORTAL.finishes

    case 'get_capabilities':
      return MOCK_PORTAL.capabilities

    case 'check_feasibility': {
      const specs = (toolInput.specs ?? {}) as Record<string, unknown>
      return checkFeasibilityLogic(specs)
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
