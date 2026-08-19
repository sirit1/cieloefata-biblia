import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 })
  const { data: admin } = await supabase.from('admin_allowlist').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'No tienes permisos de administración.' }, { status: 403 })
  const body = await request.json().catch(() => null)
  const recipients = Array.isArray(body?.recipients) ? body.recipients.slice(0, 50) : []
  const contentSid = String(body?.contentSid || '').trim()
  if (!contentSid || !recipients.length) return NextResponse.json({ error: 'Content SID y destinatarios son obligatorios.' }, { status: 400 })
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) return NextResponse.json({ error: 'Twilio no está configurado.' }, { status: 503 })
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  let sent = 0; let failed = 0
  for (const recipient of recipients) {
    const to = String(recipient.whatsapp || '').replace(/[\s()-]/g, '')
    if (!/^\+[1-9]\d{7,14}$/.test(to)) { failed++; continue }
    const form = new URLSearchParams({ From: process.env.TWILIO_WHATSAPP_FROM, To: `whatsapp:${to}`, ContentSid: contentSid })
    const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
    if (result.ok) sent++; else failed++
  }
  return NextResponse.json({ sent, failed })
}
