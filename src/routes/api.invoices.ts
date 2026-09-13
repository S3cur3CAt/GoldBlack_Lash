import { createFileRoute } from '@tanstack/react-router'
import {
  fetchInvoicesFromDb,
  saveInvoiceToDb,
  deleteInvoiceFromDb,
} from '../server/invoices.server'

export const Route = createFileRoute('/api/invoices')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const invoices = await fetchInvoicesFromDb()
          return Response.json(invoices, {
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
          if (!body || !body.id || !body.clientName) {
            return Response.json(
              { error: 'Por favor proporciona los datos obligatorios de la factura' },
              { status: 400 }
            )
          }

          const ok = await saveInvoiceToDb(body)
          if (!ok) {
            return Response.json({ error: 'Error al guardar factura en Supabase' }, { status: 500 })
          }

          return Response.json(
            { ok: true, invoice: body },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
              },
            }
          )
        } catch (e: any) {
          return Response.json({ error: e?.message || 'Error al procesar factura' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const id = url.searchParams.get('id')
          if (!id) {
            return Response.json({ error: 'ID de factura requerido' }, { status: 400 })
          }

          const ok = await deleteInvoiceFromDb(id)
          if (!ok) {
            return Response.json({ error: 'Error al eliminar factura de Supabase' }, { status: 500 })
          }

          return Response.json(
            { ok: true },
            {
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': '*',
              },
            }
          )
        } catch (e: any) {
          return Response.json({ error: e?.message || 'Error al eliminar factura' }, { status: 500 })
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        })
      },
    },
  },
})
