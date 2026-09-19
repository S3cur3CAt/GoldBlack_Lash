/**
 * Servicio de Alertas Instantáneas por Telegram Bot para GoldBlack Lash Studio.
 * Despacho en 0 segundos con soporte nativo de HTML enriquecido y botones interactivos (Inline Keyboards).
 */

import { fetchConfigFromDb } from './config.server'
import { saveContactsToDb } from './appointments.server'

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
    const waUrl = `https://wa.me/${cleanPhone}`

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

/**
 * Configura el botón permanente de menú en Telegram para abrir el Panel Móvil de GoldBlack Lash
 */
export async function setupTelegramBotMenuButton(
  botToken: string,
  webAppUrl = 'https://www.goldblacklash.com/nueva-cita',
  buttonText = '💼 Panel Studio'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const endpoint = `https://api.telegram.org/bot${botToken}/setChatMenuButton`
    const payload = {
      menu_button: {
        type: 'web_app',
        text: buttonText,
        web_app: {
          url: webAppUrl,
        },
      },
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` }
    }

    // Configurar también comandos rápidos del bot
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'panel', description: '💼 Abrir Panel Móvil (Citas, Facturación, Clientas)' },
            { command: 'nueva', description: '📅 Formulario Rápido de Crear Cita' },
            { command: 'promo', description: '🔥 Ver Oferta Especial de Pestañas (23 €)' },
          ],
        }),
      })
    } catch {}

    // Configurar automáticamente el webhook para recepción instantánea de contactos
    try {
      await setTelegramBotWebhook(botToken)
    } catch {}

    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error al configurar botón de menú en Telegram' }
  }
}

/**
 * Conecta el Webhook oficial del Bot de Telegram para recibir mensajes y contactos en tiempo real
 */
export async function setTelegramBotWebhook(
  botToken: string,
  webhookUrl = 'https://www.goldblacklash.com/api/telegram'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message'],
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error al conectar Webhook de Telegram' }
  }
}

function parseVcardText(vcfText: string): Array<{ name: string; phone: string }> {
  const contacts: Array<{ name: string; phone: string }> = []
  const cards = vcfText.split(/BEGIN:VCARD/i)
  for (const card of cards) {
    if (!card.trim()) continue
    let name = ''
    let phone = ''
    const lines = card.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.toUpperCase().startsWith('FN:') || trimmed.toUpperCase().startsWith('FN;')) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx !== -1) name = trimmed.substring(colonIdx + 1).trim()
      } else if (!name && (trimmed.toUpperCase().startsWith('N:') || trimmed.toUpperCase().startsWith('N;'))) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx !== -1) {
          const parts = trimmed.substring(colonIdx + 1).split(';').filter(Boolean)
          name = parts.reverse().join(' ').trim()
        }
      } else if (!phone && (trimmed.toUpperCase().startsWith('TEL') || trimmed.toUpperCase().includes('.TEL'))) {
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx !== -1) phone = trimmed.substring(colonIdx + 1).trim()
      }
    }
    if (phone) {
      contacts.push({ name: name || 'Sin nombre', phone })
    }
  }
  return contacts
}

/**
 * Procesa actualizaciones entrantes enviadas por Telegram Webhook
 * Soporta: contactos compartidos desde WhatsApp/iPhone, archivos .vcf, comandos y texto
 */
export async function handleTelegramWebhookUpdate(
  update: any,
  botTokenOverride?: string
): Promise<{ ok: boolean; replySent?: boolean; error?: string }> {
  try {
    const liveConfig = await fetchConfigFromDb().catch(() => ({} as any))
    const botToken =
      botTokenOverride?.trim() ||
      liveConfig.telegramBotToken?.trim() ||
      process.env.TELEGRAM_BOT_TOKEN ||
      ''

    if (!botToken) return { ok: false, error: 'Sin bot token configurado' }

    const message = update.message || update.edited_message
    if (!message || !message.chat?.id) return { ok: true }

    const chatId = message.chat.id

    // 1. Caso: El usuario comparte un contacto (desde WhatsApp o Contactos del iPhone)
    if (message.contact) {
      const c = message.contact
      let phone = (c.phone_number || '').trim()
      if (!phone.startsWith('+') && phone.length >= 9) {
        phone = '+' + phone
      }
      const firstName = (c.first_name || '').trim()
      const lastName = (c.last_name || '').trim()
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Contacto'

      await saveContactsToDb([
        {
          name: fullName,
          phone: phone,
          source: 'telegram_bot',
          notes: 'Compartido desde WhatsApp o iPhone',
        },
      ])

      const cleanPhone = phone.replace(/\D/g, '')
      const webAppUrl = `https://www.goldblacklash.com/nueva-cita?clientName=${encodeURIComponent(fullName)}&clientPhone=${encodeURIComponent(phone)}`

      const text = [
        `✨ <b>¡Contacto sincronizado con éxito!</b>`,
        ``,
        `👤 <b>Clienta:</b> ${fullName}`,
        `📱 <b>Teléfono:</b> <code>${phone}</code>`,
        ``,
        `💎 <i>Guardado en tu agenda de GoldBlack Lash Studio.</i>`,
        `<i>Toca el botón de abajo para agendarle su cita al instante:</i>`,
      ].join('\n')

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `📅 Agendar Cita con ${firstName || 'Clienta'}`,
                  web_app: { url: webAppUrl },
                },
              ],
              [
                {
                  text: `💬 Abrir WhatsApp con ${firstName || 'Clienta'}`,
                  url: `https://wa.me/${cleanPhone}`,
                },
              ],
            ],
          },
        }),
      })

      return { ok: true, replySent: true }
    }

    // 2. Caso: Envío de archivo .vcf
    if (message.document && (message.document.file_name?.endsWith('.vcf') || message.document.mime_type?.includes('vcard'))) {
      const fileId = message.document.file_id
      const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
      const fileData = await getFileRes.json().catch(() => ({}))
      if (fileData.ok && fileData.result?.file_path) {
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`
        const vcfRes = await fetch(fileUrl)
        const vcfText = await vcfRes.text()
        const parsed = parseVcardText(vcfText)
        if (parsed.length > 0) {
          await saveContactsToDb(parsed)
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ <b>¡Agenda sincronizada!</b>\n\nSe han importado <b>${parsed.length} contactos</b> directamente a tu Mini App de GoldBlack Lash. Ya puedes seleccionarlos para tus citas.`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '💼 Abrir Mini App de Citas',
                      web_app: { url: 'https://www.goldblacklash.com/nueva-cita' },
                    },
                  ],
                ],
              },
            }),
          })
          return { ok: true, replySent: true }
        }
      }
    }

    // 3. Caso: Comandos /start o /panel
    const text = (message.text || '').trim()
    if (text === '/start' || text === '/panel' || text === '/menu') {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: [
            `✨ <b>Bienvenida al Bot Oficial de GoldBlack Lash Studio</b>`,
            ``,
            `📱 <b>Sincronización instantánea de contactos:</b>`,
            `• Puedes <b>compartirme cualquier contacto</b> desde WhatsApp o tu iPhone y se guardará automáticamente en tu agenda.`,
            `• O toca el botón abajo para entrar al panel de gestión y crear citas:`,
          ].join('\n'),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '💼 Abrir Panel Móvil y Citas',
                  web_app: { url: 'https://www.goldblacklash.com/nueva-cita' },
                },
              ],
            ],
          },
        }),
      })
      return { ok: true, replySent: true }
    }

    // 4. Caso: El usuario escribe un texto con teléfono y nombre
    const phoneMatches = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/)
    if (phoneMatches) {
      const phone = phoneMatches[0].trim()
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length >= 8) {
        let name = text.replace(phone, '').replace(/[•\-\:\;\|\,\(\)\*\_]/g, ' ').replace(/\s+/g, ' ').trim()
        name = name.replace(/^(nombre|tel[eé]fono|celular|whatsapp|wa|m[oó]vil|contacto)\s*:?/i, '').trim()
        const clientName = name || 'Contacto'

        await saveContactsToDb([
          {
            name: clientName,
            phone: phone,
            source: 'telegram_text',
            notes: 'Enviado por chat de Telegram',
          },
        ])

        const webAppUrl = `https://www.goldblacklash.com/nueva-cita?clientName=${encodeURIComponent(clientName)}&clientPhone=${encodeURIComponent(phone)}`

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✨ <b>¡Contacto detectado y guardado!</b>\n\n👤 <b>Clienta:</b> ${clientName}\n📱 <b>Teléfono:</b> <code>${phone}</code>\n\n<i>Ya está guardado en tu agenda de GoldBlack Lash.</i>`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: `📅 Agendar Cita con ${clientName}`,
                    web_app: { url: webAppUrl },
                  },
                ],
              ],
            },
          }),
        })
        return { ok: true, replySent: true }
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err)
    return { ok: false, error: err?.message || 'Error procesando webhook' }
  }
}

/**
 * Genera el mensaje formateado con estilo formal para WhatsApp de la clienta
 */
export function generateWhatsAppBookingConfirmationMessage(data: {
  clientName: string
  date: string
  time: string
  serviceName: string
  price?: number | string
  studioName?: string
  address?: string
}): string {
  const studio = data.studioName || 'GoldBlack Lash'
  const address = data.address || 'Calle Numa, Montequinto (Dos Hermanas)'
  const priceFormatted = data.price ? `\n💶 *Precio:* ${data.price} €` : ''

  return [
    `✨ *Confirmación de Cita — ${studio}* ✨`,
    `🌐 https://www.goldblacklash.com/`,
    ``,
    `¡Hola *${data.clientName}*! Tu cita ha sido confirmada con éxito en nuestro estudio:`,
    ``,
    `📅 *Fecha:* ${data.date}`,
    `⏰ *Hora:* ${data.time}`,
    `🌸 *Tratamiento:* ${data.serviceName}${priceFormatted}`,
    `📍 *Ubicación:* ${address}`,
    ``,
    `*Pautas para tu sesión:*`,
    `• Acude con la zona de los ojos completamente desmaquillada (sin rímel ni sombras).`,
    `• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la puesta.`,
    ``,
    `Si necesitas modificar tu horario o tienes cualquier consulta, puedes respondernos directamente por aquí.`,
    ``,
    `¡Te esperamos con ganas! 💕`,
    `${studio}`,
  ].join('\n')
}

