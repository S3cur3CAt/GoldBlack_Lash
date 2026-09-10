// Handler Nitro para GET /api/images/:key (registrado en vite.config.ts).
// Sirve las imagenes guardadas en Neon Postgres con cache inmutable.
// Formato "web": Request/Response estandar.
import { fetchImageFromNeon, isValidImageKey } from './images'

export default async (request: Request): Promise<Response> => {
  const pathname = new URL(request.url).pathname
  const match = pathname.match(/^\/api\/images\/([A-Za-z0-9-]{1,64})\/?$/)
  const key = match ? match[1] : ''
  if (!isValidImageKey(key)) {
    return Response.json({ error: 'Clave no valida' }, { status: 400 })
  }

  let hit
  try {
    hit = await fetchImageFromNeon(key)
  } catch {
    return Response.json({ error: 'Error de base de datos' }, { status: 500 })
  }
  if (!hit) {
    return Response.json({ error: 'Imagen no encontrada' }, { status: 404 })
  }

  return new Response(hit.data as unknown as BodyInit, {
    headers: {
      'Content-Type': hit.mime,
      'Content-Length': String(hit.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
