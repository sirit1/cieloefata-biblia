import { generateText } from 'ai'
import {
  SYSTEM_PROMPT,
  AI_TEMPERATURE,
  FALLBACK_FUERA_DE_MARCO,
  respuestaSiFueraDeMarco,
} from '../lib/prompts/revelatio-system-prompt.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  try {
    const { message, context = {}, history = [] } = req.body || {}
    const cleanMessage = String(message || '').trim().slice(0, 4000)
    if (!cleanMessage) return res.status(400).json({ error: 'Escribe una pregunta para continuar.' })

    const fuera = respuestaSiFueraDeMarco(cleanMessage)
    if (fuera) {
      return res.status(200).json({
        text: FALLBACK_FUERA_DE_MARCO,
        gated: true,
        reason: 'fuera_de_marco',
      })
    }

    const contextLine = [context.reference, context.module, context.version]
      .filter(Boolean)
      .join(' · ')
    const transcript = Array.isArray(history)
      ? history.slice(-8).map(item => `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`).join('\n')
      : ''
    const seed = String(context.invisiblePromptSeed || context.guardrail || '').trim()
    const auditHint = String(context.auditHint || '').trim()

    const result = await generateText({
      model: 'openai/gpt-5.6-sol',
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${seed ? `Marco exegético: ${seed}\n` : ''}${auditHint ? `Fuentes de trazabilidad (obligatorias de anclar): ${auditHint}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${cleanMessage}`,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 900,
    })

    return res.status(200).json({
      text: result.text,
      gated: false,
      temperature: AI_TEMPERATURE,
      governance: 'inerrancia_v1',
      audit: context.audit || null,
    })
  } catch (error) {
    console.error('[v0] Error en chat global:', error)
    return res.status(500).json({ error: 'No pude responder ahora. Inténtalo de nuevo en un momento.' })
  }
}
