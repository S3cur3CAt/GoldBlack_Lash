import { createFileRoute } from '@tanstack/react-router'
import {
  fetchContactsFromDb,
  saveContactsToDb,
  deleteContactFromDb,
} from '../server/appointments.server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
}

export const Route = createFileRoute('/api/contacts')({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
      },
      GET: async () => {
        try {
          const contacts = await fetchContactsFromDb()
          return Response.json(contacts, { headers: CORS_HEADERS })
        } catch (err: any) {
          return Response.json({ error: err?.message || 'Error leyendo contactos' }, { status: 500, headers: CORS_HEADERS })
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const contactsToSave = Array.isArray(body)
            ? body
            : body.contacts && Array.isArray(body.contacts)
              ? body.contacts
              : body.phone
                ? [body]
                : []

          if (contactsToSave.length === 0) {
            return Response.json({ error: 'No se enviaron contactos válidos' }, { status: 400, headers: CORS_HEADERS })
          }

          const result = await saveContactsToDb(contactsToSave)
          return Response.json(result, { headers: CORS_HEADERS })
        } catch (err: any) {
          return Response.json({ error: err?.message || 'Error guardando contactos' }, { status: 500, headers: CORS_HEADERS })
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) {
            return Response.json({ error: 'ID de contacto requerido' }, { status: 400, headers: CORS_HEADERS })
          }
          const success = await deleteContactFromDb(id)
          return Response.json({ ok: success }, { headers: CORS_HEADERS })
        } catch (err: any) {
          return Response.json({ error: err?.message || 'Error eliminando contacto' }, { status: 500, headers: CORS_HEADERS })
        }
      },
    },
  },
})
