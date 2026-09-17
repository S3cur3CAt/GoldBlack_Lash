import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { business } from '#/data/site'
import { useStudioConfig } from '#/context/StudioConfigContext'

export const Route = createFileRoute('/nueva-cita')({
  component: StudioMobileHubPage,
  head: () => ({
    meta: [
      { title: `Panel Studio — ${business.name} (Telegram Assistant)` },
      { name: 'description', content: `Panel de control móvil y asistente de gestión para ${business.name}` },
      { name: 'theme-color', content: '#08080a' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
    ],
    scripts: [
      { src: 'https://telegram.org/js/telegram-web-app.js' },
    ],
  }),
})

// Tipos
interface ServiceOption {
  id: string
  name: string
  priceNumber: number
  priceFormatted: string
  originalPriceFormatted?: string
  duration: string
  badge?: string
  isPromo?: boolean
}

interface AppointmentItem {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string
  time: string
  durationMinutes: number
  serviceId?: string
  serviceName: string
  price: number
  status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  paymentStatus: 'pendiente' | 'seña_pagada' | 'pagado'
  curl?: string
  length?: string
  style?: string
  notes?: string
  createdAt?: string
}

interface ClientSummary {
  name: string
  phone: string
  email?: string
  totalVisits: number
  totalSpent: number
  lastVisitDate: string
  lastServiceName: string
  preferredCurl?: string
  notes?: string
}

// Catálogo Oficial de Servicios (con la OFERTA ESPECIAL 23 € en 1ª posición)
const STUDIO_SERVICES: ServiceOption[] = [
  {
    id: 'promo-extensiones-23',
    name: 'Extensiones de Pestañas (Oferta Especial)',
    priceNumber: 23,
    priceFormatted: '23 €',
    originalPriceFormatted: '27 €',
    duration: '1 h 15 min',
    badge: '🔥 AHORA SOLO 23 €',
    isPromo: true,
  },
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

const PROMO_WHATSAPP_TEXT = `✨👁️ *OFERTA ESPECIAL* 👁️✨

💖 *EXTENSIONES DE PESTAÑAS* 💖

~Precio habitual: 27 €~
🔥 *AHORA SOLO 23 €* 🔥

✨ Realza tu mirada
✨ Pestañas bonitas y definidas
✨ Acabado elegante y personalizado

📅 *Oferta por tiempo limitado*

📩 *Reserva tu cita ahora*
💗 ¡Te encantará el resultado!
🌐 https://www.goldblacklash.com/`

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

type TabType = 'crear' | 'citas' | 'facturacion' | 'clientas' | 'servicios' | 'promo'

function StudioMobileHubPage() {
  const config = useStudioConfig()

  // Navegación de pestañas
  const [currentTab, setCurrentTab] = useState<TabType>('citas')

  // Estado de Datos en Vivo
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  // Filtro de Citas
  const [agendaFilter, setAgendaFilter] = useState<'hoy' | 'proximas' | 'todas'>('hoy')

  // Búsqueda en Clientas
  const [clientSearch, setClientSearch] = useState('')

  // Form State (Crear Cita)
  const [selectedService, setSelectedService] = useState<ServiceOption>(STUDIO_SERVICES[0])
  const [isCustomService, setIsCustomService] = useState(false)
  const [customServiceName, setCustomServiceName] = useState('')
  const [customPrice, setCustomPrice] = useState('30')
  const [date, setDate] = useState<string>(getFormattedDate(0))
  const [time, setTime] = useState<string>('16:30')
  const [clientName, setClientName] = useState<string>('')
  const [clientPhone, setClientPhone] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [curl, setCurl] = useState<string>('D')

  // UI state para crear cita
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null)

  // Feedback de copiado en promo
  const [copiedPromo, setCopiedPromo] = useState(false)

  // Cargar citas desde Supabase
  const loadAppointments = async () => {
    setIsLoadingAppointments(true)
    setAppointmentsError(null)
    try {
      const res = await fetch(`/api/appointments?_t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAppointments(data)
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    } catch (err: any) {
      setAppointmentsError(err?.message || 'Error cargando citas')
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  // Inicializar Telegram WebApp SDK y cargar citas al abrir
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.setHeaderColor) tg.setHeaderColor('#08080a')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#08080a')
    }
    loadAppointments()
  }, [])

  // Actualizar estado de una cita en Supabase
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'pendiente' | 'confirmada' | 'completada' | 'cancelada',
    newPayment?: 'pendiente' | 'seña_pagada' | 'pagado'
  ) => {
    try {
      const payload: any = { id, status: newStatus }
      if (newPayment) payload.paymentStatus = newPayment

      // Optimistic update
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus, ...(newPayment ? { paymentStatus: newPayment } : {}) } : apt))
      )

      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        // Recargar si falló
        loadAppointments()
      }
    } catch {
      loadAppointments()
    }
  }

  // Citas filtradas
  const todayStr = getFormattedDate(0)
  const filteredAppointments = useMemo(() => {
    if (agendaFilter === 'hoy') {
      return appointments.filter((a) => a.date === todayStr)
    }
    if (agendaFilter === 'proximas') {
      return appointments.filter((a) => a.date >= todayStr)
    }
    return appointments
  }, [appointments, agendaFilter, todayStr])

  // Métricas Financieras (Facturación)
  const metrics = useMemo(() => {
    const today = todayStr
    // Cálculo inicio de semana (lunes)
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0]
    const currentMonth = today.substring(0, 7) // YYYY-MM

    let totalHoy = 0
    let totalSemana = 0
    let totalMes = 0
    let countCompletadas = 0
    let countTotal = appointments.length
    let totalCobrado = 0
    let totalPendienteCobro = 0

    const serviceCounts: Record<string, { count: number; total: number }> = {}

    appointments.forEach((apt) => {
      const price = Number(apt.price) || 0
      const isCancelled = apt.status === 'cancelada'

      if (!isCancelled) {
        if (apt.date === today) totalHoy += price
        if (apt.date >= monday && apt.date <= today) totalSemana += price
        if (apt.date.startsWith(currentMonth)) totalMes += price

        if (apt.paymentStatus === 'pagado') {
          totalCobrado += price
        } else {
          totalPendienteCobro += price
        }

        const sName = apt.serviceName || 'Otros'
        if (!serviceCounts[sName]) serviceCounts[sName] = { count: 0, total: 0 }
        serviceCounts[sName].count += 1
        serviceCounts[sName].total += price
      }

      if (apt.status === 'completada') {
        countCompletadas += 1
      }
    })

    const monthCount = appointments.filter(a => a.date.startsWith(currentMonth)).length || 1
    const ticketMedio = countTotal > 0 ? Math.round(totalMes / monthCount) : 0

    return {
      totalHoy,
      totalSemana,
      totalMes,
      countTotal,
      countCompletadas,
      totalCobrado,
      totalPendienteCobro,
      ticketMedio,
      serviceCounts: Object.entries(serviceCounts).sort((a, b) => b[1].total - a[1].total),
    }
  }, [appointments, todayStr])

  // Directorio de Clientas Deducido
  const clientsList = useMemo<ClientSummary[]>(() => {
    const map = new Map<string, ClientSummary>()

    appointments.forEach((apt) => {
      const phone = (apt.clientPhone || '').trim()
      const key = phone ? cleanPhoneForWhatsApp(phone) : apt.clientName.toLowerCase().trim()
      if (!key) return

      const existing = map.get(key)
      const price = Number(apt.price) || 0

      if (!existing) {
        map.set(key, {
          name: apt.clientName,
          phone: apt.clientPhone,
          email: apt.clientEmail,
          totalVisits: 1,
          totalSpent: price,
          lastVisitDate: apt.date,
          lastServiceName: apt.serviceName,
          preferredCurl: apt.curl,
          notes: apt.notes,
        })
      } else {
        existing.totalVisits += 1
        existing.totalSpent += price
        if (apt.date > existing.lastVisitDate) {
          existing.lastVisitDate = apt.date
          existing.lastServiceName = apt.serviceName
          if (apt.curl) existing.preferredCurl = apt.curl
        }
        if (apt.notes && !existing.notes?.includes(apt.notes)) {
          existing.notes = (existing.notes ? existing.notes + ' | ' : '') + apt.notes
        }
      }
    })

    const list = Array.from(map.values()).sort((a, b) => b.totalVisits - a.totalVisits || b.totalSpent - a.totalSpent)
    if (!clientSearch) return list

    const q = clientSearch.toLowerCase()
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [appointments, clientSearch])

  // Validación de teléfono para WhatsApp
  const cleanPhone = cleanPhoneForWhatsApp(clientPhone)
  const isValidPhone = cleanPhone.length >= 9

  // Generador de mensaje de confirmación de WhatsApp
  const generateWhatsAppMessage = (data: {
    clientName: string
    date: string
    time: string
    serviceName: string
    price: number | string
    isPromo?: boolean
  }): string => {
    const studio = config?.name || business.name || 'GoldBlack Lash'
    const address = config?.address || 'Calle Numa, Montequinto (Dos Hermanas)'

    const promoBanner = data.isPromo
      ? `\n🎉 *¡Promoción Especial Aplicada!* (23 € en vez de 27 €)\n`
      : ''

    return [
      `✨ *Confirmación de Cita — ${studio}* ✨`,
      `🌐 https://www.goldblacklash.com/`,
      promoBanner,
      `¡Hola *${data.clientName}*! Tu cita ha sido agendada con éxito en nuestro estudio:`,
      ``,
      `📅 *Fecha:* ${data.date}`,
      `⏰ *Hora:* ${data.time}`,
      `🌸 *Tratamiento:* ${data.serviceName}`,
      `💶 *Precio:* ${data.price} €${data.isPromo ? ' (~Antes: 27 €~)' : ''}`,
      `📍 *Ubicación:* ${address}`,
      ``,
      `*Pautas para tu sesión:*`,
      `• Acude con la zona de los ojos completamente desmaquillada (sin rímel ni sombras).`,
      `• Si usas lentillas, te aconsejamos traer estuche para retirarlas durante la sesión.`,
      ``,
      `Si necesitas ajustar tu horario o tienes alguna duda, puedes respondernos directamente por aquí.`,
      ``,
      `¡Te esperamos con muchas ganas! 💕`,
      `${studio}`,
    ].filter(Boolean).join('\n')
  }

  // Envío de Cita
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      setSubmitErrorMsg('Por favor escribe el nombre de la clienta')
      return
    }
    if (!isValidPhone) {
      setSubmitErrorMsg('Por favor introduce un teléfono móvil válido (9 dígitos)')
      return
    }

    setIsSubmitting(true)
    setSubmitErrorMsg(null)

    const finalServiceName = isCustomService
      ? customServiceName.trim() || 'Servicio Personalizado'
      : selectedService.name
    const finalPrice = isCustomService
      ? parseFloat(customPrice) || 0
      : selectedService.priceNumber

    const appointmentPayload = {
      id: `apt-tg-${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date,
      time,
      serviceId: isCustomService ? 'custom' : selectedService.id,
      serviceName: finalServiceName,
      price: finalPrice,
      durationMinutes: isCustomService ? 60 : 75,
      curl: curl || 'D',
      notes: notes.trim() || undefined,
      status: 'confirmada',
      paymentStatus: 'pendiente',
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentPayload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Error HTTP ${res.status}`)
      }

      const whatsappMsg = generateWhatsAppMessage({
        clientName: clientName.trim(),
        date,
        time,
        serviceName: finalServiceName,
        price: finalPrice,
        isPromo: selectedService.isPromo,
      })

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`

      setCreatedAppointment({
        ...appointmentPayload,
        whatsappUrl,
        whatsappMsg,
      })

      // Recargar citas en segundo plano
      loadAppointments()
    } catch (err: any) {
      setSubmitErrorMsg(err?.message || 'Error al conectar con la base de datos')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copiar anuncio promocional
  const handleCopyPromo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(PROMO_WHATSAPP_TEXT)
      setCopiedPromo(true)
      setTimeout(() => setCopiedPromo(false), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans pb-24 selection:bg-[#d4af37]/30 selection:text-[#f3e5ab]">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-[#d4af37]/20 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#f3e5ab] flex items-center justify-center text-black font-serif font-black text-xs shadow-md">
              GB
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white leading-tight font-serif">
                {business.name}
              </h1>
              <p className="text-[10px] text-[#d4af37] tracking-widest uppercase font-mono">
                Panel Studio Móvil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAppointments}
              title="Actualizar datos"
              disabled={isLoadingAppointments}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37]/40 text-[11px] text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className={`w-2 h-2 rounded-full ${isLoadingAppointments ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{isLoadingAppointments ? 'Sincronizando...' : lastSyncTime || 'Conectado'}</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS (Scrollable horizontal) */}
        <div className="max-w-md mx-auto mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'citas'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>📅 Citas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-inherit font-bold">
              {appointments.filter(a => a.date === todayStr).length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('crear')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'crear'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>➕ Crear Cita</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'facturacion'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>💶 Facturación</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'clientas'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>👥 Clientas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-inherit font-bold">
              {clientsList.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'promo'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span>🔥 Oferta 23€</span>
          </button>

          <button
            onClick={() => setCurrentTab('servicios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'servicios'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>🌸 Servicios</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="max-w-md w-full mx-auto p-4 flex-1">
        {/* ========================================================================= */}
        {/* PESTAÑA 1: AGENDA DE CITAS */}
        {/* ========================================================================= */}
        {currentTab === 'citas' && (
          <div className="space-y-4">
            {/* Selector de Filtro */}
            <div className="flex items-center justify-between bg-[#121218] p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => setAgendaFilter('hoy')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'hoy'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hoy ({appointments.filter(a => a.date === todayStr).length})
              </button>
              <button
                onClick={() => setAgendaFilter('proximas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'proximas'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setAgendaFilter('todas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'todas'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todas ({appointments.length})
              </button>
            </div>

            {/* Listado de Citas */}
            {isLoadingAppointments && appointments.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Consultando citas en la nube...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-[#121218] border border-white/5 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-2xl">
                  📅
                </div>
                <h3 className="text-sm font-medium text-white">
                  {agendaFilter === 'hoy' ? 'No hay citas programadas para hoy' : 'No se encontraron citas'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Puedes agendar una nueva cita en cualquier momento y enviarle la confirmación a la clienta por WhatsApp.
                </p>
                <button
                  onClick={() => setCurrentTab('crear')}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#d4af37] text-black font-semibold text-xs transition-all active:scale-95 shadow-md shadow-[#d4af37]/20"
                >
                  ➕ Crear Nueva Cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const aptPhoneClean = cleanPhoneForWhatsApp(apt.clientPhone)
                  const statusColors = {
                    confirmada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    pendiente: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                    completada: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30',
                    cancelada: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  }

                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-[#121218] border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white font-serif tracking-tight">
                              {apt.clientName}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${
                                statusColors[apt.status] || statusColors.pendiente
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            📞 {apt.clientPhone}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-[#d4af37] font-mono">
                            {apt.price} €
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded ${
                              apt.paymentStatus === 'pagado'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {apt.paymentStatus === 'pagado' ? 'Pagado' : 'Cobro Pendiente'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#d4af37]">🕒</span>
                          <span className="font-medium text-zinc-200">
                            {apt.date} · {apt.time}
                          </span>
                        </div>
                        <div className="text-zinc-400 truncate max-w-[150px]">
                          🌸 {apt.serviceName}
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-zinc-400 bg-white/5 p-2 rounded-lg italic">
                          📝 {apt.notes}
                        </p>
                      )}

                      {/* Botones de Acción de Cita */}
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        {aptPhoneClean && (
                          <a
                            href={`https://wa.me/${aptPhoneClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}

                        {apt.status !== 'completada' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'completada', 'pagado')}
                            className="py-1.5 px-3 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span>⭐ Completar</span>
                          </button>
                        )}

                        {apt.status === 'pendiente' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'confirmada')}
                            className="py-1.5 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all active:scale-95"
                          >
                            <span>✓ Confirmar</span>
                          </button>
                        )}

                        {apt.status !== 'cancelada' && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Cancelar la cita de ${apt.clientName}?`)) {
                                handleUpdateStatus(apt.id, 'cancelada')
                              }
                            }}
                            className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-all active:scale-95"
                          >
                            <span>✕</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: CREAR CITA (CON OFERTA ESPECIAL 23 €) */}
        {/* ========================================================================= */}
        {currentTab === 'crear' && (
          <div className="space-y-4">
            {createdAppointment ? (
              <div className="p-5 rounded-3xl bg-[#121218] border border-emerald-500/30 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-semibold">
                    Cita Registrada 24/7 en la Nube
                  </span>
                  <h2 className="text-xl font-bold text-white font-serif mt-1">
                    {createdAppointment.clientName}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    {createdAppointment.date} a las {createdAppointment.time} · {createdAppointment.serviceName}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/50 border border-[#d4af37]/20 text-left space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Teléfono:</span>
                    <span className="font-mono text-zinc-200">{createdAppointment.clientPhone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Total a cobrar:</span>
                    <span className="font-mono font-bold text-[#d4af37]">{createdAppointment.price} €</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={createdAppointment.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
                  >
                    <span>💬 Enviar WhatsApp a la Clienta ↗</span>
                  </a>

                  <button
                    onClick={() => {
                      setCreatedAppointment(null)
                      setClientName('')
                      setClientPhone('')
                      setNotes('')
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-all"
                  >
                    Agendar otra cita
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppointment} className="space-y-4">
                {/* 1. Selección de Servicio */}
                <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-[#d4af37]">1.</span> Tratamiento / Servicio
                    </label>
                    <span className="text-[10px] text-[#d4af37]">Precios oficiales</span>
                  </div>

                  <div className="space-y-2">
                    {STUDIO_SERVICES.map((s) => {
                      const isSelected = !isCustomService && selectedService.id === s.id
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedService(s)
                            setIsCustomService(false)
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                            isSelected
                              ? s.isPromo
                                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                                : 'bg-[#d4af37]/15 border-[#d4af37] shadow-md shadow-[#d4af37]/10'
                              : 'bg-black/30 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-semibold ${isSelected ? (s.isPromo ? 'text-amber-300 font-bold' : 'text-white') : 'text-zinc-300'}`}>
                                {s.name}
                              </span>
                              {s.badge && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                  s.isPromo ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white animate-pulse' : 'bg-[#d4af37]/20 text-[#f3e5ab]'
                                }`}>
                                  {s.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 flex items-center gap-2">
                              <span>⏱️ {s.duration}</span>
                              {s.originalPriceFormatted && (
                                <span className="line-through text-zinc-600">Habitual: {s.originalPriceFormatted}</span>
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-bold font-mono ${s.isPromo ? 'text-amber-400 text-base' : 'text-[#d4af37]'}`}>
                              {s.priceFormatted}
                            </span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Opción Personalizada */}
                    <div
                      onClick={() => setIsCustomService(true)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                        isCustomService
                          ? 'bg-[#d4af37]/15 border-[#d4af37]'
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-300">
                        + Otro servicio personalizado
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">Editar</span>
                    </div>

                    {isCustomService && (
                      <div className="p-3 rounded-xl bg-black/40 border border-[#d4af37]/30 space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre del servicio (ej. Lifting + Tinte)"
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          className="w-full bg-[#121218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Precio (€):</span>
                          <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="w-24 bg-[#121218] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fecha y Hora */}
                <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
                  <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#d4af37]">2.</span> Fecha y Hora
                  </label>

                  {/* Chips rápidos de fecha */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Hoy', offset: 0 },
                      { label: 'Mañana', offset: 1 },
                      { label: 'Pasado', offset: 2 },
                    ].map((d) => {
                      const dStr = getFormattedDate(d.offset)
                      const isSel = date === dStr
                      return (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setDate(dStr)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSel
                              ? 'bg-[#d4af37] text-black border-[#d4af37] font-semibold'
                              : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Día de la cita</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Hora de inicio</span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  {/* Chips rápidos de horas habituales */}
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    {['10:00', '11:30', '13:00', '16:00', '17:30', '19:00'].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTime(h)}
                        className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all ${
                          time === h
                            ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3e5ab]'
                            : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Datos de la Clienta y WhatsApp */}
                <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-[#d4af37]">3.</span> Clienta y Teléfono
                    </label>
                    {isValidPhone && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        WhatsApp: +{cleanPhone}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre de la clienta *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                    />

                    <input
                      type="tel"
                      required
                      placeholder="Teléfono móvil (ej. 612 34 56 78) *"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Curvatura habitual</span>
                      <select
                        value={curl}
                        onChange={(e) => setCurl(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="D">Curva D (Marcada)</option>
                        <option value="CC">Curva CC (Media)</option>
                        <option value="C">Curva C (Natural)</option>
                        <option value="M">Curva M (Foxy / Rasgado)</option>
                        <option value="L">Curva L (Especial)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Notas / Preferencias</span>
                      <input
                        type="text"
                        placeholder="Ej. Ojo sensible, efecto ardilla"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>

                {submitErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    ⚠️ {submitErrorMsg}
                  </div>
                )}

                {/* Botón de Guardado */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa8c2c] hover:opacity-95 text-black font-bold text-sm tracking-wide shadow-xl shadow-[#d4af37]/25 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando en la nube...' : '✨ GUARDAR CITA Y GENERAR ENLACE WHATSAPP'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: FACTURACIÓN Y MÉTRICAS */}
        {/* ========================================================================= */}
        {currentTab === 'facturacion' && (
          <div className="space-y-4">
            {/* Tarjetas Principales */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Facturado Hoy</span>
                <div className="text-2xl font-bold text-white font-mono">
                  {metrics.totalHoy} €
                </div>
                <p className="text-[10px] text-emerald-400">
                  {appointments.filter(a => a.date === todayStr && a.status !== 'cancelada').length} citas programadas
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121218] border border-[#d4af37]/30 space-y-1 bg-gradient-to-br from-[#121218] to-[#1a170d]">
                <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-semibold">Este Mes</span>
                <div className="text-2xl font-bold text-[#d4af37] font-mono">
                  {metrics.totalMes} €
                </div>
                <p className="text-[10px] text-zinc-400">
                  Semana: {metrics.totalSemana} €
                </p>
              </div>
            </div>

            {/* Desglose de Cobros */}
            <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Balance de Cobros
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-300 block">Total Pagado</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{metrics.totalCobrado} €</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20">
                  <span className="text-[10px] text-amber-300 block">Pendiente de Cobro</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{metrics.totalPendienteCobro} €</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 text-zinc-400">
                <span>Citas completadas: <strong className="text-white">{metrics.countCompletadas}</strong></span>
                <span>Ticket medio estimado: <strong className="text-[#d4af37] font-mono">{metrics.ticketMedio} €</strong></span>
              </div>
            </div>

            {/* Desglose por Servicios */}
            <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Ingresos por Tratamiento
              </h3>

              <div className="space-y-2">
                {metrics.serviceCounts.map(([serviceName, data]) => (
                  <div key={serviceName} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-200 block">{serviceName}</span>
                      <span className="text-[10px] text-zinc-500">{data.count} cita{data.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="font-bold text-[#d4af37] font-mono">{data.total} €</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: DIRECTORIO DE CLIENTAS */}
        {/* ========================================================================= */}
        {currentTab === 'clientas' && (
          <div className="space-y-3">
            {/* Buscador de Clientas */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar clienta por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-[#121218] border border-white/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch('')}
                  className="absolute right-3 top-2.5 text-zinc-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {clientsList.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No se encontraron clientas en la base de datos.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientsList.map((client) => {
                  const clientPhoneClean = cleanPhoneForWhatsApp(client.phone)
                  return (
                    <div
                      key={client.phone || client.name}
                      className="p-3.5 rounded-2xl bg-[#121218] border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white font-serif tracking-tight">
                            {client.name}
                          </h4>
                          <p className="text-xs text-zinc-400 font-mono">
                            📞 {client.phone}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] font-bold">
                            {client.totalVisits} visita{client.totalVisits !== 1 ? 's' : ''}
                          </span>
                          <span className="block text-xs font-mono font-bold text-zinc-300 mt-1">
                            {client.totalSpent} € total
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-white/5 pt-1.5">
                        <span>Última vez: {client.lastVisitDate} ({client.lastServiceName})</span>
                        {client.preferredCurl && (
                          <span className="text-[#f3e5ab] font-bold">Curva {client.preferredCurl}</span>
                        )}
                      </div>

                      {client.notes && (
                        <p className="text-[10px] text-zinc-500 italic">
                          📝 {client.notes}
                        </p>
                      )}

                      {clientPhoneClean && (
                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={`https://wa.me/${clientPhoneClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>💬 Escribir por WhatsApp</span>
                          </a>

                          <button
                            onClick={() => {
                              setClientName(client.name)
                              setClientPhone(client.phone)
                              if (client.preferredCurl) setCurl(client.preferredCurl)
                              setCurrentTab('crear')
                            }}
                            className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-all"
                          >
                            ➕ Agendar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: OFERTA ESPECIAL Y DIFUSIÓN EN WHATSAPP */}
        {/* ========================================================================= */}
        {currentTab === 'promo' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1c1208] via-[#121218] to-[#12081c] border border-amber-500/40 shadow-xl space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold uppercase tracking-wider">
                  🔥 PROMOCIÓN ACTIVA
                </span>
                <h2 className="text-lg font-bold text-white font-serif mt-1">
                  Extensiones de Pestañas — Oferta 23 €
                </h2>
                <p className="text-xs text-amber-300">
                  Difunde esta promoción directamente por WhatsApp o aplícala a nuevas citas
                </p>
              </div>

              {/* Vista previa del mensaje */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs text-zinc-300 font-sans whitespace-pre-line leading-relaxed shadow-inner">
                {PROMO_WHATSAPP_TEXT}
              </div>

              {/* Acciones de Difusión */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyPromo}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{copiedPromo ? '✓ ¡Copiado!' : '📋 Copiar Texto'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(PROMO_WHATSAPP_TEXT)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💬 Enviar por WhatsApp</span>
                  </a>
                </div>

                <button
                  onClick={() => {
                    setSelectedService(STUDIO_SERVICES[0])
                    setIsCustomService(false)
                    setCurrentTab('crear')
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  📅 Crear Cita con esta Oferta (23 €)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 6: SERVICIOS Y PRECIOS OFICIALES */}
        {/* ========================================================================= */}
        {currentTab === 'servicios' && (
          <div className="space-y-3">
            <div className="text-center pb-1">
              <h2 className="text-sm font-bold text-white font-serif">
                Catálogo de Servicios y Precios
              </h2>
              <p className="text-[11px] text-zinc-400">
                Pulsa en cualquier servicio para agendar una cita al instante
              </p>
            </div>

            <div className="space-y-2.5">
              {STUDIO_SERVICES.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#121218] border border-white/5 hover:border-[#d4af37]/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">
                        {s.name}
                      </h4>
                      {s.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#d4af37]/20 text-[#f3e5ab] font-bold">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      ⏱️ Duración: {s.duration}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-sm font-bold text-[#d4af37] font-mono">
                      {s.priceFormatted}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedService(s)
                        setIsCustomService(false)
                        setCurrentTab('crear')
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-black font-bold text-[10px] hover:opacity-90 active:scale-95 transition-all"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BARRA INFERIOR FLOTANTE (DOCK PARA MÓVIL) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-t border-white/10 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'citas' ? 'text-[#d4af37] font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">📅</span>
            <span className="text-[10px]">Citas</span>
          </button>

          <button
            onClick={() => setCurrentTab('crear')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'crear' ? 'text-[#d4af37] font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">➕</span>
            <span className="text-[10px]">Crear</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'facturacion' ? 'text-[#d4af37] font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">💶</span>
            <span className="text-[10px]">Facturas</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'clientas' ? 'text-[#d4af37] font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">👥</span>
            <span className="text-[10px]">Clientas</span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'promo' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">🔥</span>
            <span className="text-[10px]">Oferta</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
