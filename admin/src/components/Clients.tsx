import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import { Client, StudioConfig, LashCurl, LashStyle } from '../types/admin'
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconMail,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconX,
  IconGrid,
  IconList,
  IconClock,
  IconCheck,
} from './Icons'
import { EmailModal, EmailModalMode } from './EmailModal'

export type ClientsViewMode = 'grid' | 'list' | 'compact'

interface ClientsProps {
  clients: Client[]
  config: StudioConfig
  onSaveClient: (client: Client) => void
  onDeleteClient: (id: string) => void
}

export const Clients: React.FC<ClientsProps> = ({
  clients,
  config,
  onSaveClient,
  onDeleteClient,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  // View Mode: 'grid' (standard cards) | 'list' (table) | 'compact' (dense cards)
  const [viewMode, setViewMode] = useState<ClientsViewMode>(() => {
    try {
      const saved = localStorage.getItem('goldblack_admin_clients_view_mode')
      if (saved === 'grid' || saved === 'list' || saved === 'compact') return saved
    } catch {}
    return 'grid'
  })

  const handleSetViewMode = (mode: ClientsViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('goldblack_admin_clients_view_mode', mode)
    } catch {}
  }

  // Email Modal State for direct Resend messaging
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedEmailClient, setSelectedEmailClient] = useState<Client | null>(null)
  const [emailModalMode, setEmailModalMode] = useState<EmailModalMode>('retoque')

  const handleOpenEmail = (client: Client, mode: EmailModalMode = 'retoque') => {
    setSelectedEmailClient(client)
    setEmailModalMode(mode)
    setEmailModalOpen(true)
  }

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    allergies: '',
    preferredStyle: 'Cat Eye (Ojo de Gato)',
    preferredCurl: 'D',
    notes: '',
  })

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData(client)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      allergies: 'Ninguna conocida',
      preferredStyle: 'Cat Eye (Ojo de Gato)',
      preferredCurl: 'D',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone) {
      showAlert({
        title: 'Datos requeridos',
        message: 'El nombre y teléfono son obligatorios para guardar la ficha de la clienta.',
        type: 'warning',
      })
      return
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || '',
      allergies: formData.allergies?.trim() || 'Ninguna conocida',
      preferredStyle: formData.preferredStyle as LashStyle,
      preferredCurl: formData.preferredCurl as LashCurl,
      totalVisits: editingClient ? editingClient.totalVisits : 1,
      totalSpent: editingClient ? editingClient.totalSpent : 30,
      lastVisitDate: editingClient?.lastVisitDate || new Date().toISOString().split('T')[0],
      notes: formData.notes?.trim() || '',
      createdAt: editingClient?.createdAt || new Date().toISOString().split('T')[0],
    }

    onSaveClient(clientToSave)
    setIsModalOpen(false)
  }

  const nowMs = Date.now()
  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    )
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
            <IconUsers size={24} className="text-gold-400" />
            Directorio y Fichas de Clientas
          </h3>
          <p className="text-xs text-gray-400">
            Historial de sesiones, alergias, sensibilidades y avisos de retoque por correo corporativo.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow self-start sm:self-auto cursor-pointer"
        >
          <IconPlus size={16} />
          <span>Nueva Ficha</span>
        </button>
      </div>

      {/* Controls Bar: Search & View Mode Switcher */}
      <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202c] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#181824] border border-[#272738] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden md:inline">
            Total: <strong className="text-white">{filteredClients.length}</strong> clientas
          </span>

          {/* View Mode Toggle: Grid | List | Compact */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161622] border border-[#242436]">
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              title="Vista Tarjetas Detalladas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconGrid size={14} />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              title="Vista Lista / Tabla Completa"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconList size={14} />
              <span className="hidden sm:inline">Lista</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('compact')}
              title="Vista Compacta (Alta Densidad)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'compact'
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
                <div className="bg-current rounded-[1px]" />
              </div>
              <span className="hidden sm:inline">Compacto</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRESENTATION MODE 1: GRID (Detailed Cards) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClients.map((client) => {
            const diffDays = client.lastVisitDate
              ? Math.floor((nowMs - new Date(client.lastVisitDate).getTime()) / 86400000)
              : 0
            const needsRecall = diffDays >= 20

            return (
              <div
                key={client.id}
                className="p-5 rounded-2xl bg-[#12121a] border border-[#222230] hover:border-gold-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{client.name}</h4>
                        {needsRecall && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <IconAlertCircle size={10} />
                            Retoque ({diffDays} días)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="font-mono text-gold-300">{client.phone}</span>
                        {client.email && <span>• {client.email}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 rounded-xl bg-[#1c1c28] hover:bg-[#28283a] text-gray-300 hover:text-white border border-[#2b2b3e] cursor-pointer"
                        title="Editar ficha"
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: 'Eliminar Ficha',
                            message: `¿Estás seguro de que deseas eliminar la ficha de ${client.name}? Se perderá su historial de visitas y preferencias de pestañas.`,
                            confirmText: 'Eliminar',
                            danger: true,
                            onConfirm: () => onDeleteClient(client.id),
                          })
                        }}
                        className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 cursor-pointer"
                        title="Eliminar ficha"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Metrics: Visits & Spend */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[#171722] border border-[#222232] text-center">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500">Visitas</span>
                      <span className="text-sm font-bold text-white font-mono">{client.totalVisits}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500">Gasto Total</span>
                      <span className="text-sm font-bold text-gold-300 font-mono">{client.totalSpent} €</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-gray-500">Última Visita</span>
                      <span className="text-xs font-medium text-gray-300 font-mono">{client.lastVisitDate || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Technical Lash Specs */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Estilo favorito:</span>
                      <span className="px-2 py-0.5 rounded bg-[#1c1c28] text-gray-200 border border-[#29293c]">
                        {client.preferredStyle || 'Cat Eye'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#1c1c28] text-gold-300 font-mono border border-[#29293c]">
                        Curva {client.preferredCurl || 'D'}
                      </span>
                    </div>

                    {client.allergies && (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 text-[11px]">
                        <IconAlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span><strong>Alergias / Sensibilidad:</strong> {client.allergies}</span>
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-[11px] text-gray-400 italic bg-[#171722] p-2 rounded-lg">
                        "{client.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Recall CTA */}
                <div className="mt-5 pt-3 border-t border-[#20202e] flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Registrada el {client.createdAt}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenEmail(client, 'retoque')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-950/40 hover:bg-gold-900/60 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <IconMail size={14} />
                    <span>Invitar a Retoque (Correo)</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PRESENTATION MODE 2: LIST / TABLE */}
      {viewMode === 'list' && (
        <div className="rounded-2xl bg-[#12121a] border border-[#222230] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171724] border-b border-[#252538] text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Clienta</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold text-center">Visitas</th>
                  <th className="px-4 py-3 font-semibold text-center">Gasto</th>
                  <th className="px-4 py-3 font-semibold">Última Visita</th>
                  <th className="px-4 py-3 font-semibold">Estilo / Curva</th>
                  <th className="px-4 py-3 font-semibold">Alergias / Notas</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2c]">
                {filteredClients.map((client) => {
                  const diffDays = client.lastVisitDate
                    ? Math.floor((nowMs - new Date(client.lastVisitDate).getTime()) / 86400000)
                    : 0
                  const needsRecall = diffDays >= 20

                  return (
                    <tr key={client.id} className="hover:bg-[#181824] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-700/10 border border-gold-500/30 flex items-center justify-center font-bold text-gold-300 text-xs">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{client.name}</span>
                            {needsRecall && (
                              <span className="text-[9px] font-semibold text-amber-300">
                                Retoque ({diffDays}d)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gold-300 block">{client.phone}</span>
                        {client.email ? (
                          <span className="text-gray-400 text-[11px] block truncate max-w-[160px]">{client.email}</span>
                        ) : (
                          <span className="text-gray-600 text-[10px]">Sin email</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {client.totalVisits}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-gold-300">
                        {client.totalSpent} €
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono text-[11px]">
                        {client.lastVisitDate || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#1c1c28] text-gray-200 border border-[#29293c] text-[10px] inline-block mr-1">
                          {client.preferredStyle || 'Cat Eye'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#1c1c28] text-gold-300 font-mono text-[10px] border border-[#29293c]">
                          {client.preferredCurl || 'D'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {client.allergies && client.allergies !== 'Ninguna conocida' ? (
                          <span className="text-red-300 text-[10px] line-clamp-1">
                            ⚠ {client.allergies}
                          </span>
                        ) : client.notes ? (
                          <span className="text-gray-400 italic text-[10px] line-clamp-1">
                            {client.notes}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-[10px]">Ninguna</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEmail(client, 'retoque')}
                            title="Enviar correo de recordatorio o retoque"
                            className="p-1.5 rounded-lg bg-gold-950/40 hover:bg-gold-900/60 text-gold-300 border border-gold-500/30 cursor-pointer"
                          >
                            <IconMail size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(client)}
                            title="Editar ficha"
                            className="p-1.5 rounded-lg bg-[#1c1c28] hover:bg-[#28283a] text-gray-300 hover:text-white border border-[#2b2b3e] cursor-pointer"
                          >
                            <IconEdit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirm({
                                title: 'Eliminar Ficha',
                                message: `¿Eliminar a ${client.name}?`,
                                confirmText: 'Eliminar',
                                danger: true,
                                onConfirm: () => onDeleteClient(client.id),
                              })
                            }}
                            title="Eliminar"
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 cursor-pointer"
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRESENTATION MODE 3: COMPACT (Dense cards grid) */}
      {viewMode === 'compact' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredClients.map((client) => {
            const diffDays = client.lastVisitDate
              ? Math.floor((nowMs - new Date(client.lastVisitDate).getTime()) / 86400000)
              : 0
            const needsRecall = diffDays >= 20

            return (
              <div
                key={client.id}
                className="p-3.5 rounded-xl bg-[#12121a] border border-[#222230] hover:border-gold-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-gold-500/20 to-gold-700/10 border border-gold-500/30 flex items-center justify-center font-bold text-gold-300 text-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white text-xs truncate">{client.name}</h4>
                        <span className="font-mono text-[11px] text-gold-400 block">{client.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEmail(client, 'retoque')}
                        className="p-1.5 rounded-lg bg-gold-950/40 hover:bg-gold-900/60 text-gold-300 border border-gold-500/30 cursor-pointer"
                        title="Enviar correo"
                      >
                        <IconMail size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(client)}
                        className="p-1.5 rounded-lg bg-[#1c1c28] hover:bg-[#28283a] text-gray-300 hover:text-white border border-[#2b2b3e] cursor-pointer"
                        title="Editar"
                      >
                        <IconEdit size={12} />
                      </button>
                    </div>
                  </div>

                  {client.email && (
                    <p className="text-[10px] text-gray-400 truncate mt-1.5 pl-10">
                      {client.email}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1e1e2c] text-[10px]">
                    <span className="text-gray-400">
                      Visitas: <strong className="text-white font-mono">{client.totalVisits}</strong>
                    </span>
                    <span className="text-gold-300 font-mono font-semibold">
                      {client.totalSpent} €
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1a1a26] text-gray-300 font-mono border border-[#262638]">
                      Curva {client.preferredCurl || 'D'}
                    </span>
                  </div>
                </div>

                {needsRecall && (
                  <div className="mt-2 text-[9px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-center">
                    Aviso retoque ({diffDays}d)
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Create / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <IconUsers size={20} className="text-gold-400" />
                {editingClient ? 'Editar Ficha de Clienta' : 'Nueva Ficha de Clienta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230] cursor-pointer"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Ortiz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Teléfono Móvil *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 604 18 76 76"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estilo Preferido</label>
                  <select
                    value={formData.preferredStyle}
                    onChange={(e) => setFormData({ ...formData, preferredStyle: e.target.value as LashStyle })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  >
                    <option value="Natural">Natural</option>
                    <option value="Cat Eye (Ojo de Gato)">Cat Eye (Ojo de Gato)</option>
                    <option value="Doll Eye (Muñeca)">Doll Eye (Muñeca)</option>
                    <option value="Ardilla (Squirrel)">Ardilla (Squirrel)</option>
                    <option value="Efecto Kim / Híbrido">Efecto Kim / Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Curvatura Favorita</label>
                  <select
                    value={formData.preferredCurl}
                    onChange={(e) => setFormData({ ...formData, preferredCurl: e.target.value as LashCurl })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400 font-mono"
                  >
                    <option value="C">C (Suave / Natural)</option>
                    <option value="CC">CC (Curvatura Media)</option>
                    <option value="D">D (Marcada / Glamour)</option>
                    <option value="DD">DD (Súper Curva)</option>
                    <option value="M">M (Efecto Lifting Elevado)</option>
                    <option value="L">L (Párpado Encapotado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Alergias o Sensibilidad Ocular
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ninguna conocida / Sensibilidad a vapores"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Notas de la Ficha Técnica</label>
                <textarea
                  rows={2}
                  placeholder="Grosor habitual, mapa de longitudes, preferencias personales..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#252536]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow cursor-pointer"
                >
                  {editingClient ? 'Guardar Cambios' : 'Crear Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Modal for CRM Communication (Resend) */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        client={selectedEmailClient}
        config={config}
        initialMode={emailModalMode}
        onClientEmailUpdated={(email) => {
          if (selectedEmailClient) {
            const updated = { ...selectedEmailClient, email }
            setSelectedEmailClient(updated)
            onSaveClient(updated)
          }
        }}
      />
    </div>
  )
}
