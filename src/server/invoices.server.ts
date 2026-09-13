export interface DbInvoiceRecord {
  id: string
  number: string
  date: string
  appointment_id?: string | null
  client_name: string
  client_nif?: string | null
  client_phone?: string | null
  client_email?: string | null
  items: any
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  payment_method: string
  status: string
  notes?: string | null
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

      // Ensure table and columns exist in Supabase Postgres
      try {
        await client`
          CREATE TABLE IF NOT EXISTS studio_invoices (
            id TEXT PRIMARY KEY,
            number TEXT NOT NULL,
            date TEXT NOT NULL,
            appointment_id TEXT,
            client_name TEXT NOT NULL,
            client_nif TEXT,
            client_phone TEXT,
            client_email TEXT,
            items JSONB NOT NULL DEFAULT '[]'::jsonb,
            subtotal NUMERIC NOT NULL DEFAULT 0,
            tax_rate NUMERIC NOT NULL DEFAULT 21,
            tax_amount NUMERIC NOT NULL DEFAULT 0,
            total NUMERIC NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL DEFAULT 'bizum',
            status TEXT NOT NULL DEFAULT 'cobrada',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `
      } catch (err) {
        console.warn('[Supabase DB] studio_invoices table check notice:', err)
      }

      return client
    })()
  }
  return sqlPromise
}

export async function fetchInvoicesFromDb() {
  try {
    const client = await getSql()
    const rows = await client`
      SELECT id, number, date, appointment_id, client_name, client_nif, client_phone, client_email,
             items, subtotal, tax_rate, tax_amount, total, payment_method, status, notes,
             created_at, updated_at
      FROM studio_invoices
      ORDER BY date DESC, created_at DESC
    `
    return rows.map((r: any) => ({
      id: r.id,
      number: r.number,
      date: r.date,
      appointmentId: r.appointment_id || undefined,
      clientName: r.client_name,
      clientNif: r.client_nif || undefined,
      clientPhone: r.client_phone || undefined,
      clientEmail: r.client_email || undefined,
      items: Array.isArray(r.items) ? r.items : typeof r.items === 'string' ? JSON.parse(r.items) : [],
      subtotal: Number(r.total) || Number(r.subtotal) || 0,
      taxRate: 0,
      taxAmount: 0,
      total: Number(r.total) || 0,
      paymentMethod: r.payment_method || 'bizum',
      status: r.status || 'cobrada',
      notes: r.notes || undefined,
      createdAt: r.created_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.error('[Supabase DB] Error fetching invoices:', err)
    return []
  }
}

export async function saveInvoiceToDb(invoice: any) {
  try {
    const client = await getSql()
    const itemsJson = JSON.stringify(invoice.items || [])

    await client`
      INSERT INTO studio_invoices (
        id, number, date, appointment_id, client_name, client_nif, client_phone, client_email,
        items, subtotal, tax_rate, tax_amount, total, payment_method, status, notes, updated_at
      ) VALUES (
        ${invoice.id},
        ${invoice.number},
        ${invoice.date},
        ${invoice.appointmentId || null},
        ${invoice.clientName},
        ${invoice.clientNif || null},
        ${invoice.clientPhone || null},
        ${invoice.clientEmail || null},
        ${itemsJson}::jsonb,
        ${invoice.total || invoice.subtotal || 0},
        0,
        0,
        ${invoice.total || 0},
        ${invoice.paymentMethod || 'bizum'},
        ${invoice.status || 'cobrada'},
        ${invoice.notes || null},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        number = EXCLUDED.number,
        date = EXCLUDED.date,
        appointment_id = EXCLUDED.appointment_id,
        client_name = EXCLUDED.client_name,
        client_nif = EXCLUDED.client_nif,
        client_phone = EXCLUDED.client_phone,
        client_email = EXCLUDED.client_email,
        items = EXCLUDED.items,
        subtotal = EXCLUDED.subtotal,
        tax_rate = EXCLUDED.tax_rate,
        tax_amount = EXCLUDED.tax_amount,
        total = EXCLUDED.total,
        payment_method = EXCLUDED.payment_method,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `
    return true
  } catch (err) {
    console.error('[Supabase DB] Error saving invoice:', err)
    return false
  }
}

export async function deleteInvoiceFromDb(id: string) {
  try {
    const client = await getSql()
    await client`
      DELETE FROM studio_invoices WHERE id = ${id}
    `
    return true
  } catch (err) {
    console.error('[Supabase DB] Error deleting invoice:', err)
    return false
  }
}
