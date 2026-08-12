import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

export const runtime = 'nodejs'

function isE164(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  }
}

export async function POST(request: Request) {
  try {
    const { url, anonKey, serviceKey } = getSupabaseConfig()
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!url || !anonKey || !serviceKey || !token) {
      return NextResponse.json({ error: 'Se requiere una sesión de administrador.' }, { status: 401 })
    }

    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: authData, error: authError } = await auth.auth.getUser(token)
    if (authError || !authData.user?.email) {
      return NextResponse.json({ error: 'Sesión inválida o vencida.' }, { status: 401 })
    }

    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: admin } = await service.from('admin_allowlist').select('email').eq('email', authData.user.email).maybeSingle()
    if (!admin) {
      return NextResponse.json({ error: 'Tu cuenta no tiene permisos para enviar WhatsApp.' }, { status: 403 })
    }

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

    return NextResponse.json({ ok: true, provider: 'twilio', status: message.status })
  } catch (error) {
    console.error('[revelatio] Twilio WhatsApp send failed', error)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje de WhatsApp.' }, { status: 502 })
  }
}
