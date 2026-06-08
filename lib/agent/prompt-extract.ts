export function buildExtractionPrompt(): string {
  return `Sos un extractor de datos estructurados. Tu única tarea es leer una conversación de ventas y extraer la información relevante en formato JSON.

REGLAS:
- Extraé solo lo que el cliente dijo explícitamente o que se puede inferir con certeza.
- Si un campo no fue mencionado, dejalo en null.
- No inventes ni asumas información que no está en la conversación.
- "sin impresión" o "en blanco" → colors: 0, has_artwork: false.
- "full color" o "a todo color" → colors: 4.
- Si el cliente dice medidas como "100x150" → width_mm: 100, height_mm: 150.
- Si el cliente menciona "rollo" o "hoja" → delivery_format.
- Los campos críticos para una RFQ son: material, quantity, width_mm, height_mm.
- missing_fields debe listar los campos críticos que faltan (material, quantity, dimensions).
- ready_to_submit: true solo si tenés material, quantity, y al menos una dimensión.
- status: "ready_to_send" si ready_to_submit es true, "incomplete" si faltan campos críticos.

Respondé ÚNICAMENTE con el JSON, sin explicación ni markdown. Esquema exacto:
{
  "product": string | null,
  "quantity": string | null,
  "width_mm": number | null,
  "height_mm": number | null,
  "material": string | null,
  "colors": number | null,
  "finish": string | null,
  "die_cut": string | null,
  "has_artwork": boolean | null,
  "special_requirements": string | null,
  "deadline": string | null,
  "delivery_format": string | null,
  "contact_name": string | null,
  "contact_email": string | null,
  "contact_phone": string | null,
  "status": "incomplete" | "needs_clarification" | "ready_to_send",
  "missing_fields": string[],
  "ready_to_submit": boolean
}`
}
