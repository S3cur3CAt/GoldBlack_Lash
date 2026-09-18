export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
export type PaymentStatus = 'pendiente' | 'seña_pagada' | 'pagado'

export type LashCurl = 'C' | 'D' | 'M'
export type LashStyle = 'Natural' | 'Cat Eye (Ojo de Gato)' | 'Doll Eye (Muñeca)' | 'Ardilla (Squirrel)'

export interface Appointment {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  durationMinutes: number
  serviceId: string
  serviceName: string
  price: number
  status: AppointmentStatus
  paymentStatus: PaymentStatus
  curl?: LashCurl
  length?: string // ej. "8 - 13 mm"
  style?: LashStyle
  notes?: string
  createdAt: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  nif?: string
  allergies?: string // ej. "Sensibilidad a vapores de cianocrilato"
  preferredStyle?: LashStyle
  preferredCurl?: LashCurl
  totalVisits: number
  totalSpent: number
  lastVisitDate?: string
  notes?: string
  createdAt: string
}

export interface AdminService {
  id: string
  categoryId: string
  categoryName: string
  name: string
  badge?: string
  description: string
  duration: string
  price: string
  priceNumber: number
  featured?: boolean
  pinnedFirst?: boolean
  active: boolean
  includes: string[]
  image?: string
}

export interface StudioConfig {
  name: string
  tagline: string
  claim: string
  phoneDisplay: string
  email: string
  address: string
  city: string
  postalCode: string
  instagram: string
  instagramHandle: string
  mapsUrl: string
  hours: { days: string; time: string }[]
  whatsapp?: string
  resendApiKey?: string
  senderEmail?: string
  alertEmail?: string
  maintenanceMode?: boolean
  seasonalEffect?: 'none' | 'auto' | 'snow' | 'sakura' | 'leaves' | 'rose_petals' | 'new_year' | 'halloween'
  muteAllNotifications?: boolean
  voiceAnnounceNewAppointments?: boolean
  voiceAnnounceUpdates?: boolean
  voiceVolume?: number
  notificationSoundVolume?: number
  whatsappAlertPhone?: string
  telegramAlertsEnabled?: boolean
  telegramBotToken?: string
  telegramChatId?: string
  miniAppPin?: string
  telegramAllowedCredentials?: AuthorizedTelegramUser[]
}

export interface AuthorizedTelegramUser {
  id: string
  name: string
  telegramId: string
  botToken?: string
  pin: string
  createdAt?: string
  active?: boolean
}

export interface GalleryItem {
  id: string
  key: string
  title: string
  category: string
  url: string
  detail?: string
  price?: string
  badge?: string
  featured?: boolean
  elements?: string[]
  updatedAt: string
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia'
export type InvoiceStatus = 'cobrada' | 'pendiente' | 'anulada'

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string // ej. "FAC-2026-001"
  number: string // "2026-001"
  date: string // YYYY-MM-DD
  appointmentId?: string
  clientName: string
  clientNif?: string
  clientPhone?: string
  clientEmail?: string
  items: InvoiceItem[]
  subtotal: number
  taxRate: number // 0, 10, 21 (%)
  taxAmount: number
  total: number
  paymentMethod: PaymentMethod
  status: InvoiceStatus
  notes?: string
  createdAt: string
}

export interface AgendaDayNote {
  id: string
  date: string // YYYY-MM-DD
  content: string
  color?: 'gold' | 'rose' | 'amber' | 'blue' | 'emerald'
  author?: string
  createdAt: string
  updatedAt?: string
}
