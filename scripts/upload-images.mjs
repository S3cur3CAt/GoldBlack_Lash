// Sube las imagenes de public/ a Neon Postgres (tabla images).
// Uso:  node scripts/upload-images.mjs
// Lee DATABASE_URL del archivo .env (no commitear credenciales).
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Mini-parser .env (sin dependencias)
const env = {}
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m || line.trim().startsWith('#')) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[m[1]] = v
  }
}
const url = process.env.DATABASE_URL || env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL (entorno o .env)')
  process.exit(1)
}

const files = [
  { key: 'pieza-01', path: join(root, 'public', 'galeria', 'pieza-01.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-02', path: join(root, 'public', 'galeria', 'pieza-02.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-03', path: join(root, 'public', 'galeria', 'pieza-03.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-04', path: join(root, 'public', 'galeria', 'pieza-04.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-05', path: join(root, 'public', 'galeria', 'pieza-05.jpg'), mime: 'image/jpeg' },
  { key: 'limpieza-facial', path: join(root, 'public', 'galeria', 'limpieza-facial.avif'), mime: 'image/avif' },
  { key: 'logo', path: join(root, 'public', 'goldblack_logo.png'), mime: 'image/png' },
  { key: 'promo-qr', path: join(root, 'public', 'promo-qr.png'), mime: 'image/png' },
  { key: 'hero-video', path: join(root, 'public', 'hero-video.mp4'), mime: 'video/mp4' },
  { key: 'hero-video-2', path: join(root, 'public', 'hero-video-2.mp4'), mime: 'video/mp4' },
  { key: 'hero-video-3', path: join(root, 'public', 'hero-video-3.mp4'), mime: 'video/mp4' },
]

const sql = postgres(url, { ssl: 'require', prepare: false, max: 1, connect_timeout: 15 })

await sql`
  CREATE TABLE IF NOT EXISTS images (
    key TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    size INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

let ok = 0
for (const f of files) {
  if (!existsSync(f.path)) {
    console.log(`OMITIDA (no existe): ${f.key} <- ${f.path}`)
    continue
  }
  const data = readFileSync(f.path)
  await sql`
    INSERT INTO images (key, mime, data, size, updated_at)
    VALUES (${f.key}, ${f.mime}, ${data}, ${data.length}, now())
    ON CONFLICT (key) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, size = EXCLUDED.size, updated_at = now()
  `
  console.log(`OK ${f.key} (${data.length} bytes)`)
  ok++
}

const rows = await sql`SELECT key, mime, size FROM images ORDER BY key`
console.log(`\nTotal en Neon: ${rows.length} imagenes`)
for (const r of rows) console.log(` - ${r.key}: ${r.mime}, ${r.size} bytes`)

await sql.end()
console.log(`\nSubidas/actualizadas: ${ok}`)
