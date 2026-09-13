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
import { getAgendaNotes, saveDayNote, addDayNote, deleteDayNoteById, updateDayNoteById } from '../services/storage'
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

  // Notes Side Panel State (replaces modal — supports multiple notes per day)
  const [notesPanelDate, setNotesPanelDate] = useState<string | null>(null)
  const [notePanelInput, setNotePanelInput] = useState('')
  const [notePanelColor, setNotePanelColor] = useState<AgendaDayNote['color']>('gold')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')

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

  /** Open notes side panel for a day */
  const handleOpenNotesPanel = (dateStr: string) => {
    setNotesPanelDate(dateStr)
    setNotePanelInput('')
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  /** Add a new note to the panel date */
  const handleAddNote = () => {
    if (!notesPanelDate || !notePanelInput.trim()) return
    const updated = addDayNote(notesPanelDate, notePanelInput, notePanelColor)
    setNotes([...updated])
    setNotePanelInput('')
  }

  /** Delete a note by id */
  const handleDeleteNote = (id: string) => {
    showConfirm({
      title: 'Eliminar Nota',
      message: '¿Eliminar esta nota?',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      danger: true,
      onConfirm: () => {
        const updated = deleteDayNoteById(id)
        setNotes([...updated])
        if (editingNoteId === id) setEditingNoteId(null)
      },
    })
  }

  /** Save inline edit of a note */
  const handleSaveEditNote = (id: string) => {
    if (!editingNoteText.trim()) return
    const updated = updateDayNoteById(id, editingNoteText)
    setNotes([...updated])
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  // Keep saveDayNote for agenda view banner (legacy single-note display)
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)] select-none">

      {/* View Switcher: Calendario Mensual vs Horario Diario vs Lista */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#1f1f2c]">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#14141e] border border-[#242436]">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-gold-glow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <IconCalendar size={15} />
            <span>Calendario Mensual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-gold-glow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <IconClock size={15} />
            <span>Horario del Día</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-gold-glow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="text-sm">📋</span>
            <span>Vista Lista ({appointments.length})</span>
          </button>
        </div>

        {/* Date / Month / Year Navigator depending on view */}
        {viewMode === 'month' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#14141e] border border-[#242436]">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mes anterior"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold-300 hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Mes siguiente"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* Month selector */}
            <select
              value={calMonth}
              onChange={(e) => setCalMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-[#14141e] border border-[#242436] text-xs font-bold text-white focus:outline-none focus:border-gold-500 cursor-pointer"
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
              className="px-3 py-2 rounded-xl bg-[#14141e] border border-[#242436] text-xs font-mono font-bold text-gold-300 focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>


          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#14141e] hover:bg-[#1f1f2e] text-gray-300 hover:text-white border border-[#242436] text-xs font-semibold transition-colors cursor-pointer"
            >
              <IconCalendar size={14} />
              <span>Ver Calendario Mensual</span>
            </button>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#14141e] border border-[#242436]">
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
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
              >
                ← Ayer
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gold-300 hover:bg-[#1f1f2e] transition-colors cursor-pointer"
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
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#1f1f2e] transition-colors cursor-pointer"
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
              className="px-3 py-2 rounded-xl bg-[#14141e] border border-[#242436] text-xs font-mono font-bold text-white focus:outline-none focus:border-gold-500 cursor-pointer"
            />


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
          <div className="space-y-6 animate-fadeIn">
            {/* Notes Side Panel + Calendar layout */}
            {/* Monthly KPI Header */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#151522] via-[#11111a] to-[#0c0c14] border border-gold-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gold-400 font-bold block">
                  Resumen Mensual del Estudio
                </span>
                <h3 className="text-lg font-bold font-sans text-white capitalize mt-0.5">
                  {MONTH_NAMES[calMonth]} de {calYear}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-[#181826] border border-[#262638]">
                  <span className="text-gray-400">Citas Mes: </span>
                  <strong className="text-white">{monthApts.length}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <span>Completadas: </span>
                  <strong>{monthCompleted}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-300">
                  <span>Previsión: </span>
                  <strong>{monthIncome} €</strong>
                </div>
                {monthNotesCount > 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>{monthNotesCount} notas</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar + Notes Side Panel */}
            <div className={`flex gap-4 ${notesPanelDate ? 'items-start' : ''}`}>
            {/* Calendar 7-Day Grid */}
            <div className={`rounded-3xl bg-[#0f0f17] border border-[#1e1e2d] overflow-hidden shadow-2xl transition-all ${notesPanelDate ? 'flex-1 min-w-0' : 'w-full'}`}>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-[#222234] bg-[#141420] text-center text-xs font-bold text-gray-400 py-3">
                <div className="text-gray-300 hidden sm:block">Lunes</div>
                <div className="text-gray-300 hidden sm:block">Martes</div>
                <div className="text-gray-300 hidden sm:block">Miércoles</div>
                <div className="text-gray-300 hidden sm:block">Jueves</div>
                <div className="text-gray-300 hidden sm:block">Viernes</div>
                <div className="text-gold-400/80 hidden sm:block">Sábado</div>
                <div className="text-gold-400/80 hidden sm:block">Domingo</div>
                <div className="text-gray-300 sm:hidden">Lu</div>
                <div className="text-gray-300 sm:hidden">Ma</div>
                <div className="text-gray-300 sm:hidden">Mi</div>
                <div className="text-gray-300 sm:hidden">Ju</div>
                <div className="text-gray-300 sm:hidden">Vi</div>
                <div className="text-gold-400/80 sm:hidden">Sa</div>
                <div className="text-gold-400/80 sm:hidden">Do</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-[#1c1c2a]">
                {cells.map((cell) => {
                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setAgendaDate(cell.dateStr)}
                      className={`min-h-[105px] p-2 transition-all flex flex-col justify-between group cursor-pointer relative ${
                        cell.isCurrentMonth ? 'bg-[#0f0f17] hover:bg-[#151524]' : 'bg-[#09090f]/60 opacity-40 hover:opacity-75'
                      } ${
                        cell.isSelected
                          ? 'ring-2 ring-gold-400/80 bg-[#171728] z-10 shadow-lg'
                          : ''
                      }`}
                    >
                      {/* Cell Header: Day Number & Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-bold transition-all ${
                            cell.isToday
                              ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-black shadow-gold-glow font-black'
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
                          {/* Quick notes panel button on hover */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (notesPanelDate === cell.dateStr) {
                                setNotesPanelDate(null)
                              } else {
                                handleOpenNotesPanel(cell.dateStr)
                              }
                            }}
                            title={`Notas del ${cell.dateStr}`}
                            className={`p-1 rounded-lg transition-all cursor-pointer ${
                              notesPanelDate === cell.dateStr
                                ? 'opacity-100 bg-amber-500/30 text-amber-200'
                                : 'opacity-0 group-hover:opacity-100 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300'
                            }`}
                          >
                            <IconPlus size={12} />
                          </button>

                          {/* Note count indicator */}
                          {notes.filter((n) => n.date === cell.dateStr).length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenNotesPanel(cell.dateStr)
                              }}
                              title={`${notes.filter((n) => n.date === cell.dateStr).length} nota(s)`}
                              className="p-0.5 rounded text-xs hover:scale-125 transition-transform cursor-pointer leading-none"
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

                        {(() => {
                          const dayNotes = notes.filter((n) => n.date === cell.dateStr)
                          if (dayNotes.length === 0) return null
                          return (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenNotesPanel(cell.dateStr)
                              }}
                              className="text-[9px] text-amber-300/90 italic truncate px-1 hover:text-amber-200 cursor-pointer"
                              title={dayNotes.map((n) => n.content).join(' | ')}
                            >
                              {dayNotes.length === 1 ? `"${dayNotes[0].content}"` : `${dayNotes.length} notas`}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Cell Footer: Mini Status Bar if appointments */}
                      <div className="h-1 flex rounded-full overflow-hidden bg-transparent">
                        {cell.apts.length > 0 && (
                          <div
                            className={`h-full w-full rounded-full ${
                              cell.apts.every((a) => a.status === 'completada')
                                ? 'bg-emerald-500'
                                : cell.apts.some((a) => a.status === 'completada')
                                ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
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

            {/* ── Notes Side Panel ── */}
            {notesPanelDate && (
              <div className="w-72 shrink-0 rounded-3xl bg-[#0f0f17] border border-amber-500/30 shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2d] bg-[#141420]">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">Notas</span>
                    <span className="text-xs font-mono font-bold text-white">{notesPanelDate}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotesPanelDate(null)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#252538] transition-colors cursor-pointer"
                  >
                    <IconX size={16} />
                  </button>
                </div>

                {/* Existing Notes List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72">
                  {notes.filter((n) => n.date === notesPanelDate).length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-4">Sin notas para este día.<br />Escribe abajo para añadir.</p>
                  )}
                  {notes.filter((n) => n.date === notesPanelDate).map((note) => (
                    <div key={note.id} className="group rounded-xl bg-[#1a1a26] border border-[#2a2a3d] p-3 space-y-1.5">
                      {editingNoteId === note.id ? (
                        <>
                          <textarea
                            rows={3}
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            autoFocus
                            className="w-full bg-[#0d0d14] border border-[#2b2b3d] rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                          />
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => { setEditingNoteId(null); setEditingNoteText('') }}
                              className="px-2.5 py-1 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#252538] cursor-pointer"
                            >Cancelar</button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 cursor-pointer"
                            >Guardar</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <button
                              type="button"
                              onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.content) }}
                              className="p-1 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Editar"
                            ><IconEdit size={12} /></button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar"
                            ><IconTrash size={12} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="p-3 border-t border-[#1e1e2d] space-y-2 bg-[#0c0c12]">
                  <textarea
                    rows={3}
                    value={notePanelInput}
                    onChange={(e) => setNotePanelInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote() }}
                    placeholder="Nueva nota... (Ctrl+Enter para guardar)"
                    className="w-full bg-[#0d0d14] border border-[#2b2b3d] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                  />
                  {/* Color selector */}
                  <div className="flex items-center gap-1.5">
                    {(['gold', 'rose', 'amber', 'blue', 'emerald'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNotePanelColor(c)}
                        title={c}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          c === 'gold' ? 'bg-yellow-400' :
                          c === 'rose' ? 'bg-rose-400' :
                          c === 'amber' ? 'bg-amber-400' :
                          c === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
                        } ${notePanelColor === c ? 'ring-2 ring-white scale-125' : 'opacity-60 hover:opacity-100'}`}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={!notePanelInput.trim()}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <IconPlus size={12} />
                      Añadir
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Selected Date Summary & Notes Drawer */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-[#141420] via-[#101018] to-[#0c0c14] border border-gold-500/35 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#222232]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gold-400 block">
                    Jornada Seleccionada
                  </span>
                  <h4 className="text-base font-bold font-sans text-white capitalize mt-0.5">
                    {selectedDateFormatted}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('agenda')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all cursor-pointer active:scale-95"
                  >
                    <IconClock size={14} />
                    <span>Ver Horario ({selectedDayApts.length} citas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNew(agendaDate)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1b28] hover:bg-[#252538] text-white border border-[#2c2c40] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconPlus size={14} />
                    <span>Nueva Cita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenNotesPanel(agendaDate)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>📝</span>
                    <span>Notas ({notes.filter((n) => n.date === agendaDate).length})</span>
                  </button>
                </div>
              </div>

              {/* Day Notes Summary */}
              {(() => {
                const dayNotes = notes.filter((n) => n.date === agendaDate)
                if (dayNotes.length === 0) return (
                  <div
                    onClick={() => handleOpenNotesPanel(agendaDate)}
                    className="p-3.5 rounded-2xl bg-[#11111a]/60 border border-dashed border-[#262638] hover:border-amber-500/40 flex items-center justify-between gap-3 text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">📝</span>
                      <span>Sin notas para este día. Pulsa para añadir recordatorios, stock o avisos.</span>
                    </span>
                    <span className="text-amber-400 font-bold text-xs shrink-0">+ Añadir Nota</span>
                  </div>
                )
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">📝 Notas del Día ({dayNotes.length})</span>
                      <button
                        type="button"
                        onClick={() => handleOpenNotesPanel(agendaDate)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 font-semibold cursor-pointer"
                      >+ Añadir nota</button>
                    </div>
                    {dayNotes.map((note) => (
                      <div key={note.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/25">
                        <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed flex-1">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                        ><IconTrash size={12} /></button>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })()}

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

          {/* Day Notes Banner in Agenda View */}
          {(() => {
            const dayNotes = notes.filter((n) => n.date === agendaDate)
            if (dayNotes.length > 0) {
              return (
                <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/35 shadow-md animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      📝 Notas de la Jornada ({dayNotes.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenNotesPanel(agendaDate)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      + Añadir / Gestionar
                    </button>
                  </div>
                  {dayNotes.map((note) => (
                    <div key={note.id} className="flex items-start gap-2">
                      <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed flex-1">• {note.content}</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                      ><IconTrash size={12} /></button>
                    </div>
                  ))}
                </div>
              )
            }
            return (
              <div
                onClick={() => handleOpenNotesPanel(agendaDate)}
                className="p-3.5 rounded-2xl bg-[#11111a]/60 border border-dashed border-[#242436] hover:border-amber-500/40 flex items-center justify-between text-xs text-gray-400 hover:text-gray-200 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>📝</span>
                  <span>Sin notas para esta jornada. Pulsa aquí para añadir recordatorios o tareas del día.</span>
                </span>
                <span className="text-amber-400 font-bold">+ Añadir Nota</span>
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
                      <option value="D">Curva D (Volumen glamuroso)</option>
                      <option value="M">Curva M (Efecto lifting)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Longitud de fibras</label>
                    <select
                      value={formData.length || '9 - 13 mm'}
                      onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white font-mono"
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
                      className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
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

      {/* Notes side panel is now rendered inline inside the calendar layout */}
    </div>
  )
}
