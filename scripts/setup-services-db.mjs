import postgres from 'postgres'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serviceCategories } from '../src/data/site.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Mini-parser .env
const env = {}
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m || line.trim().startsWith('#')) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[m[1]] = v
  }
}

const url = process.env.DATABASE_URL || env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL en .env')
  process.exit(1)
}

const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 10 })

console.log('1. Creando tabla studio_services en Neon Postgres...')
await sql`
  CREATE TABLE IF NOT EXISTS studio_services (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    name TEXT NOT NULL,
    badge TEXT,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    price TEXT NOT NULL,
    price_number INT NOT NULL,
    featured BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    includes JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`

console.log('2. Comprobando registros iniciales...')
const existing = await sql`SELECT count(*)::int as c FROM studio_services`
if (existing[0].c === 0) {
  console.log('Sembrando servicios desde src/data/site.ts...')
  let order = 0
  for (const cat of serviceCategories) {
    for (const s of cat.services) {
      const priceNum = parseInt(s.price.replace(/\D/g, ''), 10) || 0
      await sql`
        INSERT INTO studio_services (
          id, category_id, category_name, name, badge, description, duration, price, price_number, featured, active, includes, sort_order, updated_at
        ) VALUES (
          ${s.id}, ${cat.id}, ${cat.name}, ${s.name}, ${s.badge || null}, ${s.description}, ${s.duration}, ${s.price}, ${priceNum}, ${!!s.featured}, true, ${sql.json(s.includes || [])}, ${order++}, now()
        )
      `
      console.log(`✓ Insertado servicio: ${s.name} (${s.price})`)
    }
  }
} else {
  console.log(`La tabla ya contiene ${existing[0].c} servicios.`)
}

console.log('✓ Configuración de base de datos completada con éxito.')
await sql.end()
