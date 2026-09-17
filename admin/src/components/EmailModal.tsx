import React, { useState, useEffect } from 'react'
import { Appointment, Client, StudioConfig } from '../types/admin'
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
} from './Icons'
import { sendEmailViaResend } from '../services/storage'
import { formatWhatsAppPhone } from './WhatsAppModal'

export type EmailModalMode = 'confirmar' | 'recordar' | 'cuidados' | 'responder' | 'retoque'
export type CommunicationChannel = 'whatsapp' | 'email'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: Appointment | null
  client?: Client | null
  config: StudioConfig
  initialMode?: EmailModalMode
  initialChannel?: CommunicationChannel
  onClientEmailUpdated?: (email: string) => void
  onClientPhoneUpdated?: (phone: string) => void
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  client,
  config,
  initialMode = 'confirmar',
  initialChannel,
  onClientEmailUpdated,
  onClientPhoneUpdated,
}) => {
  const [channel, setChannel] = useState<CommunicationChannel>(
    initialChannel || (appointment?.clientPhone || client?.phone ? 'whatsapp' : 'email')
  )
  const [mode, setMode] = useState<EmailModalMode>(initialMode)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const clientName = appointment?.clientName || client?.name || 'Clienta'
  const serviceName = appointment?.serviceName || 'Tratamiento de Pestañas'
  const aptDate = appointment?.date || new Date().toISOString().split('T')[0]
  const aptTime = appointment?.time || '11:00'
  const aptPrice = appointment?.price || 30

  // Genera plantillas dinámicas tanto para Correo como para WhatsApp
  const getTemplateData = (
    targetMode: EmailModalMode
  ): { subject: string; message: string; whatsappMessage: string } => {
    const studioName = config.name || 'GoldBlack Lash'
    const address = config.address ? `${config.address}, ${config.city}` : 'Montequinto, Dos Hermanas'
    const phone = config.phoneDisplay || '+34 604 18 76 76'

    switch (targetMode) {
      case 'confirmar':
        return {
          subject: `✨ Confirmación de Cita — ${studioName}`,
          message: `Hola ${clientName},\n\nTu cita en ${studioName} ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio.\n\n📅 Fecha: ${aptDate}\n⏰ Hora: ${aptTime}\n🌸 Tratamiento: ${serviceName}\n💶 Precio: ${aptPrice} €\n📍 Ubicación: ${address}\n\nPor favor, recuerda acudir con los ojos limpios, sin restos de maquillaje ni rímel. Si utilizas lentillas, te recomendamos traer estuche para retirarlas durante la sesión.\n\nSi necesitas realizar cualquier cambio en tu reserva, responde a este correo o llámanos al ${phone}.\n\n¡Te esperamos!`,
          whatsappMessage: `✨ *Confirmación de Cita — ${studioName}* ✨\n\n¡Hola *${clientName}*! Tu cita ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio:\n\n📅 *Fecha:* ${aptDate}\n⏰ *Hora:* ${aptTime}\n🌸 *Tratamiento:* ${serviceName}\n💶 *Precio:* ${aptPrice} €\n📍 *Ubicación:* ${address}\n\n*Pautas para tu sesión:*\n• Acude con los ojos limpios, sin restos de maquillaje ni rímel.\n• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la puesta.\n\nSi necesitas modificar tu horario o tienes alguna duda, puedes respondernos directamente por aquí o llamarnos al ${phone}.\n\n¡Te esperamos con muchas ganas! 💕`,
        }

      case 'recordar':
        return {
          subject: `🗓 Recordatorio de Cita — ${studioName}`,
          message: `Hola ${clientName},\n\nTe recordamos tu cita para mañana en ${studioName}:\n\n📅 Fecha: ${aptDate}\n⏰ Hora: ${aptTime}\n🌸 Tratamiento: ${serviceName}\n📍 Dirección: ${address}\n\nRecomendaciones para tu sesión:\n• Acudir sin maquillaje en ojos ni restos de máscara de pestañas.\n• Evitar cremas grasas u oleosas en el contorno de ojos las horas previas.\n\nSi necesitas modificar tu horario, por favor avísanos con la mayor antelación posible.\n\n¡Hasta pronto!`,
          whatsappMessage: `🗓 *Recordatorio de Cita — ${studioName}* 🗓\n\n¡Hola *${clientName}*! Te recordamos con cariño tu cita programada para mañana:\n\n📅 *Fecha:* ${aptDate}\n⏰ *Hora:* ${aptTime}\n🌸 *Tratamiento:* ${serviceName}\n📍 *Dirección:* ${address}\n\n*Recomendaciones:*\n• Acude sin maquillaje en pestañas ni párpados.\n• Evita cafeína o bebidas estimulantes justo antes de la cita para una mayor relajación.\n\nPor favor, si necesitas realizar cualquier cambio avísanos con antelación.\n\n¡Hasta mañana! ✨`,
        }

      case 'cuidados':
        return {
          subject: `🌸 Recomendaciones y Cuidados Previos — ${studioName}`,
          message: `Hola ${clientName},\n\nPara que tu sesión de ${serviceName} en ${studioName} sea perfecta y obtengas la máxima retención y duración en tus extensiones, te compartimos estas recomendaciones:\n\n1. Higiene: Acude con las pestañas completamente desmaquilladas y libres de grasa.\n2. Lentillas: Es preferible retirarlas antes de comenzar la aplicación.\n3. Cafeína: Recomendamos evitar café o bebidas estimulantes justo antes para tener los párpados relajados.\n\nCualquier duda que tengas, estamos a tu entera disposición.\n\n¡Un saludo cordial!`,
          whatsappMessage: `🌸 *Recomendaciones y Cuidados Previos — ${studioName}* 🌸\n\n¡Hola *${clientName}*! Para que tu sesión de *${serviceName}* quede impecable y obtengas la máxima retención y duración en tus extensiones, te compartimos estos consejos:\n\n1️⃣ *Higiene total:* Acude con las pestañas bien limpias, sin restos de máscara, delineador ni sombras.\n2️⃣ *Lentillas:* Es preferible retirarlas antes de comenzar la sesión.\n3️⃣ *Relax:* Procura evitar café o bebidas energéticas antes para tener los párpados completamente tranquilos.\n\nCualquier duda que tengas, estamos aquí para ayudarte.\n\n¡Un abrazo! 💖`,
        }

      case 'retoque':
        return {
          subject: `💖 ¡Hora de mimar tu mirada! Retoque en ${studioName}`,
          message: `Hola ${clientName},\n\nEsperamos que estés teniendo una excelente semana. Hemos visto que han pasado varias semanas desde tu última puesta de pestañas.\n\nPara mantener tu set siempre tupido, equilibrado y uniforme, lo ideal es realizar un retoque a las 2 o 3 semanas.\n\n¿Te gustaría que te reservemos un hueco estos días? Responde a este correo indicándonos qué días u horarios te vienen mejor y coordinamos tu cita.\n\n¡Nos encantará verte de nuevo!`,
          whatsappMessage: `💖 *¡Momento de renovar tu mirada! — ${studioName}* 💖\n\n¡Hola *${clientName}*! Esperamos que estés genial.\n\nHemos visto que han pasado más de 20 días desde tu última puesta de extensiones. Para que tu mirada se mantenga siempre tupida, uniforme y en su máxima expresión, es el momento ideal para realizar tu *mantenimiento/retoque*.\n\n¿Te gustaría que te reservemos un hueco estos días? Indícanos qué días u horarios te vienen mejor y coordinamos tu cita enseguida.\n\n¡Nos encantará verte de nuevo en el estudio! ✨`,
        }

      case 'responder':
        const noteContext = appointment?.notes?.trim()
          ? `Respecto a lo que nos comentabas en tu reserva ("${appointment.notes.trim()}"):\n\n`
          : ''
        return {
          subject: `💬 Respuesta de ${studioName} sobre tu cita`,
          message: `Hola ${clientName},\n\nTe escribimos desde ${studioName} en relación a tu consulta sobre tu cita de ${serviceName}:\n\n${noteContext}Gracias por comunicarte con nosotras. [Escribe aquí tu respuesta]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\nAtentamente,\n${studioName}`,
          whatsappMessage: `💬 *Hola ${clientName}*,\n\nTe escribimos desde *${studioName}*:\n\n${noteContext}[Escribe aquí tu mensaje...]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\n¡Un saludo cordial! ✨`,
        }
    }
  }

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const email = appointment?.clientEmail || client?.email || ''
      const phone = appointment?.clientPhone || client?.phone || ''
      setRecipientEmail(email)
      setRecipientPhone(phone)
      setMode(initialMode)
      if (initialChannel) {
        setChannel(initialChannel)
      } else {
        setChannel(phone ? 'whatsapp' : 'email')
      }
      const tpl = getTemplateData(initialMode)
      setSubject(tpl.subject)
      setMessage(tpl.message)
      setWhatsappMessage(tpl.whatsappMessage)
      setSendSuccess(null)
      setError(null)
      setIsSending(false)
      setCopied(false)
    }
  }, [isOpen, appointment, client, initialMode, initialChannel])

  const handleModeChange = (newMode: EmailModalMode) => {
    setMode(newMode)
    const tpl = getTemplateData(newMode)
    setSubject(tpl.subject)
    setMessage(tpl.message)
    setWhatsappMessage(tpl.whatsappMessage)
    setError(null)
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

  // Despacho directo a la aplicación nativa de WhatsApp en macOS Monterey
  const handleOpenWhatsApp = async (target: 'app' | 'web' = 'app') => {
    if (!isPhoneValid) {
      setError('Por favor, indica un número de teléfono móvil válido para la clienta (mínimo 9 dígitos).')
      return
    }
    setError(null)

    if (recipientPhone && onClientPhoneUpdated) {
      onClientPhoneUpdated(recipientPhone)
    }

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

    setSendSuccess(`¡Abriendo chat de WhatsApp para ${clientName}!`)
    setTimeout(() => {
      setSendSuccess(null)
    }, 4000)
  }

  // Despacho por Correo (Resend)
  const handleSendEmail = async () => {
    const trimmedEmail = recipientEmail.trim()
    if (!trimmedEmail || !isEmailValid) {
      setError('Por favor, indica una dirección de correo válida para la clienta.')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0c10; color: #f0f0f5; padding: 40px 30px; border-radius: 16px; border: 1px solid #28283c;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; font-size: 24px; letter-spacing: 0.05em; margin: 0 0 8px 0; text-transform: uppercase;">
              ${config.name}
            </h1>
            <p style="color: #888899; font-size: 13px; margin: 0;">
              ${config.tagline}
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

      if (recipientEmail && onClientEmailUpdated) {
        onClientEmailUpdated(recipientEmail)
      }

      setSendSuccess(`¡Correo enviado con éxito a ${recipientEmail}!`)
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
                Clienta: <strong className="text-gold-300 font-semibold">{clientName}</strong>
                {appointment && (
                  <span> • {aptDate} {aptTime} ({serviceName})</span>
                )}
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

        {/* Horizontal Contact Bar (Móvil & Correo side-by-side in one compact row) */}
        <div className="px-5 py-2 bg-ink-850/40 border-b border-line flex flex-col sm:flex-row items-center gap-4">
          {/* Phone for WhatsApp */}
          <div className="flex-1 w-full flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 flex items-center gap-1">
              <IconWhatsApp size={13} className="text-emerald-400" /> Móvil WhatsApp:
            </span>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => {
                setRecipientPhone(e.target.value)
                setError(null)
              }}
              onBlur={() => {
                if (recipientPhone && onClientPhoneUpdated) {
                  onClientPhoneUpdated(recipientPhone)
                }
              }}
              placeholder="Ej. +34 604 18 76 76"
              className="flex-1 px-3 py-1 rounded-lg bg-ink-800 border border-line text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            {isPhoneValid && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">+{cleanPhone}</span>
            )}
          </div>

          {/* Email for Resend */}
          <div className="flex-1 w-full flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 flex items-center gap-1">
              <IconMail size={13} className="text-gold-400" /> Correo:
            </span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value)
                setError(null)
              }}
              onBlur={() => {
                if (recipientEmail && onClientEmailUpdated) {
                  onClientEmailUpdated(recipientEmail)
                }
              }}
              placeholder="ejemplo@correo.com"
              className="flex-1 px-3 py-1 rounded-lg bg-ink-800 border border-line text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50"
            />
            {isEmailValid && (
              <span className="text-[10px] font-mono text-gold-400 shrink-0">✓ Válido</span>
            )}
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

        {/* Modal Footer: Clean & Horizontal */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-ink-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-ink-800 transition-colors text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* WhatsApp Desktop Native App (macOS Monterey) */}
            <button
              type="button"
              onClick={() => handleOpenWhatsApp('app')}
              disabled={!isPhoneValid}
              title={isPhoneValid ? `Enviar ${getModeTitle()} por WhatsApp a ${clientName}` : 'Introduce el teléfono de la clienta arriba'}
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
              title={isEmailValid ? `Enviar ${getModeTitle()} por Correo a ${recipientEmail}` : 'Introduce el correo de la clienta arriba'}
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
