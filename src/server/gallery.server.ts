export interface DbGalleryRecord {
  id: string
  key: string
  title: string
  category: string
  detail: string
  price?: string
  badge?: string
  featured: boolean
  elements: string[]
  image_url: string
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

export async function fetchGalleryFromDb(): Promise<DbGalleryRecord[]> {
  try {
    const client = await getSql()
    const rows = await client`
      SELECT id, key, title, category, detail, price, badge, featured, elements, image_url, sort_order, updated_at
      FROM studio_gallery
      ORDER BY sort_order ASC, updated_at DESC
    `
    if (!rows || rows.length === 0) {
      return fallbackGalleryPieces()
    }
    return rows.map((r: any) => ({
      id: r.id,
      key: r.key,
      title: r.title,
      category: r.category,
      detail: r.detail || '',
      price: r.price || undefined,
      badge: r.badge || undefined,
      featured: !!r.featured,
      elements: Array.isArray(r.elements) ? r.elements : typeof r.elements === 'string' ? JSON.parse(r.elements) : [],
      image_url: r.image_url,
      sort_order: r.sort_order,
      updated_at: r.updated_at,
    }))
  } catch (err) {
    console.warn('[Supabase DB] Error leyendo studio_gallery, usando datos locales:', err)
    return fallbackGalleryPieces()
  }
}

export async function saveGalleryItemToDb(item: {
  id: string
  key?: string
  title: string
  category: string
  detail?: string
  price?: string
  badge?: string
  featured?: boolean
  elements?: string[]
  url?: string
  image_url?: string
  image_data?: string
  sort_order?: number
}): Promise<{ ok: boolean; item: DbGalleryRecord }> {
  const client = await getSql()
  let key = (item.key || `custom-${Date.now()}`).replace(/[^A-Za-z0-9-]/g, '-').slice(0, 60)
  if (!key) key = `custom-${Date.now()}`
  let finalImageUrl = item.image_url || item.url || `/api/images/${key}`

  // Check if image is a base64 Data URL to store in `images` table in Supabase
  const rawData = item.image_data || item.url || ''
  if (rawData.startsWith('data:image/')) {
    try {
      const match = rawData.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
      if (match) {
        const mime = match[1]
        const buffer = Buffer.from(match[2], 'base64')
        await client`
          INSERT INTO images (key, mime, data, size, updated_at)
          VALUES (${key}, ${mime}, ${buffer}, ${buffer.length}, now())
          ON CONFLICT (key) DO UPDATE SET
            mime = EXCLUDED.mime,
            data = EXCLUDED.data,
            size = EXCLUDED.size,
            updated_at = now()
        `
        finalImageUrl = `/api/images/${key}`

        // Sube tambien a Supabase Storage bucket studio-media
        try {
          const sbUrl = process.env.SUPABASE_URL || 'https://uiohtupgtqxbzmfqkqea.supabase.co'
          const anon = process.env.SUPABASE_ANON_KEY || 'sb_publishable_EmVnt_9VUQnB2wrBt5U1LA_khOLHLCh'
          const ext = mime.includes('png') ? 'png' : mime.includes('avif') ? 'avif' : 'jpg'
          await fetch(`${sbUrl}/storage/v1/object/studio-media/${key}.${ext}`, {
            method: 'POST',
            headers: {
              apikey: anon,
              Authorization: `Bearer ${anon}`,
              'Content-Type': mime,
              'x-upsert': 'true',
            },
            body: buffer,
          }).catch(() => {})
        } catch (storageErr) {
          console.warn('Aviso guardando en Supabase Storage:', storageErr)
        }
      }
    } catch (e) {
      console.warn('Error guardando imagen binaria en Supabase:', e)
    }
  }

  const elementsJson = JSON.stringify(item.elements || [])
  const sortOrder = item.sort_order ?? 100

  await client`
    INSERT INTO studio_gallery (
      id, key, title, category, detail, price, badge, featured, elements, image_url, sort_order, updated_at
    ) VALUES (
      ${item.id}, ${key}, ${item.title}, ${item.category}, ${item.detail || ''},
      ${item.price || null}, ${item.badge || null}, ${!!item.featured},
      ${elementsJson}::jsonb, ${finalImageUrl}, ${sortOrder}, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      key = EXCLUDED.key,
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      detail = EXCLUDED.detail,
      price = EXCLUDED.price,
      badge = EXCLUDED.badge,
      featured = EXCLUDED.featured,
      elements = EXCLUDED.elements,
      image_url = EXCLUDED.image_url,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
  `

  return {
    ok: true,
    item: {
      id: item.id,
      key,
      title: item.title,
      category: item.category,
      detail: item.detail || '',
      price: item.price,
      badge: item.badge,
      featured: !!item.featured,
      elements: item.elements || [],
      image_url: finalImageUrl,
      sort_order: sortOrder,
    },
  }
}

export async function deleteGalleryItemFromDb(id: string): Promise<boolean> {
  const client = await getSql()
  await client`DELETE FROM studio_gallery WHERE id = ${id}`
  return true
}

function fallbackGalleryPieces(): DbGalleryRecord[] {
  return [
    {
      id: 'gal-01',
      key: 'pieza-04',
      title: 'Volumen 3D',
      category: 'Volumen 3D',
      detail: 'Fibras Tecnológicas y diseño anatómico de ojo',
      price: '27 €',
      badge: 'Popular',
      featured: true,
      elements: ['Curvatura D', 'Grosor 0.07', 'Fibras Tecnológicas', 'Efecto Cat Eye'],
      image_url: '/api/images/pieza-04',
      sort_order: 10,
    },
    {
      id: 'gal-02',
      key: 'pieza-01',
      title: 'Volumen 4D',
      category: 'Volumen 4D',
      detail: 'Abanicos simétricos de 4 fibras',
      price: '27 €',
      featured: false,
      elements: ['Curvatura CC', 'Grosor 0.07', 'Fibras Tecnológicas', 'Longitud 9-13 mm'],
      image_url: '/api/images/pieza-01',
      sort_order: 20,
    },
    {
      id: 'gal-03',
      key: 'pieza-02',
      title: 'Volumen 5D',
      category: 'Volumen 5D',
      detail: 'Efecto volumen medio con acento rasgado',
      price: '27 €',
      featured: false,
      elements: ['Curvatura D', 'Grosor 0.05', 'Volumen 5D', 'Efecto Ardilla'],
      image_url: '/api/images/pieza-02',
      sort_order: 30,
    },
    {
      id: 'gal-04',
      key: 'pieza-03',
      title: 'Volumen 6D',
      category: 'Volumen 6D',
      detail: 'Mirada expresiva y tupida con abanicos ultra finos',
      price: '27 €',
      featured: false,
      elements: ['Curvatura M', 'Grosor 0.05', 'Volumen 6D', 'Retención +4 semanas'],
      image_url: '/api/images/pieza-03',
      sort_order: 40,
    },
    {
      id: 'gal-05',
      key: 'pieza-05',
      title: 'Volumen Ruso',
      category: 'Volumen Ruso',
      detail: 'Densidad y negro intenso para máxima profundidad',
      price: '30 €',
      badge: 'Destacado',
      featured: false,
      elements: ['Curvatura D', 'Grosor 0.03', 'Volumen Ruso', 'Densidad Intensa'],
      image_url: '/api/images/pieza-05',
      sort_order: 50,
    },
  ]
}
