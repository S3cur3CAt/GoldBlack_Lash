import { createFileRoute } from '@tanstack/react-router'
import {
  fetchAppointmentsFromDb,
  saveAppointmentToDb,
  deleteAppointmentFromDb,
} from '../server/appointments.server'
import {
  generateBookingEmailHtml,
  generateBookingEmailText,
} from '../server/emails/bookingEmail'

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

          const rawName = String(body.clientName).trim()
          const rawPhone = String(body.clientPhone).trim()
          const rawEmail = body.clientEmail ? String(body.clientEmail).trim() : undefined
          const appointmentId = body.id || `apt-web-${Date.now()}`

          // Filter out dummy test appointments
          if (
            appointmentId.startsWith('test-') ||
            rawName.toLowerCase() === 'test' ||
            rawName.toLowerCase() === 'clienta test'
          ) {
            return Response.json(
              { ok: true, message: 'Cita de prueba descartada', filtered: true },
              {
                headers: {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS, PUT, PATCH',
                  'Access-Control-Allow-Headers': '*',
                },
              }
            )
          }

          const aptRecord = {
            id: appointmentId,
            clientName: rawName,
            clientPhone: rawPhone,
            clientEmail: rawEmail,
            date: body.date || new Date().toISOString().split('T')[0],
            time: body.time || 'Por coordinar',
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

          // Send confirmation email via Resend if client provided email
          let clientEmailSent = false
          const resendKey =
            process.env.RESEND_API_KEY ||
            process.env.VITE_RESEND_API_KEY ||
            body.resendApiKey

          if (resendKey && rawEmail) {
            try {
              const sender =
                process.env.RESEND_FROM_EMAIL ||
                'GoldBlack Lash <citas@goldblacklash.com>'

              const confirmationHtml = generateBookingEmailHtml({
                clientName: rawName,
                clientPhone: rawPhone,
                clientEmail: rawEmail,
                serviceName: aptRecord.serviceName,
                date: aptRecord.date,
                time: aptRecord.time,
                notes: aptRecord.notes,
              })

              const confirmationText = generateBookingEmailText({
                clientName: rawName,
                clientPhone: rawPhone,
                clientEmail: rawEmail,
                serviceName: aptRecord.serviceName,
                date: aptRecord.date,
                time: aptRecord.time,
                notes: aptRecord.notes,
              })

              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: sender,
                  to: [rawEmail],
                  subject: `✨ ¡Gracias por tu reserva en GoldBlack Lash! · ${aptRecord.serviceName}`,
                  html: confirmationHtml,
                  text: confirmationText,
                }),
              })

              clientEmailSent = emailRes.ok
              if (!emailRes.ok) {
                const errData = await emailRes.json().catch(() => ({}))
                console.warn('[Resend Client Email Error]', errData)
              }

              // Also alert the studio owner at citas@goldblacklash.com
              const alertEmail =
                process.env.RESEND_ALERT_EMAIL || 'citas@goldblacklash.com'

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: sender,
                  to: [alertEmail],
                  subject: `🔔 Nueva Cita Online: ${rawName} (${aptRecord.serviceName})`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                      <h2 style="color: #b66f79;">🔔 ¡Nueva reserva web recibida!</h2>
                      <p><strong>Cliente:</strong> ${rawName}</p>
                      <p><strong>Teléfono:</strong> <a href="tel:${rawPhone}">${rawPhone}</a> (<a href="https://wa.me/${rawPhone.replace(/\D/g, '')}">WhatsApp</a>)</p>
                      <p><strong>Email:</strong> ${rawEmail}</p>
                      <p><strong>Tratamiento:</strong> ${aptRecord.serviceName}</p>
                      <p><strong>Fecha / Horario:</strong> ${aptRecord.date} · ${aptRecord.time}</p>
                      <p><strong>Comentarios:</strong> ${aptRecord.notes || 'Ninguno'}</p>
                    </div>
                  `,
                }),
              }).catch((alertErr) => {
                console.warn('[Resend Studio Alert Error]', alertErr)
              })
            } catch (emailErr) {
              console.warn('[Resend Booking Confirmation Error]', emailErr)
            }
          }

          return Response.json(
            {
              ok: true,
              message: 'Cita registrada correctamente en el sistema de administración',
              appointment: aptRecord,
              emailSent: clientEmailSent,
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
