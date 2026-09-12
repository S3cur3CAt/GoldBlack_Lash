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

          // Send confirmation email via Resend if client provided email and API key is configured
          let clientEmailSent = false
          const resendKey = process.env.RESEND_API_KEY || body.resendApiKey
          if (resendKey && rawEmail) {
            try {
              const sender =
                process.env.RESEND_FROM_EMAIL ||
                'GoldBlack Lash <citas@goldblacklash.com>'

              const confirmationHtml = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0b10; color: #f2f2f7; padding: 40px 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background-color: #12121a; border: 1px solid #28283a; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                    <div style="background: linear-gradient(135deg, #1d1b28 0%, #12121a 100%); padding: 32px 30px; text-align: center; border-bottom: 1px solid #28283a;">
                      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #d4af37; font-weight: 700;">GoldBlack Lash Studio</span>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 12px 0 0 0; font-family: 'Playfair Display', Georgia, serif;">¡Solicitud de Cita Confirmada!</h1>
                    </div>
                    <div style="padding: 32px 30px;">
                      <p style="font-size: 15px; line-height: 1.6; color: #e2e2e8; margin-top: 0;">
                        Hola <strong style="color: #ffffff;">${rawName}</strong>,
                      </p>
                      <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                        Hemos recibido correctamente tu solicitud de cita en GoldBlack Lash Studio. Nos pondremos en contacto contigo para coordinar y asegurar tu horario ideal.
                      </p>
                      <div style="background-color: #181824; border: 1px solid #2f2f44; border-radius: 14px; padding: 22px; margin: 24px 0;">
                        <h3 style="margin: 0 0 16px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #d4af37;">Resumen de tu Reserva</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                          <tr>
                            <td style="padding: 6px 0; color: #888899; width: 35%;">Tratamiento:</td>
                            <td style="padding: 6px 0; color: #ffffff; font-weight: 600;">${aptRecord.serviceName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #888899;">Fecha estimada:</td>
                            <td style="padding: 6px 0; color: #ffffff;">${aptRecord.date}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #888899;">Horario:</td>
                            <td style="padding: 6px 0; color: #ffffff;">${aptRecord.time}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #888899;">Teléfono:</td>
                            <td style="padding: 6px 0; color: #ffffff; font-family: monospace;">${rawPhone}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #888899;">Ubicación:</td>
                            <td style="padding: 6px 0; color: #ffffff;">Calle Numa, Montequinto, Sevilla</td>
                          </tr>
                        </table>
                      </div>
                      <div style="background-color: rgba(212, 175, 55, 0.08); border-left: 3px solid #d4af37; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #dfd8c4;">
                          <strong>Consejo para tu sesión:</strong> Por favor, acude con los ojos limpios y libres de restos de máscara de pestañas o aceites para asegurar la máxima adherencia y retención de tus extensiones.
                        </p>
                      </div>
                      <p style="font-size: 13px; line-height: 1.6; color: #71717a; text-align: center; margin: 30px 0 0 0;">
                        ¿Deseas cambiar algún detalle? Responde a este correo o llámanos al <strong>+34 604 18 76 76</strong>.
                      </p>
                    </div>
                    <div style="background-color: #0d0d14; padding: 18px 30px; text-align: center; border-top: 1px solid #1f1f2e; font-size: 11px; color: #666677;">
                      GoldBlack Lash Studio · Belleza de autor, hecha a medida.
                    </div>
                  </div>
                </div>
              `

              const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify({
                  from: sender,
                  to: [rawEmail],
                  subject: `✨ Tu cita en GoldBlack Lash: ${aptRecord.serviceName}`,
                  html: confirmationHtml,
                }),
              })
              clientEmailSent = emailRes.ok

              // Optional alert email to studio owner
              const alertEmail = process.env.RESEND_ALERT_EMAIL
              if (alertEmail) {
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
                    html: `<p>Has recibido una nueva reserva web de <strong>${rawName}</strong> (${rawPhone}, ${rawEmail}).</p><p>Tratamiento: ${aptRecord.serviceName}</p><p>Notas: ${aptRecord.notes}</p>`,
                  }),
                }).catch(() => {})
              }
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
