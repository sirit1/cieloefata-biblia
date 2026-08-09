import { createClient } from '@supabase/supabase-js';
const RUTA_FASES = [
  { id: 'enraizamiento', titulo: 'Enraizamiento', duracionMeses: 2, objetivo: 'Establecer una vida de confesión, oración y Palabra.', modulos: ['Caminar en la luz', 'Alimentarse de la Palabra'] },
  { id: 'caracter', titulo: 'Carácter', duracionMeses: 3, objetivo: 'Formar obediencia visible y hábitos santos.', modulos: ['Obedecer en comunidad'] },
  { id: 'teologia-practica', titulo: 'Teología práctica', duracionMeses: 3, objetivo: 'Conectar doctrina bíblica con decisiones cotidianas.', modulos: ['Permanecer firmes'] },
  { id: 'multiplicacion', titulo: 'Multiplicación', duracionMeses: 4, objetivo: 'Servir, acompañar y formar a otros.', modulos: ['Comisión y servicio'] }
];

const LECCIONES = [
  { id: 'luz-01', faseId: 'enraizamiento', moduloId: 'caminar-luz', titulo: 'Volver a la verdad', puntosClave: ['Reconocer sin esconder', 'Confesar delante de Dios', 'Recibir limpieza y restauración'], referencias: [{ ref: '1 Juan 1:9', cita: 'Si confesamos nuestros pecados, Él es fiel y justo para perdonarnos los pecados y para limpiarnos de toda maldad.' }], modelo3M: { atras: '¿Qué necesitas revisar con honestidad?', arriba: 'Lee 1 Juan 1:9 lentamente y ora.', adelante: 'Da un paso concreto de reconciliación.' }, aplicacion: 'Escribe una confesión concreta y preséntala a Dios en oración.' },
  { id: 'luz-02', faseId: 'enraizamiento', moduloId: 'caminar-luz', titulo: 'Una conciencia limpia', puntosClave: ['La gracia no encubre la verdad', 'El arrepentimiento cambia dirección', 'La comunidad acompaña'], referencias: [{ ref: 'Salmo 139:23-24', cita: 'Examíname, oh Dios, y conoce mi corazón; pruébame y conoce mis inquietudes.' }], modelo3M: { atras: '¿Qué respuesta diste a la corrección?', arriba: 'Permite que Dios examine tus caminos.', adelante: 'Comparte un próximo paso con alguien maduro.' }, aplicacion: 'Identifica una decisión que necesita alinearse con la verdad bíblica.' },
  { id: 'palabra-01', faseId: 'enraizamiento', moduloId: 'alimentarse-palabra', titulo: 'Hambre de la Palabra', puntosClave: ['Desear alimento espiritual', 'Leer con atención', 'Practicar lo comprendido'], referencias: [{ ref: '1 Pedro 2:2', cita: 'deseen como niños recién nacidos, la leche pura de la palabra, para que por ella crezcan para salvación.' }], modelo3M: { atras: '¿Qué hábito pudiste sostener?', arriba: 'Observa qué produce el deseo por la Palabra.', adelante: 'Agenda tu próxima lectura.' }, aplicacion: 'Lee el pasaje, anota una verdad, una corrección y una obediencia.' },
  { id: 'caracter-01', faseId: 'caracter', moduloId: 'obedecer-comunidad', titulo: 'Oidores y hacedores', puntosClave: ['Escuchar no es suficiente', 'La obediencia es visible', 'La rendición de cuentas protege'], referencias: [{ ref: 'Santiago 1:22', cita: 'Sean hacedores de la palabra y no solamente oidores que se engañan a sí mismos.' }], modelo3M: { atras: '¿Qué compromiso compartido cumpliste?', arriba: 'Compara el texto con tu práctica.', adelante: 'Pide rendición de cuentas.' }, aplicacion: 'Comparte con una persona madura qué obediencia practicarás esta semana.' },
  { id: 'firmeza-01', faseId: 'teologia-practica', moduloId: 'permanecer-firmes', titulo: 'Firmes y constantes', puntosClave: ['La esperanza sostiene', 'El trabajo fiel importa', 'La constancia es una decisión'], referencias: [{ ref: '1 Corintios 15:58', cita: 'Estén firmes, constantes, abundando siempre en la obra del Señor.' }], modelo3M: { atras: '¿Dónde viste fidelidad en dificultad?', arriba: 'Medita en la esperanza de la resurrección.', adelante: 'Elige una forma concreta de servir.' }, aplicacion: 'Define un servicio concreto y una forma de mantenerte constante.' }
];

const LECCIONES_COMPLETAS = LECCIONES.map((leccion) => ({ ...leccion, contenido: {
  'luz-01': 'La confesión cristiana no es una exposición pública para recibir condena. Es volver a la verdad delante de Dios y descansar en su fidelidad. El discípulo comienza dejando de negociar con aquello que necesita ser rendido.',
  'luz-02': 'Dios no examina para destruir, sino para conducir a la vida. Una conciencia limpia aprende a reconocer sus señales, recibir corrección y caminar acompañado sin esconderse.',
  'palabra-01': 'La Palabra no es un adorno espiritual ni una lista de datos. Es alimento para una vida que está creciendo. Lee despacio: observa quién habla, qué revela el texto y qué obediencia pide hoy.',
  'caracter-01': 'La escucha bíblica alcanza su propósito cuando se convierte en obediencia. La comunidad no es un tribunal; es el lugar donde aprendemos a practicar la verdad con humildad, gracia y rendición de cuentas.',
  'firmeza-01': 'La firmeza cristiana no significa ausencia de cansancio. Significa permanecer orientado por la esperanza de Cristo y seguir sirviendo aunque el fruto no sea inmediato.'
}[leccion.id] || leccion.titulo }));

const MODULOS = [
  { id: 'caminar-luz', faseId: 'enraizamiento', nombre: 'Caminar en la luz', descripcion: 'Confesión, arrepentimiento y una conciencia abierta delante de Dios.', leccionIds: ['luz-01', 'luz-02'] },
  { id: 'alimentarse-palabra', faseId: 'enraizamiento', nombre: 'Alimentarse de la Palabra', descripcion: 'Aprender a leer, comprender y obedecer las Escrituras.', leccionIds: ['palabra-01'] },
  { id: 'obedecer-comunidad', faseId: 'caracter', nombre: 'Obedecer en comunidad', descripcion: 'Convertir la verdad recibida en hábitos y decisiones visibles.', leccionIds: ['caracter-01'] },
  { id: 'permanecer-firmes', faseId: 'teologia-practica', nombre: 'Permanecer firmes', descripcion: 'Vivir una fe sólida, útil y constante.', leccionIds: ['firmeza-01'] }
];

const CAMINO_BASE = [
  { id: 'luz', titulo: 'Caminar en la luz', pasaje: '1 Juan 1:9 · NBLA', objetivo: 'Reconocer el pecado y responder con confesión y arrepentimiento.', contenido: 'La vida del discípulo comienza ante Dios con honestidad. La confesión no es una condena: es volver a la verdad y recibir limpieza.', practica: 'Escribe una confesión concreta, ora con humildad y busca reconciliación cuando corresponda.', modelo3M: { atras: '¿Qué obediencia o tropiezo necesitas revisar?', arriba: 'Lee 1 Juan 1:9 lentamente y ora con honestidad.', adelante: 'Comparte un próximo paso con tu mentor o comunidad.' }, preguntas: [{ pregunta: '¿Qué respuesta pide 1 Juan 1:9?', opciones: ['Ocultar el pecado', 'Confesarlo a Dios', 'Justificarlo'], correcta: 1, explicacion: 'El texto llama a confesar el pecado y confiar en el carácter fiel y justo de Dios.' }] },
  { id: 'palabra', titulo: 'Alimentarse de la Palabra', pasaje: '1 Pedro 2:2 · NBLA', objetivo: 'Pasar de conocer versículos a desear y obedecer la Palabra.', contenido: 'El crecimiento cristiano necesita alimento constante. Leer, observar, interpretar y practicar forman un hábito de discípulo.', practica: 'Lee el pasaje lentamente, anota una verdad, una corrección y una obediencia para hoy.', modelo3M: { atras: '¿Qué hábito de lectura pudiste sostener?', arriba: 'Observa qué revela 1 Pedro 2:2 sobre el crecimiento.', adelante: 'Agenda tu próxima lectura y compártela con alguien.' }, preguntas: [{ pregunta: '¿Qué imagen usa 1 Pedro 2:2 para describir el deseo espiritual?', opciones: ['Agua de lluvia', 'Leche espiritual', 'Pan del cielo'], correcta: 1, explicacion: 'Pedro compara el deseo por la Palabra con el deseo de un recién nacido por la leche.' }] },
  { id: 'obediencia', titulo: 'Obedecer en comunidad', pasaje: 'Santiago 1:22 · NBLA', objetivo: 'Convertir la escucha bíblica en decisiones visibles y compartidas.', contenido: 'Un discípulo no se limita a escuchar. Examina su vida, practica la verdad y permite que otros le acompañen con gracia y rendición de cuentas.', practica: 'Comparte tu próximo paso con una persona madura y vuelve a revisar tu obediencia.', modelo3M: { atras: '¿Qué compromiso compartido pudiste cumplir?', arriba: 'Examina Santiago 1:22 frente a tu práctica real.', adelante: 'Pide rendición de cuentas para tu decisión concreta.' }, preguntas: [{ pregunta: '¿Qué peligro señala Santiago 1:22?', opciones: ['Escuchar sin hacer', 'Servir demasiado', 'Leer en comunidad'], correcta: 0, explicacion: 'El texto advierte contra engañarnos al oír la Palabra sin ponerla en práctica.' }] },
  { id: 'firmeza', titulo: 'Permanecer firmes', pasaje: '1 Corintios 15:58 · NBLA', objetivo: 'Servir con constancia y esperanza sin abandonar el camino.', contenido: 'La madurez se reconoce en una vida sólida, constante y útil. La esperanza en Cristo sostiene el trabajo fiel aun cuando no vemos resultados inmediatos.', practica: 'Define un servicio concreto para esta semana y una forma de permanecer constante.', modelo3M: { atras: '¿Dónde viste fidelidad en medio de la dificultad?', arriba: 'Medita en 1 Corintios 15:58 y la esperanza de la resurrección.', adelante: 'Elige una forma concreta de servir con constancia.' }, preguntas: [{ pregunta: '¿Cómo llama Pablo a permanecer en la obra del Señor?', opciones: ['Inconstantes', 'Firmes y constantes', 'Aislados'], correcta: 1, explicacion: 'Pablo anima a estar firmes, constantes y abundando en la obra del Señor.' }] }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  const objetivo = typeof req.body?.objetivo === 'string' ? req.body.objetivo.trim() : '';
  const ritmo = typeof req.body?.ritmo === 'string' ? req.body.ritmo.trim() : '15 minutos al día';
  if (!objetivo || objetivo.length > 300) return res.status(400).json({ error: 'Escribe un objetivo de entre 1 y 300 caracteres.' });
  const normalizarEtapas = (etapas) => CAMINO_BASE.map((base, index) => {
    const etapa = etapas?.[index] || {};
    const preguntas = Array.isArray(etapa.preguntas) && etapa.preguntas.length
      ? etapa.preguntas.map((pregunta) => ({
          pregunta: String(pregunta.pregunta || base.preguntas[0].pregunta),
          opciones: Array.isArray(pregunta.opciones) && pregunta.opciones.length === 3 ? pregunta.opciones.map(String) : base.preguntas[0].opciones,
          correcta: Number.isInteger(pregunta.correcta) && pregunta.correcta >= 0 && pregunta.correcta < 3 ? pregunta.correcta : base.preguntas[0].correcta,
          explicacion: String(pregunta.explicacion || base.preguntas[0].explicacion)
        }))
      : base.preguntas;
    return {
      id: base.id,
      titulo: String(etapa.titulo || base.titulo),
      pasaje: String(etapa.pasaje || base.pasaje),
      objetivo: String(etapa.objetivo || base.objetivo),
      contenido: String(etapa.contenido || etapa.descripcion || base.contenido),
      practica: String(etapa.practica || base.practica),
      modelo3M: etapa.modelo3M || base.modelo3M,
      preguntas
    };
  });
  let data = { titulo: 'Ruta de discipulado integral', introduccion: `Un recorrido local para crecer en ${objetivo}, a un ritmo de ${ritmo}.`, fases: RUTA_FASES, modulos: MODULOS, lecciones: LECCIONES_COMPLETAS, etapas: normalizarEtapas(CAMINO_BASE) };
  return res.status(200).json({ success: true, source: 'catalogo-local', data });
}
