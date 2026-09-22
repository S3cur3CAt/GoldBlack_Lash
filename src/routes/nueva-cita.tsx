import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { business } from '#/data/site'
import { useStudioConfig } from '#/context/StudioConfigContext'

export const Route = createFileRoute('/nueva-cita')({
  component: StudioMobileHubPage,
  head: () => ({
    meta: [
      { title: `Panel Studio — ${business.name} (Telegram Assistant)` },
      { name: 'description', content: `Panel de control móvil y asistente de gestión para ${business.name}` },
      { name: 'theme-color', content: '#fffaf4' },
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

export interface PhoneContactItem {
  id?: string
  name: string
  phone: string
  notes?: string
  source?: string
}

export function parseVcardString(vcfText: string): Array<{ name: string; phone: string }> {
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
        if (colonIdx !== -1) {
          phone = trimmed.substring(colonIdx + 1).trim()
        }
      }
    }
    if (phone) {
      contacts.push({ name: name || 'Sin nombre', phone })
    }
  }
  return contacts
}

export function parseContactsFromTextOrVcard(input: string): Array<{ name: string; phone: string }> {
  if (/BEGIN:VCARD/i.test(input)) {
    return parseVcardString(input)
  }
  const results: Array<{ name: string; phone: string }> = []
  const lines = input.split(/\r?\n/)
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(phoneRegex)
    if (match) {
      const phone = match[0].trim()
      const digitsOnly = phone.replace(/\D/g, '')
      if (digitsOnly.length >= 8) {
        let name = trimmed
          .replace(phone, '')
          .replace(/[•\-\:\;\|\,\(\)\*\_]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        name = name.replace(/^(nombre|tel[eé]fono|celular|whatsapp|wa|m[oó]vil|contacto)\s*:?/i, '').trim()
        results.push({
          name: name || 'Contacto WhatsApp',
          phone: phone,
        })
      }
    }
  }

  if (results.length === 0) {
    const digitsOnly = input.replace(/\D/g, '')
    if (digitsOnly.length >= 8) {
      results.push({
        name: 'Contacto WhatsApp',
        phone: input.trim(),
      })
    }
  }

  return results
}

const DURATION_PRESETS = [
  '30 min',
  '45 min',
  '1 h',
  '1 h 15 min',
  '1 h 30 min',
  '1 h 45 min',
  '2 h',
  '2 h 15 min',
  '2 h 30 min',
  '3 h',
]

const BADGE_PRESETS = [
  { value: '', label: '(Sin etiqueta)' },
  { value: 'Más popular', label: '⭐ Más popular' },
  { value: 'Novedad', label: '✨ Novedad' },
  { value: 'Oferta', label: '🔥 Oferta' },
  { value: 'Recomendado', label: '💖 Recomendado' },
  { value: 'Top Ventas', label: '👑 Top Ventas' },
  { value: 'Exclusivo', label: '💎 Exclusivo' },
  { value: 'Promo', label: '🏷️ Promo' },
]

const PRICE_PRESETS = [
  15, 20, 25, 27, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100
]

const compressImageFile = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      resolve('')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (!src) {
        resolve('')
        return
      }
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(src)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(src)
      img.src = src
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

const DEFAULT_SERVICE_CATEGORIES: { id: string; name: string }[] = [
  { id: 'extensiones', name: 'Extensiones de pestañas' },
  { id: 'extras', name: 'Tratamientos y extras' },
  { id: 'facial', name: 'Cuidado Facial' },
  { id: 'lifting', name: 'Lifting y Cejas' },
]

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
  const [serviceFormCategoryId, setServiceFormCategoryId] = useState('extensiones')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [customCatInput, setCustomCatInput] = useState('')
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('goldblack_admin_custom_categories')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [selectedServiceCategoryFilter, setSelectedServiceCategoryFilter] = useState('all')

  const allServiceCategories = useMemo(() => {
    const map = new Map<string, string>()
    DEFAULT_SERVICE_CATEGORIES.forEach((c) => map.set(c.id, c.name))
    customCategories.forEach((c) => map.set(c.id, c.name))
    services.forEach((s) => {
      if (s.categoryId && s.categoryName) {
        map.set(s.categoryId, s.categoryName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [services, customCategories])

  const serviceFilterTabs = useMemo(
    () => [{ id: 'all', name: 'Todos los servicios' }, ...allServiceCategories],
    [allServiceCategories]
  )

  const filteredServices = useMemo(() => {
    if (selectedServiceCategoryFilter === 'all') return services
    return services.filter((s) => s.categoryId === selectedServiceCategoryFilter)
  }, [services, selectedServiceCategoryFilter])

  const [serviceFormPrice, setServiceFormPrice] = useState('27')
  const [isCustomPrice, setIsCustomPrice] = useState(false)
  const [serviceFormDuration, setServiceFormDuration] = useState('1 h 15 min')
  const [isCustomDuration, setIsCustomDuration] = useState(false)
  const [serviceFormBadge, setServiceFormBadge] = useState('')
  const [isCustomBadge, setIsCustomBadge] = useState(false)
  const [serviceFormDescription, setServiceFormDescription] = useState('')
  const [serviceFormIncludes, setServiceFormIncludes] = useState('')
  const [serviceFormImage, setServiceFormImage] = useState('/galeria/pieza-01.jpg')
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const deviceImageInputRef = useRef<HTMLInputElement>(null)
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
  const [pickerTab, setPickerTab] = useState<'telefono' | 'estudio'>('telefono')
  const [phoneContacts, setPhoneContacts] = useState<PhoneContactItem[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [nativeContactNotice, setNativeContactNotice] = useState<string | null>(null)
  const [contactSelectedToast, setContactSelectedToast] = useState<string | null>(null)
  const [showAddContactForm, setShowAddContactForm] = useState(false)
  const [addContactMode, setAddContactMode] = useState<'single' | 'bulk'>('single')
  const [newContactName, setNewContactName] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [pasteListText, setPasteListText] = useState('')
  const vcfInputRef = useRef<HTMLInputElement>(null)
  const isFilePickerOpenRef = useRef(false)
  const openFileInput = (inputEl: HTMLInputElement | null) => {
    isFilePickerOpenRef.current = true
    inputEl?.click()
  }
  const isIOS = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }, [])

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

  // Cargar contactos telefónicos / WhatsApp de Supabase y localStorage
  const loadPhoneContacts = async () => {
    setIsLoadingContacts(true)
    try {
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('goldblack_imported_contacts')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPhoneContacts(parsed)
            }
          } catch {}
        }
      }
      const res = await fetch('/api/contacts?_t=' + Date.now())
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setPhoneContacts(data)
          if (typeof window !== 'undefined') {
            localStorage.setItem('goldblack_imported_contacts', JSON.stringify(data))
          }
        }
      }
    } catch (e) {
      console.warn('[Contacts Load Error]', e)
    } finally {
      setIsLoadingContacts(false)
    }
  }

  // Eliminar un contacto importado
  const handleDeletePhoneContact = async (contact: PhoneContactItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`¿Eliminar a ${contact.name} de tus contactos importados?`)) return
    const clean = contact.phone.replace(/\D/g, '')
    const updated = phoneContacts.filter((c) => c.phone.replace(/\D/g, '') !== clean)
    setPhoneContacts(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goldblack_imported_contacts', JSON.stringify(updated))
    }
    try {
      const id = contact.id || `cnt-${clean}`
      await fetch(`/api/contacts?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('[Contact Delete Error]', err)
    }
  }

  // Inicializar Telegram WebApp SDK y comprobar credenciales de acceso
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp
      tg.ready()
      tg.expand()
      if (tg.setHeaderColor) tg.setHeaderColor('#fffaf4')
      if (tg.setBackgroundColor) tg.setBackgroundColor('#fffaf4')
      const tgUser = tg.initDataUnsafe?.user
      if (tgUser?.id) {
        setDetectedTelegramUser({
          id: String(tgUser.id),
          name: tgUser.first_name || tgUser.username || '',
        })
      }
    }

    // Leer parámetros de URL si viene de un enlace o botón de bot (ej. ?clientName=...&clientPhone=...)
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const qName = params.get('clientName') || params.get('name')
        const qPhone = params.get('clientPhone') || params.get('phone') || params.get('tel')
        if (qName) setClientName(decodeURIComponent(qName))
        if (qPhone) setClientPhone(decodeURIComponent(qPhone))
      }
    } catch {}

    loadPhoneContacts()

    try {
      localStorage.removeItem('gb_mini_app_auth')
      const savedAuth =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('gb_mini_app_auth') === 'true' &&
        document.visibilityState !== 'hidden'
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
          // Sesión activa mientras Telegram esté en primer plano; se auto-bloquea al pasar a segundo plano
          sessionStorage.setItem('gb_mini_app_auth', 'true')
          localStorage.removeItem('gb_mini_app_auth')
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
  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gb_mini_app_auth')
      localStorage.removeItem('gb_mini_app_auth')
    }
    setIsAuthenticated(false)
    setPinInput('')
    setPinError(null)
  }, [])

  // Auto-bloqueo de seguridad cuando Telegram pasa a segundo plano o se minimiza
  useEffect(() => {
    const handleAutoLock = () => {
      // Si el usuario abrió el selector de fotos o archivos evitamos bloquear en falso
      if (isFilePickerOpenRef.current) return

      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        handleLogout()
      }
    }

    const handlePageHide = () => {
      if (isFilePickerOpenRef.current) return
      handleLogout()
    }

    const handleWindowFocus = () => {
      // Regreso de diálogo nativo o selector
      setTimeout(() => {
        isFilePickerOpenRef.current = false
      }, 800)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleAutoLock)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageHide)
      window.addEventListener('focus', handleWindowFocus)
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleAutoLock)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageHide)
        window.removeEventListener('focus', handleWindowFocus)
      }
    }
  }, [handleLogout])

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
    setIsCreatingCategory(false)
    setCustomCatInput('')
    if (serviceToEdit) {
      setEditingServiceId(serviceToEdit.id)
      setServiceFormName(serviceToEdit.name)
      setServiceFormCategoryId(serviceToEdit.categoryId || 'extensiones')
      setServiceFormCategory(serviceToEdit.categoryName || 'Extensiones de pestañas')

      const pNum = serviceToEdit.priceNumber || parseInt(String(serviceToEdit.priceFormatted || '27').replace(/\D/g, ''), 10) || 27
      setServiceFormPrice(String(pNum))
      setIsCustomPrice(!PRICE_PRESETS.includes(pNum))

      const dur = serviceToEdit.duration || '1 h 15 min'
      setServiceFormDuration(dur)
      setIsCustomDuration(!DURATION_PRESETS.includes(dur))

      const bdg = serviceToEdit.badge || ''
      setServiceFormBadge(bdg)
      setIsCustomBadge(!!bdg && !BADGE_PRESETS.some((b) => b.value === bdg))

      setServiceFormDescription(serviceToEdit.description || '')
      setServiceFormIncludes((serviceToEdit.includes || []).join('\n'))
      setServiceFormImage(serviceToEdit.image || getServiceImageFallback(serviceToEdit.name, serviceToEdit.id))
    } else {
      setEditingServiceId(null)
      setServiceFormName('')
      setServiceFormCategoryId('extensiones')
      setServiceFormCategory('Extensiones de pestañas')
      setServiceFormPrice('27')
      setIsCustomPrice(false)
      setServiceFormDuration('1 h 15 min')
      setIsCustomDuration(false)
      setServiceFormBadge('')
      setIsCustomBadge(false)
      setServiceFormDescription('')
      setServiceFormIncludes('Diseño anatómico personalizado\nFibras de alta gama\nSellado profesional')
      setServiceFormImage('/galeria/pieza-02.jpg')
    }
    setServiceModalOpen(true)
  }

  // Manejar selección de foto desde el dispositivo (Android, iPhone, PC)
  const handleDeviceImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    isFilePickerOpenRef.current = false
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessingImage(true)
    try {
      const compressed = await compressImageFile(file)
      if (compressed) {
        setServiceFormImage(compressed)
      }
    } catch (err) {
      console.warn('Error al procesar imagen del dispositivo:', err)
    } finally {
      setIsProcessingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  // Guardar Servicio (Crear o Actualizar) en Supabase
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceFormName.trim()) {
      setServiceActionError('Por favor escribe el nombre del servicio')
      return
    }

    let finalCatId = serviceFormCategoryId || 'extensiones'
    let finalCatName = serviceFormCategory || 'Extensiones de pestañas'

    if (isCreatingCategory) {
      const trimmed = customCatInput.trim()
      if (!trimmed) {
        setServiceActionError('Por favor introduce el nombre de la nueva categoría')
        return
      }
      finalCatName = trimmed
      finalCatId =
        trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `cat-${Date.now()}`

      const updated = [
        ...customCategories.filter((c) => c.id !== finalCatId),
        { id: finalCatId, name: finalCatName },
      ]
      setCustomCategories(updated)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('goldblack_admin_custom_categories', JSON.stringify(updated))
        }
      } catch (err) {
        console.warn('Error saving custom category:', err)
      }
    } else {
      const found = allServiceCategories.find((c) => c.id === serviceFormCategoryId)
      if (found) {
        finalCatId = found.id
        finalCatName = found.name
      }
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
      categoryName: finalCatName,
      categoryId: finalCatId,
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

  // Directorio filtrado para el modal selector de contactos (pestaña Estudio)
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

  // Contactos del teléfono filtrados para el modal selector de contactos (pestaña Teléfono)
  const filteredPhoneContacts = useMemo<PhoneContactItem[]>(() => {
    if (!contactPickerSearch.trim()) return phoneContacts
    const q = contactPickerSearch.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return phoneContacts.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q)
      const matchPhone = qDigits.length > 0 && c.phone.replace(/\D/g, '').includes(qDigits)
      return matchName || matchPhone
    })
  }, [phoneContacts, contactPickerSearch])

  // Sugerencias rápidas mientras el usuario escribe en el formulario de crear cita
  const contactSuggestions = useMemo(() => {
    const qName = clientName.trim().toLowerCase()
    const qPhone = clientPhone.replace(/\D/g, '')

    if (qName.length < 2 && qPhone.length < 3) return []

    const studioMatches = allStudioClients.filter((c) => {
      const matchName = qName.length >= 2 && c.name.toLowerCase().includes(qName)
      const matchPhone = qPhone.length >= 3 && c.phone.replace(/\D/g, '').includes(qPhone)
      const isExactMatch = c.name.toLowerCase() === qName && c.phone.replace(/\D/g, '') === qPhone
      return (matchName || matchPhone) && !isExactMatch
    })

    const phoneMatches = phoneContacts
      .filter((c) => {
        const matchName = qName.length >= 2 && c.name.toLowerCase().includes(qName)
        const matchPhone = qPhone.length >= 3 && c.phone.replace(/\D/g, '').includes(qPhone)
        const isExactMatch = c.name.toLowerCase() === qName && c.phone.replace(/\D/g, '') === qPhone
        const alreadyInStudio = studioMatches.some((s) => cleanPhoneForWhatsApp(s.phone) === cleanPhoneForWhatsApp(c.phone))
        return (matchName || matchPhone) && !isExactMatch && !alreadyInStudio
      })
      .map((c) => ({
        name: c.name,
        phone: c.phone,
        totalVisits: 0,
        totalSpent: 0,
        lastVisitDate: '',
        lastServiceName: 'Contacto del móvil',
        appointmentsHistory: [],
      } as ClientSummary))

    return [...studioMatches, ...phoneMatches].slice(0, 4)
  }, [allStudioClients, phoneContacts, clientName, clientPhone])

  // Procesar texto pegado desde portapapeles o compartido (soporta formato WhatsApp y listas)
  const handleProcessPastedText = (rawText: string | null | undefined) => {
    if (!rawText || !rawText.trim()) {
      setNativeContactNotice('El portapapeles está vacío o no contiene texto. Copia primero un número o contacto.')
      return
    }
    const text = rawText.trim()
    const parsed = parseContactsFromTextOrVcard(text)

    if (parsed.length > 1) {
      const mergedMap = new Map<string, PhoneContactItem>()
      phoneContacts.forEach((c) => mergedMap.set(c.phone.replace(/\D/g, ''), c))
      parsed.forEach((c) => {
        const clean = c.phone.replace(/\D/g, '')
        mergedMap.set(clean, {
          id: `cnt-${clean}`,
          name: c.name,
          phone: c.phone,
          source: 'whatsapp',
        })
      })
      const updatedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setPhoneContacts(updatedList)
      if (typeof window !== 'undefined') {
        localStorage.setItem('goldblack_imported_contacts', JSON.stringify(updatedList))
      }
      setContactPickerOpen(false)
      setContactSelectedToast(`✓ Se han importado ${parsed.length} contactos de WhatsApp`)
      setTimeout(() => setContactSelectedToast(null), 5000)

      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      }).catch((e) => console.warn('[Contacts Sync Error]', e))
      return
    }

    if (parsed.length === 1) {
      const single = parsed[0]
      setClientPhone(single.phone)
      if (single.name && single.name !== 'Sin nombre' && single.name !== 'Contacto WhatsApp') {
        setClientName(single.name)
      }
      const clean = cleanPhoneForWhatsApp(single.phone)
      const matched = allStudioClients.find((cli) => cleanPhoneForWhatsApp(cli.phone) === clean)
      if (matched) {
        if (matched.preferredCurl) setCurl(matched.preferredCurl)
        if (matched.notes) setNotes(matched.notes)
      }

      if (clean && !phoneContacts.some((c) => c.phone.replace(/\D/g, '') === clean)) {
        const newContact: PhoneContactItem = {
          id: `cnt-${clean}`,
          name: single.name !== 'Contacto WhatsApp' ? single.name : (clientName || 'Contacto WhatsApp'),
          phone: single.phone,
          source: 'whatsapp',
        }
        const updated = [newContact, ...phoneContacts].sort((a, b) => a.name.localeCompare(b.name))
        setPhoneContacts(updated)
        if (typeof window !== 'undefined') {
          localStorage.setItem('goldblack_imported_contacts', JSON.stringify(updated))
        }
        fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([newContact]),
        }).catch(() => {})
      }

      setContactPickerOpen(false)
      setContactSelectedToast(`✓ Contacto seleccionado: ${single.name} (${single.phone})`)
      setTimeout(() => setContactSelectedToast(null), 4000)
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
      }
      return
    }

    // Fallback: Si no tiene formato estándar pero hay dígitos
    const digitsOnly = text.replace(/\D/g, '')
    if (digitsOnly.length >= 8) {
      setClientPhone(text)
      setContactPickerOpen(false)
      setContactSelectedToast(`✓ Pegado en teléfono: ${text}`)
      setTimeout(() => setContactSelectedToast(null), 4000)
    } else {
      setNativeContactNotice('No se reconoció un número de teléfono válido en el texto pegado.')
    }
  }

  // Fallback para leer portapapeles del navegador si Telegram WebApp falla
  const fallbackBrowserClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText()
        if (text) {
          handleProcessPastedText(text)
          return
        }
      } catch {
        // Bloqueado por permisos del navegador
      }
    }
    // Si no se puede leer el portapapeles automáticamente, abrir el formulario para pegar manualmente
    setShowAddContactForm(true)
    setAddContactMode('bulk')
    setNativeContactNotice(
      'Para pegar de WhatsApp en iPhone: Mantén pulsado dentro del cuadro de texto de abajo y selecciona "Pegar".'
    )
  }

  // Pegar contacto copiado (Telegram WebApp SDK o navegador)
  const handlePasteClipboard = () => {
    setNativeContactNotice(null)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.readTextFromClipboard) {
      try {
        ;(window as any).Telegram.WebApp.readTextFromClipboard((text: string | null) => {
          if (text) {
            handleProcessPastedText(text)
          } else {
            fallbackBrowserClipboard()
          }
        })
        return
      } catch {
        // Continuar a fallback
      }
    }
    fallbackBrowserClipboard()
  }

  // Guardar un contacto manual en Mis Contactos y seleccionarlo
  const handleAddManualContact = async () => {
    const name = newContactName.trim()
    const phone = newContactPhone.trim()
    if (!phone) {
      setNativeContactNotice('Por favor introduce al menos un número de teléfono.')
      return
    }
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 8) {
      setNativeContactNotice('El teléfono debe contener al menos 8 dígitos.')
      return
    }
    const newContact: PhoneContactItem = {
      id: `cnt-${clean}`,
      name: name || 'Contacto',
      phone: phone,
      source: 'manual',
    }
    const merged = [newContact, ...phoneContacts.filter((c) => c.phone.replace(/\D/g, '') !== clean)].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    setPhoneContacts(merged)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goldblack_imported_contacts', JSON.stringify(merged))
    }
    handleSelectPhoneContact(newContact)
    setShowAddContactForm(false)
    setNewContactName('')
    setNewContactPhone('')
    setNativeContactNotice(null)

    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([newContact]),
      })
    } catch (err) {
      console.warn('[Contacts Save Error]', err)
    }
  }

  // Importar bloque de texto o lista pegada de WhatsApp
  const handleImportPastedList = async () => {
    if (!pasteListText.trim()) return
    const parsed = parseContactsFromTextOrVcard(pasteListText)
    if (parsed.length === 0) {
      setNativeContactNotice('No se encontraron teléfonos válidos en el texto pegado.')
      return
    }

    const mergedMap = new Map<string, PhoneContactItem>()
    phoneContacts.forEach((c) => mergedMap.set(c.phone.replace(/\D/g, ''), c))
    parsed.forEach((c) => {
      const clean = c.phone.replace(/\D/g, '')
      mergedMap.set(clean, {
        id: `cnt-${clean}`,
        name: c.name,
        phone: c.phone,
        source: 'whatsapp',
      })
    })
    const updatedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    setPhoneContacts(updatedList)
    if (typeof window !== 'undefined') {
      localStorage.setItem('goldblack_imported_contacts', JSON.stringify(updatedList))
    }
    setContactSelectedToast(`✓ Se han importado ${parsed.length} contactos a tu agenda`)
    setTimeout(() => setContactSelectedToast(null), 5000)
    setShowAddContactForm(false)
    setPasteListText('')
    setNativeContactNotice(null)

    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
    } catch (err) {
      console.warn('[Contacts Sync Error]', err)
    }
  }

  // Importar ficha o agenda completa de contactos en formato vCard (.vcf)
  const handleVcfImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    isFilePickerOpenRef.current = false
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target?.result as string
      if (!text) return
      const parsed = parseContactsFromTextOrVcard(text)
      if (parsed.length === 0) {
        setNativeContactNotice('No se detectaron contactos con número de teléfono en el archivo seleccionado.')
        return
      }

      // Si es un solo contacto, lo seleccionamos directamente en el formulario
      if (parsed.length === 1) {
        const single = parsed[0]
        setClientPhone(single.phone)
        if (single.name && single.name !== 'Sin nombre') {
          setClientName(single.name)
        }
        const clean = cleanPhoneForWhatsApp(single.phone)
        const matched = allStudioClients.find((cli) => cleanPhoneForWhatsApp(cli.phone) === clean)
        if (matched) {
          if (matched.preferredCurl) setCurl(matched.preferredCurl)
          if (matched.notes) setNotes(matched.notes)
        }
        setContactPickerOpen(false)
        setContactSelectedToast(`✓ Contacto seleccionado: ${single.name} (${single.phone})`)
        setTimeout(() => setContactSelectedToast(null), 4000)
      } else {
        setContactSelectedToast(`✓ Se han importado ${parsed.length} contactos a tu agenda`)
        setTimeout(() => setContactSelectedToast(null), 5000)
      }

      // Guardar en estado local y persistir en localStorage
      const mergedMap = new Map<string, PhoneContactItem>()
      phoneContacts.forEach((c) => mergedMap.set(c.phone.replace(/\D/g, ''), c))
      parsed.forEach((c) => mergedMap.set(c.phone.replace(/\D/g, ''), c))
      const updatedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name))
      setPhoneContacts(updatedList)

      if (typeof window !== 'undefined') {
        localStorage.setItem('goldblack_imported_contacts', JSON.stringify(updatedList))
      }

      // Sincronizar en Supabase en segundo plano
      try {
        await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        })
      } catch (err) {
        console.warn('[Contacts Sync Error]', err)
      }

      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
        ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
      }
    }
    reader.readAsText(file)
    if (vcfInputRef.current) vcfInputRef.current.value = ''
  }

  // Seleccionar un contacto de la agenda del teléfono
  const handleSelectPhoneContact = (c: PhoneContactItem) => {
    setClientName(c.name)
    setClientPhone(c.phone)
    const clean = cleanPhoneForWhatsApp(c.phone)
    const matched = allStudioClients.find((cli) => cleanPhoneForWhatsApp(cli.phone) === clean)
    if (matched) {
      if (matched.preferredCurl) setCurl(matched.preferredCurl)
      if (matched.notes) setNotes(matched.notes)
    } else if (c.notes) {
      setNotes(c.notes)
    }
    setContactPickerOpen(false)
    setContactSelectedToast(`✓ Contacto seleccionado: ${c.name} (${c.phone})`)
    setTimeout(() => setContactSelectedToast(null), 4000)
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
  }

  // Selector Universal de Contactos (Capacitor nativo iOS CNContactPickerViewController o Modal Web / Telegram)
  const handleUniversalContactPickerOpen = async () => {
    // 1. Si está en entorno nativo Capacitor (iOS / Android)
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      try {
        const { Contacts } = await import('@capacitor/contacts')
        const c = await Contacts.pickContact()
        if (c) {
          const chosenName =
            c.displayName ||
            c.name?.formatted ||
            [c.name?.givenName, c.name?.familyName].filter(Boolean).join(' ') ||
            'Clienta'
          const chosenPhone = c.phoneNumbers?.[0]?.value || ''

          if (chosenPhone) {
            setClientPhone(chosenPhone)
            if (chosenName) setClientName(chosenName)

            const clean = cleanPhoneForWhatsApp(chosenPhone)
            const matched = allStudioClients.find((cli) => cleanPhoneForWhatsApp(cli.phone) === clean)
            if (matched) {
              if (matched.preferredCurl) setCurl(matched.preferredCurl)
              if (matched.notes) setNotes(matched.notes)
            }

            // Sincronizar en Supabase con source: 'picker'
            fetch('/api/contacts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([
                {
                  name: chosenName,
                  phone: chosenPhone,
                  source: 'picker',
                  notes: 'Seleccionado desde selector nativo iOS',
                },
              ]),
            }).catch(() => {})

            setContactSelectedToast(`✓ Contacto seleccionado: ${chosenName} (${chosenPhone})`)
            setTimeout(() => setContactSelectedToast(null), 4000)
            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
              ;(window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
            }
            return
          }
        }
      } catch (err) {
        console.warn('[Capacitor PickContact Error]', err)
      }
    }

    // 2. Si no es nativo (Web / Telegram Mini App): abrir modal con Mis Contactos, Bot y Clientas
    setContactPickerSearch('')
    setNativeContactNotice(null)
    setContactPickerOpen(true)
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
      <div className="min-h-screen bg-gradient-to-b from-[#fffaf4] via-[#fff3ea] to-[#fdeef5] text-[#46253a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500/20 selection:text-rose-900">
        {/* Auroras luminosas vivas (idénticas a la web) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[420px] h-[420px] bg-gradient-to-br from-rose-400/25 via-pink-400/15 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-28 w-[380px] h-[380px] bg-gradient-to-tr from-purple-400/20 via-pink-300/15 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-t from-amber-400/25 via-rose-300/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-xs relative z-10 space-y-5">
          {/* Cabecera & Logotipo oficial */}
          <div className="text-center space-y-2.5">
            <div className="inline-block relative">
              <div className="h-16 w-16 mx-auto rounded-2xl p-0.5 bg-gradient-to-br from-rose-400 via-amber-400 to-rose-500 border border-rose-300 shadow-xl shadow-rose-500/20">
                <div className="h-full w-full rounded-[14px] overflow-hidden bg-white flex items-center justify-center">
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[10px] text-rose-600 font-bold uppercase tracking-wider mb-1 shadow-xs">
                <span>🔒 Acceso Protegido</span>
              </div>
              <h1 className="text-2xl font-bold font-serif tracking-wide text-[#46253a]">
                GoldBlack <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500">Lash</span>
              </h1>
              <p className="text-xs text-[#7a3b5a] mt-0.5">
                Introduce tu PIN de acceso del estudio
              </p>
            </div>
          </div>

          {/* Tarjeta de Seguridad y Teclado Numérico */}
          <div className="bg-white/90 border border-rose-200/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-rose-500/10 backdrop-blur-xl space-y-4">
            {/* Cajas visuales de PIN — 6 dígitos estándar (hasta 8 dinámicos) */}
            <div className={`flex items-center justify-center gap-2 sm:gap-2.5 transition-transform ${shakePin ? 'animate-bounce' : ''}`}>
              {Array.from({ length: Math.max(6, Math.min(8, pinInput.length)) }).map((_, idx) => {
                const hasDigit = pinInput.length > idx
                return (
                  <div
                    key={idx}
                    className={`w-9 sm:w-10 h-12 sm:h-13 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                      hasDigit
                        ? 'border-rose-400 bg-rose-50/80 shadow-md shadow-rose-400/30 scale-105'
                        : 'border-rose-200/60 bg-white/70'
                    }`}
                  >
                    {hasDigit ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 block shadow-xs" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-200/70 block" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mensaje de Error */}
            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-600 text-[11px] text-center font-medium shadow-xs">
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
                  className="h-12 rounded-2xl bg-white hover:bg-rose-50 active:bg-rose-100 border border-rose-200/70 text-lg font-mono font-bold text-[#46253a] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
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
                className="h-12 rounded-2xl bg-rose-50/50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/60 text-xs font-mono font-bold text-[#7a3b5a] transition-all active:scale-95 flex items-center justify-center cursor-pointer"
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
                className="h-12 rounded-2xl bg-white hover:bg-rose-50 active:bg-rose-100 border border-rose-200/70 text-lg font-mono font-bold text-[#46253a] transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
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
                className="h-12 rounded-2xl bg-rose-50/50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/60 text-base text-[#7a3b5a] transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Usuario Telegram detectado */}
            {detectedTelegramUser && (
              <div className="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-200/70 text-[11px] text-[#46253a] flex items-center justify-between">
                <span className="font-mono">👤 {detectedTelegramUser.name || 'Telegram'} (ID: {detectedTelegramUser.id})</span>
                <span className="text-[10px] text-emerald-600 font-bold">✓ Detectado</span>
              </div>
            )}

            {/* Opciones y Botón */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={pinInput.length === 0 || isVerifyingPin}
                onClick={() => handleVerifyPin(pinInput)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 active:scale-98 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingPin ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Desbloquear Panel {pinInput.length > 0 ? `(${pinInput.length} ${pinInput.length === 1 ? 'dígito' : 'dígitos'})` : ''}</span>
                )}
              </button>

              <p className="text-[10px] text-center text-[#7a3b5a] font-medium flex items-center justify-center gap-1">
                <span>🛡️</span>
                <span>Se auto-bloquea al salir de Telegram para máxima privacidad</span>
              </p>
            </div>
          </div>

          <p className="text-[10px] text-center text-[#9a7585]">
            GoldBlack Lash Studio • Sistema de Seguridad Privado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffaf4] via-[#fff3ea] to-[#fdeef5] text-[#46253a] flex flex-col font-sans pb-24 selection:bg-rose-500/20 selection:text-rose-900 relative">
      {/* Auroras de fondo Candy Aurora (idénticas a la web) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 w-[450px] h-[450px] bg-gradient-to-br from-rose-400/20 via-pink-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-28 w-[400px] h-[400px] bg-gradient-to-tr from-purple-400/15 via-pink-300/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-[450px] h-[450px] bg-gradient-to-t from-amber-400/15 via-rose-300/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-[#fffaf4]/90 backdrop-blur-xl border-b border-rose-200/60 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-xl p-0.5 bg-gradient-to-br from-rose-400 via-amber-400 to-rose-500 border border-rose-300 shadow-md shadow-rose-500/20">
                <div className="h-full w-full rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
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
              <h1 className="text-sm font-semibold tracking-wide text-[#46253a] leading-tight font-serif flex items-center gap-1.5">
                <span>GoldBlack</span>
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 font-bold">Lash</span>
              </h1>
              <p className="text-[10px] text-rose-500 font-bold tracking-widest uppercase font-mono">
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
              className="px-2.5 py-1 rounded-full bg-white/80 border border-rose-200/80 hover:border-rose-400/80 text-[11px] text-[#46253a] font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <span className={`w-2 h-2 rounded-full ${isLoadingAppointments || isLoadingServices ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isLoadingAppointments || isLoadingServices ? 'Sincronizando...' : lastSyncTime || 'Conectado'}</span>
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS (Scrollable horizontal) */}
        <div className="max-w-md mx-auto mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'citas'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
            }`}
          >
            <span>📅 Citas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${currentTab === 'citas' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
              {appointments.filter(a => a.date === todayStr).length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('crear')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'crear'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
            }`}
          >
            <span>➕ Crear Cita</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'facturacion'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
            }`}
          >
            <span>💶 Facturación</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'clientas'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
            }`}
          >
            <span>👥 Clientas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${currentTab === 'clientas' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
              {clientsList.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('servicios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'servicios'
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
            }`}
          >
            <span>🌸 Servicios</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${currentTab === 'servicios' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
              {services.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              currentTab === 'promo'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100/60 shadow-xs'
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
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-rose-200/60 shadow-xs">
              <button
                onClick={() => setAgendaFilter('hoy')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'hoy'
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-xs'
                    : 'text-[#7a3b5a] hover:text-[#46253a]'
                }`}
              >
                Hoy ({appointments.filter(a => a.date === todayStr).length})
              </button>
              <button
                onClick={() => setAgendaFilter('proximas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'proximas'
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-xs'
                    : 'text-[#7a3b5a] hover:text-[#46253a]'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setAgendaFilter('todas')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  agendaFilter === 'todas'
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-xs'
                    : 'text-[#7a3b5a] hover:text-[#46253a]'
                }`}
              >
                Todas ({appointments.length})
              </button>
            </div>

            {isLoadingAppointments && appointments.length === 0 ? (
              <div className="text-center py-12 text-[#9a7585] space-y-2">
                <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Consultando citas en la nube...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-3xl bg-white/90 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100/60 flex items-center justify-center mx-auto text-2xl">
                  📅
                </div>
                <h3 className="text-sm font-semibold text-[#46253a]">
                  {agendaFilter === 'hoy' ? 'No hay citas programadas para hoy' : 'No se encontraron citas'}
                </h3>
                <p className="text-xs text-[#7a3b5a] max-w-xs mx-auto">
                  Puedes agendar una nueva cita en cualquier momento y enviarle la confirmación a la clienta por WhatsApp.
                </p>
                <button
                  onClick={() => setCurrentTab('crear')}
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-rose-500/20"
                >
                  ➕ Crear Nueva Cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const aptPhoneClean = cleanPhoneForWhatsApp(apt.clientPhone)
                  const statusColors = {
                    confirmada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    pendiente: 'bg-amber-100 text-amber-800 border-amber-300',
                    completada: 'bg-rose-100 text-rose-800 border-rose-300',
                    cancelada: 'bg-red-100 text-red-700 border-red-300',
                  }

                  return (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 hover:border-rose-300 transition-all space-y-3 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-[#46253a] font-serif tracking-tight">
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
                          <p className="text-xs text-[#7a3b5a] mt-0.5">
                            📞 {apt.clientPhone}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-rose-600 font-mono">
                            {apt.price} €
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              apt.paymentStatus === 'pagado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {apt.paymentStatus === 'pagado' ? 'Pagado' : 'Cobro Pendiente'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500">🕒</span>
                          <span className="font-medium text-[#46253a]">
                            {apt.date} · {apt.time}
                          </span>
                        </div>
                        <div className="text-[#7a3b5a] truncate max-w-37.5">
                          🌸 {apt.serviceName}
                        </div>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-[#7a3b5a] bg-rose-50/40 p-2 rounded-lg italic border border-rose-100/50">
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
                            className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}

                        {apt.status !== 'completada' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'completada', 'pagado')}
                            className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                          >
                            <span>⭐ Completar</span>
                          </button>
                        )}

                        {apt.status === 'pendiente' && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'confirmada')}
                            className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all active:scale-95 shadow-xs"
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
                            className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs transition-all active:scale-95 shadow-xs"
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
              <div className="p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-300 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-2xl p-[1.5px] bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-400 shadow-lg shadow-rose-500/20 overflow-hidden">
                    <img
                      src="/api/images/logo"
                      alt="GoldBlack Lash"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-md">
                    ✓
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-mono font-semibold">
                    Cita Registrada 24/7 en la Nube
                  </span>
                  <h2 className="text-xl font-bold text-[#46253a] font-serif mt-1">
                    {createdAppointment.clientName}
                  </h2>
                  <p className="text-xs text-[#7a3b5a] mt-1">
                    {createdAppointment.date} a las {createdAppointment.time} · {createdAppointment.serviceName}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-left space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7a3b5a]">Teléfono:</span>
                    <span className="font-mono text-[#46253a] font-medium">{createdAppointment.clientPhone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7a3b5a]">Total a cobrar:</span>
                    <span className="font-mono font-bold text-rose-600">{createdAppointment.price} €</span>
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
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 text-xs font-medium transition-all shadow-xs"
                  >
                    Agendar otra cita
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitAppointment} className="space-y-4">
                {/* Cabecera con Logotipo Oficial del Sitio Web */}
                <div className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/80 shadow-sm flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl p-[1.5px] bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-400 shadow-md shadow-rose-500/15">
                      <div className="w-full h-full rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src="/api/images/logo"
                          alt="GoldBlack Lash Studio"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-rose-600 font-mono tracking-widest uppercase font-semibold block">
                      GoldBlack Lash Studio
                    </span>
                    <h2 className="text-sm font-bold text-[#46253a] font-serif tracking-wide truncate">
                      Nueva Cita en la Agenda
                    </h2>
                    <p className="text-[11px] text-[#7a3b5a] truncate">
                      Sincronización en tiempo real y confirmación por WhatsApp
                    </p>
                  </div>
                </div>

                {/* 1. Selección de Servicio */}
                <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#46253a] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-rose-600">1.</span> Tratamiento / Servicio
                    </label>
                    <span className="text-[10px] text-rose-600 font-medium">{services.length} disponibles</span>
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
                              ? 'bg-rose-50/90 border-rose-400 shadow-sm ring-1 ring-rose-400/40'
                              : 'bg-white/80 border-rose-100 hover:border-rose-300 hover:bg-rose-50/40'
                          }`}
                        >
                          <img
                            src={sImg}
                            alt={s.name}
                            className="w-11 h-11 rounded-lg object-cover border border-rose-200 shrink-0"
                            loading="lazy"
                          />

                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[#46253a]' : 'text-[#7a3b5a]'}`}>
                                {s.name}
                              </span>
                              {s.badge && (
                                <span className="text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                  {s.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#9a7585]">
                              ⏱️ {s.duration}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold font-mono text-rose-600">
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
                          ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-400/40'
                          : 'bg-white/80 border-rose-100 hover:border-rose-300'
                      }`}
                    >
                      <span className="text-xs font-semibold text-[#7a3b5a]">
                        + Otro servicio personalizado
                      </span>
                      <span className="text-xs text-[#9a7585] font-mono">Editar</span>
                    </div>

                    {isCustomService && (
                      <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre del servicio (ej. Lifting + Tinte)"
                          value={customServiceName}
                          onChange={(e) => setCustomServiceName(e.target.value)}
                          className="w-full bg-white border border-rose-200 rounded-lg px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#7a3b5a]">Precio (€):</span>
                          <input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="w-24 bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-[#46253a] font-mono focus:outline-none focus:border-rose-400 shadow-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Fecha y Hora */}
                <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
                  <label className="text-xs font-semibold text-[#46253a] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-rose-600">2.</span> Fecha y Hora
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
                              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white border-transparent font-semibold shadow-xs'
                              : 'bg-white border-rose-200/80 text-[#7a3b5a] hover:bg-rose-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#7a3b5a] block mb-1">Día de la cita</span>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 shadow-xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7a3b5a] block mb-1">Hora de inicio</span>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 shadow-xs"
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
                            ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                            : 'bg-white border-rose-200/80 text-[#7a3b5a] hover:bg-rose-50'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Datos de la Clienta y WhatsApp */}
                <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-xs font-semibold text-[#46253a] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-rose-600">3.</span> Clienta y Teléfono
                    </label>

                    <button
                      type="button"
                      onClick={handleUniversalContactPickerOpen}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-[11px] flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Seleccionar Contacto</span>
                    </button>
                  </div>

                  {contactSelectedToast && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{contactSelectedToast}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      id="clientName"
                      name="name"
                      autoComplete="name"
                      autoCapitalize="words"
                      type="text"
                      required
                      placeholder="Nombre de la clienta *"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 shadow-xs"
                    />

                    <div className="relative">
                      <input
                        id="clientPhone"
                        name="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        type="tel"
                        required
                        placeholder="Teléfono móvil (ej. 612 34 56 78) *"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl pl-3.5 pr-36 py-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 font-mono shadow-xs"
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#7a3b5a] text-[10px] font-semibold flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                          title="Pegar número copiado del portapapeles"
                        >
                          📋 Pegar
                        </button>
                        <button
                          type="button"
                          onClick={handleUniversalContactPickerOpen}
                          className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-semibold flex items-center gap-1 border border-rose-300 transition-colors cursor-pointer"
                          title="Seleccionar desde tus contactos o clientas del estudio"
                        >
                          📖 Agenda
                        </button>
                      </div>
                    </div>

                    {isValidPhone && (
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 px-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          WhatsApp preparado: +{cleanPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sugerencias Rápidas al escribir nombre o teléfono */}
                  {contactSuggestions.length > 0 && (
                    <div className="p-2 rounded-xl bg-white border border-rose-200 shadow-md space-y-1.5 animate-in fade-in duration-150">
                      <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider block px-1">
                        ✨ Contactos coincidentes ({contactSuggestions.length}):
                      </span>
                      <div className="space-y-1">
                        {contactSuggestions.map((sug) => (
                          <div
                            key={sug.phone || sug.name}
                            onClick={() => handleSelectStudioClient(sug)}
                            className="p-2 rounded-lg bg-rose-50/50 hover:bg-rose-100/70 border border-rose-100 cursor-pointer flex items-center justify-between gap-2 transition-colors group"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold text-[#46253a] block truncate">
                                {sug.name}
                              </span>
                              <span className="text-[10px] text-[#7a3b5a] font-mono">
                                📞 {sug.phone}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold shrink-0">
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
                      className="text-[10px] text-[#9a7585] hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      ✕ Limpiar datos de clienta del formulario
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-[#7a3b5a] block mb-1">Curvatura habitual</span>
                      <select
                        value={curl}
                        onChange={(e) => setCurl(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 shadow-xs"
                      >
                        <option value="D">Curva D (Marcada)</option>
                        <option value="CC">Curva CC (Media)</option>
                        <option value="C">Curva C (Natural)</option>
                        <option value="M">Curva M (Foxy / Rasgado)</option>
                        <option value="L">Curva L (Especial)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#7a3b5a] block mb-1">Notas / Preferencias</span>
                      <input
                        type="text"
                        placeholder="Ej. Ojo sensible, efecto ardilla"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {submitErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    ⚠️ {submitErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
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
              <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-1">
                <span className="text-[10px] text-[#7a3b5a] uppercase tracking-widest font-semibold">Facturado Hoy</span>
                <div className="text-2xl font-bold text-[#46253a] font-mono">
                  {metrics.totalHoy} €
                </div>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {appointments.filter(a => a.date === todayStr && a.status !== 'cancelada').length} citas programadas
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50/80 border border-rose-200/80 shadow-sm space-y-1">
                <span className="text-[10px] text-rose-600 uppercase tracking-widest font-semibold">Este Mes</span>
                <div className="text-2xl font-bold text-rose-600 font-mono">
                  {metrics.totalMes} €
                </div>
                <p className="text-[10px] text-[#7a3b5a]">
                  Semana: <span className="font-semibold text-[#46253a]">{metrics.totalSemana} €</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-[#46253a] uppercase tracking-wider">
                Balance de Cobros
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block">Total Pagado</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{metrics.totalCobrado} €</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-800 block">Pendiente de Cobro</span>
                  <span className="text-lg font-bold text-amber-700 font-mono">{metrics.totalPendienteCobro} €</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-rose-100 text-[#7a3b5a]">
                <span>Citas completadas: <strong className="text-[#46253a]">{metrics.countCompletadas}</strong></span>
                <span>Ticket medio estimado: <strong className="text-rose-600 font-mono">{metrics.ticketMedio} €</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-[#46253a] uppercase tracking-wider">
                Ingresos por Tratamiento
              </h3>

              <div className="space-y-2">
                {metrics.serviceCounts.map(([serviceName, data]) => (
                  <div key={serviceName} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-[#46253a] block">{serviceName}</span>
                      <span className="text-[10px] text-[#9a7585]">{data.count} cita{data.count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">{data.total} €</span>
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
                className="w-full bg-white border border-rose-200 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-300 shadow-xs"
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch('')}
                  className="absolute right-3 top-2.5 text-[#9a7585] text-xs hover:text-rose-600"
                >
                  ✕
                </button>
              )}
            </div>

            {clientsList.length === 0 ? (
              <div className="text-center py-12 text-[#9a7585] text-xs">
                No se encontraron clientas en la base de datos.
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientsList.map((client) => {
                  const clientPhoneClean = cleanPhoneForWhatsApp(client.phone)
                  return (
                    <div
                      key={client.phone || client.name}
                      className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 hover:border-rose-300 transition-all space-y-2 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-[#46253a] font-serif tracking-tight">
                            {client.name}
                          </h4>
                          <p className="text-xs text-[#7a3b5a] font-mono">
                            📞 {client.phone}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                            {client.totalVisits} visita{client.totalVisits !== 1 ? 's' : ''}
                          </span>
                          <span className="block text-xs font-mono font-bold text-rose-600 mt-1">
                            {client.totalSpent} € total
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#7a3b5a] flex items-center justify-between border-t border-rose-100 pt-1.5">
                        <span>Última visita: {client.lastVisitDate}</span>
                        {client.preferredCurl && (
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold text-[10px]">Curva {client.preferredCurl}</span>
                        )}
                      </div>

                      {client.notes && (
                        <p className="text-[10px] text-[#7a3b5a] bg-rose-50/50 p-1.5 rounded italic border border-rose-100/60 truncate">
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
                            className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
                          >
                            <span>💬 WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedClientModal(client)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
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
                          className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 text-xs font-medium transition-all shadow-xs"
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
                <h2 className="text-sm font-bold text-[#46253a] font-serif">
                  Catálogo de Servicios
                </h2>
                <p className="text-[11px] text-[#7a3b5a]">
                  {services.length} tratamientos en la base de datos
                </p>
              </div>

              <button
                onClick={() => openServiceModal()}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <span>➕ Añadir Servicio</span>
              </button>
            </div>

            {/* Selector de filtro por categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {serviceFilterTabs.map((tab) => {
                const isActive = selectedServiceCategoryFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedServiceCategoryFilter(tab.id)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold shadow-xs'
                        : 'bg-white/80 text-[#7a3b5a] border border-rose-200/60 hover:bg-white shadow-xs'
                    }`}
                  >
                    {tab.name}
                  </button>
                )
              })}
            </div>

            {isLoadingServices && services.length === 0 ? (
              <div className="text-center py-12 text-[#9a7585] space-y-2">
                <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Cargando servicios de Supabase...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-white/90 border border-rose-200/70 space-y-2">
                <p className="text-xs text-[#7a3b5a]">No hay servicios en esta categoría todavía.</p>
                <button
                  type="button"
                  onClick={() => openServiceModal()}
                  className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                >
                  + Añadir servicio aquí
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((s) => {
                  const sImg = formatServiceImageUrl(s.image, s.name, s.id)
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-rose-200/70 hover:border-rose-300 transition-all space-y-3 shadow-sm hover:shadow-md overflow-hidden"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-rose-200 shrink-0 bg-rose-50">
                          <img
                            src={sImg}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {s.badge && (
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[7px] px-1 py-0.5 rounded bg-amber-100/90 backdrop-blur-sm text-amber-800 border border-amber-300 font-bold uppercase truncate">
                              {s.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#46253a] leading-tight">
                              {s.name}
                            </h4>
                            <span className="text-sm font-bold text-rose-600 font-mono shrink-0">
                              {s.priceFormatted}
                            </span>
                          </div>

                          <div className="text-[10px] text-[#7a3b5a] flex items-center gap-2">
                            <span>⏱️ {s.duration}</span>
                            <span className="text-rose-200">•</span>
                            <span>{s.categoryName || 'General'}</span>
                          </div>

                          {s.description && (
                            <p className="text-[11px] text-[#7a3b5a] line-clamp-2 leading-tight">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {s.includes && s.includes.length > 0 && (
                        <div className="pt-2 border-t border-rose-100 flex items-center gap-1.5 flex-wrap">
                          {s.includes.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-[#7a3b5a]">
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
                          className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs hover:opacity-95 active:scale-95 transition-all shadow-md shadow-rose-500/20"
                        >
                          📅 Agendar Cita
                        </button>

                        <button
                          onClick={() => openServiceModal(s)}
                          className="py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 text-xs font-medium active:scale-95 transition-all shadow-xs"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(s)}
                          className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1 shrink-0 shadow-xs"
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
            <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-rose-200/80 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl p-px bg-gradient-to-tr from-rose-400 to-amber-300 border border-rose-300 overflow-hidden shrink-0">
                    <img
                      src="/api/images/logo"
                      alt="GoldBlack Lash"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 font-mono tracking-widest uppercase font-semibold block">
                      GoldBlack Lash Studio
                    </span>
                    <h2 className="text-base font-bold text-[#46253a] font-serif tracking-wide">
                      Promociones del Estudio
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-100 border border-rose-200 text-rose-700 font-medium">
                  Campaña WhatsApp
                </span>
              </div>

              {/* Selector Rápido de Propuestas del Estudio */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7a3b5a] uppercase font-semibold block">
                    Propuestas Rápidas del Estudio:
                  </span>
                  <span className="text-[9px] text-rose-600 font-medium">
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
                            ? 'bg-gradient-to-r from-rose-50 to-amber-50/80 border-rose-400 ring-1 ring-rose-400/50 text-[#46253a] shadow-xs'
                            : 'bg-white/80 border-rose-200/70 hover:border-rose-300 hover:bg-rose-50/40 text-[#7a3b5a]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-bold block ${isSelected ? 'text-[#46253a]' : 'text-[#7a3b5a]'}`}>
                            {preset.label}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black shrink-0 shadow-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] block mt-0.5 ${
                            isSelected ? 'text-rose-600 font-medium' : 'text-[#9a7585]'
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
              <div className="space-y-3 pt-2 border-t border-rose-100">
                {/* 1. SELECCIÓN DE TIPO DE SERVICIO */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7a3b5a] uppercase font-semibold flex items-center justify-between">
                    <span>Tipo de Servicio / Tratamiento</span>
                    <span className="text-rose-600 text-[9px]">Catálogo o personalizado</span>
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
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 shadow-xs cursor-pointer"
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
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                  />
                </div>

                {/* 2. SELECCIÓN DE TIPO DE PESTAÑA / CURVATURA / EFECTO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7a3b5a] uppercase font-semibold flex items-center justify-between">
                    <span>Tipo de Pestaña / Curvatura / Efecto</span>
                    <span className="text-rose-600 text-[9px]">Técnica aplicada</span>
                  </label>
                  <select
                    value={LASH_TYPE_PRESETS.includes(promoLashType) ? promoLashType : ''}
                    onChange={(e) => {
                      if (e.target.value) setPromoLashType(e.target.value)
                    }}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 shadow-xs cursor-pointer"
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
                            ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold'
                            : 'bg-white border-rose-200/80 text-[#7a3b5a] hover:bg-rose-50'
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
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                  />
                </div>

                {/* 3. SELECCIÓN DE PRECIOS */}
                <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#46253a] uppercase font-semibold">
                      Configuración de Precios
                    </span>
                    {Number(promoOldPrice) > Number(promoNewPrice) && Number(promoNewPrice) > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                        Ahorro clienta: {Number(promoOldPrice) - Number(promoNewPrice)} €
                      </span>
                    )}
                  </div>

                  {/* Precio Promocional con Chips Rápidos */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-600 uppercase font-bold block">
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
                              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-xs scale-105'
                              : 'bg-white border border-rose-200 text-[#7a3b5a] hover:border-rose-300'
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
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs text-rose-600 font-mono font-bold focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  </div>

                  {/* Precio Habitual con Chips */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7a3b5a] uppercase block">
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
                              ? 'bg-rose-100 border border-rose-300 text-rose-800 font-semibold'
                              : 'bg-white border border-rose-200/80 text-[#7a3b5a] hover:bg-rose-50'
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
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] font-mono focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  </div>
                </div>

                {/* 4. CONDICIONES Y BENEFICIOS */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-[#7a3b5a] uppercase block mb-1">
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
                              ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold'
                              : 'bg-white border-rose-200/80 text-[#7a3b5a] hover:bg-rose-50'
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
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[#7a3b5a] uppercase block mb-1">
                      Puntos Clave / Beneficios (1 por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={promoPoints}
                      onChange={(e) => setPromoPoints(e.target.value)}
                      placeholder="Realza tu mirada&#10;Pestañas bonitas y definidas"
                      className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Vista Previa Seria para WhatsApp */}
              <div className="space-y-1.5 pt-2 border-t border-rose-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7a3b5a] uppercase font-semibold">
                    Vista Previa del Anuncio (WhatsApp):
                  </span>
                  <span className="text-[10px] text-rose-600 font-mono font-bold">
                    {promoNewPrice ? `${promoNewPrice} €` : ''}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs text-[#46253a] font-sans whitespace-pre-line leading-relaxed shadow-inner">
                  {generatedPromoText}
                </div>
              </div>

              {/* Acciones de Difusión y Creación */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPromo}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{copiedPromo ? '✓ ¡Copiado!' : '📋 Copiar Anuncio'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(generatedPromoText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>💬 Enviar por WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCustomService(true)
                    const extra = promoLashType.trim() ? ` · ${promoLashType.trim().split('(')[0].trim()}` : ''
                    setCustomServiceName(`${promoServiceName}${extra} (${promoTitle})`)
                    setCustomPrice(promoNewPrice.replace(/\D/g, '') || '23')
                    setCurrentTab('crear')
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all active:scale-95"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#fffaf4] border-t sm:border border-rose-200/80 rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-hidden flex flex-col p-5 space-y-4 shadow-2xl">
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between shrink-0">
              <div>
                <span className="text-[10px] text-rose-600 uppercase tracking-widest font-mono font-semibold">
                  📖 Agenda de Contactos
                </span>
                <h3 className="text-xl font-bold text-[#46253a] font-serif mt-0.5">
                  Seleccionar Contacto
                </h3>
                <p className="text-xs text-[#7a3b5a] mt-0.5">
                  Elige desde los contactos de tu móvil o del directorio del estudio
                </p>
              </div>

              <button
                type="button"
                onClick={() => setContactPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-[#7a3b5a] flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Input oculto para importar archivos .vcf (vCard) */}
            <input
              type="file"
              ref={vcfInputRef}
              onChange={handleVcfImport}
              onCancel={() => { isFilePickerOpenRef.current = false }}
              accept=".vcf,text/vcard,text/x-vcard"
              className="hidden"
            />

            {/* Pestañas del Modal */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-white border border-rose-200/80 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPickerTab('telefono')
                  setContactPickerSearch('')
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  pickerTab === 'telefono'
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-xs'
                    : 'text-[#7a3b5a] hover:text-[#46253a]'
                }`}
              >
                <span>📱 Mis Contactos</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${pickerTab === 'telefono' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {phoneContacts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPickerTab('estudio')
                  setContactPickerSearch('')
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  pickerTab === 'estudio'
                    ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-xs'
                    : 'text-[#7a3b5a] hover:text-[#46253a]'
                }`}
              >
                <span>💎 Clientas Estudio</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${pickerTab === 'estudio' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {allStudioClients.length}
                </span>
              </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: CONTACTOS DEL TELÉFONO / WHATSAPP */}
            {pickerTab === 'telefono' && (
              <>
                {/* Botones de acción rápida de contactos */}
                <div className="shrink-0 space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Botón 1: Importar Contactos .vcf */}
                    <button
                      type="button"
                      onClick={() => openFileInput(vcfInputRef.current)}
                      className="p-2.5 rounded-2xl bg-rose-50/80 border border-rose-200 hover:border-rose-300 text-[#46253a] font-semibold text-xs flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                    >
                      <span className="text-lg">📥</span>
                      <span className="block font-bold text-[11px] text-rose-600 leading-tight">
                        Importar .vcf
                      </span>
                      <span className="block text-[8px] text-[#7a3b5a] leading-none">iPhone / WhatsApp</span>
                    </button>

                    {/* Botón 2: Pegar de WhatsApp */}
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 text-emerald-800 font-semibold text-xs flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                    >
                      <span className="text-lg">📋</span>
                      <span className="block font-bold text-[11px] text-emerald-700 leading-tight">
                        Pegar WA
                      </span>
                      <span className="block text-[8px] text-[#7a3b5a] leading-none">Portapapeles</span>
                    </button>

                    {/* Botón 3: Añadir manual / Lista */}
                    <button
                      type="button"
                      onClick={() => setShowAddContactForm((prev) => !prev)}
                      className={`p-2.5 rounded-2xl border text-[#46253a] font-semibold text-xs flex flex-col items-center justify-center text-center gap-1 transition-all active:scale-[0.98] shadow-xs cursor-pointer ${
                        showAddContactForm
                          ? 'bg-rose-100 border-rose-300 text-rose-800'
                          : 'bg-white border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span className="text-lg">{showAddContactForm ? '✕' : '➕'}</span>
                      <span className="block font-bold text-[11px] leading-tight">
                        {showAddContactForm ? 'Cerrar' : 'Añadir'}
                      </span>
                      <span className="block text-[8px] text-[#7a3b5a] leading-none">Manual o lista</span>
                    </button>
                  </div>

                  {/* Formulario desplegable para Añadir o Pegar Lista */}
                  {showAddContactForm && (
                    <div className="p-3 rounded-2xl bg-white border border-rose-200 space-y-2.5 shadow-md animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAddContactMode('single')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              addContactMode === 'single'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                                : 'text-[#7a3b5a] hover:text-[#46253a]'
                            }`}
                          >
                            ➕ Un Contacto
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddContactMode('bulk')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              addContactMode === 'bulk'
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                                : 'text-[#7a3b5a] hover:text-[#46253a]'
                            }`}
                          >
                            📝 Pegar Lista WA
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddContactForm(false)}
                          className="text-[#9a7585] hover:text-rose-600 text-xs px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {addContactMode === 'single' ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Nombre de la clienta (ej. Marta WhatsApp)"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                          />
                          <input
                            type="tel"
                            placeholder="Teléfono móvil (ej. 612 34 56 78)"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 font-mono shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddManualContact}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            💾 Guardar en Agenda y Seleccionar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[10px] text-[#7a3b5a] leading-snug">
                            Pega aquí mensajes, notas o chats copiados de WhatsApp que contengan nombres y teléfonos:
                          </p>
                          <textarea
                            rows={3}
                            placeholder="Ejemplo:&#10;María López 612345678&#10;Lucía +34 654 987 321"
                            value={pasteListText}
                            onChange={(e) => setPasteListText(e.target.value)}
                            className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 font-mono resize-none shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={handleImportPastedList}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            ✨ Extraer e Importar Contactos
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {nativeContactNotice && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                      ℹ️ {nativeContactNotice}
                    </div>
                  )}
                </div>

                {/* Buscador de Contactos del Móvil */}
                <div className="shrink-0">
                  <input
                    type="text"
                    placeholder={`🔍 Buscar entre tus ${phoneContacts.length} contactos...`}
                    value={contactPickerSearch}
                    onChange={(e) => setContactPickerSearch(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                  />
                </div>

                {/* Lista de Contactos del Móvil con Scroll */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-40">
                  {phoneContacts.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white border border-rose-200/80 space-y-2.5 text-center my-2 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl mx-auto">
                        📱
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#46253a]">Ten todos tus contactos aquí en 10 segundos</h4>
                        <p className="text-[11px] text-[#7a3b5a] leading-relaxed max-w-xs mx-auto">
                          Importa tu agenda de iPhone o los contactos de WhatsApp una sola vez y estarán disponibles para seleccionar siempre:
                        </p>
                      </div>
                      <div className="text-left p-3 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5 text-[11px] text-[#7a3b5a]">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-rose-600">1.</span>
                          <span>En tu iPhone abre <strong>Contactos</strong> ➔ pulsa <strong>Listas</strong> (arriba a la izquierda).</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-rose-600">2.</span>
                          <span>Mantén pulsado <strong>"Todos los contactos"</strong> ➔ toca <strong>Exportar</strong> ➔ Guardar en Archivos.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-rose-600">3.</span>
                          <span>O en <strong>WhatsApp</strong>: abre el chat de tu clienta ➔ toca su nombre ➔ <strong>Compartir contacto</strong> ➔ Guardar en Archivos.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openFileInput(vcfInputRef.current)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        📥 Toca aquí para elegir el archivo (.vcf)
                      </button>
                    </div>
                  ) : filteredPhoneContacts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#9a7585] space-y-1">
                      <p>No se encontraron contactos con "{contactPickerSearch}".</p>
                    </div>
                  ) : (
                    filteredPhoneContacts.map((c) => (
                      <div
                        key={c.phone || c.name}
                        onClick={() => handleSelectPhoneContact(c)}
                        className="p-3 rounded-2xl bg-white/90 border border-rose-200/70 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer flex items-center justify-between gap-3 transition-all group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 uppercase font-mono">
                            {c.name.charAt(0) || '👤'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#46253a] block truncate group-hover:text-rose-600 transition-colors">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-[#7a3b5a] font-mono block">
                              📞 {c.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                            Elegir ➔
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePhoneContact(c, e)}
                            className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-red-100 text-[#9a7585] hover:text-red-600 text-xs flex items-center justify-center cursor-pointer transition-colors"
                            title="Eliminar de contactos importados"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* CONTENIDO PESTAÑA 2: CLIENTAS DEL ESTUDIO */}
            {pickerTab === 'estudio' && (
              <>
                {/* Buscador de Clientas */}
                <div className="shrink-0">
                  <input
                    type="text"
                    placeholder={`🔍 Buscar entre ${allStudioClients.length} clientas del estudio...`}
                    value={contactPickerSearch}
                    onChange={(e) => setContactPickerSearch(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                  />
                </div>

                {/* Lista con scroll de clientas */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-40">
                  {filteredClientsForPicker.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#9a7585] space-y-1">
                      <p>No se encontraron clientas con "{contactPickerSearch}".</p>
                    </div>
                  ) : (
                    filteredClientsForPicker.map((client) => (
                      <div
                        key={client.phone || client.name}
                        onClick={() => handleSelectStudioClient(client)}
                        className="p-3 rounded-2xl bg-white/90 border border-rose-200/70 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer flex items-center justify-between gap-3 transition-all group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 uppercase font-mono">
                            {client.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#46253a] block truncate group-hover:text-rose-600 transition-colors">
                              {client.name}
                            </span>
                            <span className="text-[11px] text-[#7a3b5a] font-mono block">
                              📞 {client.phone}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold block mb-0.5">
                            {client.totalVisits} {client.totalVisits === 1 ? 'cita' : 'citas'}
                          </span>
                          {client.preferredCurl && (
                            <span className="text-[9px] text-[#9a7585] block">
                              Curva {client.preferredCurl}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Pie de modal */}
            <div className="shrink-0 pt-2 border-t border-rose-100 flex justify-end">
              <button
                type="button"
                onClick={() => setContactPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 text-xs font-medium cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#fffaf4] border-t sm:border border-rose-200/80 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-rose-600 uppercase tracking-widest font-mono font-semibold">
                  Ficha de la Clienta
                </span>
                <h3 className="text-xl font-bold text-[#46253a] font-serif mt-0.5">
                  {selectedClientModal.name}
                </h3>
                <p className="text-xs text-[#7a3b5a] font-mono mt-0.5">
                  📞 {selectedClientModal.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedClientModal(null)}
                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-[#7a3b5a] flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-0.5">
                <span className="text-[10px] text-[#7a3b5a] uppercase font-semibold">Citas Acumuladas</span>
                <div className="text-lg font-bold text-[#46253a] font-mono">
                  {selectedClientModal.totalVisits}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-0.5">
                <span className="text-[10px] text-rose-600 uppercase font-semibold">Gasto Total</span>
                <div className="text-lg font-bold text-rose-600 font-mono">
                  {selectedClientModal.totalSpent} €
                </div>
              </div>
            </div>

            {selectedClientModal.preferredCurl && (
              <div className="p-3 rounded-xl bg-white border border-rose-200/80 text-xs flex justify-between items-center shadow-xs">
                <span className="text-[#7a3b5a]">Curvatura habitual:</span>
                <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px]">Curva {selectedClientModal.preferredCurl}</span>
              </div>
            )}

            {selectedClientModal.notes && (
              <div className="p-3 rounded-xl bg-white border border-rose-200/80 text-xs space-y-1 shadow-xs">
                <span className="text-[10px] text-[#7a3b5a] uppercase font-semibold">Observaciones / Alergias</span>
                <p className="text-[#46253a] italic">{selectedClientModal.notes}</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#46253a] uppercase tracking-wider">
                Historial de Sesiones ({selectedClientModal.appointmentsHistory.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                {selectedClientModal.appointmentsHistory.map((hApt) => (
                  <div key={hApt.id} className="p-2 rounded-xl bg-white border border-rose-100 text-xs flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[#46253a] font-medium block">{hApt.serviceName}</span>
                      <span className="text-[10px] text-[#9a7585]">{hApt.date} · {hApt.time}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-600 font-mono">{hApt.price} €</span>
                      <span className="block text-[8px] uppercase tracking-wider text-[#9a7585]">{hApt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-rose-100">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp(selectedClientModal.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
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
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <span>➕ Agendar Cita</span>
                </button>
              </div>

              <button
                onClick={() => handleDeleteClient(selectedClientModal)}
                disabled={isDeletingClient}
                className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#fffaf4] border-t sm:border border-rose-200/80 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-rose-600 uppercase tracking-widest font-mono font-semibold">
                  {editingServiceId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
                </span>
                <h3 className="text-lg font-bold text-[#46253a] font-serif mt-0.5">
                  {editingServiceId ? 'Modificar Datos del Servicio' : 'Añadir Servicio al Catálogo'}
                </h3>
              </div>

              <button
                onClick={() => setServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-[#7a3b5a] flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider block mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Efecto Sirena / Wet Look"
                  value={serviceFormName}
                  onChange={(e) => setServiceFormName(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Precio (€) con Selector Rápido o Custom */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider">
                      Precio (€) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomPrice(!isCustomPrice)}
                      className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      {isCustomPrice ? '← Rápido' : '✏️ Otro'}
                    </button>
                  </div>

                  {isCustomPrice ? (
                    <input
                      type="number"
                      required
                      autoFocus
                      placeholder="Ej. 28"
                      value={serviceFormPrice}
                      onChange={(e) => setServiceFormPrice(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-rose-600 font-mono font-bold focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  ) : (
                    <select
                      value={serviceFormPrice}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomPrice(true)
                        } else {
                          setServiceFormPrice(e.target.value)
                        }
                      }}
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] font-mono focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
                    >
                      {PRICE_PRESETS.map((p) => (
                        <option key={p} value={String(p)}>
                          {p} €
                        </option>
                      ))}
                      <option value="__custom__" className="text-rose-600 font-semibold">
                        ✏️ Otro precio (manual)...
                      </option>
                    </select>
                  )}
                </div>

                {/* Duración estimada con Selector Rápido o Custom */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider">
                      Duración *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomDuration(!isCustomDuration)}
                      className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      {isCustomDuration ? '← Rápida' : '✏️ Otra'}
                    </button>
                  </div>

                  {isCustomDuration ? (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ej. 1 h 20 min"
                      value={serviceFormDuration}
                      onChange={(e) => setServiceFormDuration(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 shadow-xs"
                    />
                  ) : (
                    <select
                      value={serviceFormDuration}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomDuration(true)
                        } else {
                          setServiceFormDuration(e.target.value)
                        }
                      }}
                      className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
                    >
                      {DURATION_PRESETS.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur}
                        </option>
                      ))}
                      <option value="__custom__" className="text-rose-600 font-semibold">
                        ✏️ Otra duración (manual)...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Categoría (con creación dinámica como en Mac) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider">
                    Categoría *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(!isCreatingCategory)
                      setCustomCatInput('')
                    }}
                    className="text-[11px] text-rose-600 hover:underline font-semibold transition-colors cursor-pointer"
                  >
                    {isCreatingCategory ? '← Elegir existente' : '+ Crear nueva categoría'}
                  </button>
                </div>

                {isCreatingCategory ? (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Ej. Cejas & Microblading, Masajes..."
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 placeholder:text-rose-300 shadow-xs"
                    />
                    <p className="text-[10px] text-[#7a3b5a] leading-snug">
                      Se guardará como categoría independiente en los filtros y listas.
                    </p>
                  </div>
                ) : (
                  <select
                    value={serviceFormCategoryId}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setIsCreatingCategory(true)
                        setCustomCatInput('')
                      } else {
                        const found = allServiceCategories.find((c) => c.id === e.target.value)
                        setServiceFormCategoryId(e.target.value)
                        setServiceFormCategory(found?.name || e.target.value)
                      }
                    }}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
                  >
                    {allServiceCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__new__" className="text-rose-600 font-semibold">
                      + Crear nueva categoría...
                    </option>
                  </select>
                )}
              </div>

              {/* Badge / Etiqueta con Selector Rápido o Custom */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider">
                    Badge / Etiqueta
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomBadge(!isCustomBadge)}
                    className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    {isCustomBadge ? '← Rápida' : '✏️ Personalizada'}
                  </button>
                </div>

                {isCustomBadge ? (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. Edición Limitada, Verano..."
                    value={serviceFormBadge}
                    onChange={(e) => setServiceFormBadge(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 shadow-xs"
                  />
                ) : (
                  <select
                    value={serviceFormBadge}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomBadge(true)
                      } else {
                        setServiceFormBadge(e.target.value)
                      }
                    }}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-2 text-xs text-[#46253a] focus:outline-none focus:border-rose-400 cursor-pointer shadow-xs"
                  >
                    {BADGE_PRESETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                    <option value="__custom__" className="text-rose-600 font-semibold">
                      ✏️ Escribir etiqueta personalizada...
                    </option>
                  </select>
                )}
              </div>

              {/* Selector de Imagen del Servicio — Subida desde Android/iPhone + Catálogo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider">
                    Imagen del Servicio
                  </label>
                  {typeof serviceFormImage === 'string' && serviceFormImage.startsWith('data:image/') && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span>✓</span> Foto del dispositivo activa
                    </span>
                  )}
                </div>

                {/* Input oculto para abrir la cámara o fototeca de Android o iPhone */}
                <input
                  ref={deviceImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDeviceImageChange}
                  onCancel={() => { isFilePickerOpenRef.current = false }}
                  className="hidden"
                />

                {/* Botón táctil para subir foto desde el móvil o PC */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200/80 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center text-base shrink-0">
                        📱
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#46253a] truncate">
                          Subir foto desde este dispositivo
                        </span>
                        <span className="block text-[10px] text-[#7a3b5a] truncate">
                          iPhone, Android o Galería (optimizado automático)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessingImage}
                      onClick={() => openFileInput(deviceImageInputRef.current)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm shadow-rose-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span>{isProcessingImage ? '⏳' : '📷'}</span>
                      <span>
                        {typeof serviceFormImage === 'string' && serviceFormImage.startsWith('data:image/')
                          ? 'Cambiar foto'
                          : 'Elegir foto'}
                      </span>
                    </button>
                  </div>

                  {/* Previsualización si la imagen fue seleccionada desde el dispositivo */}
                  {typeof serviceFormImage === 'string' && serviceFormImage.startsWith('data:image/') && (
                    <div className="p-2 rounded-xl bg-white border border-rose-200 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={serviceFormImage}
                          alt="Foto subida del dispositivo"
                          className="w-12 h-12 object-cover rounded-lg border border-rose-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block text-[11px] font-semibold text-rose-600 truncate">
                            Foto propia cargada
                          </span>
                          <span className="block text-[9px] text-[#7a3b5a] truncate">
                            Formato comprimido listo para guardar
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setServiceFormImage('/galeria/pieza-01.jpg')}
                        className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-semibold border border-red-200 shrink-0 transition-colors cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                {/* Galería de presets predeterminados del salón */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[#7a3b5a] block">O elige una foto del catálogo predeterminado:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GALLERY_PRESETS.map((preset) => {
                      const isSelected = serviceFormImage === preset.path
                      return (
                        <div
                          key={preset.path}
                          onClick={() => setServiceFormImage(preset.path)}
                          className={`p-1 rounded-xl cursor-pointer border relative overflow-hidden transition-all ${
                            isSelected
                              ? 'border-rose-400 ring-1 ring-rose-400 bg-rose-50'
                              : 'border-rose-200/70 bg-white/80 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.path} alt={preset.label} className="w-full h-12 object-cover rounded-lg" />
                          <span className="block text-[8px] text-center text-[#7a3b5a] mt-1 truncate">
                            {preset.label.split(' ')[0]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="O introduce una URL de imagen personalizada"
                  value={serviceFormImage}
                  onChange={(e) => setServiceFormImage(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-[#46253a] placeholder:text-rose-300 font-mono mt-1 focus:outline-none focus:border-rose-400 shadow-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el acabado, grosor o estilo..."
                  value={serviceFormDescription}
                  onChange={(e) => setServiceFormDescription(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#7a3b5a] uppercase font-bold tracking-wider block mb-1">Qué incluye (1 punto por línea)</label>
                <textarea
                  rows={2}
                  placeholder="Diseño anatómico personalizado&#10;Fibras de seda ligeras&#10;Sellado profesional"
                  value={serviceFormIncludes}
                  onChange={(e) => setServiceFormIncludes(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs text-[#46253a] placeholder:text-rose-300 focus:outline-none focus:border-rose-400 shadow-xs"
                />
              </div>

              {serviceActionError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
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
                    className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
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
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-[#7a3b5a] border border-rose-200/80 text-xs font-medium shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs hover:opacity-95 active:scale-95 shadow-md shadow-rose-500/20 disabled:opacity-50"
                >
                  {isSavingService ? 'Guardando en la nube...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BARRA INFERIOR FLOTANTE (DOCK) — 6 Botones */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fffaf4]/95 backdrop-blur-xl border-t border-rose-200/60 shadow-lg px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5 text-center">
          <button
            onClick={() => setCurrentTab('citas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'citas' ? 'text-rose-600 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
            }`}
          >
            <span className="text-sm">📅</span>
            <span className="text-[9px]">Citas</span>
          </button>

          <button
            onClick={() => setCurrentTab('crear')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'crear' ? 'text-rose-600 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
            }`}
          >
            <span className="text-sm">➕</span>
            <span className="text-[9px]">Crear</span>
          </button>

          <button
            onClick={() => setCurrentTab('facturacion')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'facturacion' ? 'text-rose-600 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
            }`}
          >
            <span className="text-sm">💶</span>
            <span className="text-[9px]">Balance</span>
          </button>

          <button
            onClick={() => setCurrentTab('clientas')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'clientas' ? 'text-rose-600 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
            }`}
          >
            <span className="text-sm">👥</span>
            <span className="text-[9px]">Clientas</span>
          </button>

          <button
            onClick={() => setCurrentTab('servicios')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'servicios' ? 'text-rose-600 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
            }`}
          >
            <span className="text-sm">🌸</span>
            <span className="text-[9px]">Servicios</span>
          </button>

          <button
            onClick={() => setCurrentTab('promo')}
            className={`py-1 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
              currentTab === 'promo' ? 'text-amber-500 font-bold scale-105' : 'text-[#7a3b5a] hover:text-[#46253a]'
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
