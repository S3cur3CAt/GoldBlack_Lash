// Sube las imágenes y vídeos de public/ a Supabase (tabla images y bucket studio-media de Storage).
// Uso: node scripts/upload-images.mjs
// Lee DATABASE_URL, SUPABASE_URL y SUPABASE_ANON_KEY del archivo .env.
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Mini-parser .env (sin dependencias externas)
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

const url =
  process.env.DATABASE_URL ||
  env.DATABASE_URL ||
  'postgresql://postgres.uiohtupgtqxbzmfqkqea:7AqofDWnZplmMkFq@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require'

const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL || 'https://uiohtupgtqxbzmfqkqea.supabase.co'
const anonKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || 'sb_publishable_EmVnt_9VUQnB2wrBt5U1LA_khOLHLCh'

const files = [
  { key: 'pieza-01', filename: 'pieza-01.jpg', path: join(root, 'public', 'galeria', 'pieza-01.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-02', filename: 'pieza-02.jpg', path: join(root, 'public', 'galeria', 'pieza-02.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-03', filename: 'pieza-03.jpg', path: join(root, 'public', 'galeria', 'pieza-03.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-04', filename: 'pieza-04.jpg', path: join(root, 'public', 'galeria', 'pieza-04.jpg'), mime: 'image/jpeg' },
  { key: 'pieza-05', filename: 'pieza-05.jpg', path: join(root, 'public', 'galeria', 'pieza-05.jpg'), mime: 'image/jpeg' },
  { key: 'limpieza-facial', filename: 'limpieza-facial.avif', path: join(root, 'public', 'galeria', 'limpieza-facial.avif'), mime: 'image/avif' },
  { key: 'logo', filename: 'goldblack_logo.png', path: join(root, 'public', 'goldblack_logo.png'), mime: 'image/png' },
  { key: 'promo-qr', filename: 'promo-qr.png', path: join(root, 'public', 'promo-qr.png'), mime: 'image/png' },
  { key: 'hero-video', filename: 'hero-video.mp4', path: join(root, 'public', 'hero-video.mp4'), mime: 'video/mp4' },
  { key: 'hero-video-2', filename: 'hero-video-2.mp4', path: join(root, 'public', 'hero-video-2.mp4'), mime: 'video/mp4' },
  { key: 'hero-video-3', filename: 'hero-video-3.mp4', path: join(root, 'public', 'hero-video-3.mp4'), mime: 'video/mp4' },
]

console.log('=== SUBIDA DE IMÁGENES Y VÍDEOS A SUPABASE ===\n')

const sql = postgres(url, { ssl: 'require', prepare: false, max: 2, connect_timeout: 15 })

// 1. Asegurar tabla en Supabase Postgres
await sql`
  CREATE TABLE IF NOT EXISTS images (
    key TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    data BYTEA NOT NULL,
    size INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

let okDb = 0
let okStorage = 0

for (const f of files) {
  if (!existsSync(f.path)) {
    console.log(`OMITIDA (no existe): ${f.key} <- ${f.path}`)
    continue
  }
  const data = readFileSync(f.path)

  // Subir a Supabase PostgreSQL tabla images
  try {
    await sql`
      INSERT INTO images (key, mime, data, size, updated_at)
      VALUES (${f.key}, ${f.mime}, ${data}, ${data.length}, now())
      ON CONFLICT (key) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, size = EXCLUDED.size, updated_at = now()
    `
    okDb++
  } catch (err) {
    console.error(`Error guardando en Supabase DB (${f.key}):`, err.message)
  }

  // Subir a Supabase Storage bucket studio-media
  try {
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/studio-media/${f.filename}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': f.mime,
        'x-upsert': 'true',
      },
      body: data,
    })

    // También subir bajo la clave sin extensión por compatibilidad
    if (f.key !== f.filename) {
      await fetch(`${supabaseUrl}/storage/v1/object/studio-media/${f.key}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': f.mime,
          'x-upsert': 'true',
        },
        body: data,
      }).catch(() => {})
    }

    if (uploadRes.ok) {
      okStorage++
      console.log(`✓ OK [DB + Storage] ${f.key} (${(data.length / 1024 / 1024).toFixed(2)} MB)`)
    } else {
      const errText = await uploadRes.text()
      console.warn(`! DB OK, pero aviso en Storage para ${f.key}:`, errText)
    }
  } catch (err) {
    console.warn(`! DB OK, error de red en Storage para ${f.key}:`, err.message)
  }
}

const rows = await sql`SELECT key, mime, size FROM images ORDER BY key`
console.log(`\nTotal en Supabase Postgres (tabla images): ${rows.length} archivos`)
for (const r of rows) {
  console.log(` - ${r.key}: ${r.mime}, ${(r.size / 1024).toFixed(1)} KB`)
}

await sql.end()
console.log(`\nResumen: ${okDb} guardados en BD, ${okStorage} subidos a Supabase Storage bucket 'studio-media'.`)
