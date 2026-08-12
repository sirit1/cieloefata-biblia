import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const tables = {
  versions: 'bible_versions',
  verses: 'bible_verses',
  commentaries: 'verse_commentaries',
  crossReferences: 'verse_cross_references',
  strong: 'strong_dictionary',
} as const

export async function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return NextResponse.json({ tools: {} }, { status: 503 })

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const entries = await Promise.all(Object.entries(tables).map(async ([name, table]) => {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    return [name, { available: !error && (count ?? 0) > 0, count: error ? null : count ?? 0 }] as const
  }))

  return NextResponse.json({ tools: Object.fromEntries(entries) }, { headers: { 'Cache-Control': 'public, max-age=60' } })
}
