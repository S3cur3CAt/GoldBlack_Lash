import { serviceCategories as fallbackCategories, type ServiceCategory } from '../data/site'

export interface DbServiceRecord {
  id: string
  category_id: string
  category_name: string
  name: string
  badge: string | null
  description: string
  duration: string
  price: string
  price_number: number
  featured: boolean
  pinnedFirst?: boolean
  active: boolean
  includes: string[]
  sort_order?: number
  updated_at?: string
}

let sqlPromise: Promise<any> | null = null

async function getSql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const url =
        process.env.DATABASE_URL ||
        'postgresql://postgres.uiohtupgtqxbzmfqkqea:7AqofDWnZplmMkFq@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require'
      const { default: postgres } = await import('postgres')
      return postgres(url, {
        ssl: 'require',
        prepare: false,
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
      })
    })()
  }
  return sqlPromise
}

export function parseIncludes(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === 'string' ? x.trim() : String(x || '').trim()))
      .filter((x) => x.length > 0)
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return parseIncludes(parsed)
    } catch {
      return [trimmed]
    }
  }
  return []
}

export async function fetchServicesFromDb(): Promise<DbServiceRecord[]> {
  try {
    const client = await getSql()
    const rows = await client`
      SELECT id, category_id, category_name, name, badge, description, duration, price, price_number, featured, active, includes, sort_order, updated_at
      FROM studio_services
      ORDER BY sort_order ASC, id ASC
    `
    if (!rows || rows.length === 0) {
      return fallbackFlatServices()
    }
    return rows.map((r: any) => ({
      id: r.id,
      category_id: r.category_id,
      category_name: r.category_name,
      name: r.name,
      badge: r.badge,
      description: r.description,
      duration: r.duration,
      price: r.price,
      price_number: r.price_number,
      featured: r.featured,
      pinnedFirst: r.sort_order === 0,
      active: r.active,
      includes: parseIncludes(r.includes),
      updated_at: r.updated_at,
    }))
  } catch (err) {
    console.warn('[Supabase DB] Error leyendo studio_services, usando datos locales:', err)
    return fallbackFlatServices()
  }
}

export async function saveServiceToDb(service: {
  id: string
  categoryId: string
  categoryName: string
  name: string
  badge?: string
  description: string
  duration: string
  price: string
  priceNumber?: number
  featured?: boolean
  pinnedFirst?: boolean
  active?: boolean
  includes?: string[]
}): Promise<boolean> {
  const client = await getSql()
  const priceNum = service.priceNumber ?? (parseInt(service.price.replace(/\D/g, ''), 10) || 0)
  const cleanIncludes = parseIncludes(service.includes)
  const includesJson = JSON.stringify(cleanIncludes)
  const sortOrder = service.pinnedFirst ? 0 : 100

  if (service.pinnedFirst) {
    try {
      await client`UPDATE studio_services SET sort_order = 100 WHERE sort_order <= 0 AND id != ${service.id}`
    } catch (err) {
      console.warn('Could not reset sort_order on existing records:', err)
    }
  }

  await client`
    INSERT INTO studio_services (
      id, category_id, category_name, name, badge, description, duration, price, price_number, featured, active, includes, sort_order, updated_at
    ) VALUES (
      ${service.id}, ${service.categoryId}, ${service.categoryName}, ${service.name},
      ${service.badge || null}, ${service.description}, ${service.duration},
      ${service.price}, ${priceNum}, ${!!service.featured}, ${service.active !== false},
      ${includesJson}::jsonb, ${sortOrder}, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      category_id = EXCLUDED.category_id,
      category_name = EXCLUDED.category_name,
      name = EXCLUDED.name,
      badge = EXCLUDED.badge,
      description = EXCLUDED.description,
      duration = EXCLUDED.duration,
      price = EXCLUDED.price,
      price_number = EXCLUDED.price_number,
      featured = EXCLUDED.featured,
      active = EXCLUDED.active,
      includes = EXCLUDED.includes,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
  `
  return true
}

export async function deleteServiceFromDb(id: string): Promise<boolean> {
  const client = await getSql()
  await client`DELETE FROM studio_services WHERE id = ${id}`
  return true
}

function fallbackFlatServices(): DbServiceRecord[] {
  const res: DbServiceRecord[] = []
  for (const cat of fallbackCategories) {
    for (const s of cat.services) {
      res.push({
        id: s.id,
        category_id: cat.id,
        category_name: cat.name,
        name: s.name,
        badge: s.badge || null,
        description: s.description,
        duration: s.duration,
        price: s.price,
        price_number: parseInt(s.price.replace(/\D/g, ''), 10) || 0,
        featured: !!s.featured,
        active: true,
        includes: s.includes || [],
      })
    }
  }
  return res
}

export function groupServicesByCategory(services: DbServiceRecord[]): ServiceCategory[] {
  const map = new Map<string, ServiceCategory>()

  for (const s of services) {
    if (!s.active) continue
    let cat = map.get(s.category_id)
    if (!cat) {
      // Find blurb from fallback if exists
      const fb = fallbackCategories.find((c) => c.id === s.category_id)
      cat = {
        id: s.category_id,
        name: s.category_name,
        blurb: fb ? fb.blurb : `Tratamientos de ${s.category_name.toLowerCase()}.`,
        services: [],
      }
      map.set(s.category_id, cat)
    }

    cat.services.push({
      id: s.id,
      name: s.name,
      badge: s.badge || undefined,
      description: s.description,
      duration: s.duration,
      price: s.price,
      featured: s.featured,
      includes: parseIncludes(s.includes),
    })
  }

  return Array.from(map.values())
}
