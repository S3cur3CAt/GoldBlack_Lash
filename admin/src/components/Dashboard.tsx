import React, { useState } from 'react'
import {
  Appointment,
  Client,
  AdminService,
  StudioConfig,
  Invoice,
  PaymentMethod,
} from '../types/admin'
import {
  IconCalendar,
  IconUsers,
  IconEuro,
  IconSparkles,
  IconMail,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconPlus,
  IconReceipt,
  IconWhatsApp,
} from './Icons'
import { EmailModal, EmailModalMode } from './EmailModal'
import { WhatsAppModal, WhatsAppModalMode } from './WhatsAppModal'
import { FinalizeServiceModal } from './FinalizeServiceModal'

interface DashboardProps {
  appointments: Appointment[]
  clients: Client[]
  services: AdminService[]
  config: StudioConfig
  invoices?: Invoice[]
  onNewAppointment: () => void
  onSelectTab: (tab: 'appointments' | 'clients' | 'services') => void
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void
  onFinalizeService?: (
    apt: Appointment,
    options: {
      paymentMethod: PaymentMethod
      clientEmail?: string
      clientNif?: string
      sendEmail?: boolean
      customNotes?: string
    }
  ) => Promise<Invoice | null>
}

export const Dashboard: React.FC<DashboardProps> = ({
  appointments,
  clients,
  services,
  config,
  invoices = [],
  onNewAppointment,
  onSelectTab,
  onUpdateAppointmentStatus,
  onFinalizeService,
}) => {
  const today = new Date().toISOString().split('T')[0]

  // Finalize Service Modal State
  const [finalizingApt, setFinalizingApt] = useState<Appointment | null>(null)

  // Email Modal State for direct Resend messaging
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedEmailApt, setSelectedEmailApt] = useState<Appointment | null>(null)
  const [selectedEmailClient, setSelectedEmailClient] = useState<Client | null>(null)
  const [emailModalMode, setEmailModalMode] = useState<EmailModalMode>('recordar')

  // WhatsApp Modal State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [selectedWhatsappApt, setSelectedWhatsappApt] = useState<Appointment | null>(null)
  const [selectedWhatsappClient, setSelectedWhatsappClient] = useState<Client | null>(null)
  const [whatsappModalMode, setWhatsappModalMode] = useState<WhatsAppModalMode>('recordar')

  const handleOpenWhatsApp = (
    target: { apt?: Appointment; client?: Client },
    mode: WhatsAppModalMode = 'recordar'
  ) => {
    setSelectedWhatsappApt(target.apt || null)
    setSelectedWhatsappClient(target.client || null)
    setWhatsappModalMode(mode)
    setWhatsappModalOpen(true)
  }

  // Filter today's appointments
  const todayAppointments = appointments.filter((a) => a.date === today)
  const confirmedToday = todayAppointments.filter((a) => a.status === 'confirmada').length
  const completedToday = todayAppointments.filter((a) => a.status === 'completada').length

  // Calculate monthly projected income
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const monthAppointments = appointments.filter(
    (a) => a.date.startsWith(currentMonth) && a.status !== 'cancelada'
  )
  const monthlyIncome = monthAppointments.reduce((sum, a) => sum + (a.price || 0), 0)

  // Clients needing touch-up recall (last visit > 21 days ago)
  const nowMs = Date.now()
  const recallClients = clients.filter((c) => {
    if (!c.lastVisitDate) return false
    const diffDays = (nowMs - new Date(c.lastVisitDate).getTime()) / 86400000
    return diffDays >= 20
  })

  // Calculate service popularity
  const serviceCounts: Record<string, number> = {}
  appointments.forEach((a) => {
    serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1
  })
  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 13) {
    return 'Buenos días, Laura'
  } else if (hour >= 13 && hour < 21) {
    return 'Buenas tardes, Laura'
  } else {
    return 'Buenas noches, Laura'
  }
}

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto h-full">
      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl bg-ink-850 border border-line p-6 overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold-500/[0.07] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold font-sans tracking-tight text-white">
              {getTimeBasedGreeting()}
            </h3>
            <p className="text-sm text-muted mt-1 max-w-xl">
              {todayAppointments.length > 0 ? (
                <>
                  Tienes <strong className="text-gold-300">{todayAppointments.length} citas</strong> hoy en el estudio de Montequinto ({confirmedToday} confirmadas).
                </>
              ) : (
                <>
                  Agenda del día lista. Pulsa en <strong className="text-gold-300">Nueva Cita</strong> en la barra superior para registrar el primer turno.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('appointments')}
              className="px-4 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-200 text-xs font-semibold border border-line-strong transition-colors cursor-pointer"
            >
              Ver Agenda Completa →
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Citas Hoy */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Citas Hoy</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <IconCalendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-white tabular-nums">{todayAppointments.length}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {completedToday > 0 ? `${completedToday} completada(s)` : 'En progreso'}
            </span>
          </div>
          <p className="text-[11px] text-faint mt-2">
            {confirmedToday} confirmada(s) por la clienta
          </p>
        </div>

        {/* Card 2: Ingresos Mes */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Facturación Estimada Mes</span>
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400">
              <IconEuro size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-gold-300 tabular-nums">{monthlyIncome} €</span>
            <span className="text-xs text-gold-400/80 font-mono">EST.</span>
          </div>
          <p className="text-[11px] text-faint mt-2">
            {monthAppointments.length} sesiones en este mes
          </p>
        </div>

        {/* Card 3: Clientas Activas */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Base de Clientas</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <IconUsers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-white tabular-nums">{clients.length}</span>
            <span className="text-xs text-purple-400 font-medium">Fichas registradas</span>
          </div>
          <p className="text-[11px] text-faint mt-2">
            {recallClients.length} pendientes de mantenimiento
          </p>
        </div>

        {/* Card 4: Servicios Activos */}
        <div className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Catálogo de Pestañas</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IconSparkles size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-sans tracking-tight text-white tabular-nums">{services.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Servicios activos</span>
          </div>
          <p className="text-[11px] text-faint mt-2">
            Volumen, Ruso, Retirada y Limpieza Facial
          </p>
        </div>
      </div>

      {/* Main Split Content: Today's Appointments & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Today's Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-base font-semibold text-white flex items-center gap-2">
              <IconClock size={18} className="text-gold-400" />
              Citas Programadas para Hoy ({today})
            </h4>
            <button
              onClick={() => onSelectTab('appointments')}
              className="text-xs text-gold-400 hover:text-gold-300 font-medium"
            >
              Ver todas →
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-ink-850 border border-line text-center">
              <p className="text-sm text-gray-400">No hay citas programadas para el día de hoy.</p>
              <button
                onClick={onNewAppointment}
                className="mt-3 px-4 py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold hover:bg-gold-500/30"
              >
                + Añadir Cita para Hoy
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => {
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="px-3 py-2 rounded-xl bg-ink-800 border border-line-strong text-center min-w-[65px]">
                        <span className="block text-sm font-bold font-mono text-gold-300">{apt.time}</span>
                        <span className="block text-[10px] text-gray-400">{apt.durationMinutes} min</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-white text-sm">{apt.clientName}</h5>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              apt.status === 'completada'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : apt.status === 'confirmada'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {apt.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {apt.serviceName} • <strong className="text-gold-400">{apt.price} €</strong>
                        </p>
                        {apt.curl && (
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                            <span className="px-1.5 py-0.5 rounded bg-ink-800 text-gray-300 font-mono">
                              Curva: {apt.curl}
                            </span>
                            {apt.length && (
                              <span className="px-1.5 py-0.5 rounded bg-ink-800 text-gray-300 font-mono">
                                Longitud: {apt.length}
                              </span>
                            )}
                            {apt.style && (
                              <span className="px-1.5 py-0.5 rounded bg-ink-800 text-gray-300">
                                {apt.style}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Finalize Service & Email */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {apt.status !== 'completada' ? (
                        <button
                          type="button"
                          onClick={() => setFinalizingApt(apt)}
                          title="Finalizar servicio y emitir factura en Facturación & Caja"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 hover:text-gold-200 border border-gold-500/35 hover:border-gold-400/60 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <IconCheck size={14} className="text-gold-400 stroke-[2.5]" />
                          <span>Finalizar Servicio</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14120c] border border-gold-500/25 text-gold-300 text-xs font-medium">
                          <IconCheck size={13} className="text-gold-400 stroke-[2.5]" />
                          <span>Finalizado</span>
                          {(() => {
                            const inv = invoices.find((i) => i.appointmentId === apt.id)
                            return inv ? <span className="text-[10px] text-gold-400 font-mono">({inv.number})</span> : null
                          })()}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp({ apt }, 'recordar')}
                        title="Enviar recordatorio o confirmación por WhatsApp a la clienta"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <IconWhatsApp size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmailApt(apt)
                          setSelectedEmailClient(null)
                          setEmailModalMode('recordar')
                          setEmailModalOpen(true)
                        }}
                        title="Enviar correo corporativo (Resend)"
                        className="p-2 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 transition-colors cursor-pointer"
                      >
                        <IconMail size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 col): Top Services & Maintenance Recalls */}
        <div className="space-y-6">
          {/* Top Services */}
          <div className="p-5 rounded-2xl bg-ink-850 border border-line">
            <h4 className="font-sans text-base font-semibold text-white flex items-center gap-2 mb-4">
              <IconSparkles size={16} className="text-gold-400" />
              Técnicas Más Pedidas
            </h4>
            <div className="space-y-3">
              {topServices.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  No hay citas registradas todavía. Las técnicas más populares se mostrarán aquí en cuanto comiences a agendar clientas.
                </p>
              ) : (
                topServices.map(([name, count]) => {
                  const percent = Math.min(100, Math.round((count / Math.max(1, appointments.length)) * 100))
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-medium truncate max-w-[180px]">{name}</span>
                        <span className="text-gray-400 font-mono">{percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Maintenance Recalls (> 3 weeks) */}
          <div className="p-5 rounded-2xl bg-ink-850 border border-line">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-sans text-base font-semibold text-white flex items-center gap-2">
                <IconAlertCircle size={16} className="text-amber-400" />
                Avisos de Retoque ({recallClients.length})
              </h4>
              <button
                onClick={() => onSelectTab('clients')}
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Ver Clientas
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Clientas que llevan más de 20 días sin acudir y necesitan mantenimiento.
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recallClients.length === 0 ? (
                <p className="text-xs text-gray-500">No hay clientas pendientes de retoque.</p>
              ) : (
                recallClients.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-ink-850 border border-line flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-gray-400">
                          Última visita: {c.lastVisitDate || 'Sin registro'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp({ client: c }, 'retoque')}
                          title="Enviar invitación de retoque por WhatsApp"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <IconWhatsApp size={12} className="text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmailApt(null)
                            setSelectedEmailClient(c)
                            setEmailModalMode('retoque')
                            setEmailModalOpen(true)
                          }}
                          title="Enviar invitación de retoque por correo corporativo"
                          className="p-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 border border-gold-500/30 text-[11px] transition-colors cursor-pointer"
                        >
                          <IconMail size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        appointment={selectedEmailApt}
        client={selectedEmailClient}
        config={config}
        initialMode={emailModalMode}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        appointment={selectedWhatsappApt}
        client={selectedWhatsappClient}
        config={config}
        initialMode={whatsappModalMode}
      />

      {/* Finalize Service & Invoice Modal */}
      <FinalizeServiceModal
        isOpen={Boolean(finalizingApt)}
        onClose={() => setFinalizingApt(null)}
        appointment={finalizingApt}
        config={config}
        clients={clients}
        onConfirm={async (options) => {
          if (finalizingApt && onFinalizeService) {
            await onFinalizeService(finalizingApt, options)
          }
        }}
      />
    </div>
  )
}
