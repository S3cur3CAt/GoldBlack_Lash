// Acceso compartido a las imagenes guardadas en Neon Postgres (tabla images).
// Lo usan la ruta Nitro (server/api/images/[key].get.ts, build/prod)
// y el middleware de Vite (vite.config.ts, solo dev).
// Las credenciales van en la variable de entorno DATABASE_URL.
import postgres from 'postgres'

export type StoredImage = {
  mime: string
  data: Buffer
}

const KEY_RE = /^[A-Za-z0-9-]{1,64}$/

export function isValidImageKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_RE.test(key)
}

let sql: ReturnType<typeof postgres> | null = null

function getSql() {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('Falta DATABASE_URL')
    }
    sql = postgres(url, { ssl: 'require', prepare: false, max: 3 })
  }
  return sql
}

/** Devuelve la imagen o null si no existe. Lanza si falta DATABASE_URL o falla la BD. */
export async function fetchImageFromNeon(key: string): Promise<StoredImage | null> {
  const rows = await getSql()<Array<StoredImage>>`
    SELECT mime, data FROM images WHERE key = ${key} LIMIT 1
  `
  return rows.length > 0 ? rows[0] : null
}
