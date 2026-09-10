// Acceso compartido a las imagenes guardadas en Neon Postgres (tabla images).
// Lo usan la ruta Nitro (server/api/images/[key].get.ts, build/prod)
// y el middleware de Vite (vite.config.ts, solo dev).
// Las credenciales van en la variable de entorno DATABASE_URL.
export type StoredImage = {
  mime: string
  data: Buffer
}

const KEY_RE = /^[A-Za-z0-9-]{1,64}$/

export function isValidImageKey(key: unknown): key is string {
  return typeof key === 'string' && KEY_RE.test(key)
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
      const url = process.env.DATABASE_URL
      if (!url) {
        throw new Error('Falta DATABASE_URL')
      }
      // Import dinamico: evita meter el driver `postgres` en el grafo de
      // la config de Vite/SSR en tiempo de evaluacion (era lo que dejaba
      // al entorno "ssr" sin recargar y tumbaba `pnpm dev`).
      const { default: postgres } = await import('postgres')
      return postgres(url, {
        ssl: 'require',
        prepare: false,
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
      }) as unknown as SqlTag
    })()
  }
  return sqlPromise
}

/** Devuelve la imagen o null si no existe. Lanza si falta DATABASE_URL o falla la BD. */
export async function fetchImageFromNeon(key: string): Promise<StoredImage | null> {
  const client = await getSql()
  // Timeout de seguridad: nunca dejar una peticion colgada mas de 10 s.
  const timeout = new Promise<never>((_, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout Neon')), 10_000)
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
  return { mime: row.mime || 'image/png', data }
}
