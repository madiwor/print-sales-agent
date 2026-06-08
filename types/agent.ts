import type Anthropic from '@anthropic-ai/sdk'

export interface ToolContext {
  converterSlug: string
  rfqId?: string
}

export interface Lead {
  name:     string
  email:    string
  company?: string
}

export interface ChatRequest {
  message: string
  messages?: Anthropic.MessageParam[]
  lead?: Lead
  rfqDraft?: RFQDraft | null
}

export interface ChatResponse {
  response: string
  messages: Anthropic.MessageParam[]
}

export interface PortalInfo {
  company_name:   string
  agent_name:     string
  agent_language: string
  industry:       string
  description:    string
  custom_greeting?: string
  materials:      Material[]
  finishes:       Finish[]
  capabilities:   Capabilities
  contact_email:  string
  contact_phone?: string
}

export interface Material {
  name:        string
  slug:        string
  description?: string
}

export interface Finish {
  name:        string
  slug:        string
  description?: string
}

export interface Capabilities {
  min_quantity:       number
  max_width_mm:       number
  max_colors:         number
  print_types?:       string[]
  coverage_zones?:    string[]
  ships_nationwide:   boolean
  ships_international?: boolean
  lead_time_days:     number
  lead_time_notes?:   string
}

export interface FeasibilityResult {
  feasible: boolean
  issues:   string[]
}

export interface RFQDraft {
  product:               string | null
  quantity:              string | null
  width_mm:              number | null
  height_mm:             number | null
  material:              string | null
  colors:                number | null
  finish:                string | null
  die_cut:               string | null
  has_artwork:           boolean | null
  special_requirements:  string | null
  deadline:              string | null
  delivery_format:       string | null   // "rollo" | "hoja" | null
  contact_name:          string | null
  contact_email:         string | null
  contact_phone:         string | null
  company_name:          string | null
  product_type:          'etiquetas' | 'impresoras' | 'ribbons' | 'mixto' | null
  status:                'incomplete' | 'needs_clarification' | 'ready_to_send'
  missing_fields:        string[]
  ready_to_submit:       boolean
}
