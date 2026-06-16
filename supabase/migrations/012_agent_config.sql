-- Agrega campos de configuración del agente a la tabla converters
ALTER TABLE converters
  ADD COLUMN IF NOT EXISTS tone              text NOT NULL DEFAULT 'semi-formal',
  ADD COLUMN IF NOT EXISTS extra_instructions text,
  ADD COLUMN IF NOT EXISTS restrictions      text;
