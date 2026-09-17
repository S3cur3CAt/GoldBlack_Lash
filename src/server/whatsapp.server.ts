/**
 * Servicio de Notificaciones y Despacho de WhatsApp para GoldBlack Lash Studio
 *
 * Permite recibir alertas automáticas en el WhatsApp de Laura cuando entra
 * una nueva reserva web, así como despachar pruebas de conexión.
 */

export interface AppointmentAlertData {
  clientName: string
  clientPhone: string
  clientEmail?: string
  serviceName: string
  date: string
  time: string
  price?: number
  notes?: string
}

/**
 * Sanitiza y normaliza un número de teléfono a formato internacional de WhatsApp (E.164 sin signo +)
 * Ejemplo: "+34 604 18 76 76" -> "34604187676"
 * Ejemplo: "604187676" (España) -> "34604187676"
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2)
  }
  // Si tiene 9 dígitos y empieza por 6, 7, 8 o 9 (móvil/fijo español estándar), añadir prefijo 34
  if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    cleaned = '34' + cleaned
  }
  return cleaned
}

/**
 * Genera el texto formateado con Markdown de WhatsApp para la alerta de nueva cita
 */
export function generateStudioWhatsAppAlertText(
  apt: AppointmentAlertData,
  studioName = 'GoldBlack Lash'
): string {
  const clientPhoneClean = formatWhatsAppPhone(apt.clientPhone)
  const waChatLink = clientPhoneClean ? `https://wa.me/${clientPhoneClean}` : ''

  const lines = [
    `🔔 *NUEVA RESERVA WEB — ${studioName.toUpperCase()}* 🔔`,
    `🌐 https://www.goldblacklash.com/`,
    '',
    `✨ *Clienta:* ${apt.clientName}`,
    `📱 *Teléfono:* ${apt.clientPhone}`,
  ]

  if (apt.clientEmail) {
    lines.push(`📧 *Email:* ${apt.clientEmail}`)
  }

  lines.push(`🌸 *Tratamiento:* ${apt.serviceName}`)
  lines.push(`📅 *Fecha:* ${apt.date}`)
  lines.push(`⏰ *Hora:* ${apt.time}`)

  if (apt.price && apt.price > 0) {
    lines.push(`💶 *Precio:* ${apt.price} €`)
  }

  if (apt.notes && apt.notes.trim()) {
    lines.push(`💬 *Comentarios:* ${apt.notes.trim()}`)
  }

  if (waChatLink) {
    lines.push('')
    lines.push(`👉 *Abrir chat con la clienta:*`)
    lines.push(waChatLink)
  }

  return lines.join('\n')
}

export interface SendWhatsAppAlertOptions {
  appointment?: AppointmentAlertData
  customMessage?: string
  config?: {
    name?: string
    whatsappAlertsEnabled?: boolean
    whatsappAlertPhone?: string
    whatsappProvider?: 'callmebot' | 'webhook'
    whatsappCallMeBotApiKey?: string
    whatsappWebhookUrl?: string
    phoneDisplay?: string
    phoneClean?: string
    whatsapp?: string
  }
}

/**
 * Envía una alerta de WhatsApp al número de Laura/estudio.
 * Soporta CallMeBot (gratis, directo sin comisiones) y Webhook genérico (Make, Zapier, Twilio, n8n).
 */
export async function sendStudioWhatsAppAlert(
  options: SendWhatsAppAlertOptions
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const cfg = options.config || {}

  // Comprobar si las alertas están activadas
  if (cfg.whatsappAlertsEnabled === false) {
    return { ok: false, error: 'Las alertas de WhatsApp están desactivadas en la configuración' }
  }

  // Resolver teléfono destino del estudio (definido dinámicamente en Ajustes)
  const rawTargetPhone =
    cfg.whatsappAlertPhone ||
    cfg.phoneClean ||
    cfg.phoneDisplay ||
    process.env.STUDIO_WHATSAPP_PHONE ||
    process.env.CALLMEBOT_PHONE ||
    ''

  const targetPhoneClean = formatWhatsAppPhone(rawTargetPhone)

  if (!targetPhoneClean) {
    return {
      ok: false,
      error: 'No se ha configurado un número de WhatsApp para el estudio en Ajustes',
    }
  }

  // Generar texto del mensaje
  let messageText = ''
  if (options.customMessage) {
    messageText = options.customMessage
  } else if (options.appointment) {
    messageText = generateStudioWhatsAppAlertText(options.appointment, cfg.name || 'GoldBlack Lash')
  } else {
    messageText = `✨ *Prueba de Alerta WhatsApp — ${cfg.name || 'GoldBlack Lash'}*\n\n¡La conexión de WhatsApp está funcionando correctamente! Recibirás aquí un aviso instantáneo cada vez que una clienta reserve en la web.`
  }

  const provider = cfg.whatsappProvider || 'callmebot'

  // MÉTODO 1: CallMeBot API (Directo y Gratuito)
  if (provider === 'callmebot' || (!cfg.whatsappWebhookUrl && !process.env.WHATSAPP_WEBHOOK_URL)) {
    const apiKey =
      cfg.whatsappCallMeBotApiKey?.trim() ||
      process.env.CALLMEBOT_API_KEY ||
      process.env.VITE_CALLMEBOT_API_KEY ||
      ''

    if (!apiKey) {
      return {
        ok: false,
        error:
          'Falta la clave API de CallMeBot. Puedes obtenerla gratis en 15 segundos desde los Ajustes de la aplicación.',
      }
    }

    try {
      const encodedMsg = encodeURIComponent(messageText)
      const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${targetPhoneClean}&text=${encodedMsg}&apikey=${apiKey}`

      const res = await fetch(callMeBotUrl, {
        method: 'GET',
      })

      const responseText = await res.text().catch(() => '')

      // CallMeBot devuelve texto plano con confirmación o mensaje de error
      if (res.ok && !responseText.toLowerCase().includes('error')) {
        return {
          ok: true,
          message: 'Alerta de WhatsApp enviada correctamente a tu móvil',
        }
      } else {
        return {
          ok: false,
          error: responseText || `Error al despachar mensaje con CallMeBot (Código ${res.status})`,
        }
      }
    } catch (err: any) {
      console.error('[CallMeBot Error]', err)
      return {
        ok: false,
        error: err?.message || 'Error de conexión con el servidor de CallMeBot',
      }
    }
  }

  // MÉTODO 2: Webhook genérico (Make / Zapier / Twilio / n8n / Meta Cloud API)
  if (provider === 'webhook' || cfg.whatsappWebhookUrl || process.env.WHATSAPP_WEBHOOK_URL) {
    const webhookUrl =
      cfg.whatsappWebhookUrl?.trim() ||
      process.env.WHATSAPP_WEBHOOK_URL ||
      ''

    if (!webhookUrl) {
      return {
        ok: false,
        error: 'No se ha configurado la URL del Webhook de WhatsApp en Ajustes',
      }
    }

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: targetPhoneClean,
          message: messageText,
          appointment: options.appointment,
          timestamp: new Date().toISOString(),
          studio: cfg.name || 'GoldBlack Lash',
        }),
      })

      if (!webhookRes.ok) {
        return {
          ok: false,
          error: `El webhook respondió con error HTTP ${webhookRes.status}`,
        }
      }

      return {
        ok: true,
        message: 'Alerta despachada correctamente al webhook de WhatsApp',
      }
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]', err)
      return {
        ok: false,
        error: err?.message || 'Error al conectar con el webhook de WhatsApp',
      }
    }
  }

  return {
    ok: false,
    error: 'No hay ningún método de WhatsApp activo configurado',
  }
}
