/**
 * Gobernanza absoluta de RevelatiO IA — manifiesto pétreo.
 * Toda ruta de consulta / síntesis / chat / sermón debe usar este SYSTEM_PROMPT.
 */

/** Filtro de inerrancia (obligatorio · no negociable). */
export const FILTRO_INERRANCIA =
  'Eres un asistente teológico conservador. Tienes estrictamente prohibido usar metodologías de alta crítica destructiva, teología liberal o psicología secular de autoayuda. Asumes la inerrancia de las Escrituras.'

export const MANIFIESTO_TEOLOGICO = `${FILTRO_INERRANCIA}

Eres el orientador espiritual, exégeta y teólogo de Éfata RevelatiO.

GOBIERNO ABSOLUTO:
1) Fundaméntate siempre en datos duros: léxico Strong (hebreo/griego), comentarios bíblicos clásicos (Matthew Henry, Jamieson-Fausset-Brown, Albert Barnes, Spurgeon cuando aplique) y el canon de las Santas Escrituras.
2) Prohibido: resúmenes vacíos de IA, autoayuda, psicología secular, humanismo, coaching motivacional, relativismo, alta crítica destructiva, teología liberal o conclusiones que excluyan la cruz.
3) Aunque menciones conducta, historia o el diseño de la mente como obra del Creador, jamás concluyas en la autosuficiencia humana.
4) Toda respuesta debe ser un tratado exegético denso, académico y fundamentado —no un párrafo corto ni una lista superficial.
5) El propósito ministerial es quebrantar el corazón de piedra y guiar al alma hacia un corazón de carne por la gracia divina: soberanía del Padre, obra consumada de Jesucristo en la cruz, poder regenerador del Espíritu Santo.
6) La Escritura interpreta la Escritura. Cita o alude pasajes canónicos. No sustituyas la autoridad bíblica por opinión contemporánea.
7) Asumes la inerrancia, suficiencia e inspiración plenaria de las Escrituras. No relativices el texto ni lo sometas a reconstrucciones especulativas.

TRAZABILIDAD: en el cuerpo de la respuesta, ancla afirmaciones a comentaristas clásicos, doctrina sistemática y códigos Strong cuando existan. No inventes citas.

CIERRE OBLIGATORIO: cada respuesta desemboca en el Padre, en la cruz de Cristo y en la obra del Espíritu Santo.`

/** System prompt permanente: el Manifiesto de Gobernanza (sin sustitutos). */
export const SYSTEM_PROMPT = MANIFIESTO_TEOLOGICO

/** Temperatura fija: precisión lógica, sin creatividad especulativa. */
export const AI_TEMPERATURE = 0.2

export const FALLBACK_FUERA_DE_MARCO =
  'Como orientador ministerial de RevelatiO, mi propósito es guiarte únicamente a través de la luz de las Escrituras. Mi misión es ayudarte a encontrar respuestas en la Palabra de Dios. Por favor, realiza una consulta centrada en el estudio bíblico o tu caminar espiritual.'

const SENALES_FUERA = [
  /\b(bitcoin|cripto|crypto|nft|forex|binance|trading|acciones\s+en\s+bolsa|bolsa\s+de\s+valores)\b/i,
  /\b(apuesta|apuestas|casino|loter[ií]a|poker|ruleta)\b/i,
  /\b(candidato|elecciones\s+presidenciales|partido\s+pol[ií]tico|campa[nñ]a\s+electoral|ideolog[ií]a\s+de\s+g[eé]nero\s+partidista)\b/i,
  /\b(receta\s+de\s+cocina|playlist|netflix|videojuego|playstation|xbox|iphone\s+barato)\b/i,
  /\b(chiste\s+verde|porno|onlyfans|ligar\s+en\s+tinder)\b/i,
  /\b(hackear|crackear\s+software|genera\s+malware)\b/i,
  /\b(autoayuda|coaching\s+secular|psicolog[ií]a\s+secular|mindfulness\s+sin\s+cristo|ley\s+de\s+atracci[oó]n)\b/i,
]

const SENALES_MARCO = [
  /\b(dios|jehov[aá]|yahv[eé]|jes[uú]s|cristo|se[nñ]or|esp[ií]ritu\s+santo|trinidad)\b/i,
  /\b(biblia|escritura|escrituras|vers[ií]culo|pasaje|salmo|evangelio|ep[ií]stola|tor[aá]|septuaginta)\b/i,
  /\b(iglesia|oraci[oó]n|pecado|gracia|fe|cruz|redenci[oó]n|salvaci[oó]n|arrepentimiento|discipulado|pastor|ministerio|serm[oó]n|ex[eé]gesis|teolog[ií]a|hermen[eé]utica|apolog[eé]tica)\b/i,
  /\b(coraz[oó]n|alma|dolor|luto|angustia|tentaci[oó]n|perdon|perdón|restauraci[oó]n|caminar\s+espiritual|vida\s+cristiana)\b/i,
  /\b(g[eé]nesis|[eé]xodo|lev[ií]tico|n[uú]meros|deuteronomio|josu[eé]|jueces|rut|samuel|reyes|cr[oó]nicas|esdras|nehem[ií]as|ester|job|salmos|proverbios|eclesiast[eé]s|cantares|isa[ií]as|jerem[ií]as|lamentaciones|ezequiel|daniel|oseas|joel|am[oó]s|abd[ií]as|jon[aá]s|miqueas|nah[uú]m|habacuc|sofon[ií]as|hageo|zacar[ií]as|malaqu[ií]as)\b/i,
  /\b(mateo|marcos|lucas|juan|hechos|romanos|corintios|g[aá]latas|efesios|filipenses|colosenses|tesalonicenses|timoteo|tito|filem[oó]n|hebreos|santiago|pedro|judas|apocalipsis)\b/i,
  /\b(strong|lxx|rvr|kjv|nbla|nvi|comentarista|henry|spurgeon|barnes|jamieson)\b/i,
]

/**
 * Validación previa: consultas ajenas a fe / ministerio / Escritura.
 * Política, finanzas especulativas u ocio sin ancla espiritual → fuera de marco.
 */
export function esConsultaFueraDeMarco(texto) {
  const t = String(texto || '').trim()
  if (t.length < 2) return false

  const enMarco = SENALES_MARCO.some((re) => re.test(t))
  const fuera = SENALES_FUERA.some((re) => re.test(t))

  if (fuera && !enMarco) return true

  if (
    !enMarco &&
    /^(dime|escribe|genera|hazme|traduce|cu[eé]ntame|busca)\b/i.test(t) &&
    /\b(chiste|poema\s+de\s+amor\s+secular|ensayo\s+pol[ií]tico|script|c[oó]digo|programa)\b/i.test(t)
  ) {
    return true
  }

  return false
}

export function respuestaSiFueraDeMarco(texto) {
  if (!esConsultaFueraDeMarco(texto)) return null
  return FALLBACK_FUERA_DE_MARCO
}
