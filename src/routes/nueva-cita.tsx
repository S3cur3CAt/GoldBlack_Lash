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

const DEFAULT_SERVICES_LIST: ServiceOption[] = [
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
    description: 'Mantenimiento recomendado cada 2–3 semanas para reponer extensiones.',
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
    description: 'Retiramos tus extensiones con crema disolvente profesional sin tirones.',
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
    includes: ['Puntos negros e impurezas fuera', 'Hidratación profunda', 'Piel suave y descansada'],
    image: '/galeria/limpieza-facial.jpg',
  },
]

const GALLERY_PRESETS = [
  { label: 'Volumen Ruso (Pieza 01)', path: '/galeria/pieza-01.jpg' },
  { label: 'Volumen 3D-5D (Pieza 02)', path: '/galeria/pieza-02.jpg' },
  { label: 'Retoque / Natural (Pieza 03)', path: '/galeria/pieza-03.jpg' },
  { label: 'Retirada de Extensiones (Pieza 04)', path: '/galeria/pieza-04.jpg' },
  { label: 'Efecto Intenso (Pieza 05)', path: '/galeria/pieza-05.jpg' },
  { label: 'Limpieza Facial Profunda', path: '/galeria/limpieza-facial.jpg' },
]

const LASH_TYPE_PRESETS = [
  'Curvatura D (Efecto Rizado Intenso)',
  'Curvatura CC (Mirada Abierta & Elegante)',
  'Curvatura C (Curva Natural & Suave)',
  'Curvatura M / L (Efecto Foxy Eyes)',
  'Efecto Cat Eye (Ojo de Gato Seductor)',
  'Efecto Wet / Húmedo (Glossy & Moderno)',
  'Efecto Wispy / Kim K (Espigado Texturizado)',
  'Fibras Tecnológicas (Volumen Brasileño / Egipcio)',
  'Pelo a Pelo Clásico 1D (Seda Natural)',
  'Volumen Ruso 2D - 3D Seda',
  'Mega Volumen 4D - 6D Negro Carbón',
  'Lifting & Nutrición con Keratina',
  'Todas las Curvaturas (A elegir por la clienta)',
]

const PROMO_PRICE_PRESETS = ['19', '20', '22', '23', '25', '27', '30', '35']
const HABITUAL_PRICE_PRESETS = ['25', '27', '30', '35', '40', '45', '50']
const PROMO_LIMIT_PRESETS = [
  'Oferta por tiempo limitado',
  'Válido hasta este viernes',
  'Promoción este fin de semana',
  'Solo para las primeras 5 reservas',
  'Hasta completar agenda',
]

export const PROMO_STUDIO_PRESETS = [
  {
    id: 'curva-d',
    label: '✨ Pestañas Curva D',
    sublabel: '23 € (Habitual 27 €)',
    title: 'OFERTA ESPECIAL',
    service: 'EXTENSIONES DE PESTAÑAS',
    lashType: 'Curvatura D (Efecto Rizado Intenso)',
    oldPrice: '27',
    newPrice: '23',
    points: 'Realza tu mirada\nPestañas bonitas, ligeras y definidas\nAcabado elegante y 100% personalizado',
    limit: 'Oferta por tiempo limitado',
  },
  {
    id: 'volumen-ruso',
    label: '👑 Volumen Ruso 25€',
    sublabel: '25 € (Habitual 30 €)',
    title: 'PROMOCIÓN EXCLUSIVA',
    service: 'VOLUMEN RUSO INTENSO',
    lashType: 'Curvatura CC (Mirada Abierta & Elegante)',
    oldPrice: '30',
    newPrice: '25',
    points: 'Negro carbón mate sin peso\nMáxima densidad pelo a pelo\nRetención premium +4 semanas',
    limit: 'Solo para las primeras 5 reservas',
  },
  {
    id: 'lifting-tinte',
    label: '🌸 Lifting + Tinte 22€',
    sublabel: '22 € (Habitual 30 €)',
    title: 'TARIFA ESPECIAL',
    service: 'LIFTING DE PESTAÑAS + TINTE',
    lashType: 'Lifting & Nutrición con Keratina',
    oldPrice: '30',
    newPrice: '22',
    points: 'Curva espectacular desde la raíz\nColor negro brillante intenso\nBaño de keratina nutritivo',
    limit: 'Válido hasta este viernes',
  },
  {
    id: 'foxy-cat',
    label: '💎 Efecto Foxy / Cat Eye',
    sublabel: '25 € (Habitual 32 €)',
    title: 'CAMPAÑA MIRADA VIP',
    service: 'EFECTO FOXY / CAT EYE',
    lashType: 'Curvatura M / L (Efecto Foxy Eyes)',
    oldPrice: '32',
    newPrice: '25',
    points: 'Ojo rasgado efecto lifting\nFibras ultraligeras de visón sintético\nMirada felina sofisticada',
    limit: 'Promoción este fin de semana',
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

function getServiceImageFallback(serviceName = '', serviceId = ''): string {
  const norm = `${serviceId || ''} ${serviceName || ''}`.toLowerCase()
  if (norm.includes('facial') || norm.includes('limpieza') || norm.includes('higiene') || norm.includes('cutis')) {
    return '/galeria/limpieza-facial.jpg'
  }
  if (norm.includes('retirada') || norm.includes('quitar') || norm.includes('remover')) {
    return '/galeria/pieza-04.jpg'
  }
  if (norm.includes('ruso') || norm.includes('russian')) {
    return '/galeria/pieza-01.jpg'
  }
  if (norm.includes('3d') || norm.includes('4d') || norm.includes('5d') || norm.includes('6d') || norm.includes('volumen')) {
    return '/galeria/pieza-02.jpg'
  }
  if (norm.includes('retoque') || norm.includes('mantenimiento') || norm.includes('relleno')) {
    return '/galeria/pieza-03.jpg'
  }
  if (norm.includes('lifting') || norm.includes('tinte') || norm.includes('cejas') || norm.includes('laminado')) {
    return '/galeria/pieza-03.jpg'
  }
  return '/galeria/pieza-02.jpg'
}

function formatServiceImageUrl(rawUrl?: string | null, serviceName = '', serviceId = ''): string {
  if (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    const cleanUrl = rawUrl.trim()
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:image/')) {
      return cleanUrl
    }
    if (cleanUrl.startsWith('/api/images/')) {
      return cleanUrl
    }
    const clean = cleanUrl.replace(/^(\.\/|\/)?(galeria\/)?/, '')
    return `/galeria/${clean}`
  }
  return getServiceImageFallback(serviceName, serviceId)
}

type TabType = 'citas' | 'crear' | 'facturacion' | 'clientas' | 'servicios' | 'promo'

function StudioMobileHubPage() {
  const config = useStudioConfig()

  // Navegación de pestañas
  const [currentTab, setCurrentTab] = useState<TabType>('citas')

  // Candado de Seguridad y Autenticación del Bot / Mini App
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true)
  const [pinInput, setPinInput] = useState<string>('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false)
  const [shakePin, setShakePin] = useState<boolean>(false)
  const [detectedTelegramUser, setDetectedTelegramUser] = useState<{ id: string; name: string } | null>(null)

  // Estado de Datos en Vivo
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  // Servicios dinámicos desde Supabase
  const [services, setServices] = useState<ServiceOption[]>(DEFAULT_SERVICES_LIST)
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

  // =========================================================================
  // ESTADO DE PROMOCIONES Y TARIFAS ESPECIALES (DIFUSIÓN WHATSAPP)
  // =========================================================================
  const [promoTitle, setPromoTitle] = useState('OFERTA ESPECIAL')
  const [promoServiceName, setPromoServiceName] = useState('EXTENSIONES DE PESTAÑAS')
  const [promoLashType, setPromoLashType] = useState('Curvatura D (Efecto Rizado Intenso)')
  const [promoOldPrice, setPromoOldPrice] = useState('27')
  const [promoNewPrice, setPromoNewPrice] = useState('23')
  const [promoPoints, setPromoPoints] = useState('Realza tu mirada\nPestañas bonitas, ligeras y definidas\nAcabado elegante y 100% personalizado')
  const [promoLimit, setPromoLimit] = useState('Oferta por tiempo limitado')
  const [copiedPromo, setCopiedPromo] = useState(false)
  const [selectedPromoPresetId, setSelectedPromoPresetId] = useState<string | null>('curva-d')

  // Form State (Crear Cita)
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

  // Selector de Contactos y Clientas
  const [contactPickerOpen, setContactPickerOpen] = useState(false)
  const [contactPickerSearch, setContactPickerSearch] = useState('')
  const [nativeContactNotice, setNativeContactNotice] = useState<string | null>(null)
  const [contactSelectedToast, setContactSelectedToast] = useState<string | null>(null)

  // UI state para crear cita
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null)
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null)

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
          image: s.image || getServiceImageFallback(s.name, s.id),
        }))
        setServices(mapped)
        setSelectedService((prev) => {
          const found = mapped.find((item) => item.id === prev.id)
          return found || mapped[0]
        })
      }
    } catch (err) {
      console.warn('[Services Load Error]', err)
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Inicializar Telegram WebApp SDK y comprobar credenciales de acceso
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.setHeaderColor) tg.setHeaderColor('#08080a')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#08080a')
      const tgUser = tg.initDataUnsafe?.user
      if (tgUser?.id) {
        setDetectedTelegramUser({
          id: String(tgUser.id),
          name: tgUser.first_name || tgUser.username || '',
        })
      }
    }

    try {
      const savedAuth =
        typeof window !== 'undefined' &&
        (localStorage.getItem('gb_mini_app_auth') === 'true' || sessionStorage.getItem('gb_mini_app_auth') === 'true')
      if (savedAuth) {
        setIsAuthenticated(true)
        loadAppointments()
        loadServices()
      }
    } catch {}
    setIsAuthChecking(false)
  }, [])

  // Verificación de PIN de Acceso con persistencia en dispositivo
  const handleVerifyPin = async (candidatePin = pinInput) => {
    const clean = candidatePin.trim()
    if (!clean) {
      setPinError('Por favor introduce el PIN de acceso')
      return
    }

    setIsVerifyingPin(true)
    setPinError(null)

    const payload: any = { pin: clean }
    if (detectedTelegramUser?.id) {
      payload.telegramId = detectedTelegramUser.id
    }

    try {
      let res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null)

      let data: any = null
      if (res && res.ok) {
        data = await res.json().catch(() => null)
      } else {
        const fallbackRes = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_pin', ...payload }),
        }).catch(() => null)
        if (fallbackRes && fallbackRes.ok) {
          res = fallbackRes
          data = await fallbackRes.json().catch(() => null)
        }
      }

      let errorMsg = 'PIN o ID incorrectos. Acceso exclusivo para el estudio.'

      if (res && res.ok) {
        if (typeof window !== 'undefined') {
          // Se recuerda siempre en este dispositivo para que no vuelva a pedirlo de por vida
          localStorage.setItem('gb_mini_app_auth', 'true')
          sessionStorage.setItem('gb_mini_app_auth', 'true')
          if (data?.user) {
            localStorage.setItem('gb_mini_app_user', JSON.stringify(data.user))
          }
        }
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
          ;(window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success')
        }
        setIsAuthenticated(true)
        setPinInput('')
        loadAppointments()
        loadServices()
      } else {
        if (data?.error) {
          errorMsg = data.error
        } else if (res) {
          try {
            const parsed = await res.json()
            if (parsed?.error) errorMsg = parsed.error
          } catch {}
        }

        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
          ;(window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('error')
        }
        setShakePin(true)
        setTimeout(() => setShakePin(false), 600)
        setPinError(errorMsg)
        setPinInput('')
      }
    } catch {
      setPinError('Error de conexión al verificar credenciales. Comprueba tu conexión a internet.')
    } finally {
      setIsVerifyingPin(false)
    }
  }

  // Cerrar sesión y bloquear panel
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gb_mini_app_auth')
      localStorage.removeItem('gb_mini_app_auth')
    }
    setIsAuthenticated(false)
    setPinInput('')
    setPinError(null)
  }

  // Soporte para teclado físico (PC/Mac) en pantalla de PIN
  useEffect(() => {
    if (isAuthenticated) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        setPinInput((prev) => {
          if (prev.length < 8) {
            const next = prev + e.key
            if (next.length === 6) {
              handleVerifyPin(next)
            }
            return next
          }
          return prev
        })
      } else if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1))
        setPinError(null)
      } else if (e.key === 'Enter') {
        if (pinInput.length > 0) handleVerifyPin(pinInput)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated, pinInput])

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

      setSelectedClientModal(null)
      if (clientPhone === client.phone) {
        setClientName('')
        setClientPhone('')
        setNotes('')
      }
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
      setServiceFormImage(serviceToEdit.image || getServiceImageFallback(serviceToEdit.name, serviceToEdit.id))
    } else {
      setEditingServiceId(null)
      setServiceFormName('')
      setServiceFormCategory('Extensiones de pestañas')
      setServiceFormPrice('27')
      setServiceFormDuration('1 h 15 min')
      setServiceFormBadge('')
      setServiceFormDescription('')
      setServiceFormIncludes('Diseño anatómico personalizado\nFibras de alta gama\nSellado profesional')
      setServiceFormImage('/galeria/pieza-02.jpg')
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

  // Eliminar CUALQUIER Servicio de Supabase
  const handleDeleteService = async (service: ServiceOption) => {
    if (!window.confirm(`¿Estás segura de eliminar el servicio "${service.name}" de la base de datos?\nSe eliminará tanto de la web como del panel de administración.`)) return
    try {
      // Optimistic update
      setServices((prev) => prev.filter((s) => s.id !== service.id))

      const res = await fetch(`/api/services?id=${encodeURIComponent(service.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      loadServices()
    } catch (err: any) {
      alert(`Error al eliminar servicio: ${err?.message || 'Error de conexión'}`)
      loadServices()
    }
  }

  // Generador Dinámico de Texto Promocional para WhatsApp (Estilo Profesional)
  const generatedPromoText = useMemo(() => {
    const pointsFormatted = promoPoints
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `✨ ${p}`)
      .join('\n')

    const cleanOld = promoOldPrice.replace(/\D/g, '')
    const cleanNew = promoNewPrice.replace(/\D/g, '')
    const cleanLash = promoLashType.trim()

    return [
      `✨👁️ *${promoTitle.trim() || 'OFERTA ESPECIAL'}* 👁️✨`,
      ``,
      `💖 *${promoServiceName.trim() || 'EXTENSIONES DE PESTAÑAS'}* 💖`,
      cleanLash ? `💎 *Estilo / Curvatura:* ${cleanLash}` : '',
      ``,
      cleanOld ? `~Precio habitual: ${cleanOld} €~` : '',
      `🔥 *AHORA SOLO ${cleanNew || '23'} €* 🔥`,
      ``,
      pointsFormatted,
      ``,
      `📅 *${promoLimit.trim() || 'Oferta por tiempo limitado'}*`,
      ``,
      `📩 *Reserva tu cita ahora*`,
      `💗 ¡Te encantará el resultado!`,
      `🌐 https://www.goldblacklash.com/`,
    ].filter(Boolean).join('\n')
  }, [promoTitle, promoServiceName, promoLashType, promoOldPrice, promoNewPrice, promoPoints, promoLimit])

  // Aplicar propuesta rápida de promoción
  const applyPromoPreset = (preset: {
    id?: string
    title: string
    service: string
    lashType?: string
    oldPrice: string
    newPrice: string
    points: string
    limit: string
  }) => {
    if (preset.id) {
      setSelectedPromoPresetId(preset.id)
    }
    setPromoTitle(preset.title)
    setPromoServiceName(preset.service)
    if (preset.lashType) setPromoLashType(preset.lashType)
    setPromoOldPrice(preset.oldPrice)
    setPromoNewPrice(preset.newPrice)
    setPromoPoints(preset.points)
    setPromoLimit(preset.limit)
  }

  // Copiar anuncio promocional
  const handleCopyPromo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedPromoText)
      setCopiedPromo(true)
      setTimeout(() => setCopiedPromo(false), 2500)
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

  // Directorio Completo de Clientas Deducido desde Citas
  const allStudioClients = useMemo<ClientSummary[]>(() => {
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

    return Array.from(map.values()).sort((a, b) => b.totalVisits - a.totalVisits || b.totalSpent - a.totalSpent)
  }, [appointments])

  // Directorio filtrado para la pestaña de Clientas
  const clientsList = useMemo<ClientSummary[]>(() => {
    if (!clientSearch) return allStudioClients
    const q = clientSearch.toLowerCase()
    return allStudioClients.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [allStudioClients, clientSearch])

  // Directorio filtrado para el modal selector de contactos
  const filteredClientsForPicker = useMemo<ClientSummary[]>(() => {
    if (!contactPickerSearch.trim()) return allStudioClients
    const q = contactPickerSearch.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return allStudioClients.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q)
      const matchPhone = qDigits.length > 0 && c.phone.replace(/\D/g, '').includes(qDigits)
      return matchName || matchPhone
    })
  }, [allStudioClients, contactPickerSearch])

  // Sugerencias rápidas mientras el usuario escribe en el formulario de crear cita
  const contactSuggestions = useMemo(() => {
    const qName = clientName.trim().toLowerCase()
    const qPhone = clientPhone.replace(/\D/g, '')

    if (qName.length < 2 && qPhone.length < 3) return []

    return allStudioClients
      .filter((c) => {
        const matchName = qName.length >= 2 && c.name.toLowerCase().includes(qName)
        const matchPhone = qPhone.length >= 3 && c.phone.replace(/\D/g, '').includes(qPhone)
        const isExactMatch = c.name.toLowerCase() === qName && c.phone.replace(/\D/g, '') === qPhone
        return (matchName || matchPhone) && !isExactMatch
      })
      .slice(0, 3)
  }, [allStudioClients, clientName, clientPhone])

  // Abrir selector nativo de contactos del dispositivo móvil (Android / iOS / Navegadores modernos)
  const handlePickNativeContact = async () => {
    setNativeContactNotice(null)
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel']
        const results = await (navigator as any).contacts.select(props, { multiple: false })
        if (results && results.length > 0) {
          const c = results[0]
          const rawTel = Array.isArray(c.tel) ? c.tel[0] : (c.tel || '')
          const rawName = Array.isArray(c.name) ? c.name[0] : (c.name || '')

          if (rawTel) {
            setClientPhone(rawTel)
            if (rawName) {
              setClientName(rawName)
            }
            // Comprobar si coincide con alguna clienta guardada para autocompletar curvatura y notas
            const clean = cleanPhoneForWhatsApp(rawTel)
            const matched = allStudioClients.find((cli) => cleanPhoneForWhatsApp(cli.phone) === clean)
            if (matched) {
              if (matched.preferredCurl) setCurl(matched.preferredCurl)
              if (matched.notes) setNotes(matched.notes)
            }
            setContactPickerOpen(false)
            setContactSelectedToast(`✓ Contacto seleccionado: ${rawName || rawTel}`)
            setTimeout(() => setContactSelectedToast(null), 4000)
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
              ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
            }
            return
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setNativeContactNotice('No se pudo acceder a la agenda del móvil o se canceló el permiso. Puedes seleccionar cualquier clienta de tu lista abajo.')
        }
      }
    } else {
      setNativeContactNotice('Tu navegador o webview no soporta la apertura directa de la agenda del sistema. Selecciona cualquier clienta de tu lista abajo o introduce el número.')
    }
  }

  // Seleccionar una clienta del estudio
  const handleSelectStudioClient = (client: ClientSummary) => {
    setClientName(client.name)
    setClientPhone(client.phone)
    if (client.preferredCurl) setCurl(client.preferredCurl)
    if (client.notes) setNotes(client.notes)
    setContactPickerOpen(false)
    setContactSelectedToast(`✓ Clienta seleccionada: ${client.name} (${client.phone})`)
    setTimeout(() => setContactSelectedToast(null), 4000)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
  }

  // Validación de teléfono para WhatsApp
  const cleanPhone = cleanPhoneForWhatsApp(clientPhone)
  const isValidPhone = cleanPhone.length >= 9

  // Generador de mensaje de confirmación de WhatsApp para cita
  const generateWhatsAppBookingMessage = (data: {
    clientName: string
    date: string
    time: string
    serviceName: string
    price: number | string
  }): string => {
    const studio = config?.name || business.name || 'GoldBlack Lash'
    const address = config?.address || 'Calle Numa, Montequinto (Dos Hermanas)'

    return [
      `✨ *Confirmación de Cita — ${studio}* ✨`,
      `🌐 https://www.goldblacklash.com/`,
      ``,
      `¡Hola *${data.clientName}*! Tu cita ha sido agendada con éxito en nuestro estudio:`,
      ``,
      `📅 *Fecha:* ${data.date}`,
      `⏰ *Hora:* ${data.time}`,
      `🌸 *Tratamiento:* ${data.serviceName}`,
      `💶 *Precio:* ${data.price} €`,
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
    ].join('\n')
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

      const whatsappMsg = generateWhatsAppBookingMessage({
        clientName: clientName.trim(),
        date,
        time,
        serviceName: finalServiceName,
        price: finalPrice,
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

  // PANTALLA DE BLOQUEO Y ACCESO POR PIN (Para el Bot / Mini App)
  if (!isAuthenticated && !isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-accent/30 selection:text-[#f3e5ab]">
        {/* Luces y resplandor de fondo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl" />
        </div>

        <div className="w-full max-w-xs relative z-10 space-y-6">
          {/* Cabecera & Logotipo oficial */}
          <div className="text-center space-y-3">
            <div className="inline-block relative">
              <div className="h-16 w-16 mx-auto rounded-2xl p-px bg-linear-to-b from-accent/80 via-accent/30 to-white/10 border border-accent/40 shadow-[0_8px_32px_-4px_rgba(212,175,55,0.5)]">
                <div className="h-full w-full rounded-[15px] overflow-hidden bg-[#050508] flex items-center justify-center">
                  <img
                    src="/api/images/logo"
                    alt="GoldBlack Lash Studio"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-[10px] text-accent uppercase font-mono tracking-wider mb-1">
                <span>🔒 Acceso Protegido</span>
              </div>
              <h1 className="text-xl font-bold font-serif tracking-wide text-white">
                GoldBlack <span className="italic text-accent">Lash</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Introduce tu PIN de acceso (6 dígitos) para desbloquear el panel
              </p>
            </div>
          </div>

          {/* Tarjeta de Seguridad y Teclado Numérico */}
          <div className="bg-[#0f0f14]/90 border border-accent/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Cajas visuales de PIN — 6 dígitos estándar (hasta 8 dinámicos) */}
            <div className={`flex items-center justify-center gap-2 sm:gap-2.5 transition-transform ${shakePin ? 'animate-bounce' : ''}`}>
              {Array.from({ length: Math.max(6, Math.min(8, pinInput.length)) }).map((_, idx) => {
                const hasDigit = pinInput.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-9 sm:w-11 h-13 sm:h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                      hasDigit
                        ? 'border-accent bg-accent/20 shadow-[0_0_16px_rgba(212,175,55,0.4)] text-accent scale-105'
                        : 'border-white/10 bg-black/40 text-zinc-600'
                    }`}
                  >
                    {hasDigit ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-accent block shadow-sm shadow-accent" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white/15 block" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mensaje de Error */}
            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-[11px] text-center font-medium">
                {pinError}
              </div>
            )}

            {/* Teclado Táctil en Pantalla */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 8) {
                      const next = pinInput + digit
                      setPinInput(next)
                      setPinError(null)
                      if (next.length === 6) {
                        handleVerifyPin(next)
                      }
                    }
                  }}
                  className="h-12 rounded-2xl bg-white/5 hover:bg-accent/20 active:bg-accent/30 border border-white/10 hover:border-accent/40 text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              {/* Limpiar */}
              <button
                type="button"
                onClick={() => {
                  setPinInput('')
                  setPinError(null)
                }}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 text-xs font-mono text-zinc-400 transition-all active:scale-95 flex items-center justify-center"
              >
                C
              </button>

              {/* 0 */}
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 8) {
                    const next = pinInput + '0'
                    setPinInput(next)
                    setPinError(null)
                    if (next.length === 6) {
                      handleVerifyPin(next)
                    }
                  }
                }}
                className="h-12 rounded-2xl bg-white/5 hover:bg-accent/20 active:bg-accent/30 border border-white/10 hover:border-accent/40 text-lg font-mono font-bold text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              {/* Borrar */}
              <button
                type="button"
                onClick={() => {
                  setPinInput((prev) => prev.slice(0, -1))
                  setPinError(null)
                }}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 text-base text-zinc-300 transition-all active:scale-95 flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Usuario Telegram detectado */}
            {detectedTelegramUser && (
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-300 flex items-center justify-between">
                <span className="font-mono">👤 {detectedTelegramUser.name || 'Telegram'} (ID: {detectedTelegramUser.id})</span>
                <span className="text-[10px] text-emerald-400 font-bold">✓ Detectado</span>
              </div>
            )}

            {/* Opciones y Botón */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={pinInput.length === 0 || isVerifyingPin}
                onClick={() => handleVerifyPin(pinInput)}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-accent via-amber-400 to-accent hover:opacity-95 active:scale-98 disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingPin ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Desbloquear Panel {pinInput.length > 0 ? `(${pinInput.length} ${pinInput.length === 1 ? 'dígito' : 'dígitos'})` : ''}</span>
                )}
              </button>

              <p className="text-[10px] text-center text-emerald-400/90 font-medium">
                ✓ Acceso permanente: no tendrás que volver a introducir tu PIN en este teléfono
              </p>
            </div>
          </div>

          <p className="text-[10px] text-center text-zinc-500">
            GoldBlack Lash Studio • Sistema de Seguridad Privado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans pb-24 selection:bg-accent/30 selection:text-[#f3e5ab]">
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-accent/20 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-xl p-px bg-linear-to-b from-accent/60 via-accent/20 to-white/10 border border-accent/40 shadow-[0_4px_16px_-4px_rgba(212,175,55,0.4)]">
                <div className="h-full w-full rounded-[10px] overflow-hidden bg-[#050508] flex items-center justify-center">
                  <img
                    src="/api/images/logo"
                    alt="GoldBlack Lash — logotipo oficial"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white leading-tight font-serif flex items-center gap-1.5">
                <span>GoldBlack</span>
                <span className="italic text-accent">Lash</span>
              </h1>
              <p className="text-[10px] text-accent tracking-widest uppercase font-mono">
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
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-accent/40 text-[11px] text-zinc-300 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span className={`w-2 h-2 rounded-full ${isLoadingAppointments || isLoadingServices ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{isLoadingAppointments || isLoadingServices ? 'Sincronizando...' : lastSyncTime || 'Conectado'}</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión y bloquear panel"
              className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-rose-500/40 hover:text-rose-300 text-[11px] text-zinc-400 flex items-center gap-1 transition-all active:scale-95"
            >
              <span>🔒 Bloquear</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS (Scrollable horizontal) */}
        <div className="max-w-md mx-auto mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'citas'
                ? 'bg-accent text-black font-semibold shadow-md shadow-accent/20'
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
                ? 'bg-accent text-black font-semibold shadow-md shadow-accent/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>➕ Crear Cita</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'facturacion'
                ? 'bg-accent text-black font-semibold shadow-md shadow-accent/20'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <span>💶 Facturación</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'clientas'
                ? 'bg-accent text-black font-semibold shadow-md shadow-accent/20'
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
                ? 'bg-accent text-black font-semibold shadow-md shadow-accent/20'
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
                ? 'bg-linear-to-r from-amber-500 to-accent text-black font-bold shadow-md shadow-accent/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}
          >
            <span>✨ Ofertas</span>
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
                    ? 'bg-accent text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hoy ({appointments.filter(a => a.date === todayStr).length})
              </button>
              <button
                onClick={() => setAgendaFilter('proximas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'proximas'
                    ? 'bg-accent text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setAgendaFilter('todas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'todas'
                    ? 'bg-accent text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todas ({appointments.length})
              </button>
            </div>

            {isLoadingAppointments && appointments.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
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
                  className="mt-2 px-4 py-2 rounded-xl bg-accent text-black font-semibold text-xs transition-all active:scale-95 shadow-md shadow-accent/20"
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
                    completada: 'bg-accent/10 text-accent border-accent/30',
                    cancelada: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  }

                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-[#121218] border border-white/5 hover:border-accent/30 transition-all space-y-3 shadow-md"
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
                          <div className="text-sm font-bold text-accent font-mono">
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
                          <span className="text-accent">🕒</span>
                          <span className="font-medium text-zinc-200">
                            {apt.date} · {apt.time}
                          </span>
                        </div>
                        <div className="text-zinc-400 truncate max-w-37.5">
                          🌸 {apt.serviceName}
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-zinc-400 bg-white/5 p-2 rounded-lg italic">
                          📝 {apt.notes}
                        </p>
                      )}

                      {/* Botones de Acción */}
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
                            className="py-1.5 px-3 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
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
        {/* PESTAÑA 2: CREAR CITA */}
        {/* ========================================================================= */}
        {currentTab === 'crear' && (
          <div className="space-y-4">
            {createdAppointment ? (
              <div className="p-5 rounded-3xl bg-[#121218] border border-emerald-500/30 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-2xl p-[1.5px] bg-linear-to-b from-accent via-accent/40 to-transparent shadow-lg shadow-accent/20 overflow-hidden">
                    <img
                      src="/api/images/logo"
                      alt="GoldBlack Lash"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-xs shadow-md">
                    ✓
                  </div>
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

                <div className="p-3.5 rounded-2xl bg-black/50 border border-accent/20 text-left space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Teléfono:</span>
                    <span className="font-mono text-zinc-200">{createdAppointment.clientPhone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Total a cobrar:</span>
                    <span className="font-mono font-bold text-accent">{createdAppointment.price} €</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={createdAppointment.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
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
                {/* Cabecera con Logotipo Oficial del Sitio Web */}
                <div className="p-3.5 rounded-2xl bg-linear-to-r from-[#181410] via-[#121218] to-[#1a1410] border border-accent/30 shadow-xl flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl p-[1.5px] bg-linear-to-b from-accent via-accent/40 to-transparent shadow-md shadow-accent/20">
                      <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#050508] flex items-center justify-center">
                        <img
                          src="/api/images/logo"
                          alt="GoldBlack Lash Studio"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-accent font-mono tracking-widest uppercase font-semibold block">
                      GoldBlack Lash Studio
                    </span>
                    <h2 className="text-sm font-bold text-white font-serif tracking-wide truncate">
                      Nueva Cita en la Agenda
                    </h2>
                    <p className="text-[11px] text-zinc-400 truncate">
                      Sincronización en tiempo real y confirmación por WhatsApp
                    </p>
                  </div>
                </div>

                {/* 1. Selección de Servicio */}
                <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-accent">1.</span> Tratamiento / Servicio
                    </label>
                    <span className="text-[10px] text-accent">{services.length} disponibles</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                    {services.map((s) => {
                      const isSelected = !isCustomService && selectedService.id === s.id
                      const sImg = formatServiceImageUrl(s.image, s.name, s.id)
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedService(s)
                            setIsCustomService(false)
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                            isSelected
                              ? 'bg-accent/15 border-accent shadow-md shadow-accent/10'
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
                              <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {s.name}
                              </span>
                              {s.badge && (
                                <span className="text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-accent/20 text-[#f3e5ab]">
                                  {s.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              ⏱️ {s.duration}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-mono text-accent">
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
                          ? 'bg-accent/15 border-accent'
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-300">
                        + Otro servicio personalizado
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">Editar</span>
                    </div>

                    {isCustomService && (
                      <div className="p-3 rounded-xl bg-black/40 border border-accent/30 space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre del servicio (ej. Lifting + Tinte)"
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          className="w-full bg-[#121218] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">Precio (€):</span>
                          <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="w-24 bg-[#121218] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fecha y Hora */}
                <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 space-y-3">
                  <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-accent">2.</span> Fecha y Hora
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
                              ? 'bg-accent text-black border-accent font-semibold'
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">Hora de inicio</span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
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
                            ? 'bg-accent/20 border-accent text-[#f3e5ab]'
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
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-accent">3.</span> Clienta y Teléfono
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setContactPickerSearch('')
                        setNativeContactNotice(null)
                        setContactPickerOpen(true)
                      }}
                      className="px-2.5 py-1 rounded-xl bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent font-semibold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-accent/10 cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Seleccionar Contacto</span>
                    </button>
                  </div>

                  {contactSelectedToast && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{contactSelectedToast}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre de la clienta *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                    />

                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="Teléfono móvil (ej. 612 34 56 78) *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-3.5 pr-24 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setContactPickerSearch('')
                          setNativeContactNotice(null)
                          setContactPickerOpen(true)
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white/10 hover:bg-accent/20 hover:text-accent text-zinc-300 text-[10px] font-semibold flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                        title="Seleccionar desde tus contactos o clientas del estudio"
                      >
                        <span>📖 Contactos</span>
                      </button>
                    </div>

                    {isValidPhone && (
                      <div className="flex items-center justify-between text-[10px] text-emerald-400 px-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          WhatsApp preparado: +{cleanPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sugerencias Rápidas al escribir nombre o teléfono */}
                  {contactSuggestions.length > 0 && (
                    <div className="p-2 rounded-xl bg-black/60 border border-accent/25 space-y-1.5 animate-in fade-in duration-150">
                      <span className="text-[10px] text-accent font-semibold uppercase tracking-wider block px-1">
                        ✨ Contactos coincidentes ({contactSuggestions.length}):
                      </span>
                      <div className="space-y-1">
                        {contactSuggestions.map((sug) => (
                          <div
                            key={sug.phone || sug.name}
                            onClick={() => handleSelectStudioClient(sug)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-accent/20 border border-white/5 cursor-pointer flex items-center justify-between gap-2 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-zinc-200 group-hover:text-white block truncate">
                                {sug.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                📞 {sug.phone}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold shrink-0">
                              {sug.totalVisits} {sug.totalVisits === 1 ? 'cita' : 'citas'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(clientName || clientPhone) && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientName('')
                        setClientPhone('')
                        setNotes('')
                      }}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent"
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
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
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
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-accent via-[#f3e5ab] to-[#aa8c2c] hover:opacity-95 text-black font-bold text-sm tracking-wide shadow-xl shadow-accent/25 transition-all active:scale-[0.98] disabled:opacity-50"
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

              <div className="p-4 rounded-2xl bg-[#121218] border border-accent/30 space-y-1 bg-linear-to-br from-[#121218] to-[#1a170d]">
                <span className="text-[10px] text-accent uppercase tracking-widest font-semibold">Este Mes</span>
                <div className="text-2xl font-bold text-accent font-mono">
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
                <span>Ticket medio estimado: <strong className="text-accent font-mono">{metrics.ticketMedio} €</strong></span>
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
                    <span className="font-bold text-accent font-mono">{data.total} €</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 4: DIRECTORIO DE CLIENTAS CON FICHA Y BORRADO */}
        {/* ========================================================================= */}
        {currentTab === 'clientas' && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar clienta por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-[#121218] border border-white/10 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
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
                      className="p-3.5 rounded-2xl bg-[#121218] border border-white/5 hover:border-accent/30 transition-all space-y-2 shadow-md"
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
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

                      {/* Botones de Acción */}
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
                          className="flex-1 py-1.5 px-3 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
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
        {/* PESTAÑA 5: SERVICIOS CON GESTIÓN Y BORRADO DE CUALQUIER TRATAMIENTO */}
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
                className="px-3 py-1.5 rounded-xl bg-linear-to-r from-accent to-[#aa8c2c] text-black font-bold text-xs shadow-md shadow-accent/20 flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>➕ Añadir Servicio</span>
              </button>
            </div>

            {isLoadingServices && services.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Cargando servicios de Supabase...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((s) => {
                  const sImg = formatServiceImageUrl(s.image, s.name, s.id)
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-[#121218] border border-white/5 hover:border-accent/30 transition-all space-y-3 shadow-md overflow-hidden"
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
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[7px] px-1 py-0.5 rounded bg-black/80 backdrop-blur-sm text-accent font-bold uppercase truncate">
                              {s.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-white leading-tight">
                              {s.name}
                            </h4>
                            <span className="text-sm font-bold text-accent font-mono shrink-0">
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

                      {/* Botones de Acción de Servicio — ¡Eliminar habilitado para TODOS! */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedService(s)
                            setIsCustomService(false)
                            setCurrentTab('crear')
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-accent text-black font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20"
                        >
                          📅 Agendar Cita
                        </button>

                        <button
                          onClick={() => openServiceModal(s)}
                          className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-medium active:scale-95 transition-all"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(s)}
                          className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1 shrink-0"
                          title="Eliminar servicio de la base de datos"
                        >
                          <span>🗑️</span>
                          <span>Eliminar</span>
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
        {/* PESTAÑA 6: PROMOCIONES DEL ESTUDIO Y DIFUSIÓN WHATSAPP */}
        {/* ========================================================================= */}
        {currentTab === 'promo' && (
          <div className="space-y-4">
            {/* Cabecera Seria y Profesional de Promociones */}
            <div className="p-4 rounded-3xl bg-linear-to-b from-[#181512] via-[#121216] to-[#0d0d10] border border-accent/30 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl p-px bg-linear-to-b from-accent/60 to-transparent border border-accent/40 overflow-hidden shrink-0">
                    <img
                      src="/api/images/logo"
                      alt="GoldBlack Lash"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-accent font-mono tracking-widest uppercase font-semibold block">
                      GoldBlack Lash Studio
                    </span>
                    <h2 className="text-base font-bold text-white font-serif tracking-wide">
                      Promociones del Estudio
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium">
                  Campaña WhatsApp
                </span>
              </div>

              {/* Selector Rápido de Propuestas del Estudio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                    Propuestas Rápidas del Estudio:
                  </span>
                  <span className="text-[9px] text-amber-400/80 font-medium">
                    Toca para aplicar plantilla
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PROMO_STUDIO_PRESETS.map((preset) => {
                    const isSelected = selectedPromoPresetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPromoPreset(preset)}
                        className={`relative p-2.5 rounded-xl text-left text-[11px] transition-all duration-200 border ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                            : 'bg-black/40 border-amber-500/30 hover:border-amber-500/70 hover:bg-black/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-bold block ${isSelected ? 'text-amber-200' : 'text-amber-300'}`}>
                            {preset.label}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black shrink-0 shadow-sm">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] block mt-0.5 ${
                            isSelected ? 'text-amber-200/80 font-medium' : 'text-zinc-400'
                          }`}
                        >
                          {preset.sublabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Formulario de Configuración de la Oferta */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* 1. SELECCIÓN DE TIPO DE SERVICIO */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center justify-between">
                    <span>Tipo de Servicio / Tratamiento</span>
                    <span className="text-accent text-[9px]">Catálogo o personalizado</span>
                  </label>
                  <select
                    value={
                      services.some((s) => s.name.toUpperCase() === promoServiceName.toUpperCase())
                        ? promoServiceName
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        setPromoServiceName(val.toUpperCase())
                        const sFound = services.find((s) => s.name.toUpperCase() === val.toUpperCase())
                        if (sFound) {
                          setPromoOldPrice(sFound.priceNumber.toString())
                          const suggested = Math.max(15, sFound.priceNumber - 4)
                          setPromoNewPrice(suggested.toString())
                        }
                      }
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Seleccionar servicio del catálogo --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.priceFormatted})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={promoServiceName}
                    onChange={(e) => setPromoServiceName(e.target.value)}
                    placeholder="Nombre del servicio o tratamiento"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                {/* 2. SELECCIÓN DE TIPO DE PESTAÑA / CURVATURA / EFECTO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center justify-between">
                    <span>Tipo de Pestaña / Curvatura / Efecto</span>
                    <span className="text-accent text-[9px]">Técnica aplicada</span>
                  </label>
                  <select
                    value={LASH_TYPE_PRESETS.includes(promoLashType) ? promoLashType : ''}
                    onChange={(e) => {
                      if (e.target.value) setPromoLashType(e.target.value)
                    }}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Seleccionar curvatura / estilo --</option>
                    {LASH_TYPE_PRESETS.map((lash) => (
                      <option key={lash} value={lash}>
                        {lash}
                      </option>
                    ))}
                  </select>

                  {/* Chips rápidos de curvatura */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      'Curvatura D',
                      'Curvatura CC',
                      'Curvatura C',
                      'Foxy Eyes',
                      'Cat Eye',
                      'Wet Look',
                      'Fibras Tecnológicas',
                      'Volumen Ruso',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          const full = LASH_TYPE_PRESETS.find((l) => l.toLowerCase().includes(chip.toLowerCase())) || chip
                          setPromoLashType(full)
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          promoLashType.toLowerCase().includes(chip.toLowerCase())
                            ? 'bg-accent/20 border-accent text-accent font-semibold'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={promoLashType}
                    onChange={(e) => setPromoLashType(e.target.value)}
                    placeholder="Detalles de la curvatura o técnica..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent"
                  />
                </div>

                {/* 3. SELECCIÓN DE PRECIOS */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-300 uppercase font-semibold">
                      Configuración de Precios
                    </span>
                    {Number(promoOldPrice) > Number(promoNewPrice) && Number(promoNewPrice) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                        Ahorro clienta: {Number(promoOldPrice) - Number(promoNewPrice)} €
                      </span>
                    )}
                  </div>

                  {/* Precio Promocional con Chips Rápidos */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-amber-400 uppercase font-bold block">
                      Precio de la Oferta (€) *
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {PROMO_PRICE_PRESETS.map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setPromoNewPrice(price)}
                          className={`text-[11px] px-2.5 py-1 rounded-xl font-mono font-bold transition-all ${
                            promoNewPrice === price
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 scale-105'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:border-amber-500/50'
                          }`}
                        >
                          {price} €
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={promoNewPrice}
                      onChange={(e) => setPromoNewPrice(e.target.value)}
                      placeholder="Ej. 23"
                      className="w-full bg-black/60 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Precio Habitual con Chips */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase block">
                      Precio Habitual (€)
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {HABITUAL_PRICE_PRESETS.map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setPromoOldPrice(price)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-mono transition-all ${
                            promoOldPrice === price
                              ? 'bg-accent/30 border border-accent text-white font-semibold'
                              : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {price} €
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={promoOldPrice}
                      onChange={(e) => setPromoOldPrice(e.target.value)}
                      placeholder="Ej. 27"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* 4. CONDICIONES Y BENEFICIOS */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                      Condición / Límite de la Promoción
                    </label>
                    <div className="flex items-center gap-1 flex-wrap mb-1">
                      {PROMO_LIMIT_PRESETS.map((lim) => (
                        <button
                          key={lim}
                          type="button"
                          onClick={() => setPromoLimit(lim)}
                          className={`text-[9px] px-2 py-0.5 rounded-lg border transition-all ${
                            promoLimit === lim
                              ? 'bg-accent/20 border-accent text-accent font-semibold'
                              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {lim}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={promoLimit}
                      onChange={(e) => setPromoLimit(e.target.value)}
                      placeholder="Ej. Oferta por tiempo limitado"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                      Puntos Clave / Beneficios (1 por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={promoPoints}
                      onChange={(e) => setPromoPoints(e.target.value)}
                      placeholder="Realza tu mirada&#10;Pestañas bonitas y definidas"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa Seria para WhatsApp */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                    Vista Previa del Anuncio (WhatsApp):
                  </span>
                  <span className="text-[10px] text-accent font-mono">
                    {promoNewPrice ? `${promoNewPrice} €` : ''}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/75 border border-accent/30 text-xs text-zinc-200 font-sans whitespace-pre-line leading-relaxed shadow-inner">
                  {generatedPromoText}
                </div>
              </div>

              {/* Acciones de Difusión y Creación */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPromo}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>{copiedPromo ? '✓ ¡Copiado!' : '📋 Copiar Anuncio'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(generatedPromoText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>💬 Enviar por WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Pasar la oferta personalizada a la pestaña de crear cita
                    setIsCustomService(true)
                    const extra = promoLashType.trim() ? ` · ${promoLashType.trim().split('(')[0].trim()}` : ''
                    setCustomServiceName(`${promoServiceName}${extra} (${promoTitle})`)
                    setCustomPrice(promoNewPrice.replace(/\D/g, '') || '23')
                    setCurrentTab('crear')
                  }}
                  className="w-full py-3 rounded-xl bg-linear-to-r from-amber-500 via-accent to-amber-600 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  📅 Crear Cita con esta Oferta ({promoNewPrice || '23'} €)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL SELECTOR DE CONTACTOS (MÓVIL & ESTUDIO) */}
      {/* ========================================================================= */}
      {contactPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121218] border-t sm:border border-accent/30 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-hidden flex flex-col p-5 space-y-4 shadow-2xl">
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between shrink-0">
              <div>
                <span className="text-[10px] text-accent uppercase tracking-widest font-mono font-semibold">
                  📖 Agenda de Contactos
                </span>
                <h3 className="text-xl font-bold text-white font-serif mt-0.5">
                  Seleccionar Contacto
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Elige desde los contactos de tu móvil o del directorio del estudio
                </p>
              </div>

              <button
                type="button"
                onClick={() => setContactPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Opción 1: Abrir Agenda Nativa del Teléfono */}
            <div className="shrink-0 space-y-2">
              <button
                type="button"
                onClick={handlePickNativeContact}
                className="w-full p-3.5 rounded-2xl bg-linear-to-r from-sky-500/20 via-sky-500/10 to-transparent border border-sky-500/40 hover:border-sky-400 text-white font-semibold text-xs flex items-center justify-between gap-3 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="w-9 h-9 rounded-xl bg-sky-500/25 border border-sky-500/40 flex items-center justify-center text-lg shrink-0">
                    📱
                  </span>
                  <div>
                    <span className="block font-bold text-xs text-sky-300">Abrir Contactos de mi Teléfono</span>
                    <span className="block text-[10px] text-zinc-400">Seleccionar directamente de la agenda de tu móvil</span>
                  </div>
                </div>
                <span className="text-sky-300 font-bold text-base">↗</span>
              </button>

              {nativeContactNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                  ℹ️ {nativeContactNotice}
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                O busca una clienta registrada ({allStudioClients.length})
              </span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Buscador de Clientas */}
            <div className="shrink-0">
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o teléfono..."
                value={contactPickerSearch}
                onChange={(e) => setContactPickerSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Lista con scroll de clientas */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-40">
              {filteredClientsForPicker.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500 space-y-1">
                  <p>No se encontraron clientas para esta búsqueda.</p>
                  <p className="text-[10px]">Usa el botón de abrir contactos del móvil o escribe el número a mano.</p>
                </div>
              ) : (
                filteredClientsForPicker.map((client) => (
                  <div
                    key={client.phone || client.name}
                    onClick={() => handleSelectStudioClient(client)}
                    className="p-3 rounded-2xl bg-black/30 border border-white/5 hover:border-accent/40 hover:bg-accent/10 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center shrink-0 uppercase font-mono">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white block truncate group-hover:text-accent transition-colors">
                          {client.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono block">
                          📞 {client.phone}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold block mb-0.5">
                        {client.totalVisits} {client.totalVisits === 1 ? 'cita' : 'citas'}
                      </span>
                      {client.preferredCurl && (
                        <span className="text-[9px] text-zinc-500 block">
                          Curva {client.preferredCurl}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pie de modal */}
            <div className="shrink-0 pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setContactPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FICHA COMPLETA DE CLIENTA */}
      {/* ========================================================================= */}
      {selectedClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#121218] border-t sm:border border-accent/30 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-accent uppercase tracking-widest font-mono font-semibold">
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

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-zinc-400 uppercase">Citas Acumuladas</span>
                <div className="text-lg font-bold text-white font-mono">
                  {selectedClientModal.totalVisits}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-accent/20 space-y-0.5">
                <span className="text-[10px] text-accent uppercase">Gasto Total</span>
                <div className="text-lg font-bold text-accent font-mono">
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
                      <span className="font-bold text-accent font-mono">{hApt.price} €</span>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-400">{hApt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
                  className="py-2.5 px-3 rounded-xl bg-accent text-black font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>➕ Agendar Cita</span>
                </button>
              </div>

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
          <div className="w-full max-w-md bg-[#121218] border-t sm:border border-accent/30 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-accent uppercase tracking-widest font-mono font-semibold">
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Duración estimada</label>
                  <input
                    type="text"
                    placeholder="Ej. 1 h 15 min"
                    value={serviceFormDuration}
                    onChange={(e) => setServiceFormDuration(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase block mb-1">Categoría</label>
                  <select
                    value={serviceFormCategory}
                    onChange={(e) => setServiceFormCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
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
                          isSelected ? 'border-accent ring-1 ring-accent' : 'border-white/10 opacity-70 hover:opacity-100'
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 font-mono mt-1 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el acabado, grosor o estilo..."
                  value={serviceFormDescription}
                  onChange={(e) => setServiceFormDescription(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">Qué incluye (1 punto por línea)</label>
                <textarea
                  rows={2}
                  placeholder="Diseño anatómico personalizado&#10;Fibras de seda ligeras&#10;Sellado profesional"
                  value={serviceFormIncludes}
                  onChange={(e) => setServiceFormIncludes(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                />
              </div>

              {serviceActionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  ⚠️ {serviceActionError}
                </div>
              )}

              {editingServiceId && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const currentServ = services.find((s) => s.id === editingServiceId)
                      if (currentServ) {
                        setServiceModalOpen(false)
                        handleDeleteService(currentServ)
                      }
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>🗑️</span>
                    <span>Eliminar este servicio de la base de datos</span>
                  </button>
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
                  className="flex-1 py-2.5 rounded-xl bg-accent text-black font-bold text-xs hover:opacity-90 active:scale-95 shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                  {isSavingService ? 'Guardando en la nube...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FLOTANTE (DOCK) — 6 Botones */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-t border-white/10 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5 text-center">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'citas' ? 'text-accent font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">📅</span>
            <span className="text-[9px]">Citas</span>
          </button>

          <button
            onClick={() => setCurrentTab('crear')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'crear' ? 'text-accent font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">➕</span>
            <span className="text-[9px]">Crear</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'facturacion' ? 'text-accent font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">💶</span>
            <span className="text-[9px]">Balance</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'clientas' ? 'text-accent font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">👥</span>
            <span className="text-[9px]">Clientas</span>
          </button>

          <button
            onClick={() => setCurrentTab('servicios')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'servicios' ? 'text-accent font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">🌸</span>
            <span className="text-[9px]">Servicios</span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'promo' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="text-sm">🔥</span>
            <span className="text-[9px]">Ofertas</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
