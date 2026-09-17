import React, { useState, useEffect } from 'react'
import { Appointment, Client, StudioConfig, Invoice } from '../types/admin'
import {
  IconWhatsApp,
  IconCheck,
  IconClock,
  IconSparkles,
  IconMessageSquare,
  IconX,
  IconCopy,
  IconReceipt,
  IconSend,
} from './Icons'

export type WhatsAppModalMode =
  | 'confirmar'
  | 'recordar'
  | 'cuidados'
  | 'retoque'
  | 'factura'
  | 'responder'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: Appointment | null
  client?: Client | null
  invoice?: Invoice | null
  config: StudioConfig
  initialMode?: WhatsAppModalMode
  onClientPhoneUpdated?: (phone: string) => void
}

/**
 * Normaliza cualquier número de teléfono para WhatsApp (añade prefijo 34 si es móvil español de 9 dígitos)
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2)
  }
  if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    cleaned = '34' + cleaned
  }
  return cleaned
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  appointment,
  client,
  invoice,
  config,
  initialMode = 'confirmar',
  onClientPhoneUpdated,
}) => {
  const [mode, setMode] = useState<WhatsAppModalMode>(initialMode)
  const [recipientPhone, setRecipientPhone] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const clientName = appointment?.clientName || client?.name || invoice?.clientName || 'Clienta'
  const serviceName = appointment?.serviceName || 'Extensiones de Pestañas'
  const aptDate = appointment?.date || new Date().toISOString().split('T')[0]
  const aptTime = appointment?.time || '11:00'
  const aptPrice = appointment?.price || 30

  // Genera plantillas dinámicas con formato Markdown de WhatsApp
  const getTemplateMessage = (targetMode: WhatsAppModalMode): string => {
    const studioName = config.name || 'GoldBlack Lash'
    const address = config.address ? `${config.address}, ${config.city}` : 'Montequinto, Dos Hermanas'
    const contactPhone = config.phoneDisplay || '+34 604 18 76 76'

    switch (targetMode) {
      case 'confirmar':
        return `✨ *Confirmación de Cita — ${studioName}* ✨\n\n¡Hola *${clientName}*! Tu cita ha sido confirmada con éxito. Nos complacerá recibirte en nuestro estudio:\n\n📅 *Fecha:* ${aptDate}\n⏰ *Hora:* ${aptTime}\n🌸 *Tratamiento:* ${serviceName}\n💶 *Precio:* ${aptPrice} €\n📍 *Ubicación:* ${address}\n\n*Pautas para tu sesión:*\n• Acude con la zona de los ojos completamente desmaquillada (sin rímel ni aceites).\n• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la puesta.\n\nSi necesitas modificar tu horario o tienes cualquier consulta, puedes respondernos directamente por aquí o llamarnos al ${contactPhone}.\n\n¡Te esperamos con ganas! 💕`

      case 'recordar':
        return `🗓 *Recordatorio de Cita — ${studioName}* 🗓\n\n¡Hola *${clientName}*! Te recordamos con cariño tu cita programada para mañana:\n\n📅 *Fecha:* ${aptDate}\n⏰ *Hora:* ${aptTime}\n🌸 *Tratamiento:* ${serviceName}\n📍 *Dirección:* ${address}\n\n*Recomendaciones:*\n• Acude sin maquillaje en pestañas ni párpados.\n• Evita cafeína o bebidas estimulantes justo antes de la cita para una mayor relajación.\n\nPor favor, si necesitas realizar cualquier cambio avísanos con antelación.\n\n¡Hasta mañana! ✨`

      case 'cuidados':
        return `🌸 *Recomendaciones y Cuidados Previos — ${studioName}* 🌸\n\n¡Hola *${clientName}*! Para que tu sesión de *${serviceName}* quede impecable y obtengas la máxima retención y duración en tus extensiones, te compartimos estos consejos:\n\n1️⃣ *Higiene total:* Acude con las pestañas bien limpias, sin restos de máscara, delineador ni sombras.\n2️⃣ *Lentillas:* Es preferible retirarlas antes de comenzar la sesión.\n3️⃣ *Relax:* Procura evitar café o bebidas energéticas antes para tener los párpados completamente tranquilos.\n\nCualquier duda que tengas, estamos aquí para ayudarte.\n\n¡Un abrazo! 💖`

      case 'retoque':
        return `💖 *¡Momento de renovar tu mirada! — ${studioName}* 💖\n\n¡Hola *${clientName}*! Esperamos que estés genial.\n\nHemos visto que han pasado más de 20 días desde tu última puesta de extensiones. Para que tu mirada se mantenga siempre tupida, uniforme y en su máxima expresión, es el momento ideal para realizar tu *mantenimiento/retoque*.\n\n¿Te gustaría que te reservemos un hueco estos días? Indícanos qué días u horarios te vienen mejor y coordinamos tu cita enseguida.\n\n¡Nos encantará verte de nuevo en el estudio! ✨`

      case 'factura':
        if (invoice) {
          const itemsText = invoice.items
            .map((it) => `• ${it.description} (${it.quantity}x) — *${it.total.toFixed(2)} €*`)
            .join('\n')
          return `🧾 *Ticket Digital de Cobro — ${studioName}* 🧾\n\n¡Hola *${clientName}*! Muchas gracias por tu visita y confianza. Te adjuntamos el desglose oficial de tu servicio:\n\n*Nº Factura:* ${invoice.number}\n*Fecha:* ${invoice.date}\n\n*Detalle de servicios:*\n${itemsText}\n\n*Base Imponible:* ${invoice.subtotal.toFixed(2)} €\n*Total Pagado:* *${invoice.total.toFixed(2)} €*\n*Forma de Pago:* ${(invoice.paymentMethod || 'Efectivo').toUpperCase()}\n*Estado:* ✅ Cobrado\n\nSi necesitas factura oficial con NIF para tu contabilidad o deducción, avísanos y te la emitimos con gusto.\n\n¡Ha sido un placer atenderte! 💕\n${studioName}`
        }
        return `🧾 *Ticket Digital de Cobro — ${studioName}* 🧾\n\n¡Hola *${clientName}*! Muchas gracias por visitarnos hoy en ${studioName}.\n\n*Tratamiento:* ${serviceName}\n*Fecha:* ${aptDate}\n*Importe:* *${aptPrice} €*\n*Estado:* ✅ Cobrado con éxito\n\n¡Muchas gracias por tu confianza y nos vemos muy pronto! 💕`

      case 'responder':
        const note = appointment?.notes?.trim()
          ? `Respecto a lo que nos comentabas en tu reserva ("${appointment.notes.trim()}"):\n\n`
          : ''
        return `💬 *Hola ${clientName}*,\n\nTe escribimos desde *${studioName}*:\n\n${note}[Escribe aquí tu mensaje...]\n\nQuedamos a tu entera disposición para cualquier aclaración.\n\n¡Un saludo cordial! ✨`
    }
  }

  // Sincronizar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const rawPhone =
        appointment?.clientPhone || client?.phone || invoice?.clientPhone || ''
      setRecipientPhone(rawPhone)
      setMode(initialMode)
      setMessage(getTemplateMessage(initialMode))
      setCopied(false)
      setCopiedLink(false)
      setPhoneError(null)
    }
  }, [isOpen, appointment, client, invoice, initialMode])

  if (!isOpen) return null

  const handleModeChange = (newMode: WhatsAppModalMode) => {
    setMode(newMode)
    setMessage(getTemplateMessage(newMode))
  }

  const cleanPhone = formatWhatsAppPhone(recipientPhone)
  const isPhoneValid = cleanPhone.length >= 9

  const generateWhatsAppUrl = () => {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  }

  const handleOpenWhatsApp = () => {
    if (!isPhoneValid) {
      setPhoneError('Ingresa un número de teléfono válido (al menos 9 dígitos)')
      return
    }
    setPhoneError(null)

    // Si el usuario actualizó el teléfono, guardar en el padre
    if (recipientPhone && onClientPhoneUpdated) {
      onClientPhoneUpdated(recipientPhone)
    }

    const waUrl = generateWhatsAppUrl()

    // En Electron o navegador abre WhatsApp Desktop / Web en una pestaña externa
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal) {
      ;(window as any).electronAPI.openExternal(waUrl)
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      console.warn('Clipboard write error:', e)
    }
  }

  const handleCopyLink = async () => {
    if (!isPhoneValid) {
      setPhoneError('Ingresa un número de teléfono válido para generar el enlace')
      return
    }
    try {
      await navigator.clipboard.writeText(generateWhatsAppUrl())
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch (e) {
      console.warn('Clipboard link error:', e)
    }
  }

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji)
  }

  const formatSelectedBold = () => {
    setMessage((prev) => prev + ' *texto en negrita* ')
  }

  const formatSelectedItalic = () => {
    setMessage((prev) => prev + ' _texto en cursiva_ ')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121217] border border-emerald-500/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-ink-850 to-ink-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
              <IconWhatsApp size={22} />
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-white flex items-center gap-2">
                <span>Mensajería Directa por WhatsApp</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Directo • wa.me
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Contacta a <strong className="text-white">{clientName}</strong> con plantillas de alta retención
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-ink-750 transition-colors cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Recipient Phone & Destination */}
          <div className="p-4 rounded-xl bg-ink-850 border border-line space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Número de WhatsApp de la Clienta:
              </label>
              <span className="text-[11px] font-mono text-gray-400">
                Formato WhatsApp: <span className="text-emerald-400 font-bold">+{cleanPhone || '34...'}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => {
                  setRecipientPhone(e.target.value)
                  setPhoneError(null)
                }}
                placeholder="Ej. +34 604 18 76 76 o 604187676"
                className="flex-1 px-4 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
              <a
                href={`tel:${cleanPhone}`}
                title="Llamar directamente por teléfono"
                className="px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>📞 Llamar</span>
              </a>
            </div>
            {phoneError && (
              <p className="text-[11px] text-rose-400 font-medium">{phoneError}</p>
            )}
          </div>

          {/* Template Mode Switcher Pills */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Seleccionar Plantilla de Mensaje:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('confirmar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'confirmar'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <IconCheck size={14} className="text-blue-400 shrink-0" />
                <span className="truncate">Confirmar Cita</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('recordar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'recordar'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <IconClock size={14} className="text-emerald-400 shrink-0" />
                <span className="truncate">Recordatorio 24h</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('cuidados')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'cuidados'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <IconSparkles size={14} className="text-purple-400 shrink-0" />
                <span className="truncate">Cuidados Previos</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('retoque')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'retoque'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <span className="text-amber-400 shrink-0">💖</span>
                <span className="truncate">Invitar a Retoque</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('factura')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'factura'
                    ? 'bg-gold-500/20 text-gold-300 border-gold-500/40 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <IconReceipt size={14} className="text-gold-400 shrink-0" />
                <span className="truncate">Ticket Digital</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('responder')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  mode === 'responder'
                    ? 'bg-zinc-700/50 text-white border-zinc-500 shadow-sm'
                    : 'bg-ink-850 text-gray-400 border-line hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <IconMessageSquare size={14} className="text-gray-300 shrink-0" />
                <span className="truncate">Mensaje Libre</span>
              </button>
            </div>
          </div>

          {/* Quick formatting toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 mr-1">Insertar:</span>
              <button
                type="button"
                onClick={formatSelectedBold}
                className="px-2 py-1 rounded bg-ink-800 hover:bg-ink-750 text-gray-300 text-xs font-bold border border-line"
                title="Añadir texto en negrita"
              >
                *Negrita*
              </button>
              <button
                type="button"
                onClick={formatSelectedItalic}
                className="px-2 py-1 rounded bg-ink-800 hover:bg-ink-750 text-gray-300 text-xs italic border border-line"
                title="Añadir texto en cursiva"
              >
                _Cursiva_
              </button>
              {['✨', '🌸', '💖', '📅', '⏰', '📍', '💶', '💕'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="px-1.5 py-0.5 rounded bg-ink-800 hover:bg-ink-700 text-xs border border-line transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-gray-500">{message.length} caracteres</span>
          </div>

          {/* Split Screen: Message Editor & Real-Time WhatsApp Chat Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Raw Text Area Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                <span>Editor de Texto</span>
                <span className="text-[10px] text-gray-500 font-normal">Editable</span>
              </div>
              <textarea
                rows={9}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-ink-850 border border-line-strong text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar"
                placeholder="Escribe el mensaje que recibirá la clienta en WhatsApp..."
              />
            </div>

            {/* Right: Live WhatsApp Bubble Simulator */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <IconWhatsApp size={13} />
                  Vista Previa en WhatsApp
                </span>
                <span className="text-[10.5px] text-gray-500 font-normal">Móvil de la Clienta</span>
              </div>

              {/* Chat Simulation Window */}
              <div className="flex-1 p-3.5 rounded-xl bg-[#0b141a] border border-line flex flex-col justify-between shadow-inner relative overflow-hidden min-h-[220px]">
                {/* Wallpaper background pattern */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#25d366 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* WhatsApp Chat Top Bar Mockup */}
                <div className="flex items-center gap-2 pb-2.5 border-b border-white/5 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center font-bold text-gold-300 text-[10px]">
                    {clientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-white truncate leading-tight">
                      {clientName}
                    </div>
                    <div className="text-[9.5px] text-emerald-400 leading-none">en línea</div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    +{cleanPhone || '34...'}
                  </span>
                </div>

                {/* WhatsApp Outgoing Message Bubble */}
                <div className="py-3 flex justify-end relative z-10">
                  <div className="max-w-[90%] bg-[#005c4b] text-gray-100 rounded-2xl rounded-tr-none px-3.5 py-2.5 shadow-md border border-emerald-600/30 relative">
                    {/* Bubble tail */}
                    <div className="absolute top-0 -right-1.5 w-2 h-2 bg-[#005c4b] [clip-path:polygon(0_0,100%_0,0_100%)]" />

                    <div className="text-[11.5px] leading-relaxed whitespace-pre-wrap font-sans break-words text-gray-100">
                      {message}
                    </div>

                    {/* Double Check & Timestamp */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-emerald-200/70 font-mono">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-cyan-300 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Footer hint */}
                <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 text-center relative z-10">
                  🔒 Cifrado de extremo a extremo de WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-line bg-ink-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <IconCheck size={14} className="text-emerald-400" /> : <IconCopy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Mensaje'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar enlace directo https://wa.me/..."
            >
              {copiedLink ? <IconCheck size={14} className="text-emerald-400" /> : <IconSend size={14} />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar wa.me'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!isPhoneValid}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all cursor-pointer active:scale-95"
            >
              <IconWhatsApp size={16} />
              <span>Abrir y Enviar por WhatsApp ↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
