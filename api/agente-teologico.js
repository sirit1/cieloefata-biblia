/**
 * Éfata RevelatiO — /api/agente-teologico
 * Triple entrada: Cátedra (`exegesis`) | Renovación & Vida (`vida`) | Célula / Apoyo Ministerial (`celula`).
 * La API Key NUNCA sale al frontend: solo process.env en servidor.
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local', override: true, quiet: true })
dotenv.config({ path: '.env', quiet: true })

import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadProjectEnv, resolveGeminiApiKey } from '../lib/load-env.js'
import { answerUserQuestion } from '../lib/answer-user-question.js'
import {
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../lib/prompts/revelatio-system-prompt.js'

loadProjectEnv()

export const SYSTEM_EXEGESIS = `Eres la Cátedra Exegética de Éfata RevelatiO. Tu marco es la inerrancia bíblica y el método histórico-gramatical estricto. Queda prohibida la teología liberal, la alta crítica destructiva y la autoayuda secular. Responde siempre en Markdown limpio (###, listas, **negrita**), sin envolver toda la respuesta en un bloque de código.

Estructura de respuesta obligatoria:
### I. Marco Histórico, Literario y Teología del Pacto
### II. Análisis Léxico-Sintáctico (Términos en Griego/Hebreo con Strong)
### III. Nexo Canónico y Revelación Progresiva
### IV. Articulación Doctrinal y Teología Sistemática
### V. Síntesis Exegética y Aplicación Ministerial`

export const SYSTEM_VIDA = `Eres el Motor de Sabiduría y Transformación de Éfata RevelatiO. Integras la verdad bíblica inerrante con la ciencia del diseño humano (neurociencia, antropología cognitiva, neuroplasticidad y regulación emocional).

REGLA DE ORO DE GOBERNANZA: La ciencia es únicamente el diagnóstico del diseño humano y el mapa descriptivo biológico; la ciencia y la autoayuda secular son INSUFICIENTES y actúan como parches temporales. La única solución y sanidad de raíz es la Palabra de Dios y la obra redentora de Cristo.

Responde siempre en Markdown limpio (###, listas, **negrita**), sin envolver toda la respuesta en un bloque de código.

Estructura de respuesta obligatoria:
### I. El Diagnóstico del Diseño Humano (Mecanismo Neurocognitivo)
- Explica qué ocurre en la mente y el cuerpo (amígdala, cortisol, rumiación, sesgos de supervivencia o hábitos).
- Incluye explícitamente el llamado de trascendencia: Establece con claridad por qué la neurociencia y la psicología secular se quedan cortas y son insuficientes por sí solas sin una renovación espiritual.

### II. La Verdad Revelada de Fondo (La Raíz Bíblica Inmutable)
- Principio o pasaje bíblico exégetico que aborda la raíz espiritual del conflicto (Providencia, Gracia, Amor Sacrificial, Dominio Propio).
- Términos bíblicos clave en su idioma original cuando aporte luz al corazón del problema.

### III. Inteligencia Emocional y Neuroplasticidad Bíblica
- Cómo la 'metanoia' (renovación de la mente) reconfigura físicamente los patrones neuronales de respuesta frente al conflicto o el temor.

### IV. Protocolo Vital RevelatiO (Plan de Acción de Hoy)
- 1 ejercicio guiado de reencuadre cognitivo-espiritual (5 minutos).
- 2 a 3 acciones operativas, concretas e inmediatas para el trabajo, el hogar o la toma de decisiones.`

export const SYSTEM_CELULA = `Eres el Asesor Ministerial y Facilitador de Grupos Pequeños de Éfata RevelatiO.
Tu propósito es dotar a líderes de célula, pastores y maestros de una guía pedagógica, cristocéntrica y doctrinalmente inerrante para enseñar con claridad y fomentar la participación del grupo.

ESTRUCTURA DE RESPUESTA OBLIGATORIA EN MARKDOWN:

### I. Propósito Central y Tesis del Pasaje (En 2 Minutos para el Líder)
- Idea teológica principal explicada de forma clara y accesible.
- Contexto inmediato y cómo este pasaje apunta a Cristo y la gracia.

### II. Gancho de Apertura y Rompehielos (5 Minutos)
- 1 pregunta o dinámica verbal introductoria para romper el hielo y conectar con la experiencia del grupo antes de abrir la Biblia.

### III. Desglose del Pasaje y Términos Clave (Sin Jerga Compleja)
- Explicación versículo a versículo en lenguaje llano.
- Términos originales explicados con analogías prácticas (ej. significado de 'rudimentos' o 'justificación' para la vida diaria).

### IV. Preguntas de Interacción Grupal (Para Abrir Debate)
- **Pregunta de Observación:** ¿Qué dice textualmente el pasaje?
- **Pregunta de Reflexión:** ¿Qué revela esto sobre el corazón humano o nuestras falsas seguridades?
- **Pregunta de Aplicación Práctica:** ¿Cómo impacta esta verdad en nuestras decisiones de esta semana?

### V. Alerta Doctrinal para el Líder (Qué Evitar)
- Malentendidos comunes, errores de interpretación populares y cómo redirigir la conversación con gracia si surge una desviación en el grupo.

### VI. Guía de Oración Dirigida
- Puntos específicos para concluir la reunión enfocados en la aplicación del estudio.

Responde siempre en Markdown limpio (###, listas, **negrita**), sin envolver toda la respuesta en un bloque de código.`

/** @deprecated alias de compatibilidad */
export const SYSTEM_AGENTE_TEOLOGICO = SYSTEM_VIDA

const MODEL_CANDIDATES = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
]
const MODEL_ID = MODEL_CANDIDATES[0]
const GOVERNANCE = 'revelatio_triple_v1'
const MAX_USER = 4000
const MAX_HISTORY = 8

const RE_CELULA =
  /\b(c[eé]lula|grupo\s+en\s+casa|grupo\s+peque[nñ]o|discipulado|bosquejo|reuni[oó]n|clase|ense[nñ]anza|rompehielos|peque[nñ]o\s+grupo|liderazgo\s+(de\s+)?grupo|facilitador|estudio\s+grupal|gu[ií]a\s+(de\s+)?l[ií]der)\b/i

const RE_EXEGESIS =
  /\b(ex[eé]gesis|hebreo|griego|morfolog[ií]a|sintaxis|filolog[ií]a|strong|l[eé]xico|hermen[eé]utica|hist[oó]rico[- ]gramatical|c[aá]tedra)\b/i

const RE_VIDA =
  /\b(miedo|ansiedad|estr[eé]s|trabajo|empleo|matrimonio|pareja|h[aá]bitos?|conflicto|familia|emocion|depresi[oó]n|ira|celos|duelo|finanzas|soledad|crisis|renovaci[oó]n\s+(de\s+la\s+)?mente|metanoia)\b/i

function getClient() {
  const apiKey =
    resolveGeminiApiKey() ||
    String(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '').trim()
  if (!apiKey) {
    const err = new Error(
      'Falta GOOGLE_GENERATIVE_AI_API_KEY o GEMINI_API_KEY en el entorno del servidor.',
    )
    err.code = 'MISSING_API_KEY'
    throw err
  }
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Enrutamiento por parámetro explícito o heurística de intención sobre `prompt`.
 * Prioridad: mode explícito → célula → exégesis → vida (default personal/cotidiano).
 */
export function resolveMode(raw, prompt = '') {
  const m = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (m === 'exegesis' || m === 'exegetico' || m === 'catedra') return 'exegesis'
  if (m === 'celula' || m === 'cell' || m === 'ministerial' || m === 'grupo') return 'celula'
  if (m === 'vida' || m === 'renovacion' || m === 'pastoral') return 'vida'

  // Sin mode explícito: detectar intención en el prompt
  const p = String(prompt || '')
  if (RE_CELULA.test(p)) return 'celula'
  if (RE_EXEGESIS.test(p)) return 'exegesis'
  if (RE_VIDA.test(p)) return 'vida'
  return 'vida'
}

function systemForMode(mode) {
  if (mode === 'exegesis') return SYSTEM_EXEGESIS
  if (mode === 'celula') return SYSTEM_CELULA
  return SYSTEM_VIDA
}

function sanitizeMarkdown(raw, mode = 'vida') {
  let text = String(raw || '').trim()
  if (!text) return ''
  const fenced = text.match(/^```(?:markdown|md|text)?\s*\n([\s\S]*?)\n```$/i)
  if (fenced) text = fenced[1].trim()
  text = text.replace(/\r\n/g, '\n')

  if (mode === 'exegesis') {
    text = text.replace(/^#{1,2}\s*(I\.\s*Marco Histórico[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(II\.\s*Análisis Léxico[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(III\.\s*Nexo Canónico[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(IV\.\s*Articulación Doctrinal[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(V\.\s*Síntesis Exegética[^\n]*)/gim, '### $1')
  } else if (mode === 'celula') {
    text = text.replace(/^#{1,2}\s*(I\.\s*Propósito Central[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(II\.\s*Gancho de Apertura[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(III\.\s*Desglose del Pasaje[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(IV\.\s*Preguntas de Interacción[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(V\.\s*Alerta Doctrinal[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(VI\.\s*Guía de Oración[^\n]*)/gim, '### $1')
  } else {
    text = text.replace(/^#{1,2}\s*(I\.\s*El Diagnóstico[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(II\.\s*La Verdad Revelada[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(III\.\s*Inteligencia Emocional[^\n]*)/gim, '### $1')
    text = text.replace(/^#{1,2}\s*(IV\.\s*Protocolo Vital[^\n]*)/gim, '### $1')
  }

  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function normalizeBody(body = {}) {
  const prompt = String(body.prompt || body.message || '').trim().slice(0, MAX_USER)
  const contextPassage = String(
    body.contextPassage || body.context?.reference || body.reference || '',
  ).trim()
  const explicit = body.mode ?? body.context?.mode
  const mode = resolveMode(explicit, prompt)
  const context =
    body.context && typeof body.context === 'object'
      ? { ...body.context, reference: contextPassage || body.context.reference || '', mode }
      : { reference: contextPassage, mode }
  const history = Array.isArray(body.history) ? body.history : []
  return { prompt, contextPassage, context, history, mode }
}

/** Acepta body vacío, string JSON o undefined sin tumbar el handler. */
function coerceBody(raw) {
  if (raw == null || raw === '') return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object') return raw
  return {}
}

function sendJson(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return res.status(status).json(payload)
}

function formatHintForMode(mode) {
  if (mode === 'exegesis') return 'Formato: Markdown limpio con los 5 pilares exegéticos (### I–V).'
  if (mode === 'celula') {
    return 'Formato: Markdown limpio con la guía de célula (### I–VI: tesis, rompehielos, desglose, preguntas, alerta doctrinal, oración).'
  }
  return 'Formato: Markdown limpio con los 4 pilares de Renovación & Vida (### I–IV).'
}

function buildUserPrompt({ prompt, contextPassage, context = {}, history = [], mode }) {
  const seed = String(context.invisiblePromptSeed || context.guardrail || '').trim()
  const auditHint = String(context.auditHint || '').trim()
  const meta = [contextPassage || context.reference, context.module, context.version, context.commentator]
    .filter(Boolean)
    .join(' · ')
  const transcript = Array.isArray(history)
    ? history
        .slice(-MAX_HISTORY)
        .map((item) => {
          const role = item.role === 'user' ? 'Usuario' : 'RevelatiO IA'
          return `${role}: ${String(item.content || '').slice(0, 1800)}`
        })
        .join('\n')
    : ''

  return [
    `mode: ${mode}`,
    meta ? `Pasaje / contexto activo: ${meta}` : '',
    contextPassage ? `contextPassage: ${contextPassage}` : '',
    seed ? `Marco de gobernanza: ${seed}` : '',
    auditHint ? `Fuentes de trazabilidad: ${auditHint}` : '',
    transcript ? `Conversación previa:\n${transcript}` : '',
    formatHintForMode(mode),
    `prompt:\n${prompt}`,
  ]
    .filter(Boolean)
    .join('\n\n')
}

function okPayload(data, extra = {}) {
  return {
    ok: true,
    data,
    text: data,
    format: 'markdown',
    model: MODEL_ID,
    governance: GOVERNANCE,
    ...extra,
  }
}

function errPayload(message, extra = {}) {
  return { ok: false, error: message, ...extra }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return sendJson(res, 200, {
      ok: true,
      success: true,
      ready: true,
      methods: ['POST'],
      answer: 'RevelatiO IA está activo. Envía POST con { prompt, contextPassage, mode }.',
    })
  }

  try {
    const { prompt, contextPassage, context, history, mode } = normalizeBody(coerceBody(req.body))
    if (!prompt) {
      return sendJson(
        res,
        200,
        okPayload('Escribe una pregunta o un pasaje para que RevelatiO IA responda.', {
          gated: false,
          mode,
          success: true,
        }),
      )
    }

    const fuera = respuestaSiFueraDeMarco(prompt)
    if (fuera) {
      return sendJson(
        res,
        200,
        okPayload(FALLBACK_FUERA_DE_MARCO, {
          gated: true,
          reason: 'fuera_de_marco',
          mode,
          audit: context.audit || null,
        }),
      )
    }

    const userPrompt = buildUserPrompt({ prompt, contextPassage, context, history, mode })
    const systemInstruction = systemForMode(mode)
    let data = ''
    let usedModel = MODEL_ID

    try {
      const genAI = getClient()
      for (const modelId of MODEL_CANDIDATES) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelId,
            systemInstruction,
            generationConfig: { temperature: 0.25, maxOutputTokens: 4096 },
          })
          const result = await model.generateContent(userPrompt)
          data = sanitizeMarkdown(result?.response?.text?.() || '', mode)
          if (data) {
            usedModel = modelId
            break
          }
        } catch (modelErr) {
          console.warn(`[agente-teologico] ${modelId}:`, modelErr?.message || modelErr)
        }
      }
    } catch (geminiSetupErr) {
      console.warn('[agente-teologico] Gemini no disponible:', geminiSetupErr?.message || geminiSetupErr)
    }

    if (!data) {
      const fallback = await answerUserQuestion({
        message: prompt,
        prompt,
        contextPassage,
        context,
        history,
      })
      data = sanitizeMarkdown(fallback.json?.answer || fallback.json?.text || '', mode) ||
        fallback.json?.answer ||
        fallback.json?.text ||
        ''
      usedModel = fallback.json?.source || 'engine'
    }

    return sendJson(
      res,
      200,
      okPayload(data, {
        gated: false,
        mode,
        model: usedModel,
        audit: context.audit || null,
        success: true,
        answer: data,
      }),
    )
  } catch (error) {
    console.error('[revelatio] agente-teologico:', error?.message || error)
    return sendJson(
      res,
      500,
      {
        success: false,
        error: error?.message || 'Error en el servidor',
      },
    )
  }
}
