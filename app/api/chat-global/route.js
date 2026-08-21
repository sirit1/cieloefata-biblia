import { streamText } from 'ai'
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../../../lib/prompts/revelatio-system-prompt.js'

export const runtime = 'edge'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const { message, context = {}, history = [] } = body || {}
  const cleanMessage = String(message || '').trim().slice(0, 4000)

  if (!cleanMessage) {
    return Response.json({ error: 'Escribe una pregunta para continuar.' }, { status: 400 })
  }

  const fuera = respuestaSiFueraDeMarco(cleanMessage)
  if (fuera) {
    // Respuesta inmediata sin llamar al modelo (gobernanza previa).
    return new Response(FALLBACK_FUERA_DE_MARCO, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Revelatio-Gated': 'fuera_de_marco',
      },
    })
  }

  const contextLine = [context.reference, context.module, context.version]
    .filter(Boolean)
    .join(' · ')
  const transcript = Array.isArray(history)
    ? history
        .slice(-8)
        .map(item => `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`)
        .join('\n')
    : ''
  const seed = String(context.invisiblePromptSeed || context.guardrail || '').trim()
  const auditHint = String(context.auditHint || '').trim()

  try {
    const result = streamText({
      model: 'openai/gpt-5.6-sol',
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${seed ? `Marco exegético: ${seed}\n` : ''}${auditHint ? `Fuentes de trazabilidad (obligatorias de anclar): ${auditHint}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${cleanMessage}`,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 900,
    })

    return result.toTextStreamResponse({
      headers: {
        'X-Revelatio-Governance': 'inerrancia_v1',
      },
    })
  } catch (error) {
    console.error('[v0] Error en chat global (streaming):', error)
    return Response.json(
      { error: 'No pude responder ahora. Inténtalo de nuevo en un momento.' },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
