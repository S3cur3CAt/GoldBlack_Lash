import { createFileRoute } from '@tanstack/react-router'

import { fetchImageFromNeon, isValidImageKey } from '../server/images.server'

// Server route TanStack Start: GET /api/images/:key (dev, build y prod,
// incluida Vercel). Sirve las imagenes de Neon con cache inmutable.
// Se eligio server route en vez de server/api de Nitro porque el plugin
// nitro/vite en este proyecto no escanea server/ (verificado en .output).
export const Route = createFileRoute('/api/images/$key')({
  server: {
    handlers: {
      GET: async ({
        params,
        request,
      }: {
        params: { key: string }
        request: Request
      }) => {
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

        const range = request?.headers?.get('range')
        if (range && hit.data) {
          const rangeMatch = range.match(/bytes=(\d+)-(\d*)/)
          if (rangeMatch) {
            const total = hit.data.length
            const start = parseInt(rangeMatch[1], 10)
            const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : total - 1
            if (start < total) {
              const chunk = hit.data.subarray(start, end + 1)
              return new Response(chunk as unknown as BodyInit, {
                status: 206,
                headers: {
                  'Content-Type': hit.mime,
                  'Content-Range': `bytes ${start}-${end}/${total}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': String(chunk.length),
                  'Cache-Control': 'public, max-age=31536000, immutable',
                },
              })
            }
          }
        }

        return new Response(hit.data as unknown as BodyInit, {
          headers: {
            'Content-Type': hit.mime,
            'Content-Length': String(hit.data.length),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
