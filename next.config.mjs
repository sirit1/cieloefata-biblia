import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const pub = join(root, 'public')

function syncSpaAssets() {
  try {
    if (!existsSync(pub)) mkdirSync(pub, { recursive: true })
    const files = [
      ['index.html', 'efata.html'],
      ['revelatio-modulos.js', 'revelatio-modulos.js'],
      ['script-principal.js', 'script-principal.js'],
    ]
    for (const [from, to] of files) {
      const src = join(root, from)
      if (existsSync(src)) copyFileSync(src, join(pub, to))
    }
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
