export type Perspective = { name: string; description: string }
export type Study = { id: number; title: string; block: string; duration: string; verse: string }

export const perspectives: Perspective[] = [
  { name: 'Teológica', description: 'Qué revela el pasaje sobre Dios, su carácter y su obra.' },
  { name: 'Hermenéutica', description: 'Cómo leer el texto atendiendo al género, contexto y propósito.' },
  { name: 'Exégesis', description: 'Observación histórica, literaria y de las palabras originales.' },
  { name: 'Evangelística', description: 'El camino desde la convicción hasta una fe firme y vivida.' },
  { name: 'Pastoral', description: 'Una lectura que acompaña, consuela y llama a obedecer.' },
  { name: 'Neurociencia', description: 'Renovación de la mente, hábitos y plasticidad con prudencia.' },
  { name: 'Devocional', description: 'Cómo llevar la verdad del texto a tu corazón hoy.' },
  { name: 'Apologética', description: 'Preguntas difíciles y razones para una esperanza sólida.' },
  { name: 'Psicología', description: 'Emociones, patrones y sanidad vistos a la luz de la Palabra.' },
  { name: 'Discipulado', description: 'Prácticas concretas para mantenerse firme y constante.' },
]

export const studies: Study[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  title: ['La renovación de la mente', 'El carácter de Dios', 'Fe en tiempos de prueba', 'El camino de la gracia'][index % 4],
  block: `Bloque ${Math.floor(index / 5) + 1}`,
  duration: `${20 + (index % 4) * 5} min`,
  verse: ['Romanos 12:2', 'Salmo 23:1', '1 Corintios 15:58', '1 Juan 1:9'][index % 4],
}))

export const plans = [
  { title: 'Cronológico', detail: 'La historia de la redención en orden', days: 365, progress: 18 },
  { title: 'Sanidad emocional', detail: '21 días para llevar el corazón a la verdad', days: 21, progress: 42 },
  { title: 'Teología esencial', detail: 'Fundamentos para una fe sólida', days: 30, progress: 7 },
]

export const parallelPassages = [
  { version: 'RVR1960', text: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.' },
  { version: 'NVI', text: 'No se amolden al mundo actual, sino sean transformados mediante la renovación de su mente. Así podrán comprobar cuál es la voluntad de Dios, buena, agradable y perfecta.' },
  { version: 'NTV', text: 'No imiten las conductas ni las costumbres de este mundo, más bien dejen que Dios los transforme en personas nuevas al cambiarles la manera de pensar.' },
]

export const prayerSeed = [
  { id: 1, category: 'Familia', text: 'Por sabiduría y unidad en mi hogar.', prayers: 24 },
  { id: 2, category: 'Sanidad', text: 'Por fortaleza para atravesar este proceso.', prayers: 17 },
]

export function fallbackResponse(perspective: string, verse: string) {
  return {
    context: `${verse} se sitúa dentro de una invitación a vivir una fe consciente, arraigada en la Palabra y no en la presión del entorno.`,
    analysis: `Desde la perspectiva ${perspective.toLowerCase()}, observamos que el texto une verdad, transformación interior y una respuesta concreta. La renovación no es maquillaje espiritual: es una obra continua que alcanza pensamientos, afectos y decisiones.`,
    practice: 'Escribe hoy qué patrón necesitas entregar a Dios, qué verdad del pasaje lo confronta y cuál será tu primer paso verificable. Compártelo con alguien de confianza para sostener la obediencia.',
    conclusion: 'La meta no es acumular información, sino caminar con una mente restaurada, un corazón sensible y una fe que permanece firme.',
  }
}
