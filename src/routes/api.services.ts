import { createFileRoute } from '@tanstack/react-router'
import {
  fetchServicesFromDb,
  saveServiceToDb,
  deleteServiceFromDb,
} from '../server/services.server'

export const Route = createFileRoute('/api/services')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const services = await fetchServicesFromDb()
          return Response.json(services, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        } catch (e: any) {
          return Response.json({ error: e?.message || 'Error en servidor' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          if (!body || !body.id || !body.name) {
            return Response.json({ error: 'Datos de servicio incompletos' }, { status: 400 })
          }
          await saveServiceToDb(body)
          return Response.json(
            { ok: true, message: 'Servicio guardado en tiempo real en Supabase' },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT, PATCH',
                'Access-Control-Allow-Headers': '*',
                'Cache-Control': 'no-cache',
              },
            }
          )
        } catch (e: any) {
          return Response.json(
            { error: e?.message || 'Error guardando en BD' },
            {
              status: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
              },
            }
          )
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) {
            return Response.json(
              { error: 'Falta parámetro id' },
              {
                status: 400,
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': '*',
                },
              }
            )
          }
          await deleteServiceFromDb(id)
          return Response.json(
            { ok: true, message: 'Servicio eliminado de Supabase' },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT, PATCH',
                'Access-Control-Allow-Headers': '*',
              },
            }
          )
        } catch (e: any) {
          return Response.json(
            { error: e?.message || 'Error eliminando en BD' },
            {
              status: 500,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
              },
            }
          )
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT, PATCH',
            'Access-Control-Allow-Headers': '*',
          },
        })
      },
    },
  },
})
