import React, { useState, useEffect } from 'react'
import { Appointment, StudioConfig } from '../types/admin'
import {
  IconWhatsApp,
  IconCheck,
  IconClock,
  IconSparkles,
  IconMessageSquare,
  IconX,
  IconCopy,
} from './Icons'

export type WhatsAppModalMode = 'recordar' | 'confirmar' | 'cuidados' | 'responder'

interface WhatsAppModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  config: StudioConfig
  initialMode?: WhatsAppModalMode
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  appointment,
  config,
  initialMode = 'recordar',
}) => {
  const [mode, setMode] = useState<WhatsAppModalMode>(initialMode)
  const [clientPhone, setClientPhone] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  // Generate template message based on current appointment, config, and mode
  const getTemplateMessage = (targetMode: WhatsAppModalMode, apt: Appointment): string => {
    switch (targetMode) {
      case 'recordar':
        return `¡Hola ${apt.clientName}! 🌟 Te recordamos tu cita en *${config.name}* para mañana ${apt.date} a las *${apt.time}* para tu tratamiento de *${apt.serviceName}*.\n\n📍 Ubicación: ${config.address}, ${config.city}.\n\nPor favor, recuerda acudir sin maquillaje en los ojos ni restos de rímel. Si necesitas modificar tu horario avísanos con antelación. ¡Te esperamos!`

      case 'confirmar':
        return `¡Hola ${apt.clientName}! ✨ Tu cita en *${config.name}* ha sido confirmada con éxito:\n\n🗓 *Fecha:* ${apt.date}\n⏰ *Hora:* ${apt.time}\n🌸 *Servicio:* ${apt.serviceName}\n💶 *Precio:* ${apt.price} €\n\n📍 Nos encontramos en ${config.address}, ${config.city}.\n¡Nos encantará atenderte!`

      case 'cuidados':
        return `¡Hola ${apt.clientName}! 🌸 Para garantizar que tu tratamiento de *${apt.serviceName}* en *${config.name}* quede perfecto y tenga la máxima retención, te dejamos estas sencillas pautas para tu sesión:\n\n1️⃣ Acudir con los ojos completamente limpios, sin sombras, rímel ni delineador.\n2️⃣ No aplicar cremas grasas ni aceites en el contorno de ojos las horas previas.\n3️⃣ Si usas lentillas, te recomendamos traer estuche para retirarlas durante la colocación.\n4️⃣ Evitar tomar cafeína en exceso justo antes para mantener los párpados relajados.\n\n¡Cualquier duda estamos a tu disposición!`

      case 'responder':
        const noteContext = apt.notes && apt.notes.trim()
          ? `Respecto a lo que nos comentabas en tu reserva ("${apt.notes.trim()}"):\n\n`
          : ''
        return `¡Hola ${apt.clientName}! 💬 Te escribo desde *${config.name}* en relación a tu cita para *${apt.serviceName}*:\n\n${noteContext}Gracias por contactarnos. [Escribe aquí tu respuesta para la clienta]\n\n¡Quedamos a tu disposición para cualquier duda!`
    }
  }

  // Reset or update state whenever modal opens or appointment/mode changes
  useEffect(() => {
    if (isOpen && appointment) {
      setMode(initialMode)
      setClientPhone(appointment.clientPhone)
      setMessage(getTemplateMessage(initialMode, appointment))
      setCopied(false)
    }
  }, [isOpen, appointment, initialMode])

  // Handle mode switch tab
  const handleModeChange = (newMode: WhatsAppModalMode) => {
    setMode(newMode)
    if (appointment) {
      setMessage(getTemplateMessage(newMode, appointment))
    }
  }

  // Copy message text to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Insert emoji at current cursor or end
  const handleInsertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji)
  }

  // Send to WhatsApp
  const handleSend = () => {
    if (!clientPhone) return
    const clean = clientPhone.replace(/\D/g, '')
    const fullPhone = clean.length === 9 ? `34${clean}` : clean.startsWith('34') ? clean : `34${clean}`
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    onClose()
  }

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#13131c] border border-[#262638] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#202030] flex items-center justify-between bg-[#161622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <IconWhatsApp size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Enviar Mensaje de WhatsApp</h3>
              <p className="text-xs text-gray-400">
                Personaliza la información antes de enviarla a <span className="text-gold-300 font-semibold">{appointment.clientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#171724] border border-[#242436]">
            <button
              type="button"
              onClick={() => handleModeChange('recordar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                mode === 'recordar'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconClock size={14} />
              <span>Recordar Cita</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('confirmar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                mode === 'confirmar'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconCheck size={14} />
              <span>Confirmar Cita</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('cuidados')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                mode === 'cuidados'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconSparkles size={14} />
              <span>Cuidados Previos</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('responder')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                mode === 'responder'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconMessageSquare size={14} />
              <span>Responder Consulta</span>
            </button>
          </div>

          {/* Client & Appointment Info Pill */}
          <div className="p-3.5 rounded-xl bg-[#181826] border border-[#28283a] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Clienta</span>
                <span className="text-white font-bold text-sm">{appointment.clientName}</span>
              </div>
              <div className="h-6 w-px bg-[#2a2a3e] hidden sm:block" />
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Fecha y Hora</span>
                <span className="text-gold-300 font-mono font-bold">
                  {appointment.date} · {appointment.time}
                </span>
              </div>
              <div className="h-6 w-px bg-[#2a2a3e] hidden sm:block" />
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Servicio</span>
                <span className="text-gray-200">{appointment.serviceName} ({appointment.price} €)</span>
              </div>
            </div>

            {/* Editable Phone Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="modal-client-phone" className="text-[11px] text-gray-400 whitespace-nowrap">
                Teléfono:
              </label>
              <input
                id="modal-client-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="px-3 py-1.5 rounded-lg bg-[#111118] border border-[#2b2b3e] text-xs font-mono text-white focus:outline-none focus:border-gold-500 w-full sm:w-36"
              />
            </div>
          </div>

          {/* If appointment has notes from client, show them prominently */}
          {appointment.notes && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5">
              <span className="text-amber-400 text-sm mt-0.5">💬</span>
              <div>
                <span className="text-[11px] font-bold text-amber-300 block">
                  Nota o consulta recibida de la clienta:
                </span>
                <p className="text-xs text-amber-200/90 italic mt-0.5">
                  "{appointment.notes}"
                </p>
              </div>
            </div>
          )}

          {/* Editable Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-whatsapp-msg" className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <span>Mensaje a enviar</span>
                <span className="text-[10px] text-gray-500 font-normal">(puedes editarlo y añadir información libremente)</span>
              </label>

              {/* Quick Emojis */}
              <div className="flex items-center gap-1">
                {['✨', '🌸', '⏰', '📍', '💬', '💶', '💖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertEmoji(` ${emoji} `)}
                    className="p-1 text-xs hover:bg-[#252536] rounded transition-colors"
                    title={`Insertar ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="modal-whatsapp-msg"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#111118] border border-[#2b2b3e] text-xs text-gray-100 font-sans leading-relaxed focus:outline-none focus:border-gold-500 resize-none transition-colors"
              placeholder="Escribe aquí el mensaje..."
            />

            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
              <span>{message.length} caracteres</span>
              <button
                type="button"
                onClick={() => handleModeChange(mode)}
                className="hover:text-gold-300 underline"
              >
                Restablecer texto original de la plantilla
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#202030] bg-[#161622] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b28] hover:bg-[#252538] text-gray-300 hover:text-white border border-[#2d2d40] text-xs font-semibold transition-colors"
          >
            <IconCopy size={14} />
            <span>{copied ? '✓ ¡Texto Copiado!' : 'Copiar Mensaje'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <IconWhatsApp size={16} />
              <span>Enviar a WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
