import type Anthropic from '@anthropic-ai/sdk'

export const CLIENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_portal_info',
    description:
      'Obtiene la información pública completa del portal: nombre, descripción, materiales, acabados, capacidades y datos de contacto. Llamar al inicio de cada sesión de RFQ.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_available_materials',
    description: 'Devuelve la lista de materiales activos del converter.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_available_finishes',
    description: 'Devuelve la lista de acabados activos del converter.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_capabilities',
    description:
      'Devuelve las capacidades de producción del converter: tiraje mínimo, ancho máximo, cantidad de colores y zonas de cobertura.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_feasibility',
    description:
      'Valida si las specs capturadas son factibles para este converter. Devuelve feasible: true/false y lista de problemas. Llamar SIEMPRE antes de presentar el resumen al buyer.',
    input_schema: {
      type: 'object',
      properties: {
        specs: {
          type: 'object',
          description: 'Specs a validar contra las capacidades del converter',
          properties: {
            material:      { type: 'string', description: 'Slug del material seleccionado' },
            quantity:      { type: 'number', description: 'Cantidad total de etiquetas' },
            width_mm:      { type: 'number', description: 'Ancho de la etiqueta en mm' },
            colors:        { type: 'number', description: 'Número de colores de impresión' },
            delivery_zone: { type: 'string', description: 'Zona de entrega (opcional)' },
          },
        },
      },
      required: ['specs'],
    },
  },
  {
    name: 'create_rfq_draft',
    description:
      'Crea un borrador de RFQ. NO notifica al converter NI cuenta para el trial. Usar para persistir el progreso durante la conversación.',
    input_schema: {
      type: 'object',
      properties: {
        specs: {
          type: 'object',
          description: 'Specs completas capturadas hasta el momento',
        },
        buyer_notes: {
          type: 'string',
          description: 'Notas libres del buyer que no encajan en campos estructurados',
        },
      },
      required: ['specs'],
    },
  },
  {
    name: 'update_rfq_draft',
    description:
      'Actualiza el borrador con specs corregidas o completadas. Solo si el status es draft.',
    input_schema: {
      type: 'object',
      properties: {
        rfq_id: {
          type: 'string',
          description: 'ID del borrador a actualizar',
        },
        specs: {
          type: 'object',
          description: 'Specs actualizadas (reemplaza las anteriores)',
        },
        buyer_notes: {
          type: 'string',
          description: 'Notas del buyer actualizadas',
        },
      },
      required: ['rfq_id', 'specs'],
    },
  },
  {
    name: 'submit_rfq',
    description:
      'Confirma y envía la RFQ al converter. SÍ notifica al converter y SÍ cuenta para el trial. SOLO llamar después de confirmación EXPLÍCITA del buyer ("sí", "confirmado", "enviá", "dale", u otra respuesta afirmativa clara). Nunca llamar si el buyer solo pregunta o duda.',
    input_schema: {
      type: 'object',
      properties: {
        rfq_id: {
          type: 'string',
          description: 'ID del borrador a confirmar',
        },
        summary: {
          type: 'string',
          description: 'Resumen legible de la RFQ generado por el agente, en español',
        },
      },
      required: ['rfq_id', 'summary'],
    },
  },
]
