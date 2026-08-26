import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncPublicStatic } from './scripts/sync-public-static.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const pub = join(root, 'public')

function syncSpaAssets() {
  try {
    syncPublicStatic()
    const audioDir = join(pub, 'audio')
    if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true })
    for (const name of ['oracion-instrumental.m4a', 'oracion-instrumental.mp3']) {
      const src = join(root, 'audio', name)
      if (existsSync(src)) copyFileSync(src, join(audioDir, name))
    }
  } catch {
    /* el build sigue; server.js sirve la raíz en local */
  }
}

syncSpaAssets()

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/lectura', destination: '/efata.html' },
      ],
    }
  },
  outputFileTracingIncludes: {
    '/': ['./index.html'],
  },
}

export default nextConfig
