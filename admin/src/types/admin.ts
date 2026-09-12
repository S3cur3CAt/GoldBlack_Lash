export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
export type PaymentStatus = 'pendiente' | 'seña_pagada' | 'pagado'

export type LashCurl = 'C' | 'CC' | 'D' | 'DD' | 'M' | 'L'
export type LashStyle = 'Natural' | 'Cat Eye (Ojo de Gato)' | 'Doll Eye (Muñeca)' | 'Ardilla (Squirrel)' | 'Efecto Kim / Híbrido'

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
