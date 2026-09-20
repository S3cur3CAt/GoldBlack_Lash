import { Appointment, Client, AdminService, StudioConfig, GalleryItem, Invoice, AgendaDayNote } from '../types/admin'

const STORAGE_KEYS = {
  APPOINTMENTS: 'goldblack_admin_appointments_v2',
  CLIENTS: 'goldblack_admin_clients_v2',
  SERVICES: 'goldblack_admin_services_v2',
  CONFIG: 'goldblack_admin_config_v2',
  GALLERY: 'goldblack_admin_gallery_v2',
  CUSTOM_GALLERY_CATEGORIES: 'goldblack_admin_custom_gallery_categories_v2',
  INVOICES: 'goldblack_admin_invoices_v2',
  AGENDA_NOTES: 'goldblack_admin_agenda_notes_v2',
}

// Initial Studio Config from site.ts
export const DEFAULT_CONFIG: StudioConfig = {
  name: 'GoldBlack Lash',
  tagline: 'Estudio de extensiones de pestañas',
  claim: 'Belleza de autor, hecha a medida',
  phoneDisplay: '+34 662 02 34 35',
  email: 'citas@goldblacklash.com',
  address: 'Calle Numa, Montequinto',
  city: 'Dos Hermanas (Sevilla)',
  postalCode: '41089',
  instagram: 'https://instagram.com/goldblack_lash',
  instagramHandle: '@goldblack_lash',
  mapsUrl: 'https://maps.app.goo.gl/pTmcZcRxHETf7QJq7?g_st=iw',
  senderEmail: 'citas@goldblacklash.com',
  hours: [
    { days: 'Lunes a viernes', time: '10:00 – 20:00' },
    { days: 'Sábado', time: '10:00 – 15:00' },
    { days: 'Domingo', time: 'Cerrado' },
  ],
  muteAllNotifications: false,
  voiceAnnounceNewAppointments: true,
  voiceAnnounceUpdates: true,
  voiceVolume: 80,
  whatsappAlertPhone: '+34 662 02 34 35',
  telegramAlertsEnabled: true,
  telegramBotToken: '',
  telegramChatId: '',
  telegramAllowedCredentials: [],
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
    duration: '1 h 15 min',
    price: '27 €',
    priceNumber: 27,
    featured: false,
    active: true,
    image: './galeria/pieza-02.jpg',
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
    duration: '1 h',
    price: '30 €',
    priceNumber: 30,
    featured: true,
    active: true,
    image: './galeria/pieza-01.jpg',
    includes: [
      'Abanicos hechos a mano',
      'Densidad media-alta',
      'Ideal para pestaña escasa',
    ],
  },
  {
    id: 'retirada',
    categoryId: 'extras',
    categoryName: 'Tratamientos y extras',
    name: 'Retirada de extensiones',
    badge: 'Cuidado Pestaña',
    description: 'Retiramos tus extensiones con crema disolvente profesional, sin tirones ni daño a tu pestaña natural.',
    duration: '30 min',
    price: '5–10 €',
    priceNumber: 10,
    featured: false,
    active: true,
    image: './galeria/pieza-04.jpg',
    includes: [
      'Crema disolvente suave',
      'Sin daño a la pestaña natural',
      'Revisión incluida',
    ],
  },
  {
    id: 'limpieza-facial',
    categoryId: 'extras',
    categoryName: 'Tratamientos y extras',
    name: 'Limpieza facial profunda',
    badge: 'Piel Radiante',
    description: 'Una limpieza a fondo que deja la piel respirando: extrae los puntos negros y las impurezas, retira las células muertas e hidrata en profundidad.',
    duration: '1 h',
    price: '30 €',
    priceNumber: 30,
    featured: true,
    active: true,
    image: './galeria/limpieza-facial.jpg',
    includes: [
      'Puntos negros e impurezas fuera',
      'Hidratación profunda y luminosidad',
      'Piel suave y descansada',
    ],
  },
]

// Client Database (Starts clean, without dummy/sample data)
export const DEFAULT_CLIENTS: Client[] = []

// Appointments Agenda (Starts clean, without dummy/sample data)
export const DEFAULT_APPOINTMENTS: Appointment[] = []

export const DEFAULT_GALLERY_CATEGORIES: string[] = [
  'Volumen 3D',
  'Volumen 4D',
  'Volumen 5D',
  'Volumen 6D',
  'Volumen Ruso',
  'Mega Volumen',
  'Clásicas Efecto Rímel',
  'Clásicas Pelo a Pelo',
  'Efecto Híbrido',
  'Híbridas / Kim',
  'Lifting de Pestañas',
  'Fibras Tecnológicas',
  'Densidad y Negro Intenso',
  'Cuidado Facial',
]

export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'gal-01',
    key: 'pieza-04',
    title: 'Volumen 3D',
    category: 'Volumen 3D',
    detail: 'Efecto tridimensional con fibras de seda ultra ligeras y diseño anatómico de mirada.',
    price: '27 €',
    badge: 'Popular',
    featured: true,
    elements: ['Curvatura D', 'Grosor 0.07', 'Fibras Tecnológicas', 'Efecto Cat Eye'],
    url: './galeria/pieza-04.jpg',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gal-02',
    key: 'pieza-01',
    title: 'Volumen 4D',
    category: 'Volumen 4D',
    detail: 'Abanicos simétricos de 4 fibras para una densidad suave y elegante sin sobrecargar.',
    price: '27 €',
    elements: ['Curvatura CC', 'Grosor 0.07', 'Fibras Tecnológicas', 'Longitud 9-13 mm'],
    url: './galeria/pieza-01.jpg',
    updatedAt: '2026-03-02',
  },
  {
    id: 'gal-03',
    key: 'pieza-02',
    title: 'Volumen 5D',
    category: 'Volumen 5D',
    detail: 'Efecto volumen medio con acento rasgado en el extremo exterior del ojo.',
    price: '27 €',
    elements: ['Curvatura D', 'Grosor 0.05', 'Volumen 5D', 'Efecto Ardilla'],
    url: './galeria/pieza-02.jpg',
    updatedAt: '2026-03-03',
  },
  {
    id: 'gal-04',
    key: 'pieza-03',
    title: 'Volumen 6D',
    category: 'Volumen 6D',
    detail: 'Mirada expresiva y tupida con abanicos ultra finos de alta retención.',
    price: '27 €',
    elements: ['Curvatura M', 'Grosor 0.05', 'Volumen 6D', 'Retención +4 semanas'],
    url: './galeria/pieza-03.jpg',
    updatedAt: '2026-03-04',
  },
  {
    id: 'gal-05',
    key: 'pieza-05',
    title: 'Volumen Ruso',
    category: 'Volumen Ruso',
    detail: 'Línea de pestañas compacta, color negro carbón mate y máxima intensidad visual.',
    price: '30 €',
    badge: 'Top',
    featured: true,
    elements: ['Curvatura D', 'Negro Carbón Mate', 'Efecto Sombra / Eyeliner', '100% Personalizado'],
    url: './galeria/pieza-05.jpg',
    updatedAt: '2026-03-05',
  },
  {
    id: 'gal-06',
    key: 'limpieza-facial',
    title: 'Limpieza Facial Profunda',
    category: 'Cuidado Facial',
    detail: 'Higiene dérmica con espátula ultrasónica, vapor de ozono y mascarilla calmante.',
    price: '35 €',
    elements: ['Espátula Ultrasónica', 'Vapor Ozono', 'Mascarilla Calmante', 'Hidratación Ácido Hialurónico'],
    url: './galeria/limpieza-facial.jpg',
    updatedAt: '2026-03-06',
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
    const parsed: Appointment[] = JSON.parse(raw)
    const filtered = parsed.filter((apt) => {
      const id = apt.id || ''
      const name = (apt.clientName || '').toLowerCase()
      return !id.startsWith('test-') && !name.includes('test') && !name.includes('prueba')
    })
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(filtered))
    }
    return filtered
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
    if (saved && saved.trim().startsWith('http')) {
      let cleanUrl = saved.trim().replace(/\/+$/, '')
      if (cleanUrl === 'https://goldblacklash.com') {
        cleanUrl = 'https://www.goldblacklash.com'
        localStorage.setItem('goldblack_admin_api_url', cleanUrl)
      }
      return cleanUrl
    }
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000') {
      return 'http://localhost:3000'
    }
  } catch (e) {}
  return 'https://www.goldblacklash.com'
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem('goldblack_admin_api_url', url.trim())
}

/**
 * Resolves an image URL so it works seamlessly in both Web and Electron (file:// protocol).
 * Any relative path like /api/images/... will be prefixed with the Vercel backend base URL.
 */
const LOCAL_GALLERY_FILES: Record<string, string> = {
  'pieza-01': './galeria/pieza-01.jpg',
  'pieza-02': './galeria/pieza-02.jpg',
  'pieza-03': './galeria/pieza-03.jpg',
  'pieza-04': './galeria/pieza-04.jpg',
  'pieza-05': './galeria/pieza-05.jpg',
  'limpieza-facial': './galeria/limpieza-facial.jpg',
}

export function resolveImageUrl(url?: string, key?: string): string {
  if (!url && !key) return ''
  // If it's a base64 data URL, return directly (works in Electron & browser)
  if (url && url.startsWith('data:image/')) return url
  // If it's already an absolute http or https URL, return directly
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url

  const isElectron =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || Boolean((window as any).electronAPI))

  // In Electron, prioritize bundled local assets for known items (zero latency, offline-ready)
  if (isElectron) {
    if (key && LOCAL_GALLERY_FILES[key]) {
      return LOCAL_GALLERY_FILES[key]
    }
    if (url) {
      for (const [k, path] of Object.entries(LOCAL_GALLERY_FILES)) {
        if (url.includes(k)) return path
      }
      if (url.startsWith('./') || url.startsWith('galeria/')) {
        return `./${url.replace(/^\.?\//, '')}`
      }
    }
  }

  // If url is already a relative local path ./galeria/...
  if (url && (url.startsWith('./galeria/') || url.startsWith('/galeria/') || url.startsWith('galeria/'))) {
    const cleanPath = url.replace(/^(\.\/|\/)?galeria\//, '')
    return isElectron ? `./galeria/${cleanPath}` : `/galeria/${cleanPath}`
  }

  const baseUrl = getApiBaseUrl()

  // In browser/dev mode, check local bundled items
  if (!isElectron && key && LOCAL_GALLERY_FILES[key]) {
    return `/galeria/${key === 'limpieza-facial' ? 'limpieza-facial.jpg' : key + '.jpg'}`
  }

  // If url is just a key or starts with custom- or pieza-
  if (url && (url.startsWith('custom-') || url.startsWith('pieza-'))) {
    return `${baseUrl}/api/images/${url}`
  }

  // If it starts with /api/ or api/
  if (url && url.startsWith('/api/')) {
    return `${baseUrl}${url}`
  }
  if (url && url.startsWith('api/')) {
    return `${baseUrl}/${url}`
  }

  // If it contains /api/images/
  if (url && url.includes('/api/images/')) {
    const idx = url.indexOf('/api/images/')
    return `${baseUrl}${url.substring(idx)}`
  }

  // If key is provided (e.g. pieza-01 or custom-123456)
  if (key) {
    return `${baseUrl}/api/images/${key}`
  }

  // If url contains pieza-
  if (url && url.includes('pieza-')) {
    const match = url.match(/(pieza-\d+)/)
    if (match) {
      return isElectron ? `./galeria/${match[1]}.jpg` : `${baseUrl}/api/images/${match[1]}`
    }
  }

  // If it starts with /
  if (url && url.startsWith('/')) {
    return `${baseUrl}${url}`
  }

  if (url) {
    return `${baseUrl}/${url.replace(/^\.?\//, '')}`
  }

  return ''
}

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'idle'

const SUPABASE_REST_URL = 'https://uiohtupgtqxbzmfqkqea.supabase.co/rest/v1'
const SUPABASE_ANON_KEY = 'sb_publishable_EmVnt_9VUQnB2wrBt5U1LA_khOLHLCh'

// Broadcast sync events to UI
export function notifySyncEvent(status: SyncStatus, message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('goldblack:sync', { detail: { status, message } }))
  }
}

/** Syncs a single service with Supabase / Vercel API */
export async function syncServiceWithVercel(service: AdminService): Promise<boolean> {
  notifySyncEvent('syncing', `Sincronizando ${service.name}...`)

  // 1. Direct Supabase query (Primary: no 403 proxy error)
  try {
    const sbPayload = {
      id: service.id,
      category_id: service.categoryId,
      category_name: service.categoryName,
      name: service.name,
      badge: service.badge || null,
      description: service.description || '',
      duration: service.duration || '1 h 30 min',
      price: service.price || '',
      price_number: service.priceNumber || 0,
      featured: !!service.featured,
      active: service.active !== false,
      sort_order: service.pinnedFirst ? 0 : 100,
      includes: Array.isArray(service.includes) ? service.includes : [],
      image: service.image || null,
      updated_at: new Date().toISOString(),
    }
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(sbPayload),
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ ${service.name} actualizado en tiempo real`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Direct Sync Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service),
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ ${service.name} actualizado en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Sync Error with Vercel]', err)
  }

  notifySyncEvent('error', `Guardado local.`)
  return false
}

/** Deletes a service from Supabase / Vercel API */
export async function deleteServiceFromVercel(id: string): Promise<boolean> {
  notifySyncEvent('syncing', `Eliminando servicio...`)

  // 1. Direct Supabase delete (Primary)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_services?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Servicio eliminado en tiempo real`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Direct Delete Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/services?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Servicio eliminado en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Sync Delete Error with Vercel]', err)
  }

  notifySyncEvent('error', `Eliminado local.`)
  return false
}

/** Syncs a single gallery item with Supabase / Vercel API */
export async function syncGalleryItemWithVercel(item: GalleryItem): Promise<boolean> {
  notifySyncEvent('syncing', `Publicando foto "${item.title}"...`)

  // 1. Direct Supabase sync (Primary)
  try {
    const sbPayload = {
      id: item.id,
      title: item.title,
      category: item.category,
      detail: item.detail || '',
      price: item.price || '',
      badge: item.badge || null,
      featured: !!item.featured,
      elements: JSON.stringify(item.elements || []),
      url: item.url || '',
      image_url: item.url || '',
      key: item.key || null,
      sort_order: 100,
      updated_at: new Date().toISOString(),
    }
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(sbPayload),
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Foto "${item.title}" guardada en tiempo real`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Gallery Sync Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/gallery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.item?.image_url) {
        item.url = data.item.image_url
      }
      notifySyncEvent('synced', `✓ Foto "${item.title}" guardada en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Gallery Sync Error with Vercel]', err)
  }

  notifySyncEvent('error', `Guardado local.`)
  return false
}

/** Deletes a gallery item from Supabase / Vercel API */
export async function deleteGalleryItemFromVercel(id: string): Promise<boolean> {
  notifySyncEvent('syncing', `Eliminando foto...`)

  // 1. Direct Supabase delete (Primary)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_gallery?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Foto eliminada en tiempo real`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Gallery Delete Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/gallery?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Foto eliminada en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Gallery Delete Error with Vercel]', err)
  }

  notifySyncEvent('error', `Eliminado local.`)
  return false
}

/** Fetch latest gallery items from Vercel API / Supabase */
export async function fetchLiveGalleryFromVercel(): Promise<GalleryItem[] | null> {
  let data: any[] | null = null

  // 1. Direct Supabase query (Primary: no 403 proxy error)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_gallery?select=*&order=sort_order.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      const parsed = await sbRes.json()
      if (Array.isArray(parsed)) {
        data = parsed
      }
    }
  } catch (sbErr) {
    console.warn('[Gallery fetch from Supabase failed, trying Vercel fallback]', sbErr)
  }

  // 2. Fallback to Vercel API only if Supabase didn't answer
  if (!Array.isArray(data)) {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/gallery?_t=${Date.now()}`)
      if (res.ok) {
        const parsed = await res.json()
        if (Array.isArray(parsed)) {
          data = parsed
        }
      }
    } catch (e) {
      console.warn('[Gallery fetch from Vercel failed]', e)
    }
  }

  if (Array.isArray(data) && data.length > 0) {
    const mapped: GalleryItem[] = data.map((d: any) => ({
      id: d.id,
      key: d.key,
      title: d.title,
      category: d.category,
      detail: d.detail,
      price: d.price,
      badge: d.badge,
      featured: !!d.featured,
      elements: Array.isArray(d.elements)
        ? d.elements
        : typeof d.elements === 'string'
        ? (() => {
            try {
              let p = JSON.parse(d.elements)
              while (typeof p === 'string') p = JSON.parse(p)
              return Array.isArray(p) ? p : []
            } catch {
              return []
            }
          })()
        : [],
      url: d.image_url || d.url || (d.key ? `/api/images/${d.key}` : ''),
      updatedAt: d.updated_at ? d.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
    }))
    saveGalleryItems(mapped)
    return mapped
  }
  return null
}

export async function fetchLiveServicesFromVercel(): Promise<AdminService[] | null> {
  let data: any[] | null = null

  // 1. Direct Supabase query (Primary: no 403 proxy error)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_services?select=*&order=sort_order.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      const parsed = await sbRes.json()
      if (Array.isArray(parsed)) {
        data = parsed
      }
    }
  } catch (sbErr) {
    console.warn('[Services fetch from Supabase failed, trying Vercel fallback]', sbErr)
  }

  // 2. Fallback to Vercel API only if Supabase didn't answer
  if (!Array.isArray(data)) {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/services?_t=${Date.now()}`)
      if (res.ok) {
        const parsed = await res.json()
        if (Array.isArray(parsed)) {
          data = parsed
        }
      }
    } catch (e) {
      console.warn('[Services fetch from Vercel failed]', e)
    }
  }

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
      pinnedFirst: d.sort_order === 0,
      active: d.active !== undefined ? !!d.active : true,
      image: d.image || d.image_url || d.url || undefined,
      includes: Array.isArray(d.includes)
        ? d.includes
        : typeof d.includes === 'string'
        ? (() => {
            try {
              let p = JSON.parse(d.includes)
              while (typeof p === 'string') p = JSON.parse(p)
              return Array.isArray(p) ? p : []
            } catch {
              return []
            }
          })()
        : [],
    }))
    const cleanMapped: AdminService[] = mapped
      .filter((s) => {
        const name = (s.name || '').toLowerCase()
        const id = (s.id || '').toLowerCase()
        if (name.includes('mega') || id.includes('mega')) return false
        if (name.includes('lifting') || id.includes('lifting')) return false
        if (name.includes('retoque') || id.includes('mantenimiento')) return false
        if (name.includes('spa ocular') || id.includes('retirada-limpieza')) return false
        return true
      })
      .map((s) => {
        const lower = s.name.toLowerCase()
        if (lower.includes('volumen ruso')) return { ...s, duration: '1 h' }
        if (lower.includes('3d') || lower.includes('4d') || lower.includes('5d') || lower.includes('6d')) return { ...s, duration: '1 h 15 min' }
        if (lower.includes('retirada')) return { ...s, duration: '30 min' }
        if (lower.includes('limpieza') || lower.includes('facial')) return { ...s, duration: '1 h' }
        return s
      })

    saveServices(cleanMapped)
    return cleanMapped
  }
  return null
}

/** Fetch latest appointments from Vercel API / Supabase */
export async function fetchLiveAppointmentsFromVercel(): Promise<Appointment[] | null> {
  let remoteList: any[] | null = null

  // 1. Direct Supabase query (Primary: 0% rate limit, zero 403 proxy issues, instant real-time)
  try {
    const sbRes = await fetch(
      `${SUPABASE_REST_URL}/studio_appointments?select=*&order=date.desc,time.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )
    if (sbRes.ok) {
      const parsed = await sbRes.json()
      if (Array.isArray(parsed)) {
        remoteList = parsed
      }
    }
  } catch (sbErr) {
    console.warn('[Appointments fetch from Supabase failed, trying Vercel fallback]', sbErr)
  }

  // 2. Fallback to Vercel API only if Supabase didn't answer
  if (!Array.isArray(remoteList)) {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/appointments?_t=${Date.now()}`)
      if (res.ok) {
        const parsed = await res.json()
        if (Array.isArray(parsed)) {
          remoteList = parsed
        }
      }
    } catch (e) {
      console.warn('[Appointments fetch from Vercel failed]', e)
    }
  }

  if (!Array.isArray(remoteList)) return null

  // Get current local appointments
  const local = getAppointments()
  const map = new Map<string, Appointment>()

  // First put local ones
  for (const apt of local) {
    map.set(apt.id, apt)
  }

  // Overlay / add remote ones
  let hasNewAppointments = false
  const currentClients = getClients()
  let clientsUpdated = false
  const clientsMap = new Map<string, Client>()
  for (const c of currentClients) {
    clientsMap.set(c.phone.replace(/\D/g, ''), c)
  }

  for (const r of remoteList) {
    const aptClientName = r.clientName || r.client_name || 'Cliente'
    const id = r.id || ''

    // Strictly discard any test appointments
    if (
      id.startsWith('test-') ||
      aptClientName.toLowerCase().includes('test') ||
      aptClientName.toLowerCase().includes('prueba')
    ) {
      continue
    }

    if (!map.has(r.id)) {
      hasNewAppointments = true
    }
    const aptClientPhone = r.clientPhone || r.client_phone || ''
    const aptClientEmail = r.clientEmail || r.client_email || ''
    const aptDuration = r.durationMinutes || r.duration_minutes || 90
    const aptServiceId = r.serviceId || r.service_id || ''
    const aptServiceName = r.serviceName || r.service_name || 'Servicio de Pestañas'
    const aptPrice = Number(r.price) || 0
    const aptStatus = r.status || 'pendiente'
    const aptPaymentStatus = r.paymentStatus || r.payment_status || 'pendiente'
    const aptCreatedAt = r.createdAt || r.created_at || new Date().toISOString()

    map.set(r.id, {
      id: r.id,
      clientName: aptClientName,
      clientPhone: aptClientPhone,
      clientEmail: aptClientEmail || undefined,
      date: r.date,
      time: r.time,
      durationMinutes: aptDuration,
      serviceId: aptServiceId,
      serviceName: aptServiceName,
      price: aptPrice,
      status: aptStatus,
      paymentStatus: aptPaymentStatus,
      curl: r.curl || undefined,
      length: r.length || undefined,
      style: r.style || undefined,
      notes: r.notes || undefined,
      createdAt: aptCreatedAt,
    })

    // Check if client is registered in CRM
    const cleanPhone = (aptClientPhone || '').replace(/\D/g, '')
    if (cleanPhone && !clientsMap.has(cleanPhone)) {
      const newClient: Client = {
        id: `cli-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: aptClientName,
        phone: aptClientPhone,
        email: aptClientEmail || undefined,
        allergies: 'Ninguna conocida',
        preferredStyle: (r.style as any) || 'Cat Eye (Ojo de Gato)',
        preferredCurl: (r.curl === 'C' || r.curl === 'M') ? r.curl : 'D',
        totalVisits: 1,
        totalSpent: aptPrice,
        lastVisitDate: r.date,
        notes: r.notes ? `Registrada desde reserva web: ${r.notes}` : 'Cliente creada automáticamente desde reserva web',
        createdAt: r.date || new Date().toISOString().split('T')[0],
      }
      clientsMap.set(cleanPhone, newClient)
      clientsUpdated = true
    } else if (cleanPhone && clientsMap.has(cleanPhone) && aptClientEmail && !clientsMap.get(cleanPhone)?.email) {
      const existing = clientsMap.get(cleanPhone)!
      existing.email = aptClientEmail
      clientsUpdated = true
    }
  }

  const merged = Array.from(map.values())
  // Sort by date desc
  merged.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time))

  saveAppointments(merged)

  if (clientsUpdated) {
    saveClients(Array.from(clientsMap.values()))
  }

  if (hasNewAppointments) {
    notifySyncEvent('synced', '✓ Nuevas reservas recibidas desde el sitio web')
  }

  return merged
}

/** Syncs a single appointment with Supabase / Vercel API */
export async function syncAppointmentWithVercel(appointment: Appointment): Promise<boolean> {
  // 1. Direct Supabase sync (Primary: no 403 proxy error)
  try {
    const sbPayload = {
      id: appointment.id,
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      client_email: appointment.clientEmail || null,
      date: appointment.date,
      time: appointment.time,
      duration_minutes: appointment.durationMinutes,
      service_id: appointment.serviceId || null,
      service_name: appointment.serviceName || null,
      price: appointment.price || 0,
      status: appointment.status || 'pendiente',
      payment_status: appointment.paymentStatus || 'pendiente',
      curl: appointment.curl || null,
      length: appointment.length || null,
      style: appointment.style || null,
      notes: appointment.notes || null,
      updated_at: new Date().toISOString(),
    }
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(sbPayload),
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Cita de ${appointment.clientName} sincronizada`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Appointment Sync Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Cita de ${appointment.clientName} sincronizada`)
      return true
    }
  } catch (err: any) {
    console.warn('[Appointment Sync Error with Vercel]', err)
  }

  return false
}

/** Deletes an appointment from Supabase / Vercel API */
export async function deleteAppointmentFromVercel(id: string): Promise<boolean> {
  // 1. Direct Supabase delete (Primary)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_appointments?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Cita eliminada en tiempo real`)
      return true
    }
  } catch (sbErr: any) {
    console.warn('[Supabase Appointment Delete Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/appointments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Cita eliminada en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Appointment Sync Delete Error with Vercel]', err)
  }

  return false
}

// -------------------------------------------------------------
// Invoices & Billing Management with Supabase Postgres & Resend
// -------------------------------------------------------------

export function getInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Remove IVA (0% VAT across application)
    return parsed.map((inv) => ({
      ...inv,
      taxRate: 0,
      taxAmount: 0,
      subtotal: Number(inv.total) || Number(inv.subtotal) || 0,
    }))
  } catch (e) {
    console.error(e)
    return []
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices))
}

/** Fetch latest invoices from Vercel API / Supabase Postgres */
export async function fetchLiveInvoicesFromVercel(): Promise<Invoice[] | null> {
  let remoteList: any[] | null = null

  // 1. Direct Supabase query (Primary: no 403 proxy error)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_invoices?select=*&order=date.desc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      const parsed = await sbRes.json()
      if (Array.isArray(parsed)) {
        remoteList = parsed
      }
    }
  } catch (sbErr) {
    console.warn('[Invoices fetch from Supabase failed, trying Vercel fallback]', sbErr)
  }

  // 2. Fallback to Vercel API only if Supabase didn't answer
  if (!Array.isArray(remoteList)) {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/invoices?_t=${Date.now()}`)
      if (res.ok) {
        const parsed = await res.json()
        if (Array.isArray(parsed)) {
          remoteList = parsed
        }
      }
    } catch (e) {
      console.warn('[Invoices fetch from Vercel failed]', e)
    }
  }

  if (Array.isArray(remoteList)) {
    const mapped: Invoice[] = remoteList.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      appointmentId: r.appointmentId || r.appointment_id || undefined,
      clientName: r.clientName || r.client_name,
      clientNif: r.clientNif || r.client_nif || undefined,
      clientPhone: r.clientPhone || r.client_phone || undefined,
      clientEmail: r.clientEmail || r.client_email || undefined,
      items: Array.isArray(r.items)
        ? r.items
        : typeof r.items === 'string'
        ? JSON.parse(r.items)
        : [],
      subtotal: Number(r.total) || Number(r.subtotal) || 0,
      taxRate: 0,
      taxAmount: 0,
      total: Number(r.total) || 0,
      paymentMethod: r.paymentMethod || r.payment_method || 'bizum',
      status: r.status || 'cobrada',
      notes: r.notes || undefined,
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    }))
    saveInvoices(mapped)
    return mapped
  }
  return null
}

/** Sync invoice with Supabase Postgres & Vercel API */
export async function syncInvoiceWithVercel(invoice: Invoice): Promise<boolean> {
  notifySyncEvent('syncing', `Sincronizando factura ${invoice.number}...`)

  // 1. Direct Supabase sync (Primary)
  try {
    const sbPayload = {
      id: invoice.id,
      number: invoice.number,
      date: invoice.date,
      appointment_id: invoice.appointmentId || null,
      client_name: invoice.clientName,
      client_nif: invoice.clientNif || null,
      client_phone: invoice.clientPhone || null,
      client_email: invoice.clientEmail || null,
      items: invoice.items || [],
      subtotal: invoice.total || invoice.subtotal || 0,
      tax_rate: 0,
      tax_amount: 0,
      total: invoice.total || 0,
      payment_method: invoice.paymentMethod || 'bizum',
      status: invoice.status || 'cobrada',
      notes: invoice.notes || null,
      updated_at: new Date().toISOString(),
    }
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(sbPayload),
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', `✓ Factura ${invoice.number} guardada en tiempo real`)
      return true
    }
  } catch (sbErr) {
    console.warn('[Supabase Invoice Sync Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Factura ${invoice.number} guardada en tiempo real`)
      return true
    }
  } catch (err) {
    console.warn('[Invoice Sync Error with Vercel]', err)
  }

  notifySyncEvent('error', `Guardada localmente`)
  return false
}

/** Deletes an invoice from Supabase Postgres & Vercel API */
export async function deleteInvoiceFromVercel(id: string): Promise<boolean> {
  notifySyncEvent('syncing', 'Eliminando factura...')

  // 1. Direct Supabase delete (Primary)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_invoices?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', '✓ Factura eliminada en tiempo real')
      return true
    }
  } catch (sbErr) {
    console.warn('[Supabase Invoice Delete Error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/invoices?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', '✓ Factura eliminada en tiempo real')
      return true
    }
  } catch (err) {
    console.warn('[Invoice Delete Error with Vercel]', err)
  }

  notifySyncEvent('error', 'Eliminada localmente')
  return false
}

/** Dispatches a luxury styled invoice receipt directly to the client's email via Resend */
export async function sendInvoiceEmail(
  invoice: Invoice,
  config: StudioConfig,
  recipientEmail?: string,
  customNote?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const targetEmail = (recipientEmail || invoice.clientEmail || '').trim()
  if (!targetEmail) {
    return { ok: false, error: 'Por favor indica un correo electrónico de destino.' }
  }

  const itemsHtml = (invoice.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #262635; color: #f5f5f7; font-size: 13px;">${item.description}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #262635; color: #a1a1aa; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #262635; color: #a1a1aa; font-size: 13px; text-align: right;">${item.unitPrice.toFixed(2)} €</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #262635; color: #d4af37; font-size: 13px; font-weight: 700; text-align: right;">${item.total.toFixed(2)} €</td>
      </tr>
    `
    )
    .join('')

  const isPaid = invoice.status === 'cobrada'
  const statusBadge = isPaid
    ? '<span style="background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">PAGADA / COBRADA ✓</span>'
    : '<span style="background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">PENDIENTE DE COBRO</span>'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08080c; color: #f5f5f7; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #12121a; border: 1px solid #252535; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #171722 0%, #1a1a28 100%); padding: 30px; border-bottom: 1px solid #252535; }
        .brand { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
        .brand-accent { color: #d4af37; font-weight: 300; }
        .title { color: #d4af37; font-size: 18px; font-weight: 700; margin-top: 15px; margin-bottom: 4px; }
        .content { padding: 30px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .table th { background-color: #181824; color: #d4af37; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; border-bottom: 1px solid #262635; }
        .totals-table { width: 100%; max-width: 250px; margin-left: auto; border-collapse: collapse; margin-bottom: 25px; }
        .totals-table td { padding: 6px 10px; font-size: 13px; }
        .footer { background-color: #0d0d14; padding: 20px 30px; border-top: 1px solid #20202d; font-size: 11px; color: #71717a; text-align: center; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="brand">GoldBlack <span class="brand-accent">Lash</span></div>
            <div>${statusBadge}</div>
          </div>
          <div class="title">Factura / Recibo Oficial nº ${invoice.number}</div>
          <div style="color: #a1a1aa; font-size: 12px;">Fecha de emisión: ${invoice.date}</div>
        </div>

        <div class="content">
          ${customNote ? `<div style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 12px; padding: 14px 16px; margin-bottom: 25px; font-size: 13px; color: #f5f5f7;">${customNote}</div>` : ''}

          <table style="width: 100%; margin-bottom: 25px;">
            <tr>
              <td style="vertical-align: top; width: 50%; font-size: 12px; line-height: 1.6; color: #a1a1aa;">
                <strong style="color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Datos del Estudio:</strong>
                <span style="color: #ffffff; font-weight: 600;">${config.name}</span><br>
                ${config.address}<br>
                ${config.postalCode} ${config.city}<br>
                Teléfono: ${config.phoneDisplay}<br>
                Email: ${config.email}
              </td>
              <td style="vertical-align: top; width: 50%; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: right;">
                <strong style="color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Facturado a:</strong>
                <span style="color: #ffffff; font-weight: 600;">${invoice.clientName}</span><br>
                ${invoice.clientNif ? `NIF/CIF: <strong style="color: #f5f5f7;">${invoice.clientNif}</strong><br>` : ''}
                ${invoice.clientPhone ? `Tel: ${invoice.clientPhone}<br>` : ''}
                ${invoice.clientEmail ? `Email: ${invoice.clientEmail}<br>` : ''}
                Método de pago: <strong style="color: #d4af37; text-transform: uppercase;">${invoice.paymentMethod}</strong>
              </td>
            </tr>
          </table>

          <table class="table">
            <thead>
              <tr>
                <th style="text-align: left;">Concepto / Tratamiento</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="totals-table">
            <tr style="border-top: 1px solid #262635;">
              <td style="color: #d4af37; font-weight: 800; font-size: 15px; text-align: right; padding-top: 8px;">TOTAL:</td>
              <td style="color: #d4af37; font-weight: 800; font-size: 17px; text-align: right; padding-top: 8px;">${invoice.total.toFixed(2)} €</td>
            </tr>
          </table>

          ${invoice.notes ? `<div style="font-size: 11px; color: #71717a; margin-top: 15px; border-top: 1px dashed #222230; padding-top: 10px;">Notas: ${invoice.notes}</div>` : ''}
        </div>

        <div class="footer">
          Gracias por confiar en <strong>${config.name}</strong>.<br>
          Este documento es un comprobante oficial de pago y factura simplificada emitida por el estudio.
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Factura / Recibo nº ${invoice.number}
${config.name}

Fecha: ${invoice.date}
Clienta: ${invoice.clientName} ${invoice.clientNif ? `(${invoice.clientNif})` : ''}
Total: ${invoice.total.toFixed(2)} €
Método de pago: ${invoice.paymentMethod}
Estado: ${invoice.status.toUpperCase()}

${customNote ? `${customNote}\n\n` : ''}
¡Gracias por tu confianza!
${config.name} • ${config.phoneDisplay}
  `.trim()

  return sendEmailViaResend({
    to: targetEmail,
    subject: `📄 Factura ${invoice.number} — ${config.name}`,
    html,
    text,
    apiKey: config.resendApiKey,
  })
}

export function getServices(): AdminService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES)
    let services: AdminService[] = raw ? JSON.parse(raw) : DEFAULT_SERVICES

    // 1. Purge eliminated services requested by user:
    // "elimina mega volumen glam, lifting de pestañas con tinte y queratina, retoque dos o 3 semanas, retirada profesioonal y spa ocular"
    const countBefore = services.length
    services = services.filter((s) => {
      const name = (s.name || '').toLowerCase()
      const id = (s.id || '').toLowerCase()
      if (name.includes('mega') || id.includes('mega')) return false
      if (name.includes('lifting') || id.includes('lifting')) return false
      if (name.includes('retoque') || id.includes('mantenimiento')) return false
      if (name.includes('spa ocular') || id.includes('retirada-limpieza')) return false
      return true
    })

    // 2. Ensure Retirada de extensiones and Limpieza facial profunda exist
    const hasRetirada = services.some((s) => s.name.toLowerCase().includes('retirada'))
    if (!hasRetirada) {
      const defRetirada = DEFAULT_SERVICES.find((s) => s.id === 'retirada')
      if (defRetirada) services.push(defRetirada)
    }

    const hasLimpieza = services.some((s) => s.name.toLowerCase().includes('limpieza') || s.name.toLowerCase().includes('facial'))
    if (!hasLimpieza) {
      const defLimpieza = DEFAULT_SERVICES.find((s) => s.id === 'limpieza-facial')
      if (defLimpieza) services.push(defLimpieza)
    }

    // 3. Migrate default service durations requested by user:
    // - Retirada de extensiones: 30 min
    // - Pestañas volumen ruso: 1 h
    // - Volumen 3D, 4D, 5D y 6D: 1 h 15 min
    // - Limpieza facial: 1 h
    let modified = countBefore !== services.length
    services = services.map((s) => {
      const lower = s.name.toLowerCase()
      if (lower.includes('volumen ruso') && s.duration !== '1 h') {
        modified = true
        return { ...s, duration: '1 h' }
      }
      if ((lower.includes('3d') || lower.includes('4d') || lower.includes('5d') || lower.includes('6d')) && s.duration !== '1 h 15 min') {
        modified = true
        return { ...s, duration: '1 h 15 min' }
      }
      if (lower.includes('retirada') && s.duration !== '30 min') {
        modified = true
        return { ...s, duration: '30 min' }
      }
      if ((lower.includes('limpieza') || lower.includes('facial')) && s.duration !== '1 h') {
        modified = true
        return { ...s, duration: '1 h' }
      }
      return s
    })

    if (modified || !raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services))
    }
    return services
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

/** Fetch latest studio config from Vercel / Supabase API */
export async function fetchLiveConfigFromVercel(): Promise<StudioConfig | null> {
  // 1. Direct Supabase query (Primary: 100% reliable, no proxy issues)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_config?id=eq.main`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
    if (sbRes.ok) {
      const rows = await sbRes.json()
      if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
        const remoteConfig = rows[0].data
        saveStudioConfig(remoteConfig)
        return remoteConfig
      }
    }
  } catch (sbErr) {
    console.warn('[Supabase Config fetch error, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/config?_t=${Date.now()}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'x-admin-request': 'true',
      },
    })
    if (res.ok) {
      const parsed = await res.json()
      if (parsed && typeof parsed === 'object' && parsed.name) {
        saveStudioConfig(parsed)
        return parsed
      }
    }
  } catch (e) {
    console.warn('[Config fetch from Vercel failed]', e)
  }
  return null
}

/** Sync studio config with Vercel / Supabase API */
export async function syncStudioConfigWithVercel(config: StudioConfig): Promise<boolean> {
  notifySyncEvent('syncing', 'Sincronizando ajustes del estudio en tiempo real...')

  // 1. Direct Supabase sync (Primary: instant real-time in 0 seconds)
  try {
    const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 'main',
        data: config,
        updated_at: new Date().toISOString(),
      }),
    })
    if (sbRes.ok) {
      notifySyncEvent('synced', '✓ Ajustes y credenciales sincronizados en la nube')
      // Background ping to Vercel/website API
      try {
        const baseUrl = getApiBaseUrl()
        fetch(`${baseUrl}/api/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            'x-admin-request': 'true',
          },
          body: JSON.stringify(config),
        }).catch(() => {})
      } catch {}
      return true
    }
  } catch (sbErr) {
    console.warn('[Direct Supabase Config sync failed, trying Vercel fallback]', sbErr)
  }

  // 2. Vercel fallback
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        'x-admin-request': 'true',
      },
      body: JSON.stringify(config),
    })
    if (res.ok) {
      notifySyncEvent('synced', '✓ Ajustes y credenciales sincronizados en la nube')
      return true
    }
  } catch (err) {
    console.warn('[Config sync with Vercel failed]', err)
  }

  notifySyncEvent('error', '⚠️ No se pudo sincronizar la configuración con la nube')
  return false
}

export function getGalleryItems(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GALLERY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(DEFAULT_GALLERY))
      return DEFAULT_GALLERY
    }
    const items: GalleryItem[] = JSON.parse(raw)
    // Normalize relative paths for Electron file:// and web compatibility
    const normalized = items.map((item) => ({
      ...item,
      url: item.url.startsWith('/galeria/') ? `.${item.url}` : item.url,
    }))
    return normalized
  } catch (e) {
    console.error(e)
    return DEFAULT_GALLERY
  }
}

export function saveGalleryItems(items: GalleryItem[]): void {
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items))
}

export function getGalleryCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_GALLERY_CATEGORIES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_GALLERY_CATEGORIES, JSON.stringify(DEFAULT_GALLERY_CATEGORIES))
      return DEFAULT_GALLERY_CATEGORIES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_GALLERY_CATEGORIES
  } catch {
    return DEFAULT_GALLERY_CATEGORIES
  }
}

export function saveGalleryCategories(categories: string[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_GALLERY_CATEGORIES, JSON.stringify(categories))
}

export function getCustomGalleryCategories(): string[] {
  return getGalleryCategories()
}

export function saveCustomGalleryCategories(categories: string[]): void {
  saveGalleryCategories(categories)
}

// Email Dispatch via Resend (Vercel Backend / Direct API)
export async function sendEmailViaResend(options: {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  apiKey?: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data?.error || `Error ${res.status} al enviar correo` }
    }
    return { ok: true, id: data.id }
  } catch (err: any) {
    // Direct fallback to Resend REST API if Vercel endpoint is unreachable
    if (options.apiKey) {
      try {
        const directRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify({
            from: options.from || 'GoldBlack Lash <citas@goldblacklash.com>',
            to: Array.isArray(options.to) ? options.to : [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text,
          }),
        })
        const directData = await directRes.json()
        if (directRes.ok) {
          return { ok: true, id: directData.id }
        }
        return { ok: false, error: directData?.message || 'Error en Resend' }
      } catch (directErr: any) {
        return { ok: false, error: directErr?.message || 'Error de conexión con Resend' }
      }
    }
    return { ok: false, error: err?.message || 'Error al enviar correo' }
  }
}

// Telegram Studio Alert Testing (Vercel Backend / Direct Telegram Gateway)
export async function sendTestTelegramAlert(config: StudioConfig): Promise<{ ok: boolean; message?: string; error?: string }> {
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramBotToken: config.telegramBotToken,
        telegramChatId: config.telegramChatId,
        telegramAlertsEnabled: config.telegramAlertsEnabled !== false,
        message: [
          `✨ <b>Prueba de Alerta Instantánea (0s) — ${config.name || 'GoldBlack Lash'}</b>`,
          ``,
          `<blockquote>`,
          `✅ ¡Tu Bot de Telegram está conectado y funcionando en tiempo real!`,
          `⚡ Recibirás un aviso instantáneo en <b>0 segundos</b> cada vez que una clienta reserve en tu web.`,
          `</blockquote>`,
          ``,
          `<i>Enviado con éxito desde el Panel de Administración.</i>`,
        ].join('\n'),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: data?.error || `Error ${res.status} al enviar prueba a Telegram` }
    }
    return { ok: true, message: data.message || 'Mensaje de prueba enviado con éxito a tu Telegram' }
  } catch (err: any) {
    // Direct Telegram API fallback if local backend is offline
    if (config.telegramBotToken?.trim() && config.telegramChatId?.trim()) {
      try {
        const token = config.telegramBotToken.trim()
        const chatId = config.telegramChatId.trim()
        const endpoint = `https://api.telegram.org/bot${token}/sendMessage`
        const directRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: [
              `✨ <b>Prueba de Alerta Instantánea (0s) — ${config.name || 'GoldBlack Lash'}</b>`,
              ``,
              `<blockquote>`,
              `✅ ¡Tu Bot de Telegram está conectado directamente desde tu Mac!`,
              `⚡ Las alertas llegarán aquí en <b>0 segundos</b> con formato HTML.`,
              `</blockquote>`,
              ``,
              `<i>Enviado directamente desde tu Mac.</i>`,
            ].join('\n'),
            parse_mode: 'HTML',
          }),
        })
        const textData = await directRes.json().catch(() => ({}))
        if (directRes.ok && textData.ok) {
          return { ok: true, message: 'Alerta de prueba enviada con éxito a tu Telegram' }
        }
        return { ok: false, error: textData?.description || 'Error al conectar con Telegram' }
      } catch (e: any) {
        return { ok: false, error: e?.message || 'Error de conexión directa con Telegram' }
      }
    }
    return { ok: false, error: err?.message || 'Error de conexión con el servicio de alertas' }
  }
}

// Agenda Notes Persistence
export function getAgendaNotes(): AgendaDayNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AGENDA_NOTES)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('Error loading agenda notes:', e)
    return []
  }
}

export function saveAgendaNotes(notes: AgendaDayNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AGENDA_NOTES, JSON.stringify(notes))
  } catch (e) {
    console.error('Error saving agenda notes:', e)
  }
}

export function saveDayNote(
  date: string,
  content: string,
  color: AgendaDayNote['color'] = 'gold'
): AgendaDayNote[] {
  const notes = getAgendaNotes()
  const trimmed = content.trim()
  const existingIndex = notes.findIndex((n) => n.date === date)

  if (!trimmed) {
    if (existingIndex >= 0) {
      notes.splice(existingIndex, 1)
      saveAgendaNotes(notes)
    }
    return notes
  }

  if (existingIndex >= 0) {
    notes[existingIndex] = {
      ...notes[existingIndex],
      content: trimmed,
      color,
      updatedAt: new Date().toISOString(),
    }
  } else {
    notes.push({
      id: `note-${Date.now()}`,
      date,
      content: trimmed,
      color,
      createdAt: new Date().toISOString(),
    })
  }

  saveAgendaNotes(notes)
  return notes
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
    invoices: getInvoices(),
    agendaNotes: getAgendaNotes(),
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
    if (data.invoices) saveInvoices(data.invoices)
    if (data.agendaNotes) saveAgendaNotes(data.agendaNotes)
    return true
  } catch (e) {
    console.error('Error importing backup:', e)
    return false
  }
}

