import { Appointment, Client, AdminService, StudioConfig, GalleryItem } from '../types/admin'

const STORAGE_KEYS = {
  APPOINTMENTS: 'goldblack_admin_appointments_v2',
  CLIENTS: 'goldblack_admin_clients_v2',
  SERVICES: 'goldblack_admin_services_v2',
  CONFIG: 'goldblack_admin_config_v2',
  GALLERY: 'goldblack_admin_gallery_v2',
  CUSTOM_GALLERY_CATEGORIES: 'goldblack_admin_custom_gallery_categories_v2',
}

// Initial Studio Config from site.ts
export const DEFAULT_CONFIG: StudioConfig = {
  name: 'GoldBlack Lash',
  tagline: 'Estudio de extensiones de pestañas',
  claim: 'Belleza de autor, hecha a medida',
  phoneDisplay: '+34 604 18 76 76',
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
      return saved.trim().replace(/\/+$/, '')
    }
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000') {
      return 'http://localhost:3000'
    }
  } catch (e) {}
  return 'https://goldblacklash.com'
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
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Sincronizando ${service.name}...`)
  try {
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
    console.warn('[Sync Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Direct Sync Error]', sbErr)
  }

  notifySyncEvent('error', `Guardado local.`)
  return false
}

/** Deletes a service from Supabase / Vercel API */
export async function deleteServiceFromVercel(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Eliminando servicio...`)
  try {
    const res = await fetch(`${baseUrl}/api/services?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Servicio eliminado en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Sync Delete Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Direct Delete Error]', sbErr)
  }

  notifySyncEvent('error', `Eliminado local.`)
  return false
}

/** Syncs a single gallery item with Supabase / Vercel API */
export async function syncGalleryItemWithVercel(item: GalleryItem): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Publicando foto "${item.title}"...`)
  try {
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
    console.warn('[Gallery Sync Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Gallery Sync Error]', sbErr)
  }

  notifySyncEvent('error', `Guardado local.`)
  return false
}

/** Deletes a gallery item from Supabase / Vercel API */
export async function deleteGalleryItemFromVercel(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', `Eliminando foto...`)
  try {
    const res = await fetch(`${baseUrl}/api/gallery?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Foto eliminada en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Gallery Delete Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Gallery Delete Error]', sbErr)
  }

  notifySyncEvent('error', `Eliminado local.`)
  return false
}

/** Fetch latest gallery items from Vercel API / Supabase */
export async function fetchLiveGalleryFromVercel(): Promise<GalleryItem[] | null> {
  const baseUrl = getApiBaseUrl()
  let data: any[] | null = null

  try {
    const res = await fetch(`${baseUrl}/api/gallery?_t=${Date.now()}`)
    if (res.ok) {
      const parsed = await res.json()
      if (Array.isArray(parsed) && parsed.length > 0) {
        data = parsed
      }
    }
  } catch (e) {
    console.warn('[Gallery fetch from Vercel failed, trying Supabase]', e)
  }

  if (!data) {
    try {
      const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_gallery?select=*&order=sort_order.asc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      if (sbRes.ok) {
        const parsed = await sbRes.json()
        if (Array.isArray(parsed) && parsed.length > 0) {
          data = parsed
        }
      }
    } catch (sbErr) {
      console.warn('[Gallery fetch from Supabase failed]', sbErr)
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

/** Fetch latest services from Vercel API / Supabase */
export async function fetchLiveServicesFromVercel(): Promise<AdminService[] | null> {
  const baseUrl = getApiBaseUrl()
  let data: any[] | null = null

  try {
    const res = await fetch(`${baseUrl}/api/services?_t=${Date.now()}`)
    if (res.ok) {
      const parsed = await res.json()
      if (Array.isArray(parsed) && parsed.length > 0) {
        data = parsed
      }
    }
  } catch (e) {
    console.warn('[Services fetch from Vercel failed, trying Supabase]', e)
  }

  if (!data) {
    try {
      const sbRes = await fetch(`${SUPABASE_REST_URL}/studio_services?select=*&order=sort_order.asc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })
      if (sbRes.ok) {
        const parsed = await sbRes.json()
        if (Array.isArray(parsed) && parsed.length > 0) {
          data = parsed
        }
      }
    } catch (sbErr) {
      console.warn('[Services fetch from Supabase failed]', sbErr)
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
    saveServices(mapped)
    return mapped
  }
  return null
}

/** Fetch latest appointments from Vercel API / Supabase */
export async function fetchLiveAppointmentsFromVercel(): Promise<Appointment[] | null> {
  const baseUrl = getApiBaseUrl()
  let remoteList: any[] | null = null

  try {
    const res = await fetch(`${baseUrl}/api/appointments?_t=${Date.now()}`)
    if (res.ok) {
      const parsed = await res.json()
      if (Array.isArray(parsed)) {
        remoteList = parsed
      }
    }
  } catch (e) {
    console.warn('[Appointments fetch from Vercel failed, trying Supabase]', e)
  }

  if (!Array.isArray(remoteList)) {
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
      console.warn('[Appointments fetch from Supabase failed]', sbErr)
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
        preferredStyle: r.style || 'Cat Eye (Ojo de Gato)',
        preferredCurl: r.curl || 'D',
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
  const baseUrl = getApiBaseUrl()
  try {
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
    console.warn('[Appointment Sync Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Appointment Sync Error]', sbErr)
  }

  return false
}

/** Deletes an appointment from Supabase / Vercel API */
export async function deleteAppointmentFromVercel(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/appointments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      notifySyncEvent('synced', `✓ Cita eliminada en tiempo real`)
      return true
    }
  } catch (err: any) {
    console.warn('[Appointment Sync Delete Error with Vercel, trying Supabase]', err)
  }

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
    console.warn('[Supabase Appointment Delete Error]', sbErr)
  }

  return false
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

/** Fetch latest studio config from Vercel / Supabase API */
export async function fetchLiveConfigFromVercel(): Promise<StudioConfig | null> {
  const baseUrl = getApiBaseUrl()
  try {
    const res = await fetch(`${baseUrl}/api/config?_t=${Date.now()}`)
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
  const baseUrl = getApiBaseUrl()
  notifySyncEvent('syncing', 'Sincronizando ajustes del estudio con la web...')

  try {
    const res = await fetch(`${baseUrl}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (res.ok) {
      notifySyncEvent('synced', '✓ Datos del estudio sincronizados con la web')
      return true
    }
  } catch (err) {
    console.warn('[Config sync with Vercel failed, trying direct Supabase]', err)
  }

  // Direct Supabase fallback
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
      notifySyncEvent('synced', '✓ Datos del estudio sincronizados con la web')
      return true
    }
  } catch (sbErr) {
    console.warn('[Direct Supabase Config sync failed]', sbErr)
  }

  notifySyncEvent('error', '⚠️ No se pudo sincronizar la configuración con la web')
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
