alter table converters add column if not exists products_knowledge text;

-- Nyssa: catálogo completo (etiquetas, impresoras, ribbons)
update converters set products_knowledge = '1. ETIQUETAS AUTOADHESIVAS — fabricación propia con impresión flexográfica y digital UV.
   Papeles (ilustración, kraft, cartulinas, fluorescentes) y films (BOPP blanco/transparente,
   VOID seguridad). Entrega en hojas o rollos.

2. IMPRESORAS DE ETIQUETAS (termo-transferencia / códigos de barras):
   - Industriales: alta velocidad, uso continuo, grandes volúmenes.
   - De oficina: uso moderado, escritorio.
   - Portátiles: uso en campo, logística.
   Para impresoras: preguntar uso previsto, volumen aproximado de impresión por día/mes,
   si ya tiene modelo en mente o necesita asesoramiento.

3. RIBBONS (insumos para impresoras termo-transferencia):
   - Cera: ideal para superficies de papel, uso general, más económico.
   - Cera-resina: mayor durabilidad, resiste humedad leve, papeles y sintéticos.
   - Resina: máxima resistencia, para sintéticos, químicos, temperaturas extremas.
   Para ribbons: preguntar tipo de impresora (marca y modelo si lo saben),
   ancho del ribbon en mm, largo del rollo en metros, y tipo de superficie donde se imprime.

Podés tomar RFQs para cualquiera de estos productos. Si el cliente mezcla productos
(ej: etiquetas + ribbons), tomá todo en el mismo pedido.'
where slug = 'nyssa';

-- Demo: solo etiquetas
update converters set products_knowledge = 'ETIQUETAS AUTOADHESIVAS — fabricación propia con impresión flexográfica y digital.
Materiales: vinilo blanco brillante, BOPP transparente, papel couché, papel kraft, poliéster plateado.
Acabados: barniz UV, laminado mate, laminado brillante. Entrega en hojas o rollos.'
where slug = 'demo';
