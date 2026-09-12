export interface DbAppointmentRecord {
  id: string
  client_name: string
  client_phone: string
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
        'postgresql://neondb_owner:npg_XQEK4VPqy2SB@ep-fragrant-wind-ai0f37ej-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
      const { default: postgres } = await import('postgres')
      const client = postgres(url, {
        ssl: 'require',
        prepare: false,
        max: 3,
        idle_timeout: 20,
        connect_timeout: 10,
      })

      // Ensure table exists
      try {
        await client`
          CREATE TABLE IF NOT EXISTS studio_appointments (
            id TEXT PRIMARY KEY,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
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
      } catch (err) {
        console.warn('[Neon DB] Table check notice:', err)
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
      SELECT id, client_name, client_phone, date, time, duration_minutes,
             service_id, service_name, price, status, payment_status,
             curl, length, style, notes, created_at, updated_at
      FROM studio_appointments
      ORDER BY date DESC, time DESC, created_at DESC
    `
    return rows.map((r: any) => ({
      id: r.id,
      clientName: r.client_name,
      clientPhone: r.client_phone,
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
    console.error('[Neon DB] Error leyendo studio_appointments:', err)
    return []
  }
}

export async function saveAppointmentToDb(appointment: {
  id: string
  clientName: string
  clientPhone: string
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
      id, client_name, client_phone, date, time, duration_minutes,
      service_id, service_name, price, status, payment_status,
      curl, length, style, notes, created_at, updated_at
    ) VALUES (
      ${appointment.id}, ${appointment.clientName}, ${appointment.clientPhone},
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

export async function deleteAppointmentFromDb(id: string): Promise<boolean> {
  const client = await getSql()
  await client`DELETE FROM studio_appointments WHERE id = ${id}`
  return true
}
