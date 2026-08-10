import { NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'

function isE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

export async function POST(request: Request) {
  try {
    const { to, body, consent } = await request.json()

    if (!consent) {
      return NextResponse.json({ error: 'Se requiere consentimiento para WhatsApp.' }, { status: 400 })
    }
    if (typeof to !== 'string' || !isE164(to)) {
      return NextResponse.json({ error: 'El destinatario debe usar formato internacional, por ejemplo +34600000000.' }, { status: 400 })
    }
    if (typeof body !== 'string' || body.trim().length === 0 || body.length > 4096) {
      return NextResponse.json({ error: 'El mensaje debe tener entre 1 y 4096 caracteres.' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_WHATSAPP_FROM
    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ error: 'Twilio no está configurado en el entorno del servidor.' }, { status: 503 })
    }

    const client = twilio(accountSid, authToken)
    const message = await client.messages.create({
      from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body: body.trim(),
    })

    return NextResponse.json({ ok: true, provider: 'twilio', sid: message.sid, status: message.status })
  } catch (error) {
    console.error('[v0] Twilio WhatsApp send failed', error)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje de WhatsApp.' }, { status: 502 })
  }
}
