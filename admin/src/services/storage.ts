import { Appointment, Client, AdminService, StudioConfig, GalleryItem } from '../types/admin'

const STORAGE_KEYS = {
  APPOINTMENTS: 'goldblack_admin_appointments_v2',
  CLIENTS: 'goldblack_admin_clients_v2',
  SERVICES: 'goldblack_admin_services_v2',
  CONFIG: 'goldblack_admin_config_v2',
  GALLERY: 'goldblack_admin_gallery_v2',
}

// Initial Studio Config from site.ts
export const DEFAULT_CONFIG: StudioConfig = {
  name: 'GoldBlack Lash',
  tagline: 'Estudio de extensiones de pestañas',
  claim: 'Belleza de autor, hecha a medida',
  whatsapp: '34604187676',
  phoneDisplay: '+34 604 18 76 76',
  email: 'hola@goldblacklash.com',
  address: 'Calle Numa, Montequinto',
  city: 'Dos Hermanas (Sevilla)',
  postalCode: '41089',
  instagram: 'https://instagram.com/goldblack_lash',
  instagramHandle: '@goldblack_lash',
  mapsUrl: 'https://maps.app.goo.gl/pTmcZcRxHETf7QJq7?g_st=iw',
  hours: [
    { days: 'Lunes a viernes', time: '10:00 – 20:00' },
    { days: 'Sábado', time: '10:00 – 15:00' },
    { days: 'Domingo', time: 'Cerrado' },
  ],
}

// Initial Services matching site.ts
export const DEFAULT_SERVICES: AdminService[] = [
  {
    id: 'volumen-3d6d',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Volumen (3D, 4D, 5D y 6D)',
    badge: '3D, 4D, 5D y 6D',
    description: 'Varias extensiones por pestaña natural. El resultado más natural y discreto, ideal para el día a día.',
    duration: '1 h 30 min',
    price: '27 €',
    priceNumber: 27,
    featured: false,
    active: true,
    includes: [
      'Efecto natural pelo a pelo',
      'Diseño según la forma del ojo',
      'Sellado y baño de vitaminas',
    ],
  },
  {
    id: 'volumen-ruso',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Volumen Ruso',
    badge: 'Más Popular',
    description: 'Abanicos de 3 a 5 pestañas ultrafinas por pestaña natural. Densidad y negro intenso sin peso.',
    duration: '2 h',
    price: '30 €',
    priceNumber: 30,
    featured: true,
    active: true,
    includes: [
      'Abanicos hechos a mano',
      'Densidad media-alta',
      'Ideal para pestaña escasa',
    ],
  },
  {
    id: 'mega-volumen',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    name: 'Mega Volumen Glam',
    badge: 'Efecto Intenso',
    description: 'Abanicos de 6 a 12 fibras finísimas. Mirada tupida, oscura y sofisticada para eventos y amantes del glamour.',
    duration: '2 h 30 min',
    price: '35 €',
    priceNumber: 35,
    featured: false,
    active: true,
    includes: [
      'Máxima densidad y oscuridad',
      'Retención prolongada',
      'Cepillo especial de peinado de regalo',
    ],
  },
  {
    id: 'mantenimiento-2-3-semanas',
    categoryId: 'mantenimiento',
    categoryName: 'Mantenimiento & Retoques',
    name: 'Retoque (2 a 3 semanas)',
    badge: 'Imprescindible',
    description: 'Relleno de las extensiones caídas por ciclo natural y recolocación de las crecidas para mantener el set perfecto.',
    duration: '1 h',
    price: '20 €',
    priceNumber: 20,
    featured: false,
    active: true,
    includes: [
      'Retirada segura de extensiones desalineadas',
      'Relleno de nuevas pestañas naturales',
      'Limpieza y desinfección profunda con champú especial',
    ],
  },
  {
    id: 'lifting-pestanas',
    categoryId: 'lifting',
    categoryName: 'Lifting & Tratamientos',
    name: 'Lifting de Pestañas con Tinte & Queratina',
    badge: 'Pestaña Natural',
    description: 'Eleva y curva tu pestaña natural desde la raíz, aportando longitud y color negro intenso sin extensiones.',
    duration: '1 h',
    price: '25 €',
    priceNumber: 25,
    featured: true,
    active: true,
    includes: [
      'Moldeado anatómico con molde de silicona',
      'Tinte negro carbón brillante',
      'Tratamiento nutritivo de queratina botox',
    ],
  },
  {
    id: 'retirada-limpieza',
    categoryId: 'extras',
    categoryName: 'Servicios Extras',
    name: 'Retirada Profesional & Spa Ocular',
    badge: 'Cuidado Ocular',
    description: 'Disolución química suave y segura del adhesivo sin dañar en absoluto la pestaña natural.',
    duration: '30 min',
    price: '10 €',
    priceNumber: 10,
    featured: false,
    active: true,
    includes: [
      'Crema removedora hipoalergénica sin picor',
      'Lavado con espuma micelar neutra',
      'Aceite de ricino fortalecedor',
    ],
  },
]

// Client Database (Starts clean, without dummy/sample data)
export const DEFAULT_CLIENTS: Client[] = []

// Appointments Agenda (Starts clean, without dummy/sample data)
export const DEFAULT_APPOINTMENTS: Appointment[] = []

export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'gal-01',
    key: 'pieza-04',
    title: 'Volumen 3D',
    category: 'Fibras Tecnológicas',
    url: '/galeria/pieza-04.jpg',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gal-02',
    key: 'pieza-01',
    title: 'Volumen 4D',
    category: 'Fibras Tecnológicas',
    url: '/galeria/pieza-01.jpg',
    updatedAt: '2026-03-02',
  },
  {
    id: 'gal-03',
    key: 'pieza-02',
    title: 'Volumen 5D',
    category: 'Fibras Tecnológicas',
    url: '/galeria/pieza-02.jpg',
    updatedAt: '2026-03-03',
  },
  {
    id: 'gal-04',
    key: 'pieza-03',
    title: 'Volumen 6D',
    category: 'Fibras Tecnológicas',
    url: '/galeria/pieza-03.jpg',
    updatedAt: '2026-03-04',
  },
  {
    id: 'gal-05',
    key: 'pieza-05',
    title: 'Volumen Ruso',
    category: 'Densidad y Negro Intenso',
    url: '/galeria/pieza-05.jpg',
    updatedAt: '2026-03-05',
  },
]

// Storage Accessors
export function getAppointments(): Appointment[] {
  try {
    // Purge old demo storage if present
    localStorage.removeItem('goldblack_admin_appointments_v1')
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]))
      return []
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error(e)
    return []
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments))
}

export function getClients(): Client[] {
  try {
    // Purge old demo storage if present
    localStorage.removeItem('goldblack_admin_clients_v1')
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]))
      return []
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error(e)
    return []
  }
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem('goldblack_admin_api_url')
    if (saved) return saved.trim()
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000') {
      return 'http://localhost:3000'
    }
  } catch (e) {}
  return 'https://goldblacklash.vercel.app'
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem('goldblack_admin_api_url', url.trim())
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'idle'

// Broadcast sync events to UI
export function notifySyncEvent(status: SyncStatus, message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('goldblack:sync', { detail: { status, message } }))
  }
}

/** Syncs a single service with Neon Postgres / Vercel API */
export async function syncServiceWithVercel(service: AdminService): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Sincronizando ${service.name} con Vercel...`)
  try {
    const res = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    notifySyncEvent('synced', `✓ ${service.name} actualizado en tiempo real en Vercel`)
    return true
  } catch (err: any) {
    console.warn('[Sync Error]', err)
    notifySyncEvent('error', `Guardado local. (Sincronización remota: ${err.message})`)
    return false
  }
}

/** Deletes a service from Neon Postgres / Vercel API */
export async function deleteServiceFromVercel(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Eliminando servicio en Vercel...`)
  try {
    const res = await fetch(`${baseUrl}/api/services?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    notifySyncEvent('synced', `✓ Servicio eliminado en tiempo real de Vercel`)
    return true
  } catch (err: any) {
    console.warn('[Sync Delete Error]', err)
    notifySyncEvent('error', `Eliminado local. (Vercel: ${err.message})`)
    return false
  }
}

/** Fetch latest services from Vercel API / Neon Postgres */
export async function fetchLiveServicesFromVercel(): Promise<AdminService[] | null> {
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/services`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const mapped: AdminService[] = data.map((d: any) => ({
        id: d.id,
        categoryId: d.category_id || d.categoryId,
        categoryName: d.category_name || d.categoryName,
        name: d.name,
        badge: d.badge || undefined,
        description: d.description,
        duration: d.duration,
        price: d.price,
        priceNumber: d.price_number || d.priceNumber || 0,
        featured: !!d.featured,
        active: d.active !== false,
        includes: d.includes || [],
      }))
      saveServices(mapped)
      return mapped
    }
    return null
  } catch (e) {
    console.warn('[Fetch Live Error]', e)
    return null
  }
}

export function getServices(): AdminService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES))
      return DEFAULT_SERVICES
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error(e)
    return DEFAULT_SERVICES
  }
}

export function saveServices(services: AdminService[]): void {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services))
}

export function getStudioConfig(): StudioConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG))
      return DEFAULT_CONFIG
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error(e)
    return DEFAULT_CONFIG
  }
}

export function saveStudioConfig(config: StudioConfig): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
}

export function getGalleryItems(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GALLERY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(DEFAULT_GALLERY))
      return DEFAULT_GALLERY
    }
    return JSON.parse(raw)
  } catch (e) {
    console.error(e)
    return DEFAULT_GALLERY
  }
}

export function saveGalleryItems(items: GalleryItem[]): void {
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items))
}

// WhatsApp Helper Generators
export function createWhatsAppReminderUrl(apt: Appointment, config: StudioConfig): string {
  const cleanPhone = apt.clientPhone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = `¡Hola ${apt.clientName}! 🌟 Te recordamos tu cita en *${config.name}* para mañana ${apt.date} a las *${apt.time}* para tu tratamiento de *${apt.serviceName}*.\n\n📍 Ubicación: ${config.address}, ${config.city}.\n\nPor favor, recuerda acudir sin maquillaje en los ojos ni restos de rímel. Si necesitas modificar tu horario avísanos con antelación. ¡Te esperamos!`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
}

export function createWhatsAppConfirmationUrl(apt: Appointment, config: StudioConfig): string {
  const cleanPhone = apt.clientPhone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = `¡Hola ${apt.clientName}! ✨ Tu cita en *${config.name}* ha sido confirmada con éxito:\n\n🗓 *Fecha:* ${apt.date}\n⏰ *Hora:* ${apt.time}\n🌸 *Servicio:* ${apt.serviceName}\n💶 *Precio:* ${apt.price} €\n\n📍 Nos encontramos en ${config.address}, ${config.city}.\n¡Nos encantará atenderte!`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
}

export function createWhatsAppPreCareUrl(apt: Appointment, config: StudioConfig): string {
  const cleanPhone = apt.clientPhone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = `¡Hola ${apt.clientName}! 🌸 Para garantizar que tu tratamiento de *${apt.serviceName}* en *${config.name}* quede perfecto y tenga la máxima retención, te dejamos estas sencillas pautas para tu sesión:\n\n1️⃣ Acudir con los ojos completamente limpios, sin sombras, rímel ni delineador.\n2️⃣ No aplicar cremas grasas ni aceites en el contorno de ojos las horas previas.\n3️⃣ Si usas lentillas, te recomendamos traer estuche para retirarlas durante la colocación.\n4️⃣ Evitar tomar cafeína en exceso justo antes para mantener los párpados relajados.\n\n¡Cualquier duda estamos a tu disposición!`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
}

export function createWhatsAppRecallUrl(client: Client, config: StudioConfig): string {
  const cleanPhone = client.phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = `¡Hola ${client.name}! 💖 En *${config.name}* esperamos que estés genial. Hemos visto que han pasado varias semanas desde tu última puesta de pestañas. Recuerda que para mantener tu mirada densa y uniforme, lo ideal es realizar un retoque a las 2-3 semanas.\n\n¿Te gustaría que te reservemos hueco para esta semana? ¡Escríbenos y elegimos el mejor horario para ti! ✨`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
}

// Backup and Restore
export function exportBackupJSON(): string {
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    appointments: getAppointments(),
    clients: getClients(),
    services: getServices(),
    config: getStudioConfig(),
    gallery: getGalleryItems(),
  }
  return JSON.stringify(data, null, 2)
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr)
    if (data.appointments) saveAppointments(data.appointments)
    if (data.clients) saveClients(data.clients)
    if (data.services) saveServices(data.services)
    if (data.config) saveStudioConfig(data.config)
    if (data.gallery) saveGalleryItems(data.gallery)
    return true
  } catch (e) {
    console.error('Error importing backup:', e)
    return false
  }
}
