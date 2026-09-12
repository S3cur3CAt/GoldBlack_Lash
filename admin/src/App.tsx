import React, { useState, useEffect } from 'react'
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
} from './services/storage'

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

  // Load state on mount
  const refreshAll = () => {
    setAppointments(getAppointments())
    setClients(getClients())
    setServices(getServices())
    setConfig(getStudioConfig())
    setGallery(getGalleryItems())
  }

  useEffect(() => {
    refreshAll()
    // Fetch live services from Vercel / Neon Postgres
    fetchLiveServicesFromVercel().then((live) => {
      if (live && live.length > 0) {
        setServices(live)
      }
    })

    const handleSync = (e: any) => {
      if (e.detail) {
        setSyncToast(e.detail)
        setTimeout(() => setSyncToast(null), 4500)
      }
    }
    window.addEventListener('goldblack:sync', handleSync)
    return () => window.removeEventListener('goldblack:sync', handleSync)
  }, [])

  // Appointment Actions
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
  }

  const handleDeleteAppointment = (id: string) => {
    const updated = appointments.filter((a) => a.id !== id)
    setAppointments(updated)
    saveAppointments(updated)
  }

  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a))
    setAppointments(updated)
    saveAppointments(updated)
  }

  const handleUpdatePayment = (id: string, paymentStatus: PaymentStatus) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, paymentStatus } : a))
    setAppointments(updated)
    saveAppointments(updated)
  }

  // Service Actions - Synchronized in real time with Vercel & Neon Postgres
  const handleSaveService = async (service: AdminService) => {
    const existingIndex = services.findIndex((s) => s.id === service.id)
    let updated: AdminService[]
    if (existingIndex >= 0) {
      updated = [...services]
      updated[existingIndex] = service
    } else {
      updated = [...services, service]
    }
    setServices(updated)
    saveServices(updated)
    // Send in real time to Vercel API & Neon Postgres
    await syncServiceWithVercel(service)
  }

  const handleDeleteService = async (id: string) => {
    const updated = services.filter((s) => s.id !== id)
    setServices(updated)
    saveServices(updated)
    // Delete in real time from Vercel API & Neon Postgres
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

  // Gallery Actions
  const handleSaveGalleryItem = (item: GalleryItem) => {
    const updated = [item, ...gallery]
    setGallery(updated)
    saveGalleryItems(updated)
  }

  const handleDeleteGalleryItem = (id: string) => {
    const updated = gallery.filter((g) => g.id !== id)
    setGallery(updated)
    saveGalleryItems(updated)
  }

  // Config Action
  const handleSaveConfig = (newConfig: StudioConfig) => {
    setConfig(newConfig)
    saveStudioConfig(newConfig)
  }

  // Pending appointments count
  const pendingCount = appointments.filter((a) => a.status === 'pendiente').length

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
      subtitle: 'Control de reservas, fichas técnicas y envíos de WhatsApp',
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
          onSelectTab={setActiveTab}
          pendingAppointmentsCount={pendingCount}
          clientsRecallCount={recallCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-linear-to-br from-[#0c0c11] via-[#09090d] to-[#07070a]">
        <Header
          title={activeInfo.title}
          subtitle={activeInfo.subtitle}
          config={config}
          onNewAppointment={() => {
            setEditingApt(null)
            setActiveTab('appointments')
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
                setActiveTab('appointments')
                setIsAptModalOpen(true)
              }}
              onSelectTab={(tab) => setActiveTab(tab)}
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
