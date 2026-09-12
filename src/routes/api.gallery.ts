import { createFileRoute } from '@tanstack/react-router'
import {
  fetchGalleryFromDb,
  saveGalleryItemToDb,
  deleteGalleryItemFromDb,
} from '../server/gallery.server'

export const Route = createFileRoute('/api/gallery')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const items = await fetchGalleryFromDb()
          return Response.json(items, {
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
          if (!body || !body.id || !body.title) {
            return Response.json({ error: 'Datos de fotografía incompletos' }, { status: 400 })
          }
          const result = await saveGalleryItemToDb(body)
          return Response.json(
            { ok: true, message: 'Fotografía guardada en tiempo real en Supabase', item: result.item },
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
          await deleteGalleryItemFromDb(id)
          return Response.json(
            { ok: true, message: 'Fotografía eliminada de Supabase' },
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
