export interface DbAppointmentRecord {
  id: string
  client_name: string
  client_phone: string
  client_email?: string | null
  date: string
  time: string
  duration_minutes: number
  service_id: string | null
  service_name: string | null
  price: number
  status: string
  payment_status: string
  curl: string | null
  length: string | null
  style: string | null
  notes: string | null
  created_at?: string
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
      const client = postgres(url, {
        ssl: 'require',
        prepare: false,
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
      })

      // Ensure table and columns exist
      try {
        await client`
          CREATE TABLE IF NOT EXISTS studio_appointments (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            client_email TEXT,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration_minutes INTEGER DEFAULT 90,
            service_id TEXT,
            service_name TEXT,
            price INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pendiente',
            payment_status TEXT DEFAULT 'pendiente',
            curl TEXT,
            length TEXT,
            style TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
        await client`
          ALTER TABLE studio_appointments ADD COLUMN IF NOT EXISTS client_email TEXT
        `
        await client`
          CREATE TABLE IF NOT EXISTS studio_contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            source TEXT DEFAULT 'phone',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch (err) {
        console.warn('[Supabase DB] Table check notice:', err)
      }

      return client
    })()
  }
  return sqlPromise
}

export async function fetchAppointmentsFromDb() {
  try {
    const client = await getSql()
    const rows = await client`
      SELECT id, client_name, client_phone, client_email, date, time, duration_minutes,
             service_id, service_name, price, status, payment_status,
             curl, length, style, notes, created_at, updated_at
      FROM studio_appointments
      ORDER BY date DESC, time DESC, created_at DESC
    `
    return rows.map((r: any) => ({
      id: r.id,
      clientName: r.client_name,
      clientPhone: r.client_phone,
      clientEmail: r.client_email || undefined,
      date: r.date,
      time: r.time,
      durationMinutes: r.duration_minutes || 90,
      serviceId: r.service_id || '',
      serviceName: r.service_name || 'Servicio de Pestañas',
      price: r.price || 0,
      status: r.status || 'pendiente',
      paymentStatus: r.payment_status || 'pendiente',
      curl: r.curl || undefined,
      length: r.length || undefined,
      style: r.style || undefined,
      notes: r.notes || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error('[Supabase DB] Error leyendo studio_appointments:', err)
    return []
  }
}

export async function saveAppointmentToDb(appointment: {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date?: string
  time?: string
  durationMinutes?: number
  serviceId?: string
  serviceName?: string
  price?: number
  status?: string
  paymentStatus?: string
  curl?: string
  length?: string
  style?: string
  notes?: string
}): Promise<boolean> {
  const client = await getSql()
  const date = appointment.date || new Date().toISOString().split('T')[0]
  const time = appointment.time || '10:00'
  const durationMinutes = appointment.durationMinutes || 90
  const price = appointment.price || 0
  const status = appointment.status || 'pendiente'
  const paymentStatus = appointment.paymentStatus || 'pendiente'

  await client`
    INSERT INTO studio_appointments (
      id, client_name, client_phone, client_email, date, time, duration_minutes,
      service_id, service_name, price, status, payment_status,
      curl, length, style, notes, created_at, updated_at
    ) VALUES (
      ${appointment.id}, ${appointment.clientName}, ${appointment.clientPhone},
      ${appointment.clientEmail || null},
      ${date}, ${time}, ${durationMinutes},
      ${appointment.serviceId || null}, ${appointment.serviceName || null},
      ${price}, ${status}, ${paymentStatus},
      ${appointment.curl || null}, ${appointment.length || null},
      ${appointment.style || null}, ${appointment.notes || null},
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      client_name = EXCLUDED.client_name,
      client_phone = EXCLUDED.client_phone,
      client_email = EXCLUDED.client_email,
      date = EXCLUDED.date,
      time = EXCLUDED.time,
      duration_minutes = EXCLUDED.duration_minutes,
      service_id = EXCLUDED.service_id,
      service_name = EXCLUDED.service_name,
      price = EXCLUDED.price,
      status = EXCLUDED.status,
      payment_status = EXCLUDED.payment_status,
      curl = EXCLUDED.curl,
      length = EXCLUDED.length,
      style = EXCLUDED.style,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `
  return true
}

export async function updateAppointmentStatusInDb(
  id: string,
  patch: { status?: string; paymentStatus?: string; notes?: string }
): Promise<boolean> {
  const client = await getSql()
  if (patch.status && patch.paymentStatus) {
    await client`
      UPDATE studio_appointments
      SET status = ${patch.status}, payment_status = ${patch.paymentStatus}, updated_at = NOW()
      WHERE id = ${id}
    `
  } else if (patch.status) {
    await client`
      UPDATE studio_appointments
      SET status = ${patch.status}, updated_at = NOW()
      WHERE id = ${id}
    `
  } else if (patch.paymentStatus) {
    await client`
      UPDATE studio_appointments
      SET payment_status = ${patch.paymentStatus}, updated_at = NOW()
      WHERE id = ${id}
    `
  }
  return true
}

export async function deleteAppointmentFromDb(id: string): Promise<boolean> {
  const client = await getSql()
  await client`DELETE FROM studio_appointments WHERE id = ${id}`
  return true
}

export async function deleteClientAppointmentsFromDb(
  clientPhone: string,
  clientName?: string
): Promise<boolean> {
  const client = await getSql()
  const cleanPhone = (clientPhone || '').replace(/\D/g, '')
  if (cleanPhone.length >= 7) {
    await client`
      DELETE FROM studio_appointments
      WHERE REPLACE(REPLACE(REPLACE(client_phone, ' ', ''), '-', ''), '+', '') LIKE ${'%' + cleanPhone}
    `
  } else if (clientName && clientName.trim()) {
    await client`
      DELETE FROM studio_appointments
      WHERE LOWER(TRIM(client_name)) = ${clientName.toLowerCase().trim()}
    `
  }
  return true
}

export interface DbContactRecord {
  id: string
  name: string
  phone: string
  source?: string
  notes?: string
  createdAt?: string
}

export async function fetchContactsFromDb(): Promise<DbContactRecord[]> {
  try {
    const client = await getSql()
    const rows = await client`
      SELECT id, name, phone, source, notes, created_at
      FROM studio_contacts
      ORDER BY name ASC
    `
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      source: r.source || 'phone',
      notes: r.notes || undefined,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }))
  } catch (err) {
    console.error('[Supabase DB] Error leyendo studio_contacts:', err)
    return []
  }
}

export async function saveContactsToDb(
  contacts: Array<{ name: string; phone: string; notes?: string; source?: string }>
): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const client = await getSql()
    let savedCount = 0
    for (const c of contacts) {
      const clean = (c.phone || '').replace(/\D/g, '')
      if (!clean) continue
      const id = `cnt-${clean}`
      const name = (c.name || '').trim() || 'Sin nombre'
      const phone = (c.phone || '').trim()
      const notes = c.notes ? c.notes.trim() : null
      const source = c.source || 'phone'

      await client`
        INSERT INTO studio_contacts (id, name, phone, notes, source, updated_at)
        VALUES (${id}, ${name}, ${phone}, ${notes}, ${source}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          notes = COALESCE(EXCLUDED.notes, studio_contacts.notes),
          updated_at = NOW()
      `
      savedCount++
    }
    return { ok: true, count: savedCount }
  } catch (err: any) {
    console.error('[Supabase DB] Error guardando studio_contacts:', err)
    return { ok: false, count: 0, error: err?.message || String(err) }
  }
}

export async function deleteContactFromDb(id: string): Promise<boolean> {
  try {
    const client = await getSql()
    await client`DELETE FROM studio_contacts WHERE id = ${id}`
    return true
  } catch (err) {
    console.error('[Supabase DB] Error eliminando contacto:', err)
    return false
  }
}
