export interface EtiquetasSpecs {
  industry:                'etiquetas'
  material:                string
  width_mm:                number
  height_mm:               number
  quantity:                number
  colors:                  number
  columns?:                number
  gap_between_labels_mm?:  number
  gap_between_columns_mm?: number
  finish?:                 string[]
  die_cut:                 string
  end_use?:                string
  has_artwork?:            boolean
  needs_die?:              boolean
  delivery_zone?:          string
  deadline?:               string
  special_requirements?:   string[]
}

export type RFQSpecs = EtiquetasSpecs

export type RFQStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
