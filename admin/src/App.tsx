import React, { useState, useEffect, useRef } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar, TabId, DEFAULT_SIDEBAR_ORDER } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Appointments } from './components/Appointments'
import { Services } from './components/Services'
import { Clients } from './components/Clients'
import { GalleryManager } from './components/GalleryManager'
import { Billing } from './components/Billing'
import { Settings } from './components/Settings'
import { VoiceAssistantWidget } from './components/VoiceAssistantWidget'
import {
  VoiceActionHandlers,
  announceNewAppointmentVoice,
} from './services/voiceAssistant'
import { useUpdaterContext } from './context/UpdaterContext'

import {
  Appointment,
  Client,
  AdminService,
  StudioConfig,
  GalleryItem,
  AppointmentStatus,
  PaymentStatus,
  PaymentMethod,
  Invoice,
} from './types/admin'

import {
  getAppointments,
  saveAppointments,
  getClients,
  saveClients,
  getServices,
  saveServices,
  getStudioConfig,
  saveStudioConfig,
  getGalleryItems,
  saveGalleryItems,
  getInvoices,
  saveInvoices,
  syncServiceWithVercel,
  deleteServiceFromVercel,
  fetchLiveServicesFromVercel,
  syncGalleryItemWithVercel,
  deleteGalleryItemFromVercel,
  fetchLiveGalleryFromVercel,
  fetchLiveAppointmentsFromVercel,
  syncAppointmentWithVercel,
  deleteAppointmentFromVercel,
  fetchLiveInvoicesFromVercel,
  syncInvoiceWithVercel,
  deleteInvoiceFromVercel,
  sendInvoiceEmail,
  syncStudioConfigWithVercel,
} from './services/storage'

/**
 * Synthesizes a luxury studio notification chime using the Web Audio API.
 * High clarity, zero latency, guaranteed to work across macOS, Windows, and browsers.
 */
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    const playTone = (freq: number, start: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration)
    }

    // High clarity 3-tone ascending chord: D5 (587Hz) -> A5 (880Hz) -> D6 (1174Hz)
    playTone(587.33, now, 0.5, 0.28)
    playTone(880.0, now + 0.12, 0.7, 0.32)
    playTone(1174.66, now + 0.24, 0.95, 0.24)

    setTimeout(() => {
      try {
        ctx.close()
      } catch {}
    }, 1500)
  } catch (err) {
    console.warn('[Audio Chime Error]', err)
  }
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<AdminService[]>([])
  const [config, setConfig] = useState<StudioConfig>(getStudioConfig())
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  // Modal controls for item creation/editing across the app
  const [isAptModalOpen, setIsAptModalOpen] = useState(false)
  const [editingApt, setEditingApt] = useState<Appointment | null>(null)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const { checkUpdates } = useUpdaterContext()
  const [syncToast, setSyncToast] = useState<{ status: string; message: string } | null>(null)

  // Sidebar reorder state - persistido en localStorage para personalización del orden del menú
  const [sidebarOrder, setSidebarOrder] = useState<TabId[]>(() => {
    try {
      const stored = localStorage.getItem('goldblack_sidebar_order')
      if (stored) {
        const parsed = JSON.parse(stored) as TabId[]
        // Merge: asegura que todos los tabs existan y filtra ids obsoletos
        const valid = new Set(DEFAULT_SIDEBAR_ORDER)
        const filtered = parsed.filter((id) => valid.has(id))
        const missing = DEFAULT_SIDEBAR_ORDER.filter((id) => !filtered.includes(id))
        const merged = [...filtered, ...missing]
        if (merged.length === DEFAULT_SIDEBAR_ORDER.length) return merged
      }
    } catch {}
    return [...DEFAULT_SIDEBAR_ORDER]
  })
  const [isReorderMode, setIsReorderMode] = useState(false)

  const handleReorderSidebar = (newOrder: TabId[]) => {
    setSidebarOrder(newOrder)
    try {
      localStorage.setItem('goldblack_sidebar_order', JSON.stringify(newOrder))
    } catch {}
  }

  const handleResetSidebarOrder = () => {
    const reset = [...DEFAULT_SIDEBAR_ORDER]
    setSidebarOrder(reset)
    try {
      localStorage.setItem('goldblack_sidebar_order', JSON.stringify(reset))
    } catch {}
  }

  // Track IDs of appointments viewed by the user
  const [viewedAptIds, setViewedAptIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('goldblack_viewed_appointment_ids')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  // Ref to track IDs of all appointments known so far (to detect new incoming ones)
  const knownAptIdsRef = useRef<Set<string> | null>(null)
  const isInitialSyncRef = useRef<boolean>(true)

  // Ref to track latest studio config in intervals and closures
  const configRef = useRef<StudioConfig>(config)
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Load state on mount
  const refreshAll = () => {
    const apts = getAppointments()
    setAppointments(apts)
    setClients(getClients())
    setServices(getServices())
    setConfig(getStudioConfig())
    setGallery(getGalleryItems())
    setInvoices(getInvoices())

    // If local storage has no record of viewed IDs yet, initialize with current IDs
    // so historical appointments don't show as newly unread
    if (!localStorage.getItem('goldblack_viewed_appointment_ids') && apts.length > 0) {
      const ids = new Set(apts.map((a) => a.id))
      setViewedAptIds(ids)
      try {
        localStorage.setItem('goldblack_viewed_appointment_ids', JSON.stringify(Array.from(ids)))
      } catch {}
    }
    if (!knownAptIdsRef.current) {
      knownAptIdsRef.current = new Set(apts.map((a) => a.id))
    }
  }

  // Clear unread counter when clicking Agenda & Citas
  const markAppointmentsAsViewed = () => {
    const allIds = new Set(appointments.map((a) => a.id))
    setViewedAptIds(allIds)
    try {
      localStorage.setItem('goldblack_viewed_appointment_ids', JSON.stringify(Array.from(allIds)))
    } catch {}
  }

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab)
    if (tab === 'appointments') {
      markAppointmentsAsViewed()
    }
  }

  useEffect(() => {
    refreshAll()

    // Sync appointments immediately and regularly
    const syncAppointments = () => {
      fetchLiveAppointmentsFromVercel()
        .then((liveApts) => {
          if (liveApts) {
            // Guarantee test appointments are completely ignored
            const realApts = liveApts.filter((a) => {
              const id = (a.id || '').toLowerCase()
              const name = (a.clientName || '').toLowerCase()
              return !id.startsWith('test-') && !name.includes('test') && !name.includes('prueba')
            })

            // Check for new real-time appointments
            if (knownAptIdsRef.current && !isInitialSyncRef.current) {
              const newApts = realApts.filter((a) => !knownAptIdsRef.current!.has(a.id))
              if (newApts.length > 0) {
                // Play luxury notification chime
                playNotificationChime()

                // Announce new web booking with intelligent natural female voice
                const currentConfig = configRef.current
                if (currentConfig.voiceAnnounceNewAppointments ?? true) {
                  const newestApt = newApts[0]
                  setTimeout(() => {
                    announceNewAppointmentVoice(
                      {
                        clientName: newestApt.clientName,
                        serviceName: newestApt.serviceName,
                        clientPhone: newestApt.clientPhone,
                        date: newestApt.date,
                        time: newestApt.time,
                      },
                      currentConfig.geminiApiKey
                    )
                  }, 650)
                }

                // Trigger visual notifications (Electron native macOS / Win + web fallback)
                for (const apt of newApts) {
                  const title = '✨ ¡Nueva Cita Recibida!'
                  const body = `${apt.clientName} — ${apt.serviceName} (${apt.clientPhone})`

                  if ((window as any).electronAPI?.notifyNewAppointment) {
                    (window as any).electronAPI.notifyNewAppointment({ title, body })
                  } else if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                      new Notification(title, { body })
                    } else if (Notification.permission !== 'denied') {
                      Notification.requestPermission().then((perm) => {
                        if (perm === 'granted') new Notification(title, { body })
                      })
                    }
                  }

                  // Floating toast
                  setSyncToast({
                    status: 'synced',
                    message: `🔔 ¡Nueva cita en tiempo real: ${apt.clientName} (${apt.serviceName})!`,
                  })
                }

                // If currently viewing appointments tab, mark as viewed right away
                if (activeTab === 'appointments') {
                  const updatedViewed = new Set(realApts.map((a) => a.id))
                  setViewedAptIds(updatedViewed)
                  try {
                    localStorage.setItem('goldblack_viewed_appointment_ids', JSON.stringify(Array.from(updatedViewed)))
                  } catch {}
                }
              }
            }

            isInitialSyncRef.current = false
            knownAptIdsRef.current = new Set(realApts.map((a) => a.id))
            setAppointments(realApts)
            setClients(getClients())
          }
        })
        .catch(() => {})
    }

    // Initial sync
    syncAppointments()

    // Regular polling for online web bookings (every 5 seconds)
    const aptPolling = setInterval(syncAppointments, 5000)

    // Sync on window focus (e.g. user returns to admin app)
    window.addEventListener('focus', syncAppointments)

    // Listen for tab navigation from native notification click
    const cleanupNavigate = (window as any).electronAPI?.onNavigateTab?.((tab: string) => {
      if (tab === 'appointments') {
        handleSelectTab('appointments')
      } else {
        setActiveTab(tab as TabId)
      }
    })

    // Defer services and gallery network sync to let UI render first (faster perceived startup)
    const deferTimer = setTimeout(() => {
      // Fetch live services with 3s timeout so slow network doesn't block the app
      const servicesController = new AbortController()
      const servicesTimeout = setTimeout(() => servicesController.abort(), 3000)
      fetchLiveServicesFromVercel()
        .then((live) => {
          clearTimeout(servicesTimeout)
          if (live && live.length > 0) {
            setServices(live)
          }
        })
        .catch(() => {
          clearTimeout(servicesTimeout)
        })

      // Fetch live gallery with 3s timeout
      const galleryController = new AbortController()
      const galleryTimeout = setTimeout(() => galleryController.abort(), 3000)
      fetchLiveGalleryFromVercel()
        .then((live) => {
          clearTimeout(galleryTimeout)
          if (live && live.length > 0) {
            setGallery(live)
          }
        })
        .catch(() => {
          clearTimeout(galleryTimeout)
        })

      // Fetch live invoices from Supabase with 3s timeout
      const invoicesController = new AbortController()
      const invoicesTimeout = setTimeout(() => invoicesController.abort(), 3000)
      fetchLiveInvoicesFromVercel()
        .then((live) => {
          clearTimeout(invoicesTimeout)
          if (live && Array.isArray(live)) {
            setInvoices(live)
          }
        })
        .catch(() => {
          clearTimeout(invoicesTimeout)
        })
    }, 1500)

    const handleSync = (e: any) => {
      if (e.detail) {
        setSyncToast(e.detail)
        setTimeout(() => setSyncToast(null), 4500)
      }
    }
    window.addEventListener('goldblack:sync', handleSync)
    return () => {
      clearTimeout(deferTimer)
      clearInterval(aptPolling)
      cleanupNavigate?.()
      window.removeEventListener('focus', syncAppointments)
      window.removeEventListener('goldblack:sync', handleSync)
    }
  }, [])

  // Appointment Actions - Synchronized with Supabase Postgres & Vercel API
  const handleSaveAppointment = (apt: Appointment) => {
    const existingIndex = appointments.findIndex((a) => a.id === apt.id)
    let updated: Appointment[]
    if (existingIndex >= 0) {
      updated = [...appointments]
      updated[existingIndex] = apt
    } else {
      updated = [apt, ...appointments]
      // Also register or update client in clients list if not present
      const clientExists = clients.some((c) => c.phone === apt.clientPhone)
      if (!clientExists) {
        const newClient: Client = {
          id: `cli-${Date.now()}`,
          name: apt.clientName,
          phone: apt.clientPhone,
          allergies: 'Ninguna conocida',
          preferredStyle: (apt.style as any) || 'Cat Eye (Ojo de Gato)',
          preferredCurl: (apt.curl === 'C' || apt.curl === 'M') ? apt.curl : 'D',
          totalVisits: 1,
          totalSpent: apt.price,
          lastVisitDate: apt.date,
          notes: apt.notes,
          createdAt: apt.date,
        }
        const updatedClients = [newClient, ...clients]
        setClients(updatedClients)
        saveClients(updatedClients)
      }
    }
    setAppointments(updated)
    saveAppointments(updated)
    syncAppointmentWithVercel(apt)

    // Mark locally created appointment as viewed and known
    setViewedAptIds((prev) => {
      const next = new Set(prev)
      next.add(apt.id)
      try {
        localStorage.setItem('goldblack_viewed_appointment_ids', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
    if (knownAptIdsRef.current) {
      knownAptIdsRef.current.add(apt.id)
    }
  }

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id)
    setAppointments(updated)
    saveAppointments(updated)
    deleteAppointmentFromVercel(id)
  }

  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    const targetApt = appointments.find((a) => a.id === id)
    const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a))
    setAppointments(updated)
    saveAppointments(updated)
    if (targetApt) {
      syncAppointmentWithVercel({ ...targetApt, status })
    }
  }

  const handleUpdatePayment = (id: string, paymentStatus: PaymentStatus) => {
    const targetApt = appointments.find((a) => a.id === id)
    const updated = appointments.map((a) => (a.id === id ? { ...a, paymentStatus } : a))
    setAppointments(updated)
    saveAppointments(updated)
    if (targetApt) {
      syncAppointmentWithVercel({ ...targetApt, paymentStatus })
    }
  }

  // Service Actions - Synchronized in real time with Vercel & Supabase Postgres
  const handleSaveService = async (service: AdminService) => {
    let updated: AdminService[]
    if (service.pinnedFirst) {
      // Put at the very beginning of the whole page
      const withoutCurrent = services.filter((s) => s.id !== service.id)
      const unpinnedOthers = withoutCurrent.map((s) => ({ ...s, pinnedFirst: false }))
      updated = [service, ...unpinnedOthers]
    } else {
      const existingIndex = services.findIndex((s) => s.id === service.id)
      if (existingIndex >= 0) {
        updated = [...services]
        updated[existingIndex] = service
      } else {
        updated = [...services, service]
      }
    }
    setServices(updated)
    saveServices(updated)
    // Send in real time to Vercel API & Supabase Postgres
    await syncServiceWithVercel(service)
  }

  const handleDeleteService = async (id: string) => {
    const updated = services.filter((s) => s.id !== id)
    setServices(updated)
    saveServices(updated)
    // Delete in real time from Vercel API & Supabase Postgres
    await deleteServiceFromVercel(id)
  }

  // Client Actions
  const handleSaveClient = (client: Client) => {
    const existingIndex = clients.findIndex((c) => c.id === client.id)
    let updated: Client[]
    if (existingIndex >= 0) {
      updated = [...clients]
      updated[existingIndex] = client
    } else {
      updated = [client, ...clients]
    }
    setClients(updated)
    saveClients(updated)
  }

  const handleDeleteClient = (id: string) => {
    const updated = clients.filter((c) => c.id !== id)
    setClients(updated)
    saveClients(updated)
  }

  // Gallery Actions - Synchronized in real time with Vercel & Supabase Postgres
  const handleSaveGalleryItem = async (item: GalleryItem) => {
    const existingIndex = gallery.findIndex((g) => g.id === item.id)
    let updated: GalleryItem[]
    if (existingIndex >= 0) {
      updated = [...gallery]
      updated[existingIndex] = item
    } else {
      updated = [item, ...gallery]
    }
    setGallery(updated)
    saveGalleryItems(updated)

    // Sync to Vercel API & Supabase Postgres
    const ok = await syncGalleryItemWithVercel(item)
    if (ok && item.url) {
      // Update with the remote image url if converted
      const reIndexed = updated.map((g) => (g.id === item.id ? { ...g, url: item.url } : g))
      setGallery(reIndexed)
      saveGalleryItems(reIndexed)
    }
  }

  const handleDeleteGalleryItem = async (id: string) => {
    const updated = gallery.filter((g) => g.id !== id)
    setGallery(updated)
    saveGalleryItems(updated)
    await deleteGalleryItemFromVercel(id)
  }

  // Invoices Actions - Synchronized with Supabase Postgres & Vercel API
  const handleSaveInvoice = async (invoice: Invoice) => {
    const existingIndex = invoices.findIndex((i) => i.id === invoice.id)
    let updated: Invoice[]
    if (existingIndex >= 0) {
      updated = [...invoices]
      updated[existingIndex] = invoice
    } else {
      updated = [invoice, ...invoices]
    }
    setInvoices(updated)
    saveInvoices(updated)
    await syncInvoiceWithVercel(invoice)
  }

  const handleDeleteInvoice = async (id: string) => {
    const updated = invoices.filter((i) => i.id !== id)
    setInvoices(updated)
    saveInvoices(updated)
    await deleteInvoiceFromVercel(id)
  }

  // Intelligent Service Finalization & Automatic Invoicing to Facturación & Caja
  const handleFinalizeService = async (
    apt: Appointment,
    options: {
      paymentMethod: PaymentMethod
      clientEmail?: string
      clientNif?: string
      sendEmail?: boolean
      customNotes?: string
    }
  ): Promise<Invoice | null> => {
    // 1. Mark appointment as completed & paid
    const updatedApt: Appointment = {
      ...apt,
      status: 'completada',
      paymentStatus: 'pagado',
    }
    const aptIndex = appointments.findIndex((a) => a.id === apt.id)
    let updatedApts: Appointment[]
    if (aptIndex >= 0) {
      updatedApts = [...appointments]
      updatedApts[aptIndex] = updatedApt
    } else {
      updatedApts = [updatedApt, ...appointments]
    }
    setAppointments(updatedApts)
    saveAppointments(updatedApts)
    syncAppointmentWithVercel(updatedApt)

    // 2. Generate sequential invoice number (e.g., 2026-001)
    const now = new Date()
    const year = now.getFullYear()
    const yearPrefix = `${year}-`
    const yearInvoices = invoices.filter((i) => i.number && i.number.startsWith(yearPrefix))
    const nextSeq = yearInvoices.length + 1
    const invoiceNumber = `${year}-${String(nextSeq).padStart(3, '0')}`

    // 3. Calculation: Sin IVA (0%)
    const total = Number(apt.price) || 0
    const subtotal = total
    const taxAmount = 0

    const newInvoice: Invoice = {
      id: `fac-${Date.now()}`,
      number: invoiceNumber,
      date: apt.date || now.toISOString().split('T')[0],
      appointmentId: apt.id,
      clientName: apt.clientName,
      clientNif: options.clientNif || undefined,
      clientPhone: apt.clientPhone || undefined,
      clientEmail: options.clientEmail || apt.clientEmail || undefined,
      items: [
        {
          description: apt.serviceName || 'Tratamiento de Pestañas',
          quantity: 1,
          unitPrice: total,
          total: total,
        },
      ],
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      total,
      paymentMethod: options.paymentMethod || 'bizum',
      status: 'cobrada',
      notes: options.customNotes || `Servicio completado en estudio (${apt.date} ${apt.time})`,
      createdAt: now.toISOString(),
    }

    // 4. Save Invoice to state, localStorage & Supabase Postgres
    const updatedInvoices = [newInvoice, ...invoices]
    setInvoices(updatedInvoices)
    saveInvoices(updatedInvoices)
    await syncInvoiceWithVercel(newInvoice)

    // 5. Update client stats (visits, spent, lastVisitDate)
    const existingClient = clients.find(
      (c) =>
        (apt.clientPhone && c.phone === apt.clientPhone) ||
        c.name.toLowerCase() === apt.clientName.toLowerCase()
    )
    if (existingClient) {
      const updatedClients = clients.map((c) =>
        c.id === existingClient.id
          ? {
              ...c,
              totalVisits: (c.totalVisits || 0) + 1,
              totalSpent: Number(((c.totalSpent || 0) + total).toFixed(2)),
              lastVisitDate: apt.date || now.toISOString().split('T')[0],
              email: options.clientEmail || c.email || apt.clientEmail,
              nif: options.clientNif || c.nif,
            }
          : c
      )
      setClients(updatedClients)
      saveClients(updatedClients)
    }

    // 6. Play celebratory notification chime
    playNotificationChime()

    // 7. Send invoice email via Resend if option checked
    if (options.sendEmail && (options.clientEmail || apt.clientEmail)) {
      const targetEmail = (options.clientEmail || apt.clientEmail)!.trim()
      try {
        await sendInvoiceEmail(
          newInvoice,
          config,
          targetEmail,
          `Hola ${apt.clientName},\n\nTe adjuntamos el recibo oficial y desglose de tu servicio en ${config.name}.\n¡Muchas gracias por tu visita!`
        )
      } catch (err) {
        console.warn('[Error sending automatic invoice email]:', err)
      }
    }

    // 8. Visual toast
    setSyncToast({
      status: 'synced',
      message: `✓ Servicio finalizado y Factura ${newInvoice.number} registrada en Caja (${total.toFixed(2)} €)`,
    })

    return newInvoice
  }

  // Config Action — saves locally and syncs to Supabase so the live website reflects changes immediately
  const handleSaveConfig = async (newConfig: StudioConfig) => {
    setConfig(newConfig)
    saveStudioConfig(newConfig)
    await syncStudioConfigWithVercel(newConfig)
  }

  // Unseen appointments count: appointments the user hasn't viewed yet in Agenda & Citas
  // The badge appears when a new booking arrives and disappears when the user clicks 'Agenda & Citas'
  const unseenCount = appointments.filter((a) => !viewedAptIds.has(a.id)).length

  // Recall count (clients with > 20 days since last visit)
  const nowMs = Date.now()
  const recallCount = clients.filter((c) => {
    if (!c.lastVisitDate) return false
    const diff = (nowMs - new Date(c.lastVisitDate).getTime()) / 86400000
    return diff >= 20
  }).length

  // Navigation Title Mapping
  const tabTitles: Record<TabId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Panel General',
      subtitle: 'Métricas, ocupación y resumen de actividad diaria',
    },
    appointments: {
      title: 'Gestor de Citas & Agenda',
      subtitle: 'Control de reservas, fichas técnicas y envíos por correo corporativo',
    },
    services: {
      title: 'Catálogo de Servicios y Precios',
      subtitle: 'Tarifas de extensiones de pestañas, retirada y limpieza facial profunda',
    },
    clients: {
      title: 'Ficha y Base de Clientas',
      subtitle: 'Fichas personales, historial de visitas y alertas de mantenimiento',
    },
    gallery: {
      title: 'Galería y Trabajos del Estudio',
      subtitle: 'Fotografías del catálogo y antes / después',
    },
    billing: {
      title: 'Facturación & Control de Caja',
      subtitle: 'Facturas oficiales, registro de cobros, TPV/Bizum/Efectivo y balance de caja',
    },
    settings: {
      title: 'Ajustes del Estudio',
      subtitle: 'Datos de contacto, horarios y copias de seguridad',
    },
  }

  const activeInfo = tabTitles[activeTab]

  const getHeaderAction = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'appointments':
        return {
          actionLabel: 'Nueva Cita',
          onAction: () => {
            setEditingApt(null)
            if (activeTab !== 'appointments') handleSelectTab('appointments')
            setIsAptModalOpen(true)
          },
        }
      case 'services':
        return {
          actionLabel: 'Añadir Servicio',
          onAction: () => setIsServiceModalOpen(true),
        }
      case 'clients':
        return {
          actionLabel: 'Nueva Clienta',
          onAction: () => setIsClientModalOpen(true),
        }
      case 'gallery':
        return {
          actionLabel: 'Subir Fotografía',
          onAction: () => setIsGalleryModalOpen(true),
        }
      case 'billing':
        return {
          actionLabel: 'Emitir Factura',
          onAction: () => setIsBillingModalOpen(true),
        }
      case 'settings':
      default:
        return {
          actionLabel: null,
          onAction: undefined,
        }
    }
  }

  const headerAction = getHeaderAction()

  // Voice Assistant Action Handlers for Hands-Free Control
  const voiceHandlers: VoiceActionHandlers = {
    onNavigateTab: (tab: string) => {
      const validTabs: TabId[] = [
        'dashboard',
        'appointments',
        'services',
        'clients',
        'gallery',
        'billing',
        'settings',
      ]
      if (validTabs.includes(tab as TabId)) {
        handleSelectTab(tab as TabId)
      }
    },

    onQueryAgenda: async (dateStr?: string, statusFilter?: string) => {
      let targetDate = new Date().toISOString().split('T')[0]
      if (dateStr) {
        if (dateStr.toLowerCase() === 'tomorrow' || dateStr.toLowerCase() === 'mañana') {
          const tom = new Date()
          tom.setDate(tom.getDate() + 1)
          targetDate = tom.toISOString().split('T')[0]
        } else if (dateStr.toLowerCase() !== 'today' && dateStr.toLowerCase() !== 'hoy') {
          targetDate = dateStr
        }
      }

      const dayApts = appointments.filter((a) => a.date === targetDate)
      const filtered =
        statusFilter && statusFilter !== 'todas'
          ? dayApts.filter((a) => a.status === statusFilter)
          : dayApts

      if (filtered.length === 0) {
        return `No tienes citas programadas para el ${targetDate}.`
      }

      const listStr = filtered
        .map((a) => `${a.time} con ${a.clientName} (${a.serviceName})`)
        .join(', ')
      return `Para el ${targetDate} tienes ${filtered.length} cita${filtered.length > 1 ? 's' : ''}: ${listStr}.`
    },

    onCreateAppointment: async (params) => {
      const { clientName, serviceName, date, time, phone, notes } = params
      const effectiveDate = date || new Date().toISOString().split('T')[0]
      const effectiveTime = time || '11:00'

      const matchedService = serviceName
        ? services.find((s) => s.name.toLowerCase().includes(serviceName.toLowerCase()))
        : services[0]

      const serviceToUse = matchedService || services[0] || {
        id: 'serv-default',
        name: serviceName || 'Servicio de Pestañas',
        priceNumber: 50,
      }

      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        clientName: clientName,
        clientPhone: phone || '600000000',
        date: effectiveDate,
        time: effectiveTime,
        durationMinutes: 90,
        serviceId: serviceToUse.id,
        serviceName: serviceToUse.name,
        price: serviceToUse.priceNumber || 50,
        status: 'confirmada',
        paymentStatus: 'pendiente',
        notes: notes || 'Agendada por asistente de voz',
        createdAt: new Date().toISOString(),
      }

      handleSaveAppointment(newApt)
      return `Cita agendada para ${clientName} el ${effectiveDate} a las ${effectiveTime} para ${serviceToUse.name}.`
    },

    onUpdateAppointment: async (params) => {
      const { clientName, appointmentId, status, paymentStatus } = params
      const targetApt = appointments.find(
        (a) =>
          (appointmentId && a.id === appointmentId) ||
          (clientName && a.clientName.toLowerCase().includes(clientName.toLowerCase()))
      )

      if (!targetApt) {
        return `No encontré ninguna cita registrada para ${clientName || appointmentId}.`
      }

      const updatedApt: Appointment = {
        ...targetApt,
        status: (status as AppointmentStatus) || targetApt.status,
        paymentStatus: (paymentStatus as PaymentStatus) || targetApt.paymentStatus,
      }

      handleSaveAppointment(updatedApt)
      return `Cita de ${targetApt.clientName} actualizada correctamente.`
    },

    onSearchClient: async (query: string) => {
      const q = query.toLowerCase().trim()
      const found = clients.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )

      handleSelectTab('clients')

      if (found.length === 0) {
        return `No encontré clientas que coincidan con "${query}".`
      }

      const c = found[0]
      return `Encontré a ${c.name}, teléfono ${c.phone}, ha venido ${c.totalVisits} veces. Notas: ${c.allergies || c.notes || 'sin notas especiales'}.`
    },

    onQueryFinance: async (period?: string) => {
      const now = new Date()
      let filteredApts = appointments.filter(
        (a) => a.paymentStatus === 'pagado' || a.status === 'completada'
      )

      if (period === 'today' || period === 'hoy') {
        const todayStr = now.toISOString().split('T')[0]
        filteredApts = filteredApts.filter((a) => a.date === todayStr)
      } else if (period === 'this_month' || period === 'este_mes') {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        filteredApts = filteredApts.filter((a) => a.date.startsWith(currentMonth))
      }

      const totalRevenue = filteredApts.reduce((sum, a) => sum + (a.price || 0), 0)
      return `El total registrado para este período es de ${totalRevenue.toFixed(2)} euros en ${filteredApts.length} citas.`
    },

    onOpenModal: (modal: string) => {
      if (modal === 'new_appointment') setIsAptModalOpen(true)
      else if (modal === 'new_service') setIsServiceModalOpen(true)
      else if (modal === 'new_client') setIsClientModalOpen(true)
      else if (modal === 'new_invoice') setIsBillingModalOpen(true)
      else if (modal === 'gallery') setIsGalleryModalOpen(true)
    },

    onCheckUpdates: async () => {
      checkUpdates(true)
      return 'Comprobando si hay actualizaciones disponibles en el servidor de GoldBlack Lash.'
    },

    getStudioContext: () => {
      const serviceNames = services.map((s) => s.name).join(', ')
      return `Servicios disponibles en el estudio: ${serviceNames}. Total de citas: ${appointments.length}. Clientas registradas: ${clients.length}.`
    },
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0d] text-gray-200">
      {/* Custom App TitleBar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - con drag & drop reordenable, botón dentro del aside en esquina inferior derecha */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          pendingAppointmentsCount={unseenCount}
          clientsRecallCount={recallCount}
          isReorderMode={isReorderMode}
          sidebarOrder={sidebarOrder}
          onReorder={handleReorderSidebar}
          onToggleReorder={() => setIsReorderMode((v) => !v)}
          onResetOrder={handleResetSidebarOrder}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#0c0c11] via-[#09090d] to-[#07070a]">
        <Header
          title={activeInfo.title}
          subtitle={activeInfo.subtitle}
          config={config}
          actionLabel={headerAction.actionLabel}
          onAction={headerAction.onAction}
        />

        {config.maintenanceMode && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between gap-4 text-xs text-amber-200 shrink-0 z-20">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>Modo Mantenimiento Activo:</strong> El sitio web público está mostrando la pantalla de mantenimiento con la imagen <code className="font-mono text-amber-300">Mantenimiento.png</code>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveConfig({ ...config, maintenanceMode: false })}
              className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors cursor-pointer text-[11px] shrink-0"
            >
              Reabrir Sitio Web
            </button>
          </div>
        )}

        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <Dashboard
              appointments={appointments}
              clients={clients}
              services={services}
              config={config}
              invoices={invoices}
              onNewAppointment={() => {
                setEditingApt(null)
                handleSelectTab('appointments')
                setIsAptModalOpen(true)
              }}
              onSelectTab={(tab) => handleSelectTab(tab)}
              onUpdateAppointmentStatus={handleUpdateStatus}
              onFinalizeService={handleFinalizeService}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments
              appointments={appointments}
              services={services}
              clients={clients}
              config={config}
              invoices={invoices}
              onSaveAppointment={handleSaveAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePayment={handleUpdatePayment}
              onFinalizeService={handleFinalizeService}
              isModalOpen={isAptModalOpen}
              setIsModalOpen={setIsAptModalOpen}
              editingAppointment={editingApt}
              setEditingAppointment={setEditingApt}
            />
          )}

          {activeTab === 'services' && (
            <Services
              services={services}
              onSaveService={handleSaveService}
              onDeleteService={handleDeleteService}
              isModalOpen={isServiceModalOpen}
              setIsModalOpen={setIsServiceModalOpen}
            />
          )}

          {activeTab === 'clients' && (
            <Clients
              clients={clients}
              config={config}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              isModalOpen={isClientModalOpen}
              setIsModalOpen={setIsClientModalOpen}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryManager
              galleryItems={gallery}
              onSaveItem={handleSaveGalleryItem}
              onDeleteItem={handleDeleteGalleryItem}
              isModalOpen={isGalleryModalOpen}
              setIsModalOpen={setIsGalleryModalOpen}
            />
          )}

          {activeTab === 'billing' && (
            <Billing
              invoices={invoices}
              clients={clients}
              services={services}
              config={config}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              isCreateModalOpen={isBillingModalOpen}
              setIsCreateModalOpen={setIsBillingModalOpen}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              config={config}
              onSaveConfig={handleSaveConfig}
              onRefreshAllData={refreshAll}
            />
          )}
        </main>

        {/* Real-Time Sync Notification Pill */}
        {syncToast && (
          <div className="fixed bottom-22 right-6 z-40 transition-all duration-300">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-xs font-semibold ${
                syncToast.status === 'synced'
                  ? 'bg-[#0f1d16]/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
                  : syncToast.status === 'syncing'
                  ? 'bg-[#221c10]/95 text-amber-300 border-amber-500/40 shadow-amber-950/50'
                  : 'bg-[#181822]/95 text-gray-300 border-gray-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  syncToast.status === 'synced'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncToast.status === 'syncing'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-gray-400'
                }`}
              />
              <span>{syncToast.message}</span>
            </div>
          </div>
        )}

        {/* AI Voice Assistant Widget (Gemini Flash + Web Speech) */}
        {(config.voiceAssistantEnabled ?? true) && (
          <VoiceAssistantWidget
            apiKey={config.geminiApiKey}
            voiceAutoSpeak={config.voiceAutoSpeak ?? true}
            wakeWordEnabled={config.voiceWakeWordEnabled ?? true}
            handlers={voiceHandlers}
            onOpenSettings={() => handleSelectTab('settings')}
          />
        )}
      </div>
      </div>
    </div>
  )
}

export default App
