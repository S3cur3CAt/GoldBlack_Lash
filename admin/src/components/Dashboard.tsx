import React from 'react'
import {
  Appointment,
  Client,
  AdminService,
  StudioConfig,
} from '../types/admin'
import {
  IconCalendar,
  IconUsers,
  IconEuro,
  IconSparkles,
  IconWhatsApp,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconPlus,
} from './Icons'
import {
  createWhatsAppReminderUrl,
  createWhatsAppConfirmationUrl,
  createWhatsAppRecallUrl,
} from '../services/storage'

interface DashboardProps {
  appointments: Appointment[]
  clients: Client[]
  services: AdminService[]
  config: StudioConfig
  onNewAppointment: () => void
  onSelectTab: (tab: 'appointments' | 'clients' | 'services') => void
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  appointments,
  clients,
  services,
  config,
  onNewAppointment,
  onSelectTab,
  onUpdateAppointmentStatus,
}) => {
  const today = new Date().toISOString().split('T')[0]

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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#171722] via-[#1c1c28] to-[#121218] border border-gold-500/20 p-6 overflow-hidden shadow-gold-glow">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-gold-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-gold-400">
              Panel de Control • GoldBlack Lash Studio
            </span>
            <h3 className="text-2xl font-serif font-bold text-white mt-0.5">
              Bienvenida, Administradora
            </h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              {todayAppointments.length > 0 ? (
                <>
                  Tienes <strong className="text-gold-300">{todayAppointments.length} citas</strong> hoy en el estudio de Montequinto ({confirmedToday} confirmadas).
                </>
              ) : (
                <>
                  Agenda del día lista. Pulsa en <strong className="text-gold-300">Agendar Cita</strong> para registrar el primer turno.
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNewAppointment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow"
            >
              <IconPlus size={16} />
              <span>Agendar Cita</span>
            </button>
            <button
              onClick={() => onSelectTab('appointments')}
              className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-gray-200 text-xs font-semibold border border-gray-700/50 transition-all"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Citas Hoy */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Citas Hoy</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <IconCalendar size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-white">{todayAppointments.length}</span>
            <span className="text-xs text-emerald-400 font-medium">
              {completedToday > 0 ? `${completedToday} completada(s)` : 'En progreso'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {confirmedToday} confirmada(s) por la clienta
          </p>
        </div>

        {/* Card 2: Ingresos Mes */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Facturación Estimada Mes</span>
            <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 shadow-gold-glow">
              <IconEuro size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-gold-300">{monthlyIncome} €</span>
            <span className="text-xs text-gold-400/80 font-mono">EST.</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {monthAppointments.length} sesiones en este mes
          </p>
        </div>

        {/* Card 3: Clientas Activas */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Base de Clientas</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <IconUsers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-white">{clients.length}</span>
            <span className="text-xs text-purple-400 font-medium">Fichas registradas</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            {recallClients.length} pendientes de mantenimiento
          </p>
        </div>

        {/* Card 4: Servicios Activos */}
        <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202d] hover:border-gold-500/30 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Catálogo de Pestañas</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IconSparkles size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-serif text-white">{services.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Servicios activos</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Volumen Ruso, Clásicas y Lifting
          </p>
        </div>
      </div>

      {/* Main Split Content: Today's Appointments & Side Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Today's Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-lg font-bold text-white flex items-center gap-2">
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
            <div className="p-8 rounded-2xl bg-[#111118] border border-[#20202c] text-center">
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
                const reminderUrl = createWhatsAppReminderUrl(apt, config)
                const confirmUrl = createWhatsAppConfirmationUrl(apt, config)
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl bg-[#12121a] border border-[#222230] hover:border-gold-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="px-3 py-2 rounded-xl bg-[#1c1c28] border border-[#2a2a3c] text-center min-w-[65px]">
                        <span className="block text-sm font-bold font-mono text-gold-300">{apt.time}</span>
                        <span className="block text-[10px] text-gray-400">{apt.durationMinutes} min</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-white text-sm">{apt.clientName}</h5>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              apt.status === 'completada'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : apt.status === 'confirmada'
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
                            <span className="px-1.5 py-0.5 rounded bg-[#1c1c28] text-gray-300 font-mono">
                              Curva: {apt.curl}
                            </span>
                            {apt.length && (
                              <span className="px-1.5 py-0.5 rounded bg-[#1c1c28] text-gray-300 font-mono">
                                Longitud: {apt.length}
                              </span>
                            )}
                            {apt.style && (
                              <span className="px-1.5 py-0.5 rounded bg-[#1c1c28] text-gray-300">
                                {apt.style}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: WhatsApp & Status Change */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={reminderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar recordatorio por WhatsApp"
                        className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 transition-colors"
                      >
                        <IconWhatsApp size={16} />
                      </a>
                      {apt.status !== 'completada' && (
                        <button
                          onClick={() => onUpdateAppointmentStatus(apt.id, 'completada')}
                          title="Marcar como completada"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors"
                        >
                          <IconCheck size={14} />
                          <span>Completar</span>
                        </button>
                      )}
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
          <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202c]">
            <h4 className="font-serif text-base font-bold text-white flex items-center gap-2 mb-4">
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
                      <div className="h-1.5 w-full bg-[#1c1c28] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold-500 to-gold-300 rounded-full"
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
          <div className="p-5 rounded-2xl bg-[#111118] border border-[#20202c]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
                <IconAlertCircle size={16} className="text-amber-400" />
                Avisos de Retoque ({recallClients.length})
              </h4>
              <button
                onClick={() => onSelectTab('clients')}
                className="text-[11px] text-gray-400 hover:text-white"
              >
                Ver CRM
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
                  const recallUrl = createWhatsAppRecallUrl(c, config)
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-[#161622] border border-[#242436] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-gray-400">
                          Última visita: {c.lastVisitDate || 'Sin registro'}
                        </div>
                      </div>
                      <a
                        href={recallUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Enviar invitación de retoque por WhatsApp"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
                      >
                        <IconWhatsApp size={13} />
                        <span>Avisar</span>
                      </a>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
