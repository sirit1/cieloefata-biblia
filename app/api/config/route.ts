import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'La autenticación todavía no está configurada.' },
      { status: 503 },
    )
  }

  return NextResponse.json(
    { supabaseUrl, supabaseAnonKey },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
