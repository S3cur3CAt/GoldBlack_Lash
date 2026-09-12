import React, { useState, useEffect, useRef } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar, TabId } from './components/Sidebar'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { Appointments } from './components/Appointments'
import { Services } from './components/Services'
import { Clients } from './components/Clients'
import { GalleryManager } from './components/GalleryManager'
import { Settings } from './components/Settings'

import {
  Appointment,
  Client,
  AdminService,
  StudioConfig,
  GalleryItem,
  AppointmentStatus,
  PaymentStatus,
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
  syncServiceWithVercel,
  deleteServiceFromVercel,
  fetchLiveServicesFromVercel,
  syncGalleryItemWithVercel,
  deleteGalleryItemFromVercel,
  fetchLiveGalleryFromVercel,
  fetchLiveAppointmentsFromVercel,
  syncAppointmentWithVercel,
  deleteAppointmentFromVercel,
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

  // Modal control for Appointment creation/editing across the app
  const [isAptModalOpen, setIsAptModalOpen] = useState(false)
  const [editingApt, setEditingApt] = useState<Appointment | null>(null)
  const [syncToast, setSyncToast] = useState<{ status: string; message: string } | null>(null)

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

  // Load state on mount
  const refreshAll = () => {
    const apts = getAppointments()
    setAppointments(apts)
    setClients(getClients())
    setServices(getServices())
    setConfig(getStudioConfig())
    setGallery(getGalleryItems())

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
          preferredStyle: apt.style || 'Cat Eye (Ojo de Gato)',
          preferredCurl: apt.curl || 'D',
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
      subtitle: 'Tarifas de extensiones, retoques y lifting de pestañas',
    },
    clients: {
      title: 'Base de Datos de Clientas (CRM)',
      subtitle: 'Fichas personales, historial de visitas y alertas de mantenimiento',
    },
    gallery: {
      title: 'Galería y Trabajos del Estudio',
      subtitle: 'Fotografías del catálogo y antes / después',
    },
    settings: {
      title: 'Ajustes del Estudio',
      subtitle: 'Datos de contacto, horarios y copias de seguridad',
    },
  }

  const activeInfo = tabTitles[activeTab]

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0d] text-gray-200">
      {/* Custom App TitleBar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          pendingAppointmentsCount={unseenCount}
          clientsRecallCount={recallCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-[#0c0c11] via-[#09090d] to-[#07070a]">
        <Header
          title={activeInfo.title}
          subtitle={activeInfo.subtitle}
          config={config}
          onNewAppointment={() => {
            setEditingApt(null)
            handleSelectTab('appointments')
            setIsAptModalOpen(true)
          }}
        />

        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <Dashboard
              appointments={appointments}
              clients={clients}
              services={services}
              config={config}
              onNewAppointment={() => {
                setEditingApt(null)
                handleSelectTab('appointments')
                setIsAptModalOpen(true)
              }}
              onSelectTab={(tab) => handleSelectTab(tab)}
              onUpdateAppointmentStatus={handleUpdateStatus}
            />
          )}

          {activeTab === 'appointments' && (
            <Appointments
              appointments={appointments}
              services={services}
              config={config}
              onSaveAppointment={handleSaveAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePayment={handleUpdatePayment}
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
            />
          )}

          {activeTab === 'clients' && (
            <Clients
              clients={clients}
              config={config}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryManager
              galleryItems={gallery}
              onSaveItem={handleSaveGalleryItem}
              onDeleteItem={handleDeleteGalleryItem}
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
          <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
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
      </div>
      </div>
    </div>
  )
}

export default App
