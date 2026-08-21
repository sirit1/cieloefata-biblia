import { streamText } from 'ai'
import { SYSTEM_PROMPT, AI_TEMPERATURE } from '../../../lib/prompts/revelatio-system-prompt.js'

export const runtime = 'edge'

export async function POST(request) {
  const body = await request.json().catch(() => ({}))
  const pasaje = String(body.pasaje || body.referencia || '').trim().slice(0, 180)
  const tipo = body.tipo === 'estudio' ? 'estudio bíblico para líderes' : 'sermón expositivo'
  const audiencia = String(body.audiencia || 'pastores y líderes de iglesia').trim().slice(0, 120)
  const consulta = String(body.consulta || '').trim().slice(0, 2500)

  if (pasaje.length < 3 && consulta.length < 8) {
    return Response.json({ error: 'Indica un pasaje bíblico o una consulta anclada en las Escrituras.' }, { status: 400 })
  }

  const prompt = `Genera un ${tipo} para ${audiencia}.
Pasaje rector: ${pasaje || 'el que mejor exponga el tema, citando sólo textos reales'}.
Consulta del siervo: ${consulta || 'Expón el pasaje con fidelidad al texto.'}

Reglas:
- Cristocéntrico. La Escritura es suficiente. No sustituyas el texto por anécdotas o psicología.
- Si hay dolor humano, contrástalo: los analgésicos humanos no redimen; Dios en Cristo sí.
- Estructura: título, texto, idea central, bosquejo (3-5 puntos con versículos), aplicación pastoral, llamado al arrepentimiento y la fe, oración.
- No inventes citas.`

  try {
    const result = streamText({
      model: 'openai/gpt-4.1-mini',
      system: SYSTEM_PROMPT,
      prompt,
      temperature: AI_TEMPERATURE,
      maxOutputTokens: 1400,
    })
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[revelatio] sermon', error)
    return Response.json({ error: 'No se pudo generar el bosquejo. Inténtalo de nuevo.' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
