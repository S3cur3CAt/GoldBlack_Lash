import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { business } from '#/data/site'
import { useStudioConfig } from '#/context/StudioConfigContext'

export const Route = createFileRoute('/nueva-cita')({
  component: NuevaCitaPage,
  head: () => ({
    meta: [
      { title: `Crear Cita — ${business.name} (Telegram Assistant)` },
      { name: 'description', content: `Asistente de creación y confirmación rápida de citas para ${business.name}` },
      { name: 'theme-color', content: '#08080a' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
    ],
    scripts: [
      { src: 'https://telegram.org/js/telegram-web-app.js' },
    ],
  }),
})

interface ServiceOption {
  id: string
  name: string
  priceNumber: number
  priceFormatted: string
  duration: string
  badge?: string
}

const DEFAULT_SERVICES_LIST: ServiceOption[] = [
  {
    id: 'volumen-3d6d',
    name: 'Volumen (3D, 4D, 5D y 6D)',
    priceNumber: 27,
    priceFormatted: '27 €',
    duration: '1 h 15 min',
    badge: 'Más popular',
  },
  {
    id: 'volumen-ruso',
    name: 'Volumen Ruso',
    priceNumber: 30,
    priceFormatted: '30 €',
    duration: '1 h',
    badge: 'Densidad alta',
  },
  {
    id: 'retoque-mantenimiento',
    name: 'Retoque / Mantenimiento',
    priceNumber: 22,
    priceFormatted: '22 €',
    duration: '50 min',
  },
  {
    id: 'retirada',
    name: 'Retirada de extensiones',
    priceNumber: 10,
    priceFormatted: '10 €',
    duration: '30 min',
  },
]

function getFormattedDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function cleanPhoneForWhatsApp(raw: string): string {
  let cleaned = (raw || '').replace(/\D/g, '')
  if (cleaned.startsWith('00')) cleaned = cleaned.substring(2)
  if (cleaned.length === 9 && /^[6789]/.test(cleaned)) {
    cleaned = '34' + cleaned
  }
  return cleaned
}

function NuevaCitaPage() {
  const config = useStudioConfig()

  // Form State
  const [selectedService, setSelectedService] = useState<ServiceOption>(DEFAULT_SERVICES_LIST[0])
  const [isCustomService, setIsCustomService] = useState(false)
  const [customServiceName, setCustomServiceName] = useState('')
  const [customPrice, setCustomPrice] = useState('30')

  const [date, setDate] = useState<string>(getFormattedDate(0))
  const [time, setTime] = useState<string>('16:30')
  const [clientName, setClientName] = useState<string>('')
  const [clientPhone, setClientPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [curl, setCurl] = useState<string>('D')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null)

  // Initialize Telegram WebApp SDK if opened inside Telegram
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      try {
        tg.ready()
        tg.expand()
        if (tg.setHeaderColor) tg.setHeaderColor('#08080a')
        if (tg.setBackgroundColor) tg.setBackgroundColor('#08080a')
      } catch (e) {
        console.warn('Telegram WebApp init notice:', e)
      }
    }
  }, [])

  const cleanPhone = cleanPhoneForWhatsApp(clientPhone)
  const isPhoneValid = cleanPhone.length >= 9

  const finalServiceName = isCustomService ? customServiceName || 'Servicio personalizado' : selectedService.name
  const finalPrice = isCustomService ? Number(customPrice) || 0 : selectedService.priceNumber

  const quickTimes = ['10:00', '11:30', '13:00', '16:00', '17:30', '19:00']

  // Generador del mensaje formal de confirmación de WhatsApp
  const generateWhatsAppMessage = () => {
    const studio = config.name || 'GoldBlack Lash'
    const address = config.address ? `${config.address}, ${config.city}` : 'Calle Numa, Montequinto (Dos Hermanas)'

    return [
      `✨ *Confirmación de Cita — ${studio}* ✨`,
      `🌐 https://www.goldblacklash.com/`,
      ``,
      `¡Hola *${clientName.trim()}*! Tu cita ha sido reservada y confirmada en nuestro estudio:`,
      ``,
      `📅 *Fecha:* ${date}`,
      `⏰ *Hora:* ${time}`,
      `🌸 *Tratamiento:* ${finalServiceName}`,
      `💶 *Precio:* ${finalPrice} €`,
      `📍 *Ubicación:* ${address}`,
      ``,
      `*Pautas para tu sesión:*`,
      `• Acude con la zona de los ojos completamente limpia y desmaquillada (sin rímel ni sombras).`,
      `• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la sesión.`,
      ``,
      `Si necesitas cambiar tu horario o tienes cualquier consulta, puedes responder directamente a este mensaje.`,
      ``,
      `¡Te esperamos con muchas ganas! 💕`,
      `${studio}`,
    ].join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      setErrorMsg('Por favor introduce el nombre de la clienta')
      return
    }
    if (!isPhoneValid) {
      setErrorMsg('Por favor introduce un número de teléfono móvil válido')
      return
    }
    setErrorMsg(null)
    setIsSubmitting(true)

    const appointmentId = `apt-tg-${Date.now()}`
    const aptPayload = {
      id: appointmentId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date,
      time,
      serviceName: finalServiceName,
      serviceId: isCustomService ? 'custom' : selectedService.id,
      price: finalPrice,
      durationMinutes: 75,
      status: 'confirmada',
      paymentStatus: 'pendiente',
      curl,
      notes: notes.trim() || undefined,
    }

    try {
      // 1. Guardar en la base de datos Supabase en la nube (24/7)
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aptPayload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error en el servidor (HTTP ${res.status})`)
      }

      // 2. Enviar notificación al chat del bot en Telegram (para dejar registro en tu chat)
      try {
        await fetch('/api/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment: {
              clientName: clientName.trim(),
              clientPhone: clientPhone.trim(),
              serviceName: finalServiceName,
              date,
              time,
              price: finalPrice,
              duration: 75,
            },
          }),
        })
      } catch (tgErr) {
        console.warn('Aviso notificando a Telegram:', tgErr)
      }

      // 3. Pasar al estado de éxito con botón directo de WhatsApp
      setCreatedAppointment({
        ...aptPayload,
        cleanPhone,
        whatsappText: generateWhatsAppMessage(),
      })

      // Haptic feedback de Telegram si está disponible
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        ;(window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la cita en la nube.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setCreatedAppointment(null)
    setClientName('')
    setClientPhone('')
    setNotes('')
    setErrorMsg(null)
  }

  const handleCloseApp = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.close) {
      ;(window as any).Telegram.WebApp.close()
    } else {
      window.close()
    }
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col justify-start px-4 py-6 sm:py-10 max-w-xl mx-auto font-sans selection:bg-amber-400 selection:text-black">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-amber-500/15 via-amber-600/5 to-transparent blur-3xl"></div>
      </div>

      {/* Top Branding Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-zinc-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#0d0d12] rounded-[11px] flex items-center justify-center font-bold text-amber-400 text-sm">
              GB
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              GoldBlack Lash
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">
              {createdAppointment ? 'Cita Guardada' : 'Crear Nueva Cita'}
            </h1>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Telegram Bot
        </span>
      </header>

      {/* 1. SUCCESS VIEW (CITA GUARDADA + BOTÓN WHATSAPP LISTO) */}
      {createdAppointment ? (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Success Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-300">
                ¡Cita registrada con éxito en la nube!
              </h2>
              <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed">
                Guardada en la base de datos central de Supabase. Aparecerá en tu Mac automáticamente al abrir el panel de administración.
              </p>
            </div>
          </div>

          {/* Appointment Summary Card */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs text-zinc-400">Clienta:</span>
              <span className="text-sm font-bold text-white">{createdAppointment.clientName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs text-zinc-400">Teléfono:</span>
              <span className="text-sm font-mono text-zinc-300">{createdAppointment.clientPhone}</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs text-zinc-400">Tratamiento:</span>
              <span className="text-sm font-semibold text-amber-300">{createdAppointment.serviceName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs text-zinc-400">Fecha y Hora:</span>
              <span className="text-sm font-bold text-white">
                {createdAppointment.date} a las {createdAppointment.time} h
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400">Precio:</span>
              <span className="text-base font-bold text-amber-400">{createdAppointment.price} €</span>
            </div>
          </div>

          {/* THE BIG WHATSAPP BUTTON (AUTOMATIC PRE-FILLED MESSAGE) */}
          <div className="pt-2 space-y-3">
            <a
              href={`https://wa.me/${createdAppointment.cleanPhone}?text=${encodeURIComponent(createdAppointment.whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/60 transition-all transform active:scale-98 cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.075-2.037-.482-1.615-.67-2.658-2.308-2.738-2.416-.08-.107-.648-.864-.648-1.648 0-.785.412-1.17.558-1.327.146-.157.32-.196.427-.196.106 0 .213.002.306.007.098.005.23-.037.36.275.133.32.453 1.107.493 1.187.04.079.066.173.013.28-.053.107-.08.173-.16.267-.08.093-.167.208-.24.28-.08.08-.163.167-.07.327.094.16.417.688.895 1.114.615.547 1.134.717 1.294.797.16.079.253.066.346-.04.093-.107.4-.467.507-.627.107-.16.213-.133.36-.08.146.053.933.44 1.093.52.16.08.267.12.307.187.04.066.04.386-.104.791z"/>
              </svg>
              <span>Enviar WhatsApp a la Clienta ↗</span>
            </a>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
              >
                + Crear Otra Cita
              </button>

              <button
                type="button"
                onClick={handleCloseApp}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. FORM VIEW (NUEVA CITA) */
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
              <span className="text-red-400 font-bold">✗</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Servicio */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>1. Tratamiento / Servicio</span>
              <span className="text-amber-400/80 font-normal lowercase">selecciona uno</span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_SERVICES_LIST.map((srv) => {
                const isSelected = !isCustomService && selectedService.id === srv.id
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(srv)
                      setIsCustomService(false)
                    }}
                    className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                          {srv.name}
                        </span>
                        {srv.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/20">
                            {srv.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">{srv.duration}</div>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      {srv.priceFormatted}
                    </div>
                  </button>
                )
              })}

              {/* Opción personalizada */}
              <button
                type="button"
                onClick={() => setIsCustomService(true)}
                className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isCustomService
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <span className="text-xs font-medium">+ Otro servicio / Precio a medida</span>
                <span className="text-xs font-mono text-zinc-500">Manual</span>
              </button>

              {isCustomService && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 mt-1">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Nombre del Servicio</label>
                    <input
                      type="text"
                      value={customServiceName}
                      onChange={(e) => setCustomServiceName(e.target.value)}
                      placeholder="Ej. Retoque exprés, Lifting, etc."
                      className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Precio (€)</label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="30"
                      className="w-28 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Fecha y Hora */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              2. Fecha y Hora de la Cita
            </label>

            {/* Quick date chips */}
            <div className="flex gap-2">
              {[
                { label: 'Hoy', val: getFormattedDate(0) },
                { label: 'Mañana', val: getFormattedDate(1) },
                { label: 'Pasado mañana', val: getFormattedDate(2) },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setDate(chip.val)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    date === chip.val
                      ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Hora</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Quick time chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono transition-all cursor-pointer ${
                    time === t
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Clienta y Teléfono */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              3. Datos de la Clienta
            </label>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Laura Gómez"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Teléfono WhatsApp *</label>
                {isPhoneValid && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    WhatsApp: +{cleanPhone}
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ej. 612 34 56 78"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Section: Notas / Curvatura */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              4. Curvatura y Notas (Opcional)
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">Curvatura:</span>
              {['C', 'CC', 'D', 'L', 'M'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurl(c)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    curl === c
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el diseño, longitud deseada, o preferencias..."
              className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !isPhoneValid}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando en la nube...</span>
                </>
              ) : (
                <>
                  <span>✨ Guardar Cita y Generar Enlace WhatsApp</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-zinc-500 mt-2.5">
              Se sincronizará en Supabase 24/7 y se abrirá WhatsApp con los datos listos.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}
