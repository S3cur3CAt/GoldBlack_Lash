import React, { useState, useEffect } from 'react'
import { Appointment, Client, StudioConfig, AdminService, AppointmentStatus } from '../types/admin'
import {
  IconMail,
  IconSend,
  IconCheck,
  IconClock,
  IconSparkles,
  IconMessageSquare,
  IconX,
  IconCopy,
  IconAlertCircle,
  IconWhatsApp,
  IconCalendar,
} from './Icons'
import { sendEmailViaResend } from '../services/storage'
import { formatWhatsAppPhone } from './WhatsAppModal'

export type EmailModalMode = 'confirmar' | 'recordar' | 'cuidados' | 'responder' | 'retoque'
export type CommunicationChannel = 'whatsapp' | 'email'

export const parseDurationMinutes = (durationStr?: string): number => {
  const d = (durationStr || '').toLowerCase()
  if (d.includes('30 min') || d.includes('30m')) return 30
  if (d.includes('1 h 15') || d.includes('1h 15') || d.includes('75 min') || d.includes('75m')) return 75
  if (d.includes('1 h 30') || d.includes('1h 30') || d.includes('90 min') || d.includes('90m')) return 90
  if (d.includes('2 h 30') || d.includes('2h 30') || d.includes('150 min')) return 150
  if (d.includes('2 h') || d.includes('2h') || d.includes('120 min')) return 120
  if (d.includes('1 h') || d.includes('1h') || d.includes('60 min')) return 60
  if (d.includes('45 min') || d.includes('45m')) return 45
  return 90
}

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: Appointment | null
  client?: Client | null
  config: StudioConfig
  services?: AdminService[]
  initialMode?: EmailModalMode
  initialChannel?: CommunicationChannel
  onSaveAppointment?: (appointment: Appointment) => void
  onClientEmailUpdated?: (email: string) => void
  onClientPhoneUpdated?: (phone: string) => void
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  client,
  config,
  services = [],
  initialMode = 'confirmar',
  initialChannel,
  onSaveAppointment,
  onClientEmailUpdated,
  onClientPhoneUpdated,
}) => {
  const [channel, setChannel] = useState<CommunicationChannel>(
    initialChannel || (appointment?.clientPhone || client?.phone ? 'whatsapp' : 'email')
  )
  const [mode, setMode] = useState<EmailModalMode>(initialMode)

  // Client Details
  const [clientName, setClientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  // Appointment Details (Date, Time, Service, Price, Notes, Status)
  const [aptDate, setAptDate] = useState('')
  const [aptTime, setAptTime] = useState('')
  const [aptServiceId, setAptServiceId] = useState('')
  const [aptServiceName, setAptServiceName] = useState('')
  const [aptPrice, setAptPrice] = useState<number>(30)
  const [aptDuration, setAptDuration] = useState<number>(90)
  const [aptStatus, setAptStatus] = useState<AppointmentStatus>('pendiente')
  const [aptNotes, setAptNotes] = useState('')

  // Message Content
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')

  // UI States
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Genera plantillas dinámicas según los datos actuales de la cita (reactivo al cambio de hora, fecha o servicio)
  const generateTemplates = (
    targetMode: EmailModalMode,
    cName: string,
    cDate: string,
    cTime: string,
    cService: string,
    cPrice: number,
    cNotes: string
  ): { subject: string; message: string; whatsappMessage: string } => {
    const studioName = config.name || 'GoldBlack Lash'
    const address = config.address ? `${config.address}, ${config.city}` : 'Montequinto, Dos Hermanas'
    const phone = config.phoneDisplay || '+34 604 18 76 76'
    const safeName = cName.trim() || 'Clienta'
    const safeDate = cDate || new Date().toISOString().split('T')[0]
    const safeTime = cTime || '11:00'
    const safeService = cService || 'Tratamiento de Pestañas'
    const safePrice = cPrice || 30

    switch (targetMode) {
      case 'confirmar':
        return {
          subject: `✨ Confirmación de Cita — ${studioName}`,
          message: `https://www.goldblacklash.com/\n\nHola ${safeName},\n\nTu cita en ${studioName} ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio.\n\n📅 Fecha: ${safeDate}\n⏰ Hora: ${safeTime}\n🌸 Tratamiento: ${safeService}\n💶 Precio: ${safePrice} €\n📍 Ubicación: ${address}\n\nPor favor, recuerda acudir con los ojos limpios, sin restos de maquillaje ni rímel. Si utilizas lentillas, te recomendamos traer estuche para retirarlas durante la sesión.\n\nSi necesitas realizar cualquier cambio en tu reserva, responde a este correo o llámanos al ${phone}.\n\n¡Te esperamos!`,
          whatsappMessage: `✨ *Confirmación de Cita — ${studioName}* ✨\n🌐 https://www.goldblacklash.com/\n\n¡Hola *${safeName}*! Tu cita ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio:\n\n📅 *Fecha:* ${safeDate}\n⏰ *Hora:* ${safeTime}\n🌸 *Tratamiento:* ${safeService}\n💶 *Precio:* ${safePrice} €\n📍 *Ubicación:* ${address}\n\n*Pautas para tu sesión:*\n• Acude con los ojos limpios, sin restos de maquillaje ni rímel.\n• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la puesta.\n\nSi necesitas modificar tu horario o tienes alguna duda, puedes respondernos directamente por aquí o llamarnos al ${phone}.\n\n¡Te esperamos con muchas ganas! 💕`,
        }

      case 'recordar':
        return {
          subject: `🗓 Recordatorio de Cita — ${studioName}`,
          message: `https://www.goldblacklash.com/\n\nHola ${safeName},\n\nTe recordamos tu cita para mañana en ${studioName}:\n\n📅 Fecha: ${safeDate}\n⏰ Hora: ${safeTime}\n🌸 Tratamiento: ${safeService}\n📍 Dirección: ${address}\n\nRecomendaciones para tu sesión:\n• Acudir sin maquillaje en ojos ni restos de máscara de pestañas.\n• Evitar cremas grasas u oleosas en el contorno de ojos las horas previas.\n\nSi necesitas modificar tu horario, por favor avísanos con la mayor antelación posible.\n\n¡Hasta pronto!`,
          whatsappMessage: `🗓 *Recordatorio de Cita — ${studioName}* 🗓\n🌐 https://www.goldblacklash.com/\n\n¡Hola *${safeName}*! Te recordamos con cariño tu cita programada para mañana:\n\n📅 *Fecha:* ${safeDate}\n⏰ *Hora:* ${safeTime}\n🌸 *Tratamiento:* ${safeService}\n📍 *Dirección:* ${address}\n\n*Recomendaciones:*\n• Acude sin maquillaje en pestañas ni párpados.\n• Evita cafeína o bebidas estimulantes justo antes de la cita para una mayor relajación.\n\nPor favor, si necesitas realizar cualquier cambio avísanos con antelación.\n\n¡Hasta mañana! ✨`,
        }

      case 'cuidados':
        return {
          subject: `🌸 Recomendaciones y Cuidados Previos — ${studioName}`,
          message: `https://www.goldblacklash.com/\n\nHola ${safeName},\n\nPara que tu sesión de ${safeService} en ${studioName} sea perfecta y obtengas la máxima retención y duración en tus extensiones, te compartimos estas recomendaciones:\n\n1. Higiene: Acude con las pestañas completamente desmaquilladas y libres de grasa.\n2. Lentillas: Es preferible retirarlas antes de comenzar la aplicación.\n3. Cafeína: Recomendamos evitar café o bebidas estimulantes justo antes para tener los párpados relajados.\n\nCualquier duda que tengas, estamos a tu entera disposición.\n\n¡Un saludo cordial!`,
          whatsappMessage: `🌸 *Recomendaciones y Cuidados Previos — ${studioName}* 🌸\n🌐 https://www.goldblacklash.com/\n\n¡Hola *${safeName}*! Para que tu sesión de *${safeService}* quede impecable y obtengas la máxima retención y duración en tus extensiones, te compartimos estos consejos:\n\n1️⃣ *Higiene total:* Acude con las pestañas bien limpias, sin restos de máscara, delineador ni sombras.\n2️⃣ *Lentillas:* Es preferible retirarlas antes de comenzar la sesión.\n3️⃣ *Relax:* Procura evitar café o bebidas energéticas antes para tener los párpados completamente tranquilos.\n\nCualquier duda que tengas, estamos aquí para ayudarte.\n\n¡Un abrazo! 💖`,
        }

      case 'retoque':
        return {
          subject: `💖 ¡Hora de mimar tu mirada! Retoque en ${studioName}`,
          message: `https://www.goldblacklash.com/\n\nHola ${safeName},\n\nEsperamos que estés teniendo una excelente semana. Hemos visto que han pasado varias semanas desde tu última puesta de pestañas.\n\nPara mantener tu set siempre tupido, equilibrado y uniforme, lo ideal es realizar un retoque a las 2 o 3 semanas.\n\n¿Te gustaría que te reservemos un hueco estos días? Responde a este correo indicándonos qué días u horarios te vienen mejor y coordinamos tu cita.\n\n¡Nos encantará verte de nuevo!`,
          whatsappMessage: `💖 *¡Momento de renovar tu mirada! — ${studioName}* 💖\n🌐 https://www.goldblacklash.com/\n\n¡Hola *${safeName}*! Esperamos que estés genial.\n\nHemos visto que han pasado más de 20 días desde tu última puesta de extensiones. Para que tu mirada se mantenga siempre tupida, uniforme y en su máxima expresión, es el momento ideal para realizar tu *mantenimiento/retoque*.\n\n¿Te gustaría que te reservemos un hueco estos días? Indícanos qué días u horarios te vienen mejor y coordinamos tu cita enseguida.\n\n¡Nos encantará verte de nuevo en el estudio! ✨`,
        }

      case 'responder':
        const noteContext = cNotes.trim()
          ? `Respecto a lo que nos comentabas en tu reserva ("${cNotes.trim()}"):\n\n`
          : ''
        return {
          subject: `💬 Respuesta de ${studioName} sobre tu cita`,
          message: `https://www.goldblacklash.com/\n\nHola ${safeName},\n\nTe escribimos desde ${studioName} en relación a tu consulta sobre tu cita de ${safeService}:\n\n${noteContext}Gracias por comunicarte con nosotras. [Escribe aquí tu respuesta]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\nAtentamente,\n${studioName}`,
          whatsappMessage: `💬 *Hola ${safeName}*,\n🌐 https://www.goldblacklash.com/\n\nTe escribimos desde *${studioName}*:\n\n${noteContext}[Escribe aquí tu mensaje...]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\n¡Un saludo cordial! ✨`,
        }
    }
  }

  // Sincronizar estado cuando se abre el modal con los datos de la cita
  useEffect(() => {
    if (isOpen) {
      const email = appointment?.clientEmail || client?.email || ''
      const phone = appointment?.clientPhone || client?.phone || ''
      const name = appointment?.clientName || client?.name || 'Clienta'
      const date = appointment?.date || new Date().toISOString().split('T')[0]
      const time = appointment?.time || '11:00'
      const sName = appointment?.serviceName || services[0]?.name || 'Tratamiento de Pestañas'
      const sId = appointment?.serviceId || services[0]?.id || ''
      const price = appointment?.price ?? services[0]?.priceNumber ?? 30
      const duration = appointment?.durationMinutes || 90
      const status = appointment?.status || 'pendiente'
      const notes = appointment?.notes || ''

      setClientName(name)
      setRecipientEmail(email)
      setRecipientPhone(phone)
      setAptDate(date)
      setAptTime(time)
      setAptServiceId(sId)
      setAptServiceName(sName)
      setAptPrice(price)
      setAptDuration(duration)
      setAptStatus(status)
      setAptNotes(notes)

      setMode(initialMode)
      if (initialChannel) {
        setChannel(initialChannel)
      } else {
        setChannel(phone ? 'whatsapp' : 'email')
      }

      const tpl = generateTemplates(initialMode, name, date, time, sName, price, notes)
      setSubject(tpl.subject)
      setMessage(tpl.message)
      setWhatsappMessage(tpl.whatsappMessage)
      setSendSuccess(null)
      setError(null)
      setIsSending(false)
      setCopied(false)
    }
  }, [isOpen, appointment, client, initialMode, initialChannel, services])

  // Cambio reactivo de fecha, hora, servicio o precio: actualiza la cita y las plantillas en tiempo real
  const handleAppointmentFieldChange = (fields: {
    date?: string
    time?: string
    serviceId?: string
    serviceName?: string
    price?: number
    duration?: number
    notes?: string
    clientName?: string
  }) => {
    const updatedDate = fields.date !== undefined ? fields.date : aptDate
    const updatedTime = fields.time !== undefined ? fields.time : aptTime
    const updatedServiceId = fields.serviceId !== undefined ? fields.serviceId : aptServiceId
    const updatedServiceName = fields.serviceName !== undefined ? fields.serviceName : aptServiceName
    const updatedPrice = fields.price !== undefined ? fields.price : aptPrice
    const updatedDuration = fields.duration !== undefined ? fields.duration : aptDuration
    const updatedNotes = fields.notes !== undefined ? fields.notes : aptNotes
    const updatedName = fields.clientName !== undefined ? fields.clientName : clientName

    if (fields.date !== undefined) setAptDate(updatedDate)
    if (fields.time !== undefined) setAptTime(updatedTime)
    if (fields.serviceId !== undefined) setAptServiceId(updatedServiceId)
    if (fields.serviceName !== undefined) setAptServiceName(updatedServiceName)
    if (fields.price !== undefined) setAptPrice(updatedPrice)
    if (fields.duration !== undefined) setAptDuration(updatedDuration)
    if (fields.notes !== undefined) setAptNotes(updatedNotes)
    if (fields.clientName !== undefined) setClientName(updatedName)

    // Regenerar plantillas automáticamente para que el nuevo horario o servicio aparezca en WhatsApp y Correo
    const tpl = generateTemplates(
      mode,
      updatedName,
      updatedDate,
      updatedTime,
      updatedServiceName,
      updatedPrice,
      updatedNotes
    )
    setSubject(tpl.subject)
    setMessage(tpl.message)
    setWhatsappMessage(tpl.whatsappMessage)
  }

  const handleModeChange = (newMode: EmailModalMode) => {
    setMode(newMode)
    const tpl = generateTemplates(
      newMode,
      clientName,
      aptDate,
      aptTime,
      aptServiceName,
      aptPrice,
      aptNotes
    )
    setSubject(tpl.subject)
    setMessage(tpl.message)
    setWhatsappMessage(tpl.whatsappMessage)
    setError(null)
  }

  // Construye y guarda la cita actualizada en la base de datos
  const saveAppointmentChanges = (newStatus?: AppointmentStatus): Appointment | null => {
    if (!appointment) return null
    const finalStatus = newStatus || (mode === 'confirmar' ? 'confirmada' : aptStatus)
    const updated: Appointment = {
      ...appointment,
      clientName: clientName.trim() || appointment.clientName,
      clientPhone: recipientPhone.trim() || appointment.clientPhone,
      clientEmail: recipientEmail.trim() || appointment.clientEmail,
      date: aptDate || appointment.date,
      time: aptTime || appointment.time,
      serviceId: aptServiceId || appointment.serviceId,
      serviceName: aptServiceName || appointment.serviceName,
      price: aptPrice,
      durationMinutes: aptDuration,
      status: finalStatus,
      notes: aptNotes,
    }

    if (onSaveAppointment) {
      onSaveAppointment(updated)
    }
    if (recipientPhone && onClientPhoneUpdated) {
      onClientPhoneUpdated(recipientPhone)
    }
    if (recipientEmail && onClientEmailUpdated) {
      onClientEmailUpdated(recipientEmail)
    }
    setAptStatus(finalStatus)
    return updated
  }

  const cleanPhone = formatWhatsAppPhone(recipientPhone)
  const isPhoneValid = cleanPhone.length >= 9
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())

  const handleCopy = () => {
    const textToCopy = channel === 'whatsapp' ? whatsappMessage : `Asunto: ${subject}\n\n${message}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Despacho directo a la aplicación nativa de WhatsApp en macOS Monterey (guardando la cita con la nueva hora)
  const handleOpenWhatsApp = async (target: 'app' | 'web' = 'app') => {
    if (!isPhoneValid) {
      setError('Por favor, indica un número de teléfono móvil válido para la clienta (mínimo 9 dígitos).')
      return
    }
    setError(null)

    // Guardar automáticamente la cita (actualizando hora, fecha, servicio y estado 'confirmada')
    saveAppointmentChanges(mode === 'confirmar' ? 'confirmada' : undefined)

    const textToSend = whatsappMessage || message
    const nativeUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(textToSend)}`
    const universalUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`

    // App nativa de macOS Monterey / Desktop
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal) {
      try {
        const res = await (window as any).electronAPI.openExternal(nativeUrl)
        if (res && res.ok === false) {
          console.warn('[WhatsApp] Protocolo whatsapp:// falló, abriendo universal:', res.error)
          await (window as any).electronAPI.openExternal(universalUrl)
        }
      } catch (err) {
        console.warn('[WhatsApp] Error lanzando app nativa, abriendo universal:', err)
        await (window as any).electronAPI.openExternal(universalUrl)
      }
    } else {
      window.location.href = nativeUrl
      setTimeout(() => {
        window.open(universalUrl, '_blank', 'noopener,noreferrer')
      }, 1200)
    }

    setSendSuccess(`¡Cita guardada y chat de WhatsApp abierto para ${clientName} (${aptDate} a las ${aptTime})!`)
    setTimeout(() => {
      setSendSuccess(null)
    }, 4000)
  }

  // Despacho por Correo (Resend) con guardado automático de la nueva hora
  const handleSendEmail = async () => {
    const trimmedEmail = recipientEmail.trim()
    if (!trimmedEmail || !isEmailValid) {
      setError('Por favor, indica una dirección de correo válida para la clienta.')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      // Guardar cita con la hora y fecha actualizadas
      saveAppointmentChanges(mode === 'confirmar' ? 'confirmada' : undefined)

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c10; color: #f0f0f5; padding: 40px 30px; border-radius: 16px; border: 1px solid #28283c;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; font-size: 24px; letter-spacing: 0.05em; margin: 0 0 8px 0; text-transform: uppercase;">
              ${config.name}
            </h1>
            <p style="color: #888899; font-size: 13px; margin: 0 0 8px 0;">
              ${config.tagline}
            </p>
            <p style="margin: 0;">
              <a href="https://www.goldblacklash.com/" target="_blank" rel="noopener noreferrer" style="color: #d4af37; text-decoration: underline; font-size: 13px; font-weight: 500;">
                https://www.goldblacklash.com/
              </a>
            </p>
          </div>
          
          <div style="background-color: #14141c; border: 1px solid #232332; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
              ${subject}
            </h2>
            <div style="font-size: 14px; line-height: 1.7; color: #d0d0dc; white-space: pre-line;">
              ${message}
            </div>
          </div>
          
          <div style="border-top: 1px solid #222230; padding-top: 20px; font-size: 11px; color: #666677; text-align: center; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;"><strong>${config.name}</strong> • ${config.address}, ${config.city}</p>
            <p style="margin: 0;">Teléfono de atención: ${config.phoneDisplay} | ${config.email}</p>
          </div>
        </div>
      `

      const result = await sendEmailViaResend({
        to: trimmedEmail,
        subject,
        text: message,
        html: emailHtml,
        from: config.senderEmail || undefined,
        apiKey: config.resendApiKey || undefined,
      })

      if (!result.ok) {
        throw new Error(result.error || 'Error al enviar correo corporativo')
      }

      setSendSuccess(`¡Cita guardada y correo enviado con éxito a ${recipientEmail}!`)
      setTimeout(() => {
        onClose()
      }, 1600)
    } catch (err: any) {
      console.error('[Send Email Error]', err)
      setError(
        err.message ||
          'Error al conectar con Resend. Verifica que tu API Key esté configurada en Ajustes.'
      )
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  const getModeTitle = () => {
    switch (mode) {
      case 'confirmar':
        return 'Confirmación de Cita'
      case 'recordar':
        return 'Recordatorio de Cita 24h'
      case 'cuidados':
        return 'Cuidados y Recomendaciones Previas'
      case 'retoque':
        return 'Invitar a Retoque / Mantenimiento'
      case 'responder':
        return 'Respuesta Personalizada'
    }
  }

  const getModeTheme = () => {
    switch (mode) {
      case 'confirmar':
        return {
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          bg: 'bg-blue-500/15',
          activeTab: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        }
      case 'recordar':
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/15',
          activeTab: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        }
      case 'cuidados':
        return {
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/15',
          activeTab: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        }
      case 'retoque':
        return {
          text: 'text-rose-400',
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/15',
          activeTab: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        }
      case 'responder':
        return {
          text: 'text-gold-400',
          border: 'border-gold-500/30',
          bg: 'bg-gold-500/15',
          activeTab: 'bg-gold-500/20 text-gold-300 border-gold-500/40',
        }
    }
  }

  const theme = getModeTheme()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-5xl rounded-2xl bg-ink-900 border border-line shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-gradient-to-r from-ink-950 via-ink-900 to-ink-850">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-md transition-colors ${theme.bg} ${theme.text} ${theme.border}`}
            >
              {mode === 'confirmar' && <IconCheck size={20} />}
              {mode === 'recordar' && <IconClock size={20} />}
              {mode === 'cuidados' && <IconSparkles size={20} />}
              {mode === 'retoque' && <span className="text-base">💖</span>}
              {mode === 'responder' && <IconMessageSquare size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base tracking-tight leading-none">
                {getModeTitle()}
              </h3>
              <p className="text-xs text-muted mt-1 leading-none">
                Gestión y horario de cita con <strong className="text-gold-300 font-semibold">{clientName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Horizontal Menu Bar: Templates on Left, Channel Tabs on Right (Single unified horizontal row) */}
        <div className="px-5 py-2.5 bg-ink-950/50 border-b border-line flex flex-wrap items-center justify-between gap-3">
          {/* Left: Template Selector Pills (Horizontal) */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => handleModeChange('confirmar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'confirmar'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconCheck size={13} className="text-blue-400" />
              <span>Confirmar Cita</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('recordar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'recordar'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconClock size={13} className="text-emerald-400" />
              <span>Recordatorio 24h</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('cuidados')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'cuidados'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconSparkles size={13} className="text-purple-400" />
              <span>Cuidados Previos</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('retoque')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'retoque'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <span>💖</span>
              <span>Invitar a Retoque</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('responder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                mode === 'responder'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconMessageSquare size={13} className="text-gold-400" />
              <span>Personalizado</span>
            </button>
          </div>

          {/* Right: Channel Switcher (Horizontal tabs) */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-ink-850 border border-line shrink-0">
            <button
              type="button"
              onClick={() => {
                setChannel('whatsapp')
                setError(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
              }`}
            >
              <IconWhatsApp size={14} className="text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChannel('email')
                setError(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                channel === 'email'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
              }`}
            >
              <IconMail size={14} className="text-gold-400" />
              <span>Correo</span>
            </button>
          </div>
        </div>

        {/* Horizontal Appointment Details & Schedule Editor (Fecha, Hora acordada, Servicio, Precio, Móvil, Correo) */}
        <div className="px-5 py-3 bg-ink-850/50 border-b border-line">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 items-end">
            {/* 1. Date Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
                <IconCalendar size={12} className="text-gold-400" />
                <span>Fecha</span>
              </label>
              <input
                type="date"
                value={aptDate}
                onChange={(e) => handleAppointmentFieldChange({ date: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ink-800 border border-line text-xs text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            {/* 2. Time Selector / Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
                <IconClock size={12} className="text-emerald-400" />
                <span>Hora Acordada *</span>
              </label>
              <input
                type="time"
                value={aptTime}
                onChange={(e) => handleAppointmentFieldChange({ time: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ink-800 border border-line text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* 3. Service Dropdown */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
                <IconSparkles size={12} className="text-purple-400" />
                <span>Servicio / Tratamiento</span>
              </label>
              <select
                value={aptServiceId}
                onChange={(e) => {
                  const sId = e.target.value
                  const matchedService = services.find((s) => s.id === sId)
                  const dur = matchedService ? parseDurationMinutes(matchedService.duration) : aptDuration
                  handleAppointmentFieldChange({
                    serviceId: sId,
                    serviceName: matchedService ? matchedService.name : aptServiceName,
                    price: matchedService ? matchedService.priceNumber : aptPrice,
                    duration: dur,
                  })
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-ink-800 border border-line text-xs text-white focus:outline-none focus:border-purple-400"
              >
                {services && services.length > 0 ? (
                  services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.price} ({s.duration})
                    </option>
                  ))
                ) : (
                  <option value={aptServiceId}>{aptServiceName}</option>
                )}
              </select>
            </div>

            {/* 4. WhatsApp Phone */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
                <IconWhatsApp size={12} className="text-emerald-400" />
                <span>Móvil WhatsApp</span>
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => {
                  setRecipientPhone(e.target.value)
                  setError(null)
                }}
                placeholder="604187676"
                className="w-full px-2.5 py-1.5 rounded-lg bg-ink-800 border border-line text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 5. Client Email */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 mb-1 flex items-center gap-1">
                <IconMail size={12} className="text-gold-400" />
                <span>Correo Clienta</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value)
                  setError(null)
                }}
                placeholder="clienta@correo.com"
                className="w-full px-2.5 py-1.5 rounded-lg bg-ink-800 border border-line text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
        </div>

        {/* Modal Body: Horizontal 2-Column Split (Editor on Left, Live Preview on Right) */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch min-h-[300px]">
            {/* Column 1 (Left): Text Editor */}
            <div className="flex flex-col space-y-3">
              {channel === 'whatsapp' ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300">
                      Mensaje de WhatsApp ({whatsappMessage.length} caracteres)
                    </label>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-[11px] text-gray-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <IconCopy size={13} />
                      <span>{copied ? '¡Copiado!' : 'Copiar mensaje'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full flex-1 min-h-[220px] p-3 rounded-xl bg-ink-800 border border-line text-xs text-gray-100 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-y custom-scrollbar"
                    placeholder="Mensaje que recibirá la clienta en WhatsApp..."
                  />
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="modal-email-subject" className="block text-xs font-semibold text-gray-300 mb-1">
                      Asunto del Correo *
                    </label>
                    <input
                      id="modal-email-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Asunto..."
                      className="w-full px-3 py-1.5 rounded-xl bg-ink-800 border border-line text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-email-msg" className="text-xs font-semibold text-gray-300">
                      Cuerpo del Mensaje de Correo
                    </label>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-[11px] text-gray-400 hover:text-gold-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <IconCopy size={13} />
                      <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
                    </button>
                  </div>
                  <textarea
                    id="modal-email-msg"
                    rows={9}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full flex-1 min-h-[170px] p-3 rounded-xl bg-ink-800 border border-line text-xs text-gray-200 focus:outline-none focus:border-gold-500/50 font-sans leading-relaxed resize-y custom-scrollbar"
                  />
                </>
              )}
            </div>

            {/* Column 2 (Right): Live Real-Time Preview (Side-by-Side) */}
            <div className="flex flex-col">
              {channel === 'whatsapp' ? (
                <div className="h-full flex flex-col rounded-2xl bg-[#0b141a] border border-line overflow-hidden shadow-inner p-3.5">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold border-b border-white/5 pb-2 mb-2">
                    <span className="flex items-center gap-1.5">
                      <IconWhatsApp size={13} />
                      Vista Previa en WhatsApp (Móvil de {clientName})
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      +{cleanPhone || '34...'}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-end py-1">
                    <div className="self-end max-w-[95%] bg-[#005c4b] text-gray-100 rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-md border border-emerald-600/30">
                      <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-sans break-words text-gray-100">
                        {whatsappMessage}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/70 font-mono">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-cyan-300 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col rounded-2xl bg-[#0c0c10] border border-line overflow-hidden p-4">
                  <div className="flex items-center justify-between text-[11px] text-gold-400 font-semibold border-b border-white/5 pb-2 mb-2">
                    <span className="flex items-center gap-1.5">
                      <IconMail size={13} />
                      Vista Previa de Correo Corporativo
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {config.senderEmail || 'citas@goldblacklash.com'}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 rounded-xl bg-[#14141c] border border-line space-y-2">
                    <div className="text-xs font-bold text-white border-b border-white/5 pb-1">
                      {subject}
                    </div>
                    <div className="text-[11.5px] text-gray-300 whitespace-pre-line leading-relaxed">
                      {message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <IconAlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notice */}
          {sendSuccess && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <IconCheck size={16} className="shrink-0" />
              <span>{sendSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Footer: Clean, Powerful & Horizontal */}
        <div className="p-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 bg-ink-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-ink-800 transition-colors text-xs font-medium cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* WhatsApp Desktop Native App (macOS Monterey) */}
            <button
              type="button"
              onClick={() => handleOpenWhatsApp('app')}
              disabled={!isPhoneValid}
              title={isPhoneValid ? `Guardar cita a las ${aptTime} y abrir WhatsApp de ${clientName}` : 'Introduce el teléfono de la clienta arriba'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:pointer-events-none text-ink-950 font-bold text-xs shadow-md shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <IconWhatsApp size={16} />
              <span>Enviar por WhatsApp (Mac) ↗</span>
            </button>

            {/* Send Email via Resend */}
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending || !isEmailValid}
              title={isEmailValid ? `Guardar cita a las ${aptTime} y enviar Correo a ${recipientEmail}` : 'Introduce el correo de la clienta arriba'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-30 disabled:pointer-events-none text-ink-950 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <IconSend size={15} />
                  <span>Enviar Correo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
