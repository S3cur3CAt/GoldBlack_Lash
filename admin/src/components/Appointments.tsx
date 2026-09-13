import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  AdminService,
  StudioConfig,
  LashCurl,
  LashStyle,
} from '../types/admin'
import {
  IconCalendar,
  IconClock,
  IconMail,
  IconSend,
  IconPlus,
  IconSearch,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconSparkles,
  IconMessageSquare,
} from './Icons'
import { EmailModal, EmailModalMode } from './EmailModal'

interface AppointmentsProps {
  appointments: Appointment[]
  services: AdminService[]
  config: StudioConfig
  onSaveAppointment: (apt: Appointment) => void
  onDeleteAppointment: (id: string) => void
  onUpdateStatus: (id: string, status: AppointmentStatus) => void
  onUpdatePayment: (id: string, payment: PaymentStatus) => void
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  editingAppointment: Appointment | null
  setEditingAppointment: (apt: Appointment | null) => void
}

export const Appointments: React.FC<AppointmentsProps> = ({
  appointments,
  services,
  config,
  onSaveAppointment,
  onDeleteAppointment,
  onUpdateStatus,
  onUpdatePayment,
  isModalOpen,
  setIsModalOpen,
  editingAppointment,
  setEditingAppointment,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [viewMode, setViewMode] = useState<'agenda' | 'list'>('agenda')
  const [agendaDate, setAgendaDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Email Custom Message Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedEmailApt, setSelectedEmailApt] = useState<Appointment | null>(null)
  const [emailModalMode, setEmailModalMode] = useState<EmailModalMode>('confirmar')

  const handleOpenEmail = (apt: Appointment, mode: EmailModalMode) => {
    setSelectedEmailApt(apt)
    setEmailModalMode(mode)
    setEmailModalOpen(true)
  }

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<Partial<Appointment>>({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    durationMinutes: 90,
    serviceId: services[0]?.id || '',
    serviceName: services[0]?.name || '',
    price: services[0]?.priceNumber || 30,
    status: 'pendiente',
    paymentStatus: 'pendiente',
    curl: 'D',
    length: '9 - 13 mm',
    style: 'Volumen Ruso' as unknown as LashStyle,
    notes: '',
  })

  // Open modal for editing
  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt)
    setFormData(apt)
    setIsModalOpen(true)
  }

  // Open modal for creating
  const handleNew = (defaultDate?: string, defaultTime?: string) => {
    setEditingAppointment(null)
    setFormData({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      date: defaultDate || agendaDate || new Date().toISOString().split('T')[0],
      time: defaultTime || '11:00',
      durationMinutes: services[0]?.duration.includes('2') ? 120 : 90,
      serviceId: services[0]?.id || '',
      serviceName: services[0]?.name || '',
      price: services[0]?.priceNumber || 30,
      status: 'pendiente',
      paymentStatus: 'pendiente',
      curl: 'D',
      length: '9 - 13 mm',
      style: 'Cat Eye (Ojo de Gato)',
      notes: '',
    })
    setIsModalOpen(true)
  }

  // Handle service change in form
  const handleServiceChange = (serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId)
    if (!s) return
    const durMin = s.duration.includes('2 h 30') ? 150 : s.duration.includes('2 h') ? 120 : s.duration.includes('1 h 30') ? 90 : 60
    setFormData((prev) => ({
      ...prev,
      serviceId: s.id,
      serviceName: s.name,
      price: s.priceNumber,
      durationMinutes: durMin,
    }))
  }

  // Save form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName || !formData.clientPhone) {
      showAlert({
        title: 'Datos requeridos',
        message: 'Por favor introduce el nombre y teléfono de la clienta para agendar la cita.',
        type: 'warning',
      })
      return
    }

    const appointmentToSave: Appointment = {
      id: editingAppointment ? editingAppointment.id : `apt-${Date.now()}`,
      clientName: formData.clientName || '',
      clientPhone: formData.clientPhone || '',
      clientEmail: formData.clientEmail?.trim() || undefined,
      date: formData.date || new Date().toISOString().split('T')[0],
      time: formData.time || '11:00',
      durationMinutes: formData.durationMinutes || 90,
      serviceId: formData.serviceId || services[0]?.id || '',
      serviceName: formData.serviceName || services[0]?.name || '',
      price: Number(formData.price) || 30,
      status: formData.status as AppointmentStatus,
      paymentStatus: formData.paymentStatus as PaymentStatus,
      curl: formData.curl as LashCurl,
      length: formData.length || '',
      style: formData.style as LashStyle,
      notes: formData.notes || '',
      createdAt: editingAppointment?.createdAt || new Date().toISOString(),
    }

    onSaveAppointment(appointmentToSave)
    setIsModalOpen(false)
  }

  // Filter logic
  const todayStr = new Date().toISOString().split('T')[0]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const filteredAppointments = appointments.filter((apt) => {
    // Date filter
    if (filterDate === 'today' && apt.date !== todayStr) return false
    if (filterDate === 'tomorrow' && apt.date !== tomorrowStr) return false
    if (filterDate === 'week') {
      const now = new Date(todayStr).getTime()
      const aptTime = new Date(apt.date).getTime()
      const diff = (aptTime - now) / 86400000
      if (diff < 0 || diff > 7) return false
    }

    // Status filter
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = apt.clientName.toLowerCase().includes(q)
      const matchesPhone = apt.clientPhone.includes(q)
      const matchesService = apt.serviceName.toLowerCase().includes(q)
      if (!matchesName && !matchesPhone && !matchesService) return false
    }

    return true
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)] select-none">

      {/* View Switcher: Agenda Horaria vs Lista de Citas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1f1f2c]">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#14141e] border border-[#242436]">
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-gold-glow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <IconCalendar size={15} />
            <span>Vista Agenda (Horario)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-gold-glow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">📋</span>
            <span>Vista Lista ({appointments.length})</span>
          </button>
        </div>

        {/* Quick Date Navigator for Agenda */}
        {viewMode === 'agenda' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#14141e] border border-[#242436]">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(agendaDate)
                  d.setDate(d.getDate() - 1)
                  setAgendaDate(d.toISOString().split('T')[0])
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                ← Ayer
              </button>
              <button
                type="button"
                onClick={() => setAgendaDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold-300 hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(agendaDate)
                  d.setDate(d.getDate() + 1)
                  setAgendaDate(d.toISOString().split('T')[0])
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                Mañana →
              </button>
            </div>

            <input
              type="date"
              value={agendaDate}
              onChange={(e) => e.target.value && setAgendaDate(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#14141e] border border-[#242436] text-xs font-mono font-bold text-white focus:outline-none focus:border-gold-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* AGENDA VIEW: Timeline by hours */}
      {viewMode === 'agenda' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Day KPI Summary */}
          {(() => {
            const dayApts = appointments.filter((a) => a.date === agendaDate)
            const confirmed = dayApts.filter((a) => a.status === 'confirmada').length
            const completed = dayApts.filter((a) => a.status === 'completada').length
            const totalIncome = dayApts.reduce((acc, a) => acc + (a.price || 0), 0)
            const dateObj = new Date(agendaDate + 'T00:00:00')
            const dateFormatted = dateObj.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141420] via-[#101018] to-[#0d0d14] border border-gold-500/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-gold-400 font-bold block">
                    Horario de la Jornada
                  </span>
                  <h4 className="text-base font-bold font-sans tracking-tight text-white capitalize mt-0.5">
                    {dateFormatted}
                  </h4>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-xl bg-[#181826] border border-[#262638]">
                    <span className="text-gray-400">Citas: </span>
                    <strong className="text-white">{dayApts.length}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    <span>Completadas: </span>
                    <strong>{completed}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    <span>Confirmadas: </span>
                    <strong>{confirmed}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-300">
                    <span>Previsión: </span>
                    <strong>{totalIncome} €</strong>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Timeline Schedule from 09:00 to 20:30 */}
          <div className="rounded-3xl bg-[#0f0f16] border border-[#1e1e2c] p-6 space-y-3 shadow-xl">
            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map((timeSlot) => {
              const matchedApt = appointments.find((a) => a.date === agendaDate && a.time === timeSlot)

              if (matchedApt) {
                return (
                  <div
                    key={timeSlot}
                    onClick={() => handleEdit(matchedApt)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md ${
                      matchedApt.status === 'completada'
                        ? 'bg-[#101c15] border-emerald-500/40 hover:border-emerald-400'
                        : matchedApt.status === 'confirmada'
                        ? 'bg-[#121626] border-blue-500/40 hover:border-blue-400'
                        : matchedApt.status === 'cancelada'
                        ? 'bg-[#1c1214] border-red-500/40 opacity-70'
                        : 'bg-[#1c1810] border-amber-500/40 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-center min-w-[70px]">
                        <span className="block text-base font-bold font-mono text-gold-300">{matchedApt.time}</span>
                        <span className="block text-[10px] text-gray-400">{matchedApt.durationMinutes} min</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-white text-sm">{matchedApt.clientName}</h5>
                          <span className="text-xs font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded">
                            {matchedApt.clientPhone}
                          </span>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              matchedApt.status === 'completada'
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                : matchedApt.status === 'confirmada'
                                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40'
                                : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {matchedApt.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">
                          {matchedApt.serviceName} • <strong className="text-gold-300">{matchedApt.price} €</strong>
                          {matchedApt.curl && <span className="ml-2 text-gray-400 font-mono">Curva: {matchedApt.curl}</span>}
                          {matchedApt.length && <span className="ml-2 text-gray-400 font-mono">{matchedApt.length}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEmail(matchedApt, 'confirmar')}
                        title="Enviar confirmación de cita por correo"
                        className="p-2 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 transition-colors cursor-pointer"
                      >
                        <IconMail size={15} />
                      </button>
                      {matchedApt.status !== 'completada' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(matchedApt.id, 'completada')}
                          title="Marcar cita como completada"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <IconCheck size={14} />
                          <span>Completar</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              }

              // Empty time slot with quick add
              return (
                <div
                  key={timeSlot}
                  onClick={() => handleNew(agendaDate, timeSlot)}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-[#12121c]/40 hover:bg-[#1a1a28] border border-dashed border-[#242436] hover:border-gold-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-gray-500 group-hover:text-gold-300 min-w-[50px]">
                      {timeSlot}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-300">
                      Hueco disponible en estudio
                    </span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs text-gold-400 font-semibold pr-2">
                    <IconPlus size={14} />
                    <span>Agendar en este turno</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW: Filters + Cards */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202c] flex flex-wrap items-center justify-between gap-4">
            {/* Date Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171722] border border-[#222232]">
              <button
                type="button"
                onClick={() => setFilterDate('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterDate === 'all' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterDate === 'today' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('tomorrow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterDate === 'tomorrow' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => setFilterDate('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterDate === 'week' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                Esta Semana
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Estado:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#171722] border border-[#262638] text-xs text-gray-200 focus:outline-none focus:border-gold-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmada">Confirmadas</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por clienta o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#171722] border border-[#262638] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111118] border border-[#20202c]">
              <p className="text-sm text-gray-400">No se encontraron citas con los filtros seleccionados.</p>
              <button
                type="button"
                onClick={() => handleNew()}
                className="mt-4 px-4 py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold hover:bg-gold-500/30 cursor-pointer"
              >
                + Crear Nueva Cita
              </button>
            </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {

            return (
              <div
                key={apt.id}
                className="p-5 rounded-2xl bg-[#12121a] border border-[#222230] hover:border-gold-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Time & Client Data */}
                <div className="flex items-start gap-4">
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#181824] border border-[#28283a] text-center min-w-[80px]">
                    <span className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">{apt.date}</span>
                    <span className="block text-base font-bold font-mono text-gold-300 mt-0.5">{apt.time}</span>
                    <span className="block text-[10px] text-gray-500">{apt.durationMinutes} min</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-base">{apt.clientName}</h4>
                      <span className="text-xs font-mono text-gray-400 bg-[#1a1a26] px-2 py-0.5 rounded-md">
                        {apt.clientPhone}
                      </span>
                      {/* Web Booking Badge */}
                      {(apt.id.startsWith('apt-web') || apt.notes?.toLowerCase().includes('web')) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <span>🌐</span> Web
                        </span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          apt.status === 'completada'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : apt.status === 'confirmada'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : apt.status === 'cancelada'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {apt.status}
                      </span>
                      {/* Payment Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          apt.paymentStatus === 'pagado'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/30'
                            : apt.paymentStatus === 'seña_pagada'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {apt.paymentStatus === 'pagado' ? 'Pagado' : apt.paymentStatus === 'seña_pagada' ? 'Seña Pagada' : 'Pago Pendiente'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="text-gold-300 font-semibold">{apt.serviceName}</span>
                      <span>•</span>
                      <span className="font-bold text-white">{apt.price} €</span>
                    </div>

                    {/* Technical Sheet details */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400">
                      {apt.curl && (
                        <span className="px-2 py-0.5 rounded bg-[#1b1b26] text-gray-300 border border-[#272738]">
                          Curva: <strong className="text-gold-400">{apt.curl}</strong>
                        </span>
                      )}
                      {apt.length && (
                        <span className="px-2 py-0.5 rounded bg-[#1b1b26] text-gray-300 border border-[#272738]">
                          Longitud: <strong className="text-gold-400">{apt.length}</strong>
                        </span>
                      )}
                      {apt.style && (
                        <span className="px-2 py-0.5 rounded bg-[#1b1b26] text-gray-300 border border-[#272738]">
                          Diseño: <strong className="text-gold-400">{apt.style}</strong>
                        </span>
                      )}
                      {apt.notes && (
                        <span className="text-gray-400 italic">"{apt.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Email Actions & Admin Controls */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                  {/* Email Action Buttons - Sends luxury email via Resend */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171722] border border-[#242436]">
                    <button
                      type="button"
                      onClick={() => handleOpenEmail(apt, 'confirmar')}
                      title="Enviar confirmación de cita por correo"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconCheck size={14} />
                      <span className="hidden sm:inline">Confirmar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEmail(apt, 'recordar')}
                      title="Enviar recordatorio 24h por correo"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconClock size={14} />
                      <span className="hidden sm:inline">Recordar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEmail(apt, 'cuidados')}
                      title="Enviar pautas de cuidados previos por correo"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconSparkles size={14} />
                      <span className="hidden sm:inline">Cuidados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEmail(apt, 'responder')}
                      title="Redactar correo personalizado a la clienta"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold-950/40 hover:bg-gold-900/60 text-gold-300 border border-gold-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconMail size={14} />
                      <span className="hidden sm:inline">Correo</span>
                    </button>
                  </div>

                  {/* Status Change Selector */}
                  <select
                    value={apt.status}
                    onChange={(e) => onUpdateStatus(apt.id, e.target.value as AppointmentStatus)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#171722] border border-[#2a2a3c] text-xs text-gray-200 focus:outline-none focus:border-gold-500"
                  >
                    <option value="pendiente">Marcar Pendiente</option>
                    <option value="confirmada">Marcar Confirmada</option>
                    <option value="completada">Marcar Completada</option>
                    <option value="cancelada">Marcar Cancelada</option>
                  </select>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(apt)}
                    title="Editar detalles de la cita"
                    className="p-2 rounded-xl bg-[#1b1b28] hover:bg-[#252536] text-gray-300 hover:text-white border border-[#2b2b3e] transition-colors"
                  >
                    <IconEdit size={15} />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      showConfirm({
                        title: 'Eliminar Cita',
                        message: `¿Estás seguro de que deseas eliminar la cita agendada de ${apt.clientName}?`,
                        confirmText: 'Eliminar',
                        danger: true,
                        onConfirm: () => onDeleteAppointment(apt.id),
                      })
                    }}
                    title="Eliminar cita"
                    className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 transition-colors"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
      )}

      {/* Modal: Create / Edit Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-sans text-xl font-bold text-white flex items-center gap-2">
                <IconCalendar size={20} className="text-gold-400" />
                {editingAppointment ? 'Editar Cita de Estudio' : 'Nueva Cita en GoldBlack Lash'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Nombre de la Clienta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carmen Navarro"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Client Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 612345678"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Client Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Correo Electrónico (para confirmación y avisos)
                  </label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.clientEmail || ''}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Hora</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                {/* Service Selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Servicio de Pestañas
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.price} ({s.duration})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price and Duration */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Ficha Técnica de Pestañas */}
              <div className="p-4 rounded-xl bg-[#181824] border border-[#28283a] space-y-3">
                <div className="text-xs font-bold font-sans text-gold-300 uppercase tracking-wider flex items-center gap-2">
                  <IconSparkles size={15} />
                  Ficha Técnica de Extensiones
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Curvatura</label>
                    <select
                      value={formData.curl || 'D'}
                      onChange={(e) => setFormData({ ...formData, curl: e.target.value as LashCurl })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                    >
                      <option value="C">Curva C (Natural)</option>
                      <option value="CC">Curva CC (Elevación media)</option>
                      <option value="D">Curva D (Volumen glamuroso)</option>
                      <option value="DD">Curva DD (Máxima elevación)</option>
                      <option value="M">Curva M (Efecto lifting)</option>
                      <option value="L">Curva L (Párpado encapotado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Longitud de fibras</label>
                    <input
                      type="text"
                      placeholder="Ej. 8 - 12 mm"
                      value={formData.length || ''}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Diseño de Ojo</label>
                    <select
                      value={formData.style || 'Cat Eye (Ojo de Gato)'}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value as LashStyle })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                    >
                      <option value="Natural">Natural (Armónico)</option>
                      <option value="Cat Eye (Ojo de Gato)">Cat Eye (Ojo de Gato)</option>
                      <option value="Doll Eye (Muñeca)">Doll Eye (Muñeca)</option>
                      <option value="Ardilla (Squirrel)">Ardilla (Squirrel)</option>
                      <option value="Efecto Kim / Híbrido">Efecto Kim / Híbrido</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Observaciones / Adhesivo</label>
                  <input
                    type="text"
                    placeholder="Ej. Ojo izquierdo con remolino en lagrimal, adhesivo bajo en vapores"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                  />
                </div>
              </div>

              {/* Status and Payment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estado de Cita</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estado de Pago</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  >
                    <option value="pendiente">Pendiente de pago</option>
                    <option value="seña_pagada">Seña recibida (reserva)</option>
                    <option value="pagado">Totalmente pagado</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-gray-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow"
                >
                  {editingAppointment ? 'Guardar Cambios' : 'Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Customize & Send Modal (Resend) */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        appointment={selectedEmailApt}
        config={config}
        initialMode={emailModalMode}
        onClientEmailUpdated={(email) => {
          if (selectedEmailApt) {
            const updated = { ...selectedEmailApt, clientEmail: email }
            setSelectedEmailApt(updated)
            onSaveAppointment(updated)
          }
        }}
      />
    </div>
  )
}
