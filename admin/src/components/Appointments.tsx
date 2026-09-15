import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
  PaymentMethod,
  AdminService,
  StudioConfig,
  Client,
  Invoice,
  LashCurl,
  LashStyle,
  AgendaDayNote,
} from '../types/admin'
import { getAgendaNotes, saveDayNote } from '../services/storage'
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
  IconReceipt,
} from './Icons'
import { EmailModal, EmailModalMode } from './EmailModal'
import { FinalizeServiceModal } from './FinalizeServiceModal'

interface AppointmentsProps {
  appointments: Appointment[]
  services: AdminService[]
  clients?: Client[]
  config: StudioConfig
  invoices?: Invoice[]
  onSaveAppointment: (apt: Appointment) => void
  onDeleteAppointment: (id: string) => void
  onUpdateStatus: (id: string, status: AppointmentStatus) => void
  onUpdatePayment: (id: string, payment: PaymentStatus) => void
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
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  editingAppointment: Appointment | null
  setEditingAppointment: (apt: Appointment | null) => void
}

export const Appointments: React.FC<AppointmentsProps> = ({
  appointments,
  services,
  clients = [],
  config,
  invoices = [],
  onSaveAppointment,
  onDeleteAppointment,
  onUpdateStatus,
  onUpdatePayment,
  onFinalizeService,
  isModalOpen,
  setIsModalOpen,
  editingAppointment,
  setEditingAppointment,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'list'>('month')
  const [agendaDate, setAgendaDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [calYear, setCalYear] = useState<number>(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState<number>(() => new Date().getMonth()) // 0 - 11
  const [notes, setNotes] = useState<AgendaDayNote[]>(() => getAgendaNotes())

  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteModalDate, setNoteModalDate] = useState(agendaDate)
  const [noteModalContent, setNoteModalContent] = useState('')
  const [noteModalColor, setNoteModalColor] = useState<AgendaDayNote['color']>('gold')

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear((y) => y - 1)
    } else {
      setCalMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear((y) => y + 1)
    } else {
      setCalMonth((m) => m + 1)
    }
  }

  const handleGoToday = () => {
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth())
    setAgendaDate(now.toISOString().split('T')[0])
  }

  const handleOpenNoteModal = (dateStr: string) => {
    const existing = notes.find((n) => n.date === dateStr)
    setNoteModalDate(dateStr)
    setNoteModalContent(existing?.content || '')
    setNoteModalColor(existing?.color || 'gold')
    setIsNoteModalOpen(true)
  }

  const handleSaveNoteModal = () => {
    const updated = saveDayNote(noteModalDate, noteModalContent, noteModalColor)
    setNotes([...updated])
    setIsNoteModalOpen(false)
    showAlert({
      title: 'Nota Guardada',
      message: `La nota para el día ${noteModalDate} se ha guardado en la agenda.`,
      type: 'info',
    })
  }

  const handleDeleteNoteModal = (dateStr: string) => {
    showConfirm({
      title: 'Eliminar Nota',
      message: '¿Deseas eliminar la nota para esta fecha?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => {
        const updated = saveDayNote(dateStr, '')
        setNotes([...updated])
        if (isNoteModalOpen) setIsNoteModalOpen(false)
      },
    })
  }

  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Finalize Service Modal State
  const [finalizingApt, setFinalizingApt] = useState<Appointment | null>(null)

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
    style: 'Cat Eye (Ojo de Gato)',
    notes: '',
  })

  // Open modal for editing
  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt)
    setFormData(apt)
    setIsModalOpen(true)
  }

  const parseDurationMinutes = (durationStr: string): number => {
    const d = (durationStr || '').toLowerCase()
    if (d.includes('30 min') || d.includes('30m')) return 30
    if (d.includes('1 h 15') || d.includes('1h 15') || d.includes('75 min') || d.includes('75m')) return 75
    if (d.includes('1 h 30') || d.includes('1h 30') || d.includes('90 min') || d.includes('90m')) return 90
    if (d.includes('2 h 30') || d.includes('2h 30') || d.includes('150 min')) return 150
    if (d.includes('2 h') || d.includes('2h') || d.includes('120 min')) return 120
    if (d.includes('1 h') || d.includes('1h') || d.includes('60 min')) return 60
    if (d.includes('45 min') || d.includes('45m')) return 45
    return 60
  }

  // Open modal for creating
  const handleNew = (defaultDate?: string, defaultTime?: string) => {
    setEditingAppointment(null)
    const firstSrv = services[0]
    const durMin = firstSrv ? parseDurationMinutes(firstSrv.duration) : 75
    setFormData({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      date: defaultDate || agendaDate || new Date().toISOString().split('T')[0],
      time: defaultTime || '11:00',
      durationMinutes: durMin,
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
    const durMin = parseDurationMinutes(s.duration)
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full select-none">

      {/* View Switcher: Calendario Mensual vs Horario Diario vs Lista */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-line">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-850 border border-line">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'month'
                ? 'bg-ink-800 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            <IconCalendar size={15} />
            <span>Calendario Mensual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-ink-800 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            <IconClock size={15} />
            <span>Horario del Día</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-ink-800 text-white'
                : 'text-muted hover:text-white'
            }`}
          >
            <span className="text-sm">📋</span>
            <span>Vista Lista ({appointments.length})</span>
          </button>
        </div>

        {/* Date / Month / Year Navigator depending on view */}
        {viewMode === 'month' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-line">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold-300 hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* Month selector */}
            <select
              value={calMonth}
              onChange={(e) => setCalMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-ink-850 border border-line text-xs font-bold text-white focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            {/* Year selector */}
            <select
              value={calYear}
              onChange={(e) => setCalYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-ink-850 border border-line text-xs font-mono font-bold text-gold-300 focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleOpenNoteModal(agendaDate)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>📝</span>
              <span>Nota del Día</span>
            </button>
          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-ink-850 hover:bg-ink-800 text-gray-300 hover:text-white border border-line text-xs font-semibold transition-colors cursor-pointer"
            >
              <IconCalendar size={14} />
              <span>Ver Calendario Mensual</span>
            </button>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-line">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(agendaDate)
                  d.setDate(d.getDate() - 1)
                  const newDate = d.toISOString().split('T')[0]
                  setAgendaDate(newDate)
                  setCalYear(d.getFullYear())
                  setCalMonth(d.getMonth())
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
              >
                ← Ayer
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold-300 hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(agendaDate)
                  d.setDate(d.getDate() + 1)
                  const newDate = d.toISOString().split('T')[0]
                  setAgendaDate(newDate)
                  setCalYear(d.getFullYear())
                  setCalMonth(d.getMonth())
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Mañana →
              </button>
            </div>

            <input
              type="date"
              value={agendaDate}
              onChange={(e) => {
                if (e.target.value) {
                  setAgendaDate(e.target.value)
                  const d = new Date(e.target.value)
                  setCalYear(d.getFullYear())
                  setCalMonth(d.getMonth())
                }
              }}
              className="px-3 py-2 rounded-xl bg-ink-850 border border-line text-xs font-mono font-bold text-white focus:outline-none focus:border-gold-500 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleOpenNoteModal(agendaDate)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>📝</span>
              <span>Nota</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. MONTHLY CALENDAR VIEW */}
      {viewMode === 'month' && (() => {
        const firstDayOfMonth = new Date(calYear, calMonth, 1)
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
        const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate()

        interface CalendarCell {
          dayNumber: number
          dateStr: string
          isCurrentMonth: boolean
          isToday: boolean
          isSelected: boolean
          apts: Appointment[]
          note?: AgendaDayNote
        }

        const cells: CalendarCell[] = []

        // Previous month padding
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
          const d = daysInPrevMonth - i
          const pMonth = calMonth === 0 ? 11 : calMonth - 1
          const pYear = calMonth === 0 ? calYear - 1 : calYear
          const dStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          cells.push({
            dayNumber: d,
            dateStr: dStr,
            isCurrentMonth: false,
            isToday: dStr === todayStr,
            isSelected: dStr === agendaDate,
            apts: appointments.filter((a) => a.date === dStr),
            note: notes.find((n) => n.date === dStr),
          })
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
          const dStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          cells.push({
            dayNumber: d,
            dateStr: dStr,
            isCurrentMonth: true,
            isToday: dStr === todayStr,
            isSelected: dStr === agendaDate,
            apts: appointments.filter((a) => a.date === dStr),
            note: notes.find((n) => n.date === dStr),
          })
        }

        // Next month padding to reach 35 or 42
        const totalTarget = cells.length > 35 ? 42 : 35
        const remaining = totalTarget - cells.length
        for (let d = 1; d <= remaining; d++) {
          const nMonth = calMonth === 11 ? 0 : calMonth + 1
          const nYear = calMonth === 11 ? calYear + 1 : calYear
          const dStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          cells.push({
            dayNumber: d,
            dateStr: dStr,
            isCurrentMonth: false,
            isToday: dStr === todayStr,
            isSelected: dStr === agendaDate,
            apts: appointments.filter((a) => a.date === dStr),
            note: notes.find((n) => n.date === dStr),
          })
        }

        // Month metrics
        const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`
        const monthApts = appointments.filter((a) => a.date.startsWith(monthPrefix))
        const monthCompleted = monthApts.filter((a) => a.status === 'completada').length
        const monthIncome = monthApts.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        const monthNotesCount = notes.filter((n) => n.date.startsWith(monthPrefix)).length

        // Selected day data
        const selectedDayApts = appointments.filter((a) => a.date === agendaDate)
        const selectedDayNote = notes.find((n) => n.date === agendaDate)
        const selectedDateObj = new Date(agendaDate + 'T00:00:00')
        const selectedDateFormatted = selectedDateObj.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Monthly KPI Header */}
            <div className="p-4 sm:p-5 rounded-2xl bg-ink-850 border border-line flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold block">
                  Resumen Mensual del Estudio
                </span>
                <h3 className="text-lg font-semibold font-sans text-white capitalize mt-0.5">
                  {MONTH_NAMES[calMonth]} de {calYear}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-ink-800 border border-line">
                  <span className="text-muted">Citas Mes: </span>
                  <strong className="text-white tabular-nums">{monthApts.length}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span>Completadas: </span>
                  <strong className="tabular-nums">{monthCompleted}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300">
                  <span>Previsión: </span>
                  <strong className="tabular-nums">{monthIncome} €</strong>
                </div>
                {monthNotesCount > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
                    <span>📝</span>
                    <span className="tabular-nums">{monthNotesCount} notas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar 7-Day Grid */}
            <div className="rounded-3xl bg-ink-900 border border-line overflow-hidden shadow-2xl">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-line bg-ink-850 text-center text-xs font-bold text-gray-400 py-3">
                <div className="text-gray-300">Lunes</div>
                <div className="text-gray-300">Martes</div>
                <div className="text-gray-300">Miércoles</div>
                <div className="text-gray-300">Jueves</div>
                <div className="text-gray-300">Viernes</div>
                <div className="text-gold-400/80">Sábado</div>
                <div className="text-gold-400/80">Domingo</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-line">
                {cells.map((cell) => {
                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setAgendaDate(cell.dateStr)}
                      className={`min-h-[105px] p-2 transition-all flex flex-col justify-between group cursor-pointer relative ${
                        cell.isCurrentMonth ? 'bg-ink-900 hover:bg-ink-850' : 'bg-ink-900/60 opacity-40 hover:opacity-75'
                      } ${
                        cell.isSelected
                          ? 'ring-2 ring-gold-400/80 bg-ink-800 z-10 shadow-lg'
                          : ''
                      }`}
                    >
                      {/* Cell Header: Day Number & Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-semibold transition-colors ${
                            cell.isToday
                              ? 'bg-gold-500 text-black font-bold'
                              : cell.isSelected
                              ? 'text-gold-300 bg-gold-500/20'
                              : cell.isCurrentMonth
                              ? 'text-gray-200 group-hover:text-white'
                              : 'text-gray-500'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Quick add appointment button on hover */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNew(cell.dateStr)
                            }}
                            title={`Agendar cita el ${cell.dateStr}`}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/30 text-gold-300 transition-opacity cursor-pointer"
                          >
                            <IconPlus size={12} />
                          </button>

                          {/* Note Indicator */}
                          {cell.note && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenNoteModal(cell.dateStr)
                              }}
                              title={`Nota: ${cell.note.content}`}
                              className="p-0.5 rounded text-xs hover:scale-125 transition-transform cursor-pointer"
                            >
                              📝
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Middle: Appointments Chips */}
                      <div className="space-y-1 my-1 overflow-hidden flex-1">
                        {cell.apts.slice(0, 2).map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAgendaDate(cell.dateStr)
                              setViewMode('agenda')
                            }}
                            className={`flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer transition-all hover:scale-[1.02] ${
                              apt.status === 'completada'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : apt.status === 'confirmada'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                            title={`${apt.time} • ${apt.clientName} (${apt.serviceName})`}
                          >
                            <span className="font-mono font-bold shrink-0">{apt.time}</span>
                            <span className="truncate">{apt.clientName}</span>
                          </div>
                        ))}

                        {cell.apts.length > 2 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              setAgendaDate(cell.dateStr)
                              setViewMode('agenda')
                            }}
                            className="text-[9px] text-gold-400 font-bold px-1 hover:underline cursor-pointer"
                          >
                            +{cell.apts.length - 2} citas más →
                          </div>
                        )}

                        {cell.note && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenNoteModal(cell.dateStr)
                            }}
                            className="text-[9px] text-amber-300/90 italic truncate px-1 hover:text-amber-200 cursor-pointer"
                            title={cell.note.content}
                          >
                            "{cell.note.content}"
                          </div>
                        )}
                      </div>

                      {/* Cell Footer: Mini Status Bar if appointments */}
                      <div className="h-1 flex rounded-full overflow-hidden bg-transparent">
                        {cell.apts.length > 0 && (
                          <div
                            className={`h-full w-full rounded-full ${
                              cell.apts.every((a) => a.status === 'completada')
                                ? 'bg-emerald-500'
                                : cell.apts.some((a) => a.status === 'completada')
                                ? 'bg-amber-400'
                                : 'bg-gold-500'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Summary & Notes Drawer */}
            <div className="p-5 rounded-2xl bg-ink-850 border border-line space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-line">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-gold-400 block">
                    Jornada Seleccionada
                  </span>
                  <h4 className="text-base font-semibold font-sans text-white capitalize mt-0.5">
                    {selectedDateFormatted}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('agenda')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                  >
                    <IconClock size={14} />
                    <span>Ver Horario del Día ({selectedDayApts.length} citas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNew(agendaDate)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-white border border-line-strong text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconPlus size={14} />
                    <span>Nueva Cita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenNoteModal(agendaDate)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>📝</span>
                    <span>{selectedDayNote ? 'Editar Nota' : 'Poner Nota del Día'}</span>
                  </button>
                </div>
              </div>

              {/* Day Note Display or Placeholder */}
              {selectedDayNote ? (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📝</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Nota del Estudio para este día
                        </span>
                        {selectedDayNote.updatedAt && (
                          <span className="text-[10px] text-gray-500">
                            (editada recientemente)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {selectedDayNote.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenNoteModal(agendaDate)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNoteModal(agendaDate)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar nota"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleOpenNoteModal(agendaDate)}
                  className="p-3.5 rounded-2xl bg-ink-850/60 border border-dashed border-line hover:border-gold-500/40 flex items-center justify-between gap-3 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">📝</span>
                    <span>No hay notas guardadas para este día. Pulsa para añadir recordatorios, stock o avisos.</span>
                  </span>
                  <span className="text-gold-400 font-bold text-xs shrink-0">+ Añadir Nota</span>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* AGENDA VIEW: Timeline by hours */}
      {viewMode === 'agenda' && (
        <div className="space-y-5 animate-fade-in">
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
              <div className="p-4 rounded-2xl bg-ink-850 border border-line flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-gold-400 font-semibold block">
                    Horario de la Jornada
                  </span>
                  <h4 className="text-base font-semibold font-sans tracking-tight text-white capitalize mt-0.5">
                    {dateFormatted}
                  </h4>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="px-3 py-1.5 rounded-xl bg-ink-800 border border-line">
                    <span className="text-muted">Citas: </span>
                    <strong className="text-white tabular-nums">{dayApts.length}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <span>Completadas: </span>
                    <strong className="tabular-nums">{completed}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <span>Confirmadas: </span>
                    <strong className="tabular-nums">{confirmed}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-300">
                    <span>Previsión: </span>
                    <strong className="tabular-nums">{totalIncome} €</strong>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Day Note Banner in Agenda View */}
          {(() => {
            const dayNote = notes.find((n) => n.date === agendaDate)
            if (dayNote) {
              return (
                <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/35 flex items-start justify-between gap-4 shadow-md animate-fade-in">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📝</span>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                        Nota del Estudio para esta Jornada
                      </span>
                      <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {dayNote.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenNoteModal(agendaDate)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Editar Nota
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNoteModal(agendaDate)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Eliminar nota"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              )
            }
            return (
              <div
                onClick={() => handleOpenNoteModal(agendaDate)}
                className="p-3.5 rounded-2xl bg-ink-850/60 border border-dashed border-line hover:border-gold-500/40 flex items-center justify-between text-xs text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>📝</span>
                  <span>Sin notas para esta jornada. Pulsa aquí para añadir recordatorios o tareas del día.</span>
                </span>
                <span className="text-gold-400 font-bold">+ Añadir Nota</span>
              </div>
            )
          })()}

          {/* Timeline Schedule from 09:00 to 20:30 */}
          <div className="rounded-3xl bg-ink-900 border border-line p-6 space-y-3 shadow-xl">
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
                      {matchedApt.status !== 'completada' ? (
                        <button
                          type="button"
                          onClick={() => setFinalizingApt(matchedApt)}
                          title="Finalizar servicio y emitir factura oficial a Facturación & Caja"
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
                            const inv = invoices.find((i) => i.appointmentId === matchedApt.id)
                            return inv ? <span className="text-[10.5px] text-gold-400 font-mono">({inv.number})</span> : null
                          })()}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEmail(matchedApt, 'confirmar')}
                        title="Enviar confirmación de cita por correo"
                        className="p-2 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 transition-colors cursor-pointer"
                      >
                        <IconMail size={15} />
                      </button>
                    </div>
                  </div>
                )
              }

              // Empty time slot with quick add
              return (
                <div
                  key={timeSlot}
                  onClick={() => handleNew(agendaDate, timeSlot)}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-ink-850/40 hover:bg-ink-800 border border-dashed border-line hover:border-gold-500/50 transition-all cursor-pointer"
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
        <div className="space-y-6 animate-fade-in">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-ink-850 border border-line flex flex-wrap items-center justify-between gap-4">
            {/* Date Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-800 border border-line">
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
                className="px-3 py-1.5 rounded-xl bg-ink-800 border border-line text-xs text-gray-200 focus:outline-none focus:border-gold-500"
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
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ink-800 border border-line text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-ink-850 border border-line">
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
                className="p-5 rounded-2xl bg-ink-850 border border-line hover:border-gold-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Time & Client Data */}
                <div className="flex items-start gap-4">
                  <div className="px-3.5 py-2.5 rounded-xl bg-ink-800 border border-line text-center min-w-[80px]">
                    <span className="block text-[11px] font-mono text-gray-400 uppercase tracking-wider">{apt.date}</span>
                    <span className="block text-base font-bold font-mono text-gold-300 mt-0.5">{apt.time}</span>
                    <span className="block text-[10px] text-gray-500">{apt.durationMinutes} min</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-white text-base">{apt.clientName}</h4>
                      <span className="text-xs font-mono text-gray-400 bg-ink-850 px-2 py-0.5 rounded-md">
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
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                          apt.status === 'completada'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : apt.status === 'confirmada'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : apt.status === 'cancelada'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {apt.status}
                      </span>
                      {/* Payment Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          apt.paymentStatus === 'pagado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : apt.paymentStatus === 'seña_pagada'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
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
                        <span className="px-2 py-0.5 rounded bg-ink-800 text-gray-300 border border-line">
                          Curva: <strong className="text-gold-400">{apt.curl}</strong>
                        </span>
                      )}
                      {apt.length && (
                        <span className="px-2 py-0.5 rounded bg-ink-800 text-gray-300 border border-line">
                          Longitud: <strong className="text-gold-400">{apt.length}</strong>
                        </span>
                      )}
                      {apt.style && (
                        <span className="px-2 py-0.5 rounded bg-ink-800 text-gray-300 border border-line">
                          Diseño: <strong className="text-gold-400">{apt.style}</strong>
                        </span>
                      )}
                      {apt.notes && (
                        <span className="text-gray-400 italic">"{apt.notes}"</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Finalize Button, Email Actions & Admin Controls */}
                <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                  {/* Prominent "Finalizar Servicio" button */}
                  {apt.status !== 'completada' ? (
                    <button
                      type="button"
                      onClick={() => setFinalizingApt(apt)}
                      title="Finalizar servicio y emitir factura automáticamente en Facturación & Caja"
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 hover:text-gold-200 border border-gold-500/35 hover:border-gold-400/60 text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <IconCheck size={14} className="text-gold-400 stroke-[2.5]" />
                      <span>Finalizar Servicio</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14120c] border border-gold-500/25 text-gold-300 text-xs font-medium">
                      <IconCheck size={13} className="text-gold-400 stroke-[2.5]" />
                      <span>Servicio Finalizado</span>
                      {(() => {
                        const inv = invoices.find((i) => i.appointmentId === apt.id)
                        return inv ? <span className="text-[10.5px] text-gold-400 font-mono">({inv.number})</span> : null
                      })()}
                    </div>
                  )}

                  {/* Email Action Buttons - Sends luxury email via Resend */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-800 border border-line">
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
                    className="px-2.5 py-1.5 rounded-xl bg-ink-800 border border-line-strong text-xs text-gray-200 focus:outline-none focus:border-gold-500"
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
                    className="p-2 rounded-xl bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line-strong transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <h3 className="font-sans text-xl font-semibold text-white flex items-center gap-2">
                <IconCalendar size={20} className="text-gold-400" />
                {editingAppointment ? 'Editar Cita de Estudio' : 'Nueva Cita en GoldBlack Lash'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-ink-800 transition-colors"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Duración (minutos)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Ficha Técnica de Pestañas */}
              <div className="p-4 rounded-xl bg-ink-800 border border-line space-y-3">
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
                      className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white"
                    >
                      <option value="C">Curva C (Natural)</option>
                      <option value="D">Curva D (Volumen glamuroso)</option>
                      <option value="M">Curva M (Efecto lifting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Longitud de fibras</label>
                    <select
                      value={formData.length || '9 - 13 mm'}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white font-mono"
                    >
                      <option value="9 - 13 mm">9 - 13 mm (Longitud Media / Estándar)</option>
                      <option value="8 - 12 mm">8 - 12 mm (Natural / Equilibrada)</option>
                      <option value="10 - 14 mm">10 - 14 mm (Efecto Glamour)</option>
                      <option value="7 - 11 mm">7 - 11 mm (Corta / Sutil)</option>
                      <option value="11 - 15 mm">11 - 15 mm (Extra Longitud)</option>
                      <option value="8 - 14 mm">8 - 14 mm (Graduado amplio)</option>
                      <option value="8 mm">8 mm</option>
                      <option value="9 mm">9 mm</option>
                      <option value="10 mm">10 mm</option>
                      <option value="11 mm">11 mm</option>
                      <option value="12 mm">12 mm</option>
                      <option value="13 mm">13 mm</option>
                      <option value="14 mm">14 mm</option>
                      <option value="15 mm">15 mm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Diseño de Ojo</label>
                    <select
                      value={formData.style || 'Cat Eye (Ojo de Gato)'}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value as LashStyle })}
                      className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white"
                    >
                      <option value="Natural">Natural (Armónico)</option>
                      <option value="Cat Eye (Ojo de Gato)">Cat Eye (Ojo de Gato)</option>
                      <option value="Doll Eye (Muñeca)">Doll Eye (Muñeca)</option>
                      <option value="Ardilla (Squirrel)">Ardilla (Squirrel)</option>
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
                    className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white"
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
                    className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white"
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
                    className="w-full px-3 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white"
                  >
                    <option value="pendiente">Pendiente de pago</option>
                    <option value="seña_pagada">Seña recibida (reserva)</option>
                    <option value="pagado">Totalmente pagado</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 border border-line-strong text-gray-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-xs uppercase tracking-wider transition-colors"
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

      {/* Smart Finalize Service & Invoicing Modal */}
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

      {/* Note Modal: Add / Edit Day Note */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📝</span>
                <div>
                  <h3 className="font-semibold text-white text-base">Nota de la Jornada</h3>
                  <span className="text-xs text-gold-300 font-mono">{noteModalDate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Contenido del Recordatorio / Nota
              </label>
              <textarea
                rows={4}
                value={noteModalContent}
                onChange={(e) => setNoteModalContent(e.target.value)}
                placeholder="Ejemplo: Llega pedido de adhesivo D-curl. Clienta María necesita prueba de parche. Horario intensivo 10:00 - 15:00."
                className="w-full p-3.5 rounded-xl bg-ink-900 border border-line-strong text-white text-xs placeholder-gray-500 focus:outline-none focus:border-gold-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line">
              {notes.some((n) => n.date === noteModalDate) ? (
                <button
                  type="button"
                  onClick={() => handleDeleteNoteModal(noteModalDate)}
                  className="px-3.5 py-2 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-750 border border-line-strong text-gray-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNoteModal}
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-xs uppercase tracking-wider cursor-pointer active:scale-95 transition-colors"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
