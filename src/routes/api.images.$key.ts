import { createFileRoute } from '@tanstack/react-router'

import { fetchImageFromNeon, isValidImageKey } from '../server/images.server'

// Server route TanStack Start: GET /api/images/:key (dev, build y prod,
// incluida Vercel). Sirve las imagenes de Neon con cache inmutable.
// Se eligio server route en vez de server/api de Nitro porque el plugin
// nitro/vite en este proyecto no escanea server/ (verificado en .output).
export const Route = createFileRoute('/api/images/$key')({
  server: {
    handlers: {
      GET: async ({ params }: { params: { key: string } }) => {
        const key = params.key
        if (!isValidImageKey(key)) {
          return Response.json({ error: 'Clave no valida' }, { status: 400 })
        }

        let hit
        try {
          hit = await fetchImageFromNeon(key)
        } catch {
          return Response.json(
            { error: 'Error de base de datos' },
            { status: 500 },
          )
        }
        if (!hit) {
          return Response.json(
            { error: 'Imagen no encontrada' },
            { status: 404 },
          )
        }

        return new Response(hit.data as unknown as BodyInit, {
          headers: {
            'Content-Type': hit.mime,
            'Content-Length': String(hit.data.length),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
