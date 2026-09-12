import fs from 'node:fs/promises'
import path from 'node:path'

// Acceso compartido a las imagenes guardadas en disco local y Supabase Postgres.
// Cache en memoria LRU/Map para respuesta instantanea (0ms) y alta concurrencia.
export type StoredImage = {
  mime: string
  data: Buffer
}

const KEY_RE = /^[A-Za-z0-9-_]{1,64}$/

export function isValidImageKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_RE.test(key)
}

// Cache en memoria en RAM para servir imagenes en 0ms y no saturar la BD
const memoryCache = new Map<string, StoredImage>()

// Mapeo conocido de claves a archivos estaticos en /public
const LOCAL_FILES: Record<string, { file: string; mime: string }> = {
  logo: { file: 'goldblack_logo.png', mime: 'image/png' },
  'hero-video': { file: 'hero-video.mp4', mime: 'video/mp4' },
  'hero-video-2': { file: 'hero-video-2.mp4', mime: 'video/mp4' },
  'hero-video-3': { file: 'hero-video-3.mp4', mime: 'video/mp4' },
  'limpieza-facial': { file: 'galeria/limpieza-facial.avif', mime: 'image/avif' },
  'pieza-01': { file: 'galeria/pieza-01.jpg', mime: 'image/jpeg' },
  'pieza-02': { file: 'galeria/pieza-02.jpg', mime: 'image/jpeg' },
  'pieza-03': { file: 'galeria/pieza-03.jpg', mime: 'image/jpeg' },
  'pieza-04': { file: 'galeria/pieza-04.jpg', mime: 'image/jpeg' },
  'pieza-05': { file: 'galeria/pieza-05.jpg', mime: 'image/jpeg' },
}

async function tryReadLocalFile(key: string): Promise<StoredImage | null> {
  const known = LOCAL_FILES[key]
  const possiblePaths: Array<{ path: string; mime: string }> = []

  if (known) {
    possiblePaths.push(
      { path: path.resolve(process.cwd(), 'public', known.file), mime: known.mime },
      { path: path.resolve(process.cwd(), '.output/public', known.file), mime: known.mime }
    )
  }

  // Extensiones comunes si no esta en el mapa conocido
  const extensions = [
    { ext: '.jpg', mime: 'image/jpeg' },
    { ext: '.jpeg', mime: 'image/jpeg' },
    { ext: '.png', mime: 'image/png' },
    { ext: '.webp', mime: 'image/webp' },
    { ext: '.avif', mime: 'image/avif' },
    { ext: '.mp4', mime: 'video/mp4' },
  ]

  for (const { ext, mime } of extensions) {
    possiblePaths.push(
      { path: path.resolve(process.cwd(), 'public/galeria', `${key}${ext}`), mime },
      { path: path.resolve(process.cwd(), '.output/public/galeria', `${key}${ext}`), mime },
      { path: path.resolve(process.cwd(), 'public', `${key}${ext}`), mime },
      { path: path.resolve(process.cwd(), '.output/public', `${key}${ext}`), mime }
    )
  }

  for (const item of possiblePaths) {
    try {
      const data = await fs.readFile(item.path)
      if (data && data.length > 0) {
        return { mime: item.mime, data }
      }
    } catch {}
  }

  return null
}

// oxlint-disable-next-line no-explicit-any
type SqlTag = <T = Array<Record<string, any>>>(
  strings: TemplateStringsArray,
  ...values: Array<unknown>
) => Promise<T> & { end: (opts?: unknown) => Promise<void> }

let sqlPromise: Promise<SqlTag> | null = null

async function getSql(): Promise<SqlTag> {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const url =
        process.env.DATABASE_URL ||
        'postgresql://postgres.uiohtupgtqxbzmfqkqea:7AqofDWnZplmMkFq@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require'
      // Import dinamico: evita meter el driver `postgres` en cualquier
      // grafo de cliente por accidente.
      const { default: postgres } = await import('postgres')
      return postgres(url, {
        ssl: 'require',
        prepare: false,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 15,
      }) as unknown as SqlTag
    })()
  }
  return sqlPromise
}

/** Devuelve la imagen o null si no existe. Primero memoria (0ms), luego disco (0ms), luego Supabase. */
export async function fetchImageFromSupabase(key: string): Promise<StoredImage | null> {
  // 1. Cache en memoria RAM
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!
  }

  // 2. Archivo local en disco
  const local = await tryReadLocalFile(key)
  if (local) {
    memoryCache.set(key, local)
    return local
  }

  // 3. Consulta a Supabase Postgres
  try {
    const client = await getSql()
    // Timeout de seguridad de 30s
    const timeout = new Promise<never>((_, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout Supabase')), 30_000)
      // oxlint-disable-next-line no-explicit-any
      ;(t as any).unref?.()
    })
    const query = client<Array<{ mime: string; data: Uint8Array }>>`
      SELECT mime, data FROM images WHERE key = ${key} LIMIT 1
    `
    const rows = await Promise.race([query, timeout])
    if (rows.length === 0) return null
    const row = rows[0]
    const data = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)
    const result: StoredImage = { mime: row.mime || 'image/png', data }
    memoryCache.set(key, result)
    return result
  } catch (err) {
    console.error(`[images.server] Error fetching key "${key}" from Supabase:`, err)
    throw err
  }
}
