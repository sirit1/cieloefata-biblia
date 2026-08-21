/**
 * Éfata RevelatiO — AI Synthesis (App Router).
 * Blindaje teológico: Manifiesto + temperature 0.2 + fallback fuera de marco.
 */
import { generateText } from 'ai'
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../../../lib/prompts/revelatio-system-prompt.js'

export const runtime = 'edge'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const cleanMessage = String(
    body.message || body.consulta || body.prompt || body.texto || '',
  )
    .trim()
    .slice(0, 4000)

  if (!cleanMessage) {
    return Response.json({ error: 'Escribe una pregunta para continuar.' }, { status: 400 })
  }

  const fuera = respuestaSiFueraDeMarco(cleanMessage)
  if (fuera) {
    return Response.json({
      text: FALLBACK_FUERA_DE_MARCO,
      gated: true,
      reason: 'fuera_de_marco',
    })
  }

  const context = body.context && typeof body.context === 'object' ? body.context : {}
  const history = Array.isArray(body.history) ? body.history : []
  const contextLine = [context.reference, context.module, context.version]
    .filter(Boolean)
    .join(' · ')
  const transcript = history
    .slice(-8)
    .map(
      (item) =>
        `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`,
    )
    .join('\n')

  try {
    const result = await generateText({
      model: 'openai/gpt-5.6-sol',
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${
        transcript ? `Conversación previa:\n${transcript}\n` : ''
      }Usuario: ${cleanMessage}`,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 900,
    })

    return Response.json({
      text: result.text,
      gated: false,
      temperature: AI_TEMPERATURE,
    })
  } catch (error) {
    console.error('[revelatio] ai-synthesis', error)
    return Response.json(
      { error: 'No pude responder ahora. Inténtalo de nuevo en un momento.' },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
