import { business } from '../../data/site'

export interface BookingEmailData {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceName: string
  date: string
  time?: string
  notes?: string
  studioPhone?: string
  studioPhoneClean?: string
  studioEmail?: string
  studioAddress?: string
  studioMapsUrl?: string
}

export function generateBookingEmailHtml(data: BookingEmailData): string {
  const { clientName, clientPhone, serviceName, date, time, notes } = data

  const studioPhone = data.studioPhone || business.phoneDisplay
  const studioPhoneClean =
    data.studioPhoneClean || business.phoneClean || studioPhone.replace(/\D/g, '')
  const studioEmail = data.studioEmail || business.email
  const studioAddress =
    data.studioAddress || `${business.address}, ${business.postalCode} ${business.city}`
  const mapsUrl = data.studioMapsUrl || business.mapsUrl

  const whatsappMessage = encodeURIComponent(
    `Hola, he solicitado una reserva web para "${serviceName}" a nombre de ${clientName}. ¡Me gustaría confirmar los detalles!`
  )
  const whatsappUrl = `https://wa.me/${studioPhoneClean}?text=${whatsappMessage}`
  const logoUrl = 'https://goldblacklash.com/avatar_google_completo.png'
  const displayTime = time && time !== 'Por coordinar' ? time : 'Por coordinar contigo'

  // Clean note display
  let cleanNotes = notes?.trim() || ''
  if (cleanNotes.startsWith('Solicitud web:')) {
    cleanNotes = cleanNotes.replace('Solicitud web:', '').trim()
  } else if (cleanNotes === 'Solicitud de reserva online desde el sitio web' || cleanNotes === 'Solicitud desde página de contacto') {
    cleanNotes = ''
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Gracias por tu reserva en GoldBlack Lash Studio!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf6f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #3f2932;">
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fbf6f5; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #ecd9dc; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 48px rgba(63, 41, 50, 0.07);">
          
          <!-- Header Banner with Brand & Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(180deg, #fff7f6 0%, #fdf0f1 100%); padding: 38px 24px 28px 24px; border-bottom: 1px solid #f2e3e5;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" width="96" height="96" alt="GoldBlack Lash Logo" style="display: block; border-radius: 20px; box-shadow: 0 8px 24px rgba(63, 41, 50, 0.12); border: 1px solid #ecd9dc; object-fit: cover;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 16px;">
                    <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 24px; letter-spacing: 3px; font-weight: 700; color: #3f2932; text-transform: uppercase;">
                      GoldBlack Lash
                    </div>
                    <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #b66f79; font-weight: 600; margin-top: 4px;">
                      Estudio de Pestañas · Belleza de Autor
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              
              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 18px;">
                <span style="display: inline-block; background-color: #fcf1f2; color: #b66f79; border: 1px solid #edd5d8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px;">
                  ✨ Solicitud de Cita Registrada
                </span>
              </div>

              <!-- Greeting & Hero Message -->
              <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-size: 26px; font-weight: 600; color: #3f2932; margin: 0 0 14px 0; text-align: center; line-height: 1.3;">
                ¡Muchas gracias por tu reserva, ${clientName}!
              </h1>

              <p style="font-size: 15px; line-height: 1.65; color: #6e5860; text-align: center; margin: 0 0 26px 0;">
                Nos hace muchísima ilusión recibirte en nuestro estudio. Hemos registrado tu solicitud y estamos revisando la agenda para ofrecerte el momento perfecto.
              </p>

              <!-- Reservation Summary Card -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdf7f8; border: 1px solid #ebd8db; border-radius: 18px; margin-bottom: 26px; overflow: hidden;">
                <tr>
                  <td style="padding: 22px 24px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #b66f79; margin-bottom: 14px; border-bottom: 1px solid #ebd8db; padding-bottom: 8px;">
                      Detalles de tu Solicitud
                    </div>

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.6;">
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; width: 40%; font-weight: 500;">Tratamiento:</td>
                        <td style="padding: 6px 0; color: #3f2932; font-weight: 700;">${serviceName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; font-weight: 500;">Fecha solicitada:</td>
                        <td style="padding: 6px 0; color: #3f2932; font-weight: 600;">${date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; font-weight: 500;">Preferencia de hora:</td>
                        <td style="padding: 6px 0; color: #3f2932;">${displayTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; font-weight: 500;">Teléfono de contacto:</td>
                        <td style="padding: 6px 0; color: #3f2932; font-weight: 600; font-family: monospace;">${clientPhone}</td>
                      </tr>
                      ${
                        cleanNotes
                          ? `
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; font-weight: 500; vertical-align: top;">Comentarios:</td>
                        <td style="padding: 6px 0; color: #3f2932; font-style: italic;">«${cleanNotes}»</td>
                      </tr>`
                          : ''
                      }
                      <tr>
                        <td style="padding: 6px 0; color: #8c737b; font-weight: 500; vertical-align: top;">Ubicación:</td>
                        <td style="padding: 6px 0; color: #3f2932;">Calle Numa, Montequinto, 41089 Dos Hermanas (Sevilla)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What happens next (Steps) -->
              <div style="background-color: #ffffff; border: 1px solid #f0e1e3; border-radius: 16px; padding: 20px 22px; margin-bottom: 26px;">
                <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #3f2932; margin-bottom: 12px;">
                  ¿Qué pasará a continuación?
                </div>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 1.55; color: #6e5860;">
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 24px; color: #b66f79; font-weight: 700;">1.</td>
                    <td style="padding: 6px 0;"><strong>Revisión de agenda:</strong> Comprobamos el cuadrante del estudio para asignarte el mejor turno.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 24px; color: #b66f79; font-weight: 700;">2.</td>
                    <td style="padding: 6px 0;"><strong>Contacto directo:</strong> Te escribiremos por WhatsApp al <strong>${clientPhone}</strong> para acordar la hora exacta que más te convenga.</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 24px; color: #b66f79; font-weight: 700;">3.</td>
                    <td style="padding: 6px 0;"><strong>Cita confirmada:</strong> Una vez acordada la hora, ¡tu sesión quedará 100% garantizada en el estudio!</td>
                  </tr>
                </table>
              </div>

              <!-- Pre-Appointment Tips -->
              <div style="background-color: #fdfaf9; border-left: 3px solid #b66f79; border-radius: 4px 12px 12px 4px; padding: 16px 18px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; color: #b66f79; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  🌸 Consejos para el día de tu cita
                </div>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #665058;">
                  • <strong>Ojos desmaquillados:</strong> Por favor, acude con las pestañas limpias, sin máscara ni restos de maquillaje o sombras.<br>
                  • <strong>Evita productos grasos:</strong> No apliques cremas ni aceites en el contorno de ojos las horas previas para asegurar la máxima retención.<br>
                  • <strong>Lentillas:</strong> Si usas lentes de contacto, te recomendamos traer tu estuche para quitártelas cómodamente antes del servicio.
                </p>
              </div>

              <!-- Quick Action Buttons -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                <tr>
                  <td align="center" style="padding: 4px 0;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- WhatsApp Button -->
                        <td align="center" style="border-radius: 12px; background-color: #b66f79; margin-right: 8px;">
                          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 22px; display: inline-block; letter-spacing: 0.5px;">
                            💬 Escríbenos por WhatsApp
                          </a>
                        </td>
                        <td style="width: 12px;"></td>
                        <!-- Maps Button -->
                        <td align="center" style="border-radius: 12px; background-color: #ffffff; border: 1px solid #d9a8ad;">
                          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: 600; color: #b66f79; text-decoration: none; padding: 12px 18px; display: inline-block;">
                            📍 Cómo llegar (Maps)
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Studio Footer -->
          <tr>
            <td align="center" style="background-color: #fff9f8; padding: 26px 32px; border-top: 1px solid #f2e3e5;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #3f2932; letter-spacing: 1px;">
                GoldBlack Lash Studio
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.5; color: #8c737b;">
                ${studioAddress}<br>
                Teléfono: <a href="tel:${studioPhoneClean}" style="color: #b66f79; text-decoration: none; font-weight: 600;">${studioPhone}</a> · Email: <a href="mailto:${studioEmail}" style="color: #b66f79; text-decoration: none;">${studioEmail}</a>
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #aa949a;">
                Horario: Lunes a viernes 10:00 – 20:00 · Sábados 10:00 – 15:00
              </p>
              <div style="font-size: 11px; color: #b66f79; font-style: italic;">
                «Belleza de autor, hecha a medida»
              </div>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->

        <!-- Bottom Unsubscribe / Disclaimer -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin-top: 18px;">
          <tr>
            <td align="center" style="font-size: 11px; line-height: 1.5; color: #9c848b; padding: 0 16px;">
              Has recibido este correo electrónico porque solicitaste una reserva de cita a través de <a href="https://goldblacklash.com" target="_blank" rel="noopener noreferrer" style="color: #b66f79; text-decoration: underline;">goldblacklash.com</a>.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

export function generateBookingEmailText(data: BookingEmailData): string {
  const { clientName, clientPhone, serviceName, date, time, notes } = data
  const studioPhone = data.studioPhone || business.phoneDisplay
  const studioEmail = data.studioEmail || business.email
  const studioAddress =
    data.studioAddress || `${business.address}, ${business.postalCode} ${business.city}`

  return `¡Muchas gracias por tu reserva en GoldBlack Lash, ${clientName}!

Hemos recibido tu solicitud de cita en GoldBlack Lash Studio.

RESUMEN DE TU SOLICITUD:
- Tratamiento: ${serviceName}
- Fecha solicitada: ${date}
- Preferencia horaria: ${time || 'Por coordinar contigo'}
- Teléfono: ${clientPhone}
${notes ? `- Notas: ${notes}\n` : ''}
- Ubicación: ${studioAddress}

¿QUÉ PASARÁ A CONTINUACIÓN?
1. Comprobamos la disponibilidad en el salón.
2. Te contactaremos por WhatsApp o llamada al ${clientPhone} para acordar tu hora ideal.
3. Una vez acordado el turno, ¡tu cita quedará 100% asegurada!

CONSEJOS PREVIOS:
- Acude a tu sesión con los ojos limpios, sin máscara ni restos de maquillaje.
- Evita aceites o cremas en el contorno de ojos las horas previas.
- Si usas lentillas, puedes traer tu estuche para retirarlas durante el tratamiento.

CONTACTO:
- Teléfono / WhatsApp: ${studioPhone}
- Email: ${studioEmail}
- Web: https://goldblacklash.com

GoldBlack Lash Studio · Belleza de autor, hecha a medida.`
}
