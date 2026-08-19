import { streamText } from 'ai'

export const runtime = 'edge'

const SYSTEM_PROMPT = `Eres REVELATIO IA, el motor de inteligencia exegética, histórica y de renovación del entendimiento (Metanoia) de REVELATIO BY EFATA.
Tu propósito es unir la verdad inmutable de las Sagradas Escrituras con los principios de renovación mental de Romanos 12:2.
Estructura obligatoria en 4 niveles con Markdown:
### 1. La Palabra & Léxico Original
### 2. Raíz Histórico-Exegética
### 3. Metanoia & Renovación Cognitiva
### 4. Oración Dialógica & Paso Práctico
Directo al grano, sin saludos ni introducciones triviales.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  try {
    const { message, context = {}, history = [] } = req.body || {}
    const cleanMessage = String(message || '').trim().slice(0, 5000)
    if (!cleanMessage) return res.status(400).json({ error: 'Escribe una pregunta para continuar.' })

    const contextLine = [context.reference, context.module, context.version, context.text]
      .filter(Boolean)
      .map(value => String(value).slice(0, 1800))
      .join(' · ')
    const transcript = Array.isArray(history)
      ? history.slice(-8).map(item => `${item.role === 'user' ? 'Usuario' : 'RevelatiO IA'}: ${String(item.content || '').slice(0, 1800)}`).join('\n')
      : ''

    const result = streamText({
      model: 'google/gemini-3.5-flash',
      system: SYSTEM_PROMPT,
      prompt: `${contextLine ? `Contexto activo: ${contextLine}\n` : ''}${transcript ? `Conversación previa:\n${transcript}\n` : ''}Usuario: ${cleanMessage}`,
      temperature: 0.35,
      maxOutputTokens: 1200,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[v0] Error en RevelatiO IA:', error)
    return res.status(500).json({ error: 'No pude responder ahora. Inténtalo de nuevo en un momento.' })
  }
}
