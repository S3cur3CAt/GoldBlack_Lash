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
} from './Icons'
import { sendEmailViaResend } from '../services/storage'

export type EmailModalMode = 'confirmar' | 'recordar' | 'cuidados' | 'responder' | 'retoque'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: Appointment | null
  client?: Client | null
  config: StudioConfig
  initialMode?: EmailModalMode
  onClientEmailUpdated?: (email: string) => void
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  client,
  config,
  initialMode = 'confirmar',
  onClientEmailUpdated,
}) => {
  const [mode, setMode] = useState<EmailModalMode>(initialMode)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const clientName = appointment?.clientName || client?.name || 'Cliente'
  const serviceName = appointment?.serviceName || 'Tratamiento de Pestañas'
  const aptDate = appointment?.date || ''
  const aptTime = appointment?.time || ''
  const aptPrice = appointment?.price || 30

  // Generates subject and message according to mode
  const getTemplateData = (targetMode: EmailModalMode): { subject: string; message: string } => {
    switch (targetMode) {
      case 'confirmar':
        return {
          subject: `✨ Confirmación de Cita — ${config.name}`,
          message: `Hola ${clientName},\n\nTu cita en ${config.name} ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio.\n\n📅 Fecha: ${aptDate}\n⏰ Hora: ${aptTime}\n🌸 Tratamiento: ${serviceName}\n💶 Precio: ${aptPrice} €\n📍 Ubicación: ${config.address}, ${config.city}\n\nPor favor, recuerda acudir con los ojos limpios, sin restos de maquillaje ni rímel. Si utilizas lentillas, te recomendamos traer estuche para retirarlas durante la sesión.\n\nSi necesitas realizar cualquier cambio en tu reserva, responde a este correo o llámanos al ${config.phoneDisplay}.\n\n¡Te esperamos!`,
        }

      case 'recordar':
        return {
          subject: `🗓 Recordatorio de Cita — ${config.name}`,
          message: `Hola ${clientName},\n\nTe recordamos tu cita para mañana en ${config.name}:\n\n📅 Fecha: ${aptDate}\n⏰ Hora: ${aptTime}\n🌸 Tratamiento: ${serviceName}\n📍 Dirección: ${config.address}, ${config.city}\n\nRecomendaciones para tu sesión:\n• Acudir sin maquillaje en ojos ni restos de máscara de pestañas.\n• Evitar cremas grasas u oleosas en el contorno de ojos las horas previas.\n\nSi necesitas modificar tu horario, por favor avísanos con la mayor antelación posible.\n\n¡Hasta pronto!`,
        }

      case 'cuidados':
        return {
          subject: `🌸 Recomendaciones y Cuidados Previos — ${config.name}`,
          message: `Hola ${clientName},\n\nPara que tu sesión de ${serviceName} en ${config.name} sea perfecta y obtengas la máxima retención y duración en tus extensiones, te compartimos estas recomendaciones:\n\n1. Higiene: Acude con las pestañas completamente desmaquilladas y libres de grasa.\n2. Lentillas: Es preferible retirarlas antes de comenzar la aplicación.\n3. Cafeína: Recomendamos evitar café o bebidas estimulantes justo antes para tener los párpados relajados.\n\nCualquier duda que tengas, estamos a tu entera disposición.\n\n¡Un saludo cordial!`,
        }

      case 'retoque':
        return {
          subject: `💖 ¡Hora de mimar tu mirada! Retoque en ${config.name}`,
          message: `Hola ${clientName},\n\nEsperamos que estés teniendo una excelente semana. Hemos visto que han pasado varias semanas desde tu última puesta de pestañas.\n\nPara mantener tu set siempre tupido, equilibrado y uniforme, lo ideal es realizar un retoque a las 2 o 3 semanas.\n\n¿Te gustaría que te reservemos un hueco estos días? Responde a este correo indicándonos qué días u horarios te vienen mejor y coordinamos tu cita.\n\n¡Nos encantará verte de nuevo!`,
        }

      case 'responder':
        const noteContext = appointment?.notes?.trim()
          ? `Respecto a lo que nos comentabas en tu reserva ("${appointment.notes.trim()}"):\n\n`
          : ''
        return {
          subject: `💬 Respuesta de ${config.name} sobre tu cita`,
          message: `Hola ${clientName},\n\nTe escribimos desde ${config.name} en relación a tu consulta sobre tu cita de ${serviceName}:\n\n${noteContext}Gracias por comunicarte con nosotras. [Escribe aquí tu respuesta]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\nAtentamente,\n${config.name}`,
        }
    }
  }

  // Sync state whenever modal opens or mode/appointment changes
  useEffect(() => {
    if (isOpen) {
      const email = appointment?.clientEmail || client?.email || ''
      setRecipientEmail(email)
      setMode(initialMode)
      const tpl = getTemplateData(initialMode)
      setSubject(tpl.subject)
      setMessage(tpl.message)
      setSendSuccess(false)
      setError(null)
      setIsSending(false)
      setCopied(false)
    }
  }, [isOpen, appointment, client, initialMode])

  const handleModeChange = (newMode: EmailModalMode) => {
    setMode(newMode)
    const tpl = getTemplateData(newMode)
    setSubject(tpl.subject)
    setMessage(tpl.message)
    setError(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`Asunto: ${subject}\n\n${message}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSend = async () => {
    const trimmedEmail = recipientEmail.trim()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Por favor, indica una dirección de correo válida para la clienta.')
      return
    }
    if (!subject.trim()) {
      setError('El asunto no puede estar vacío.')
      return
    }
    if (!message.trim()) {
      setError('El contenido del mensaje no puede estar vacío.')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      // Build luxury branded HTML email
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0b10; color: #f2f2f7; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #12121a; border: 1px solid #28283a; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            <div style="background: linear-gradient(135deg, #1d1b28 0%, #12121a 100%); padding: 30px; text-align: center; border-bottom: 1px solid #28283a;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #d4af37; font-weight: 700;">${config.name}</span>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 10px 0 0 0; font-family: 'Playfair Display', Georgia, serif;">${subject}</h1>
            </div>
            <div style="padding: 32px 30px;">
              <div style="font-size: 14px; line-height: 1.7; color: #e2e2e8; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="background-color: #0d0d14; padding: 18px 30px; text-align: center; border-top: 1px solid #1f1f2e; font-size: 11px; color: #666677;">
              ${config.name} · ${config.address}, ${config.city} · Tel: ${config.phoneDisplay}
            </div>
          </div>
        </div>
      `

      const result = await sendEmailViaResend({
        to: trimmedEmail,
        subject,
        html: htmlBody,
        text: message,
        from: config.senderEmail,
        apiKey: config.resendApiKey,
      })

      if (!result.ok) {
        throw new Error(result.error || 'No se pudo enviar el correo.')
      }

      // Update client email if changed
      if (appointment) {
        appointment.clientEmail = trimmedEmail
      }
      if (client) {
        client.email = trimmedEmail
      }
      onClientEmailUpdated?.(trimmedEmail)

      setSendSuccess(true)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-ink-900 border border-line shadow-raised overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-ink-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/25 flex items-center justify-center">
              <IconMail size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base tracking-tight">Enviar Correo Corporativo (Resend)</h3>
              <p className="text-xs text-muted mt-0.5">
                Comunicación directa con <span className="text-gold-300 font-semibold">{clientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-ink-800 transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-ink-850 border border-line">
            <button
              type="button"
              onClick={() => handleModeChange('confirmar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'confirmar'
                  ? 'bg-ink-800 text-blue-300 border border-blue-500/25'
                  : 'text-muted hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconCheck size={14} />
              <span>Confirmar Cita</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('recordar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'recordar'
                  ? 'bg-ink-800 text-emerald-300 border border-emerald-500/25'
                  : 'text-muted hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconClock size={14} />
              <span>Recordatorio 24h</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('cuidados')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'cuidados'
                  ? 'bg-ink-800 text-purple-300 border border-purple-500/25'
                  : 'text-muted hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconSparkles size={14} />
              <span>Cuidados Previos</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('retoque')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'retoque'
                  ? 'bg-ink-800 text-rose-300 border border-rose-500/25'
                  : 'text-muted hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconClock size={14} />
              <span>Invitar a Retoque</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('responder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                mode === 'responder'
                  ? 'bg-ink-800 text-gold-300 border border-gold-500/25'
                  : 'text-muted hover:text-white hover:bg-ink-800'
              }`}
            >
              <IconMessageSquare size={14} />
              <span>Respuesta Personalizada</span>
            </button>
          </div>

          {/* Recipient Email & Sender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-client-email" className="block text-xs font-semibold text-gray-300 mb-1">
                Para (Email de la Clienta) *
              </label>
              <div className="relative">
                <IconMail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="modal-client-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-800 border border-line text-xs text-white placeholder-faint focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Remitente (Vercel + Resend)
              </label>
              <input
                type="text"
                disabled
                value={config.senderEmail || 'citas@goldblacklash.com'}
                className="w-full px-3 py-2 rounded-xl bg-ink-850 border border-line text-xs text-muted cursor-not-allowed"
              />
            </div>
          </div>

          {/* Subject */}
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
              className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line text-xs text-white placeholder-faint focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="modal-email-msg" className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <span>Cuerpo del Mensaje</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-gray-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
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
              className="w-full p-3 rounded-xl bg-ink-800 border border-line text-xs text-gray-200 focus:outline-none focus:border-gold-500/50 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <IconAlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notice */}
          {sendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <IconCheck size={16} className="shrink-0" />
              <span>¡Correo enviado con éxito a {recipientEmail}!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line flex items-center justify-between bg-ink-900">
          <span className="text-[11px] text-faint flex items-center gap-1">
            ⚡ Envío cifrado mediante Resend API
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-muted hover:text-white hover:bg-ink-800 transition-colors text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || sendSuccess}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-ink-950 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : sendSuccess ? (
                <>
                  <IconCheck size={15} />
                  <span>¡Enviado!</span>
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
