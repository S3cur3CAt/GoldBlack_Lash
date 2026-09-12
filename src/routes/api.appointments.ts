import { createFileRoute } from '@tanstack/react-router'
import {
  fetchAppointmentsFromDb,
  saveAppointmentToDb,
  deleteAppointmentFromDb,
} from '../server/appointments.server'

export const Route = createFileRoute('/api/appointments')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const appointments = await fetchAppointmentsFromDb()
          return Response.json(appointments, {
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
          if (!body || !body.clientName || !body.clientPhone) {
            return Response.json(
              { error: 'Por favor proporciona nombre y teléfono del cliente' },
              { status: 400 }
            )
          }

          const appointmentId = body.id || `apt-web-${Date.now()}`
          const aptRecord = {
            id: appointmentId,
            clientName: String(body.clientName).trim(),
            clientPhone: String(body.clientPhone).trim(),
            date: body.date || new Date().toISOString().split('T')[0],
            time: body.time || '10:00',
            durationMinutes: body.durationMinutes || 90,
            serviceId: body.serviceId || 'web-booking',
            serviceName: body.serviceName || 'Reserva Web',
            price: Number(body.price) || 0,
            status: body.status || 'pendiente',
            paymentStatus: body.paymentStatus || 'pendiente',
            curl: body.curl || undefined,
            length: body.length || undefined,
            style: body.style || undefined,
            notes: body.notes || 'Reserva realizada desde el sitio web',
          }

          await saveAppointmentToDb(aptRecord)

          return Response.json(
            {
              ok: true,
              message: 'Cita registrada correctamente en el sistema de administración',
              appointment: aptRecord,
            },
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
          console.error('[API Appointments POST error]', e)
          return Response.json(
            { error: e?.message || 'Error guardando cita' },
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
          await deleteAppointmentFromDb(id)
          return Response.json(
            { ok: true, message: 'Cita eliminada de la base de datos' },
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
            { error: e?.message || 'Error eliminando cita' },
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
