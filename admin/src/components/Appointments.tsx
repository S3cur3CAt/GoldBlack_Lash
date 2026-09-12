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
  IconWhatsApp,
  IconPlus,
  IconSearch,
  IconTrash,
  IconEdit,
  IconCheck,
  IconX,
  IconSparkles,
  IconMessageSquare,
} from './Icons'
import {
  fetchLiveAppointmentsFromVercel,
} from '../services/storage'
import { WhatsAppModal, WhatsAppModalMode } from './WhatsAppModal'

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
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // WhatsApp Custom Message Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [selectedWhatsAppApt, setSelectedWhatsAppApt] = useState<Appointment | null>(null)
  const [whatsAppModalMode, setWhatsAppModalMode] = useState<WhatsAppModalMode>('recordar')

  const handleOpenWhatsApp = (apt: Appointment, mode: WhatsAppModalMode) => {
    setSelectedWhatsAppApt(apt)
    setWhatsAppModalMode(mode)
    setWhatsAppModalOpen(true)
  }

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<Partial<Appointment>>({
    clientName: '',
    clientPhone: '',
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
  const handleNew = () => {
    setEditingAppointment(null)
    setFormData({
      clientName: '',
      clientPhone: '',
      date: new Date().toISOString().split('T')[0],
      time: '11:00',
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Bar: Title & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
            <IconCalendar size={24} className="text-gold-400" />
            Agenda y Control de Citas
          </h3>
          <p className="text-xs text-gray-400">
            Gestiona citas, envía recordatorios por WhatsApp y anota especificaciones de pestañas.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchLiveAppointmentsFromVercel()}
            title="Sincronizar reservas con la web"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#171722] hover:bg-[#202030] text-gray-300 hover:text-white border border-[#252535] text-xs font-semibold transition-all cursor-pointer"
          >
            <span>🔄</span>
            <span>Sincronizar</span>
          </button>

          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow cursor-pointer"
          >
            <IconPlus size={16} />
            <span>Nueva Cita</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202c] flex flex-wrap items-center justify-between gap-4">
        {/* Date Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171722] border border-[#222232]">
          <button
            onClick={() => setFilterDate('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterDate === 'all' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas ({appointments.length})
          </button>
          <button
            onClick={() => setFilterDate('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterDate === 'today' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setFilterDate('tomorrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterDate === 'tomorrow' ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mañana
          </button>
          <button
            onClick={() => setFilterDate('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            onClick={handleNew}
            className="mt-4 px-4 py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-semibold hover:bg-gold-500/30"
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

                {/* Right: WhatsApp Actions & Admin Controls */}
                <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                  {/* WhatsApp Action Buttons - Opens customize form before sending */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#171722] border border-[#242436]">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(apt, 'recordar')}
                      title="Personalizar y enviar recordatorio 24h por WhatsApp"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconWhatsApp size={14} />
                      <span className="hidden sm:inline">Recordar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(apt, 'confirmar')}
                      title="Personalizar y enviar confirmación de reserva"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconCheck size={14} />
                      <span className="hidden sm:inline">Confirmar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(apt, 'cuidados')}
                      title="Personalizar y enviar pautas de cuidados previos a la cita"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconSparkles size={14} />
                      <span className="hidden sm:inline">Cuidados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(apt, 'responder')}
                      title="Responder alguna consulta o pregunta a la clienta"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <IconMessageSquare size={14} />
                      <span className="hidden sm:inline">Responder</span>
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

      {/* Modal: Create / Edit Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
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
                    Teléfono / WhatsApp *
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
                <div className="text-xs font-bold font-serif text-gold-300 uppercase tracking-wider flex items-center gap-2">
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

      {/* WhatsApp Customize & Send Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        appointment={selectedWhatsAppApt}
        config={config}
        initialMode={whatsAppModalMode}
      />
    </div>
  )
}
