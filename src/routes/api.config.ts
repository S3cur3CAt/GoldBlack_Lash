import { createFileRoute } from '@tanstack/react-router'
import { fetchConfigFromDb, saveConfigToDb } from '../server/config.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
}

export const Route = createFileRoute('/api/config')({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      },
      GET: async () => {
        try {
          const config = await fetchConfigFromDb()
          return Response.json(config, {
            headers: CORS_HEADERS,
          })
        } catch (e: any) {
          return Response.json({ error: e?.message || 'Error en servidor' }, { status: 500, headers: CORS_HEADERS })
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          if (!body || typeof body !== 'object') {
            return Response.json({ error: 'Payload inválido' }, { status: 400, headers: CORS_HEADERS })
          }

          const saved = await saveConfigToDb(body)
          return Response.json(
            {
              ok: true,
              message: 'Configuración del estudio guardada y sincronizada correctamente',
              config: saved,
            },
            {
              headers: CORS_HEADERS,
            }
          )
        } catch (e: any) {
          console.error('[API Config POST Error]', e)
          return Response.json({ error: e?.message || 'Error guardando configuración' }, { status: 500, headers: CORS_HEADERS })
        }
      },
    },
  },
})
