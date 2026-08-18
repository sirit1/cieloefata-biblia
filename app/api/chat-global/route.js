import { streamText } from 'ai'
import { SYSTEM_PROMPT } from '../../../lib/prompts/revelatio-system-prompt.js'

export const runtime = 'edge'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const { message, context = {}, history = [] } = body || {}
  const cleanMessage = String(message || '').trim().slice(0, 4000)

  if (!cleanMessage) {
    return Response.json({ error: 'Escribe una pregunta para continuar.' }, { status: 400 })
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

  try {
    const result = streamText({
      model: 'openai/gpt-5.6-sol',
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${cleanMessage}`,
      maxOutputTokens: 900,
    })

    return result.toTextStreamResponse()
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
