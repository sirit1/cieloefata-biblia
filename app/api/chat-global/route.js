import { generateText } from 'ai'
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../../../lib/prompts/revelatio-system-prompt.js'
import {
  CHAT_MODEL,
  extractUserText,
  optionsResponse,
  chatError,
  chatOk,
  chatJson,
} from '../../../lib/chat-contract.js'

export const runtime = 'edge'

export async function OPTIONS() {
  return optionsResponse()
}

export async function GET() {
  return chatJson({
    success: true,
    ok: true,
    ready: true,
    answer: 'Endpoint activo. Usa POST con { message } o { prompt }.',
  })
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const cleanMessage = extractUserText(body).slice(0, 4000)
  const context = body?.context && typeof body.context === 'object' ? body.context : {}
  const history = Array.isArray(body?.history) ? body.history : []

  if (!cleanMessage) {
    return chatError('Escribe una pregunta para continuar.', 400)
  }

  const fuera = respuestaSiFueraDeMarco(cleanMessage)
  if (fuera) {
    return chatOk(FALLBACK_FUERA_DE_MARCO, { gated: true, reason: 'fuera_de_marco' })
  }

  const contextLine = [context.reference, context.module, context.version]
    .filter(Boolean)
    .join(' · ')
  const transcript = history
    .slice(-8)
    .map((item) => `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`)
    .join('\n')
  const seed = String(context.invisiblePromptSeed || context.guardrail || '').trim()
  const auditHint = String(context.auditHint || '').trim()

  try {
    const result = await generateText({
      model: CHAT_MODEL,
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${seed ? `Marco exegético: ${seed}\n` : ''}${auditHint ? `Fuentes de trazabilidad (obligatorias de anclar): ${auditHint}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${cleanMessage}`,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 900,
    })
    const text = String(result.text || '').trim()
    if (!text) {
      return chatError('El modelo no devolvió texto.', 502)
    }
    return chatOk(text, {
      gated: false,
      temperature: AI_TEMPERATURE,
      governance: 'inerrancia_v1',
      audit: context.audit || null,
    })
  } catch (error) {
    console.error('[v0] Error en chat global:', error)
    return chatError('No pude responder ahora. Inténtalo de nuevo en un momento.', 500)
  }
}
