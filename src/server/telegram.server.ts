/**
 * Servicio de Alertas Instantáneas por Telegram Bot para GoldBlack Lash Studio.
 * Despacho en 0 segundos con soporte nativo de HTML enriquecido y botones interactivos (Inline Keyboards).
 */

export interface TelegramAppointmentData {
  id?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  serviceName?: string
  date?: string
  time?: string
  price?: number | string
  duration?: number | string
  notes?: string
}

export interface SendTelegramAlertOptions {
  appointment?: TelegramAppointmentData
  customMessage?: string
  config?: {
    name?: string
    telegramAlertsEnabled?: boolean
    telegramBotToken?: string
    telegramChatId?: string
    siteUrl?: string
  }
}

/**
 * Normaliza números de teléfono para generar enlaces universales de WhatsApp (wa.me)
 */
export function formatWhatsAppCleanPhone(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '')
  if (clean.length === 9 && /^[6789]/.test(clean)) {
    clean = '34' + clean
  }
  return clean
}

/**
 * Genera el mensaje en formato HTML enriquecido con diseño luxury para Telegram
 */
export function generateTelegramAlertHtml(
  apt: TelegramAppointmentData,
  studioName = 'GoldBlack Lash'
): string {
  const dateStr = apt.date || 'Pendiente'
  const timeStr = apt.time ? `${apt.time} h` : 'Por acordar'
  const clientName = apt.clientName || 'Clienta'
  const serviceName = apt.serviceName || 'Servicio de Pestañas'
  const phone = apt.clientPhone || 'No facilitado'
  const email = apt.clientEmail || 'No indicado'
  const price = apt.price ? `${apt.price} €` : ''
  const duration = apt.duration ? `${apt.duration} min` : ''

  return [
    `✨ <b>¡NUEVA CITA REGISTRADA!</b> — <b>${studioName}</b>`,
    ``,
    `<blockquote>`,
    `👤 <b>Clienta:</b> ${clientName}`,
    `💅 <b>Tratamiento:</b> ${serviceName}`,
    price || duration ? `💎 <b>Detalles:</b> ${[price, duration].filter(Boolean).join(' • ')}` : '',
    `📅 <b>Fecha y Hora:</b> <code>${dateStr} a las ${timeStr}</code>`,
    `📱 <b>Teléfono / WhatsApp:</b> <code>${phone}</code>`,
    email !== 'No indicado' ? `✉️ <b>Correo:</b> <i>${email}</i>` : '',
    apt.notes ? `📝 <b>Notas:</b> <i>${apt.notes}</i>` : '',
    `</blockquote>`,
    ``,
    `⚡ <i>Recibido al instante desde la web oficial de ${studioName}. Pulsa abajo para hablar directamente con la clienta:</i>`,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

/**
 * Despacha un mensaje de alerta a Telegram mediante la API oficial de Telegram Bot.
 * Soporta HTML enriquecido y botones interactivos para abrir WhatsApp o llamar a la clienta con un toque.
 */
export async function sendStudioTelegramAlert(
  options: SendTelegramAlertOptions
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const cfg = options.config || {}

  // 1. Comprobar si las alertas de Telegram están activadas
  if (cfg.telegramAlertsEnabled === false) {
    return { ok: false, error: 'Las alertas de Telegram están desactivadas en la configuración' }
  }

  // 2. Obtener Token del Bot y Chat ID (desde la configuración dinámica de la app o variables de entorno)
  const botToken =
    cfg.telegramBotToken?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ''

  const chatId =
    cfg.telegramChatId?.trim() ||
    process.env.TELEGRAM_CHAT_ID ||
    ''

  if (!botToken) {
    return {
      ok: false,
      error: 'Falta el Token del Bot de Telegram. Puedes configurarlo en Ajustes de la aplicación.',
    }
  }

  if (!chatId) {
    return {
      ok: false,
      error: 'Falta tu Chat ID de Telegram. Puedes configurarlo en Ajustes de la aplicación.',
    }
  }

  // 3. Preparar mensaje en HTML
  let messageHtml = ''
  let cleanPhone = ''

  if (options.customMessage) {
    messageHtml = options.customMessage
  } else if (options.appointment) {
    messageHtml = generateTelegramAlertHtml(options.appointment, cfg.name || 'GoldBlack Lash')
    cleanPhone = formatWhatsAppCleanPhone(options.appointment.clientPhone || '')
  } else {
    messageHtml = [
      `✨ <b>Prueba de Conexión — ${cfg.name || 'GoldBlack Lash'}</b>`,
      ``,
      `<blockquote>`,
      `✅ ¡Tu Bot de Telegram está conectado y funcionando en tiempo real!`,
      `⚡ Las alertas de nuevas reservas llegarán a este chat en <b>0 segundos</b>.`,
      `</blockquote>`,
      ``,
      `<i>Notificación de prueba generada desde el Panel de Administración.</i>`,
    ].join('\n')
  }

  // 4. Preparar botones interactivos (Inline Keyboard) si hay teléfono de clienta
  const inlineKeyboard: Array<Array<{ text: string; url: string }>> = []

  if (cleanPhone) {
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hola ${options.appointment?.clientName || ''}, te escribo desde GoldBlack Lash sobre tu cita del ${options.appointment?.date || ''} a las ${options.appointment?.time || ''}.`
    )}`

    inlineKeyboard.push([
      { text: '💬 Abrir WhatsApp de la Clienta', url: waUrl },
    ])
  }

  // 5. Llamada directa a Telegram Bot API (sendPhoto o sendMessage)
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text: messageHtml,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }

    if (inlineKeyboard.length > 0) {
      payload.reply_markup = {
        inline_keyboard: inlineKeyboard,
      }
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data.ok) {
      const errorMsg = data.description || `Error ${res.status} de la API de Telegram`
      console.warn('[Telegram Alert Error]', errorMsg)
      return { ok: false, error: errorMsg }
    }

    return {
      ok: true,
      message: 'Alerta instantánea enviada con éxito a Telegram',
    }
  } catch (err: any) {
    console.error('[Telegram Connection Error]', err)
    return {
      ok: false,
      error: err?.message || 'Error de conexión con el servidor de Telegram',
    }
  }
}
