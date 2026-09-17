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
export interface ServiceOption {
  id: string
  categoryId?: string
  categoryName?: string
  name: string
  priceNumber: number
  priceFormatted: string
  originalPriceFormatted?: string
  duration: string
  badge?: string
  description?: string
  includes?: string[]
  image?: string | null
  isPromo?: boolean
}

export interface AppointmentItem {
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

export interface ClientSummary {
  name: string
  phone: string
  email?: string
  totalVisits: number
  totalSpent: number
  lastVisitDate: string
  lastServiceName: string
  preferredCurl?: string
  notes?: string
  appointmentsHistory: AppointmentItem[]
}

// Catálogo Base con la OFERTA ESPECIAL 23 € en 1ª posición
const FALLBACK_STUDIO_SERVICES: ServiceOption[] = [
  {
    id: 'promo-extensiones-23',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Extensiones de Pestañas (Oferta Especial)',
    priceNumber: 23,
    priceFormatted: '23 €',
    originalPriceFormatted: '27 €',
    duration: '1 h 15 min',
    badge: '🔥 AHORA SOLO 23 €',
    description: 'Oferta especial por tiempo limitado para lucir una mirada definida, elegante y personalizada.',
    includes: ['Diseño personalizado según tu ojo', 'Fibras ligeras de alta retención', 'Cepillado y sellado profesional'],
    image: '/galeria/pieza-04.jpg',
    isPromo: true,
  },
  {
    id: 'volumen-3d6d',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Volumen (3D, 4D, 5D y 6D)',
    priceNumber: 27,
    priceFormatted: '27 €',
    duration: '1 h 15 min',
    badge: 'Más popular',
    description: 'Varias extensiones por pestaña natural. El resultado más natural y discreto, ideal para el día a día.',
    includes: ['Efecto natural pelo a pelo', 'Diseño según la forma del ojo', 'Sellado y baño de vitaminas'],
    image: '/galeria/pieza-02.jpg',
  },
  {
    id: 'volumen-ruso',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Volumen Ruso',
    priceNumber: 30,
    priceFormatted: '30 €',
    duration: '1 h',
    badge: 'Densidad alta',
    description: 'Abanicos de 3 a 5 pestañas ultrafinas por pestaña natural. Densidad y negro intenso sin peso.',
    includes: ['Abanicos hechos a mano', 'Densidad media-alta', 'Ideal para pestaña escasa'],
    image: '/galeria/pieza-01.jpg',
  },
  {
    id: 'retoque-mantenimiento',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Retoque / Mantenimiento',
    priceNumber: 22,
    priceFormatted: '22 €',
    duration: '50 min',
    description: 'Mantenimiento recomendado cada 2–3 semanas para reponer las extensiones caídas por el ciclo natural.',
    includes: ['Retirada de pestañas crecidas', 'Relleno de nuevas fibras', 'Cepillo de regalo'],
    image: '/galeria/pieza-03.jpg',
  },
  {
    id: 'retirada',
    categoryId: 'extras',
    categoryName: 'Tratamientos y extras',
    name: 'Retirada de extensiones',
    priceNumber: 10,
    priceFormatted: '10 €',
    duration: '30 min',
    description: 'Retiramos tus extensiones con crema disolvente profesional, sin tirones ni daño a tu pestaña natural.',
    includes: ['Crema disolvente suave', 'Sin daño a la pestaña natural', 'Revisión incluida'],
    image: '/galeria/pieza-05.jpg',
  },
  {
    id: 'limpieza-facial',
    categoryId: 'extras',
    categoryName: 'Tratamientos y extras',
    name: 'Limpieza facial profunda',
    priceNumber: 30,
    priceFormatted: '30 €',
    duration: '1 h',
    badge: 'Piel Radiante',
    description: 'Higiene dérmica con espátula ultrasónica, extracción de impurezas y mascarilla hidratante.',
    includes: ['Puntos negros e impurezas fuera', 'Hidratación profunda y luminosidad', 'Piel suave y descansada'],
    image: '/galeria/limpieza-facial.jpg',
  },
]

const GALLERY_PRESETS = [
  { label: 'Volumen Ruso (Pieza 01)', path: '/galeria/pieza-01.jpg' },
  { label: 'Volumen 3D-5D (Pieza 02)', path: '/galeria/pieza-02.jpg' },
  { label: 'Retoque / Natural (Pieza 03)', path: '/galeria/pieza-03.jpg' },
  { label: 'Volumen Clásico (Pieza 04)', path: '/galeria/pieza-04.jpg' },
  { label: 'Efecto Intenso (Pieza 05)', path: '/galeria/pieza-05.jpg' },
  { label: 'Limpieza Facial', path: '/galeria/limpieza-facial.jpg' },
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

function formatServiceImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '/galeria/pieza-04.jpg'
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:image/')) {
    return rawUrl
  }
  const clean = rawUrl.replace(/^(\.\/|\/)?(galeria\/)?/, '')
  return `/galeria/${clean}`
}

type TabType = 'crear' | 'citas' | 'facturacion' | 'clientas' | 'servicios' | 'promo'

function StudioMobileHubPage() {
  const config = useStudioConfig()

  // Navegación de pestañas
  const [currentTab, setCurrentTab] = useState<TabType>('citas')

  // Estado de Datos en Vivo
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  // Servicios dinámicos desde Supabase
  const [services, setServices] = useState<ServiceOption[]>(FALLBACK_STUDIO_SERVICES)
  const [isLoadingServices, setIsLoadingServices] = useState(false)

  // Filtro de Citas
  const [agendaFilter, setAgendaFilter] = useState<'hoy' | 'proximas' | 'todas'>('hoy')

  // Búsqueda y Modal de Clienta Seleccionada
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientModal, setSelectedClientModal] = useState<ClientSummary | null>(null)
  const [isDeletingClient, setIsDeletingClient] = useState(false)

  // Modal de Añadir / Editar Servicio
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [serviceFormName, setServiceFormName] = useState('')
  const [serviceFormCategory, setServiceFormCategory] = useState('Extensiones de pestañas')
  const [serviceFormPrice, setServiceFormPrice] = useState('27')
  const [serviceFormDuration, setServiceFormDuration] = useState('1 h 15 min')
  const [serviceFormBadge, setServiceFormBadge] = useState('')
  const [serviceFormDescription, setServiceFormDescription] = useState('')
  const [serviceFormIncludes, setServiceFormIncludes] = useState('')
  const [serviceFormImage, setServiceFormImage] = useState('/galeria/pieza-01.jpg')
  const [isSavingService, setIsSavingService] = useState(false)
  const [serviceActionError, setServiceActionError] = useState<string | null>(null)

  // Form State (Crear Cita)
  const [selectedService, setSelectedService] = useState<ServiceOption>(FALLBACK_STUDIO_SERVICES[0])
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
    try {
      const res = await fetch(`/api/appointments?_t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAppointments(data)
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    } catch (err) {
      console.warn('[Appointments Error]', err)
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  // Cargar servicios desde Supabase
  const loadServices = async () => {
    setIsLoadingServices(true)
    try {
      const res = await fetch(`/api/services?_t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const mapped: ServiceOption[] = data.map((s: any) => ({
          id: s.id,
          categoryId: s.category_id || s.categoryId || 'extensiones',
          categoryName: s.category_name || s.categoryName || 'Extensiones de pestañas',
          name: s.name,
          priceNumber: s.price_number ?? s.priceNumber ?? (parseInt(String(s.price || '').replace(/\D/g, ''), 10) || 0),
          priceFormatted: s.price ? (String(s.price).includes('€') ? s.price : `${s.price} €`) : '0 €',
          duration: s.duration || '1 h 15 min',
          badge: s.badge || undefined,
          description: s.description || undefined,
          includes: Array.isArray(s.includes) ? s.includes : [],
          image: s.image || null,
          isPromo: s.id.includes('promo') || s.name.toLowerCase().includes('oferta'),
        }))

        // Si la oferta especial no estuviera en Supabase, garantizarla siempre arriba
        const hasPromo = mapped.some((m) => m.id === 'promo-extensiones-23' || m.name.includes('Oferta Especial'))
        if (!hasPromo) {
          mapped.unshift(FALLBACK_STUDIO_SERVICES[0])
        }
        setServices(mapped)
      }
    } catch (err) {
      console.warn('[Services Load Error]', err)
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Inicializar Telegram WebApp SDK y datos
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.setHeaderColor) tg.setHeaderColor('#08080a')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#08080a')
    }
    loadAppointments()
    loadServices()
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

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus, ...(newPayment ? { paymentStatus: newPayment } : {}) } : apt))
      )

      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      loadAppointments()
    }
  }

  // Eliminar clienta y todo su historial de citas de Supabase
  const handleDeleteClient = async (client: ClientSummary) => {
    const confirmMsg = `¿Estás segura de eliminar a ${client.name} y todas sus ${client.totalVisits} cita(s) de la base de datos?\nEsta acción no se puede deshacer.`
    if (!window.confirm(confirmMsg)) return

    setIsDeletingClient(true)
    try {
      const res = await fetch(`/api/appointments?clientPhone=${encodeURIComponent(client.phone)}&clientName=${encodeURIComponent(client.name)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // Cerrar modal y limpiar del formulario si coincide
      setSelectedClientModal(null)
      if (clientPhone === client.phone) {
        setClientName('')
        setClientPhone('')
        setNotes('')
      }
      // Actualizar listado local y remoto
      setAppointments((prev) => prev.filter((a) => a.clientPhone !== client.phone && a.clientName !== client.name))
      loadAppointments()
    } catch (err: any) {
      alert(`Error al eliminar clienta: ${err?.message || 'Error de conexión'}`)
    } finally {
      setIsDeletingClient(false)
    }
  }

  // Abrir Modal de Servicio (Añadir o Editar)
  const openServiceModal = (serviceToEdit?: ServiceOption) => {
    setServiceActionError(null)
    if (serviceToEdit) {
      setEditingServiceId(serviceToEdit.id)
      setServiceFormName(serviceToEdit.name)
      setServiceFormCategory(serviceToEdit.categoryName || 'Extensiones de pestañas')
      setServiceFormPrice(String(serviceToEdit.priceNumber || 27))
      setServiceFormDuration(serviceToEdit.duration || '1 h 15 min')
      setServiceFormBadge(serviceToEdit.badge || '')
      setServiceFormDescription(serviceToEdit.description || '')
      setServiceFormIncludes((serviceToEdit.includes || []).join('\n'))
      setServiceFormImage(serviceToEdit.image || '/galeria/pieza-01.jpg')
    } else {
      setEditingServiceId(null)
      setServiceFormName('')
      setServiceFormCategory('Extensiones de pestañas')
      setServiceFormPrice('27')
      setServiceFormDuration('1 h 15 min')
      setServiceFormBadge('')
      setServiceFormDescription('')
      setServiceFormIncludes('Diseño anatómico personalizado\nFibras de alta gama\nSellado profesional')
      setServiceFormImage('/galeria/pieza-01.jpg')
    }
    setServiceModalOpen(true)
  }

  // Guardar Servicio (Crear o Actualizar) en Supabase
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceFormName.trim()) {
      setServiceActionError('Por favor escribe el nombre del servicio')
      return
    }

    setIsSavingService(true)
    setServiceActionError(null)

    const numPrice = parseFloat(serviceFormPrice) || 0
    const includesArray = serviceFormIncludes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const id = editingServiceId || `srv-${Date.now()}`
    const payload = {
      id,
      name: serviceFormName.trim(),
      categoryName: serviceFormCategory.trim() || 'Extensiones de pestañas',
      categoryId: serviceFormCategory.toLowerCase().includes('extra') || serviceFormCategory.toLowerCase().includes('facial') ? 'extras' : 'extensiones',
      price: `${numPrice} €`,
      priceNumber: numPrice,
      duration: serviceFormDuration.trim() || '1 h 15 min',
      badge: serviceFormBadge.trim() || null,
      description: serviceFormDescription.trim() || '',
      includes: includesArray,
      image: serviceFormImage,
      active: true,
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setServiceModalOpen(false)
      loadServices()
    } catch (err: any) {
      setServiceActionError(err?.message || 'Error al guardar el servicio en la base de datos')
    } finally {
      setIsSavingService(false)
    }
  }

  // Eliminar Servicio de Supabase
  const handleDeleteService = async (service: ServiceOption) => {
    if (!window.confirm(`¿Deseas eliminar el servicio "${service.name}" de la base de datos?`)) return
    try {
      const res = await fetch(`/api/services?id=${encodeURIComponent(service.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadServices()
    } catch (err: any) {
      alert(`Error al eliminar servicio: ${err?.message || 'Error de conexión'}`)
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
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0]
    const currentMonth = today.substring(0, 7)

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

    const monthAppointments = appointments.filter((a) => a.date.startsWith(currentMonth))
    const ticketMedio = monthAppointments.length > 0 ? Math.round(totalMes / monthAppointments.length) : 0

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
          appointmentsHistory: [apt],
        })
      } else {
        existing.totalVisits += 1
        existing.totalSpent += price
        existing.appointmentsHistory.push(apt)
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
              onClick={() => {
                loadAppointments()
                loadServices()
              }}
              title="Actualizar datos"
              disabled={isLoadingAppointments || isLoadingServices}
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#d4af37]/40 text-[11px] text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className={`w-2 h-2 rounded-full ${isLoadingAppointments || isLoadingServices ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{isLoadingAppointments || isLoadingServices ? 'Sincronizando...' : lastSyncTime || 'Conectado'}</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS */}
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
            onClick={() => setCurrentTab('servicios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'servicios'
                ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>🌸 Servicios</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-inherit font-bold">
              {services.length}
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
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-md w-full mx-auto p-4 flex-1">
        {/* ========================================================================= */}
        {/* PESTAÑA 1: AGENDA DE CITAS */}
        {/* ========================================================================= */}
        {currentTab === 'citas' && (
          <div className="space-y-4">
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
                    <span className="text-[10px] text-[#d4af37]">{services.length} disponibles</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                    {services.map((s) => {
                      const isSelected = !isCustomService && selectedService.id === s.id
                      const sImg = formatServiceImageUrl(s.image)
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedService(s)
                            setIsCustomService(false)
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                            isSelected
                              ? s.isPromo
                                ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                                : 'bg-[#d4af37]/15 border-[#d4af37] shadow-md shadow-[#d4af37]/10'
                              : 'bg-black/30 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <img
                            src={sImg}
                            alt={s.name}
                            className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                            loading="lazy"
                          />

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-semibold truncate ${isSelected ? (s.isPromo ? 'text-amber-300 font-bold' : 'text-white') : 'text-zinc-300'}`}>
                                {s.name}
                              </span>
                              {s.badge && (
                                <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
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

                          <div className="text-right shrink-0">
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

                  {(clientName || clientPhone) && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientName('')
                        setClientPhone('')
                        setNotes('')
                      }}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                    >
                      ✕ Limpiar datos de clienta del formulario
                    </button>
                  )}

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
        {/* PESTAÑA 4: DIRECTORIO DE CLIENTAS CON FICHA COMPLETA Y BORRADO */}
        {/* ========================================================================= */}
        {currentTab === 'clientas' && (
          <div className="space-y-3">
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
                      className="p-3.5 rounded-2xl bg-[#121218] border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-2 shadow-md"
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
                        <span>Última visita: {client.lastVisitDate}</span>
                        {client.preferredCurl && (
                          <span className="text-[#f3e5ab] font-bold">Curva {client.preferredCurl}</span>
                        )}
                      </div>

                      {client.notes && (
                        <p className="text-[10px] text-zinc-500 italic truncate">
                          📝 {client.notes}
                        </p>
                      )}

                      {/* Botones de Acción de Clienta */}
                      <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                        {clientPhoneClean && (
                          <a
                            href={`https://wa.me/${clientPhoneClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedClientModal(client)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                        >
                          <span>👁️ Ficha Completa</span>
                        </button>

                        <button
                          onClick={() => {
                            setClientName(client.name)
                            setClientPhone(client.phone)
                            if (client.preferredCurl) setCurl(client.preferredCurl)
                            setCurrentTab('crear')
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-all"
                        >
                          ➕ Cita
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: SERVICIOS CON GESTIÓN COMPLETA (VER, CREAR, EDITAR, BORRAR, IMÁGENES) */}
        {/* ========================================================================= */}
        {currentTab === 'servicios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-sm font-bold text-white font-serif">
                  Catálogo de Servicios
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {services.length} tratamientos en la base de datos
                </p>
              </div>

              <button
                onClick={() => openServiceModal()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-xs shadow-md shadow-[#d4af37]/20 flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>➕ Añadir Servicio</span>
              </button>
            </div>

            {isLoadingServices && services.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Cargando servicios de Supabase...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((s) => {
                  const sImg = formatServiceImageUrl(s.image)
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-[#121218] border border-white/5 hover:border-[#d4af37]/30 transition-all space-y-3 shadow-md overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/50">
                          <img
                            src={sImg}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {s.badge && (
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[7px] px-1 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[#d4af37] font-bold uppercase truncate">
                              {s.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-white leading-tight">
                              {s.name}
                            </h4>
                            <span className="text-sm font-bold text-[#d4af37] font-mono shrink-0">
                              {s.priceFormatted}
                            </span>
                          </div>

                          <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                            <span>⏱️ {s.duration}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400">{s.categoryName || 'General'}</span>
                          </div>

                          {s.description && (
                            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-tight">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {s.includes && s.includes.length > 0 && (
                        <div className="pt-2 border-t border-white/5 flex items-center gap-1.5 flex-wrap">
                          {s.includes.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-300">
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Botones de Acción de Servicio */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedService(s)
                            setIsCustomService(false)
                            setCurrentTab('crear')
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#d4af37]/20"
                        >
                          📅 Agendar Cita
                        </button>

                        <button
                          onClick={() => openServiceModal(s)}
                          className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-medium active:scale-95 transition-all"
                        >
                          ✏️ Editar
                        </button>

                        {!s.isPromo && (
                          <button
                            onClick={() => handleDeleteService(s)}
                            className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs active:scale-95 transition-all"
                            title="Eliminar servicio"
                          >
                            🗑️
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
        {/* PESTAÑA 6: OFERTA ESPECIAL Y DIFUSIÓN EN WHATSAPP */}
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

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs text-zinc-300 font-sans whitespace-pre-line leading-relaxed shadow-inner">
                {PROMO_WHATSAPP_TEXT}
              </div>

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
                    const promoServ = services.find(s => s.isPromo) || FALLBACK_STUDIO_SERVICES[0]
                    setSelectedService(promoServ)
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
      </main>

      {/* ========================================================================= */}
      {/* MODAL FICHA COMPLETA DE CLIENTA */}
      {/* ========================================================================= */}
      {selectedClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121218] border-t sm:border border-[#d4af37]/30 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-mono font-semibold">
                  Ficha de la Clienta
                </span>
                <h3 className="text-xl font-bold text-white font-serif mt-0.5">
                  {selectedClientModal.name}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  📞 {selectedClientModal.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedClientModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Estadísticas de la Clienta */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400 uppercase">Citas Acumuladas</span>
                <div className="text-lg font-bold text-white font-mono">
                  {selectedClientModal.totalVisits}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-[#d4af37]/20 space-y-0.5">
                <span className="text-[10px] text-[#d4af37] uppercase">Gasto Total</span>
                <div className="text-lg font-bold text-[#d4af37] font-mono">
                  {selectedClientModal.totalSpent} €
                </div>
              </div>
            </div>

            {selectedClientModal.preferredCurl && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs flex justify-between">
                <span className="text-zinc-400">Curvatura habitual:</span>
                <span className="font-bold text-[#f3e5ab]">Curva {selectedClientModal.preferredCurl}</span>
              </div>
            )}

            {selectedClientModal.notes && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Observaciones / Alergias</span>
                <p className="text-zinc-300 italic">{selectedClientModal.notes}</p>
              </div>
            )}

            {/* Historial de Citas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Historial de Sesiones ({selectedClientModal.appointmentsHistory.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                {selectedClientModal.appointmentsHistory.map((hApt) => (
                  <div key={hApt.id} className="p-2 rounded-xl bg-black/30 border border-white/5 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-zinc-200 font-medium block">{hApt.serviceName}</span>
                      <span className="text-[10px] text-zinc-500">{hApt.date} · {hApt.time}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#d4af37] font-mono">{hApt.price} €</span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-400">{hApt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de la Ficha */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp(selectedClientModal.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>💬 WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setClientName(selectedClientModal.name)
                    setClientPhone(selectedClientModal.phone)
                    if (selectedClientModal.preferredCurl) setCurl(selectedClientModal.preferredCurl)
                    setSelectedClientModal(null)
                    setCurrentTab('crear')
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#d4af37] text-black font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>➕ Agendar Cita</span>
                </button>
              </div>

              {/* Botón de Borrado de la Base de Datos */}
              <button
                onClick={() => handleDeleteClient(selectedClientModal)}
                disabled={isDeletingClient}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <span>{isDeletingClient ? 'Eliminando...' : '🗑️ Eliminar Clienta de la Base de Datos'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR SERVICIO */}
      {/* ========================================================================= */}
      {serviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121218] border-t sm:border border-[#d4af37]/30 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-[#d4af37] uppercase tracking-widest font-mono font-semibold">
                  {editingServiceId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                </span>
                <h3 className="text-lg font-bold text-white font-serif mt-0.5">
                  {editingServiceId ? 'Modificar Datos del Servicio' : 'Añadir Servicio al Catálogo'}
                </h3>
              </div>

              <button
                onClick={() => setServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Efecto Sirena / Wet Look"
                  value={serviceFormName}
                  onChange={(e) => setServiceFormName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Precio (€) *</label>
                  <input
                    type="number"
                    required
                    value={serviceFormPrice}
                    onChange={(e) => setServiceFormPrice(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Duración estimada</label>
                  <input
                    type="text"
                    placeholder="Ej. 1 h 15 min"
                    value={serviceFormDuration}
                    onChange={(e) => setServiceFormDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Categoría</label>
                  <select
                    value={serviceFormCategory}
                    onChange={(e) => setServiceFormCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="Extensiones de pestañas">Extensiones de pestañas</option>
                    <option value="Tratamientos y extras">Tratamientos y extras</option>
                    <option value="Cuidado Facial">Cuidado Facial</option>
                    <option value="Lifting y Cejas">Lifting y Cejas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Badge / Etiqueta</label>
                  <input
                    type="text"
                    placeholder="Ej. Más popular, Novedad"
                    value={serviceFormBadge}
                    onChange={(e) => setServiceFormBadge(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Selector de Imagen del Servicio */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 uppercase block">Imagen del Servicio</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {GALLERY_PRESETS.map((preset) => {
                    const isSelected = serviceFormImage === preset.path
                    return (
                      <div
                        key={preset.path}
                        onClick={() => setServiceFormImage(preset.path)}
                        className={`p-1 rounded-xl cursor-pointer border relative overflow-hidden ${
                          isSelected ? 'border-[#d4af37] ring-1 ring-[#d4af37]' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.path} alt={preset.label} className="w-full h-12 object-cover rounded-lg" />
                        <span className="block text-[8px] text-center text-zinc-300 mt-1 truncate">
                          {preset.label.split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <input
                  type="text"
                  placeholder="O introduce una URL de imagen personalizada"
                  value={serviceFormImage}
                  onChange={(e) => setServiceFormImage(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 font-mono mt-1 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el acabado, grosor o estilo..."
                  value={serviceFormDescription}
                  onChange={(e) => setServiceFormDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Qué incluye (1 punto por línea)</label>
                <textarea
                  rows={2}
                  placeholder="Diseño anatómico personalizado&#10;Fibras de seda ligeras&#10;Sellado profesional"
                  value={serviceFormIncludes}
                  onChange={(e) => setServiceFormIncludes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {serviceActionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ {serviceActionError}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="flex-1 py-2.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:opacity-90 active:scale-95 shadow-lg shadow-[#d4af37]/20 disabled:opacity-50"
                >
                  {isSavingService ? 'Guardando en la nube...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FLOTANTE (DOCK) */}
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
            onClick={() => setCurrentTab('servicios')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'servicios' ? 'text-[#d4af37] font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">🌸</span>
            <span className="text-[10px]">Servicios</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
