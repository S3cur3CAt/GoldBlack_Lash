import { business as fallbackBusiness } from '../data/site'

export interface StudioConfigData {
  name: string
  tagline: string
  claim: string
  phoneDisplay: string
  phoneClean?: string
  email: string
  address: string
  city: string
  postalCode: string
  instagram: string
  instagramHandle: string
  mapsUrl: string
  mapsEmbed?: string
  senderEmail?: string
  hours: Array<{ days: string; time: string }>
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

// In-memory cache for ultra-fast 0ms responses
let cachedConfig: StudioConfigData | null = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minute

export async function fetchConfigFromDb(): Promise<StudioConfigData> {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiresAt) {
    return cachedConfig
  }

  try {
    const client = await getSql()
    const rows = await client`
      SELECT data, updated_at
      FROM studio_config
      WHERE id = 'main'
      LIMIT 1
    `

    if (rows && rows.length > 0 && rows[0].data) {
      const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data
      cachedConfig = {
        ...fallbackBusiness,
        ...data,
        phoneClean: data.phoneClean || (data.phoneDisplay ? data.phoneDisplay.replace(/\D/g, '') : fallbackBusiness.phoneClean),
      }
      cacheExpiresAt = now + CACHE_TTL_MS
      return cachedConfig!
    }
  } catch (err) {
    console.warn('[Supabase DB] Error leyendo studio_config, usando fallback:', err)
  }

  return fallbackBusiness as unknown as StudioConfigData
}

export async function saveConfigToDb(config: Partial<StudioConfigData>): Promise<StudioConfigData> {
  const client = await getSql()
  const current = await fetchConfigFromDb()

  const cleanPhone = config.phoneClean || (config.phoneDisplay ? config.phoneDisplay.replace(/\D/g, '') : current.phoneClean)

  const updated: StudioConfigData = {
    ...current,
    ...config,
    phoneClean: cleanPhone,
  }

  await client`
    INSERT INTO studio_config (id, data, updated_at)
    VALUES ('main', ${client.json(updated)}, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = ${client.json(updated)},
        updated_at = NOW()
  `

  cachedConfig = updated
  cacheExpiresAt = Date.now() + CACHE_TTL_MS
  return updated
}
