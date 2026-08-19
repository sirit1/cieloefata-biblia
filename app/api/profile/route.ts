import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const phonePattern = /^\+[1-9]\d{7,14}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const fullName = String(body?.full_name || '').trim().replace(/\s+/g, ' ')
  const email = String(body?.email || user.email || '').trim().toLowerCase()
  const whatsapp = String(body?.whatsapp || '').replace(/[\s()-]/g, '')
  if (fullName.length < 2 || fullName.length > 120) return NextResponse.json({ error: 'Escribe tu nombre completo.' }, { status: 400 })
  if (!emailPattern.test(email)) return NextResponse.json({ error: 'Escribe un correo válido.' }, { status: 400 })
  if (!phonePattern.test(whatsapp)) return NextResponse.json({ error: 'Usa WhatsApp en formato internacional, por ejemplo +34600111222.' }, { status: 400 })
  const { error: profileError } = await supabase.from('profiles').update({ full_name: fullName, whatsapp, onboarding_completed_at: new Date().toISOString() }).eq('id', user.id)
  if (profileError) return NextResponse.json({ error: 'No se pudo guardar tu perfil.' }, { status: 500 })
  const { error: contactError } = await supabase.from('crm_contacts').upsert({ full_name: fullName, email, whatsapp, source: 'app', consent_whatsapp: Boolean(body?.consent_whatsapp), status: 'active' }, { onConflict: 'email' })
  if (contactError) return NextResponse.json({ error: 'Perfil guardado, pero no se pudo sincronizar el contacto.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 })
  const { data } = await supabase.from('profiles').select('full_name,whatsapp,onboarding_completed_at').eq('id', user.id).maybeSingle()
  return NextResponse.json({ profile: data || null, email: user.email })
}
