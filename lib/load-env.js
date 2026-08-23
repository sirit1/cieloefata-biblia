/**
 * Carga .env.local / .env desde la raíz del proyecto (cieloefata-biblia),
 * independientemente del cwd (vercel dev, next, node server.js).
 *
 * .env.local usa override:true para ganar sobre placeholders vacíos de Vercel.
 */
import { config as dotenvConfig } from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let loaded = false

export function loadProjectEnv() {
  if (loaded) return ROOT

  const envLocal = join(ROOT, '.env.local')
  const envDefault = join(ROOT, '.env')

  // Primero .env (base), luego .env.local gana (incl. sobre vars vacías de Vercel).
  if (existsSync(envDefault)) {
    dotenvConfig({ path: envDefault, override: false, quiet: true })
  }
  if (existsSync(envLocal)) {
    dotenvConfig({ path: envLocal, override: true, quiet: true })
  }

  // Fallback relativo al cwd (por si se ejecuta fuera de la carpeta del proyecto).
  dotenvConfig({ path: '.env', override: false, quiet: true })
  dotenvConfig({ path: '.env.local', override: true, quiet: true })

  loaded = true
  return ROOT
}

/** Gemini acepta cualquiera de estos nombres de variable. */
export function resolveGeminiApiKey() {
  loadProjectEnv()
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ''
  return String(apiKey || '').trim()
}

export { ROOT }
