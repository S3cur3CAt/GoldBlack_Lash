import React, { useState } from 'react'
import { Client, StudioConfig, LashCurl, LashStyle } from '../types/admin'
import {
  IconUsers,
  IconPlus,
  IconSearch,
  IconWhatsApp,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconX,
  IconSparkles,
} from './Icons'
import { createWhatsAppRecallUrl } from '../services/storage'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

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
      alert('Nombre y teléfono son obligatorios')
      return
    }

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      allergies: formData.allergies || 'Ninguna conocida',
      preferredStyle: formData.preferredStyle as LashStyle,
      preferredCurl: formData.preferredCurl as LashCurl,
      totalVisits: editingClient ? editingClient.totalVisits : 1,
      totalSpent: editingClient ? editingClient.totalSpent : 30,
      lastVisitDate: editingClient?.lastVisitDate || new Date().toISOString().split('T')[0],
      notes: formData.notes || '',
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
            Historial de sesiones, alergias, sensibilidades y recordatorios de retoque.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow self-start sm:self-auto"
        >
          <IconPlus size={16} />
          <span>Nueva Ficha</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111118] border border-[#20202c] flex items-center justify-between gap-4">
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
        <span className="text-xs text-gray-400">
          Total: <strong className="text-white">{filteredClients.length}</strong> clientas registradas
        </span>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClients.map((client) => {
          const diffDays = client.lastVisitDate
            ? Math.floor((nowMs - new Date(client.lastVisitDate).getTime()) / 86400000)
            : 0
          const needsRecall = diffDays >= 20
          const recallUrl = createWhatsAppRecallUrl(client, config)

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
                      className="p-2 rounded-xl bg-[#1c1c28] hover:bg-[#28283a] text-gray-300 hover:text-white border border-[#2b2b3e]"
                      title="Editar ficha"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la ficha de ${client.name}?`)) {
                          onDeleteClient(client.id)
                        }
                      }}
                      className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20"
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

              {/* WhatsApp Recall CTA */}
              <div className="mt-5 pt-3 border-t border-[#20202e] flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Registrada el {client.createdAt}
                </span>
                <a
                  href={recallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                >
                  <IconWhatsApp size={14} />
                  <span>Invitar a Retoque</span>
                </a>
              </div>
            </div>
          )
        })}
      </div>

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
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230]"
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
                  placeholder="Ej. Paula Morales"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 612345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email (opcional)</label>
                  <input
                    type="email"
                    placeholder="paula@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Estilo Habitual</label>
                  <select
                    value={formData.preferredStyle}
                    onChange={(e) => setFormData({ ...formData, preferredStyle: e.target.value as LashStyle })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  >
                    <option value="Cat Eye (Ojo de Gato)">Cat Eye (Ojo de Gato)</option>
                    <option value="Doll Eye (Muñeca)">Doll Eye (Muñeca)</option>
                    <option value="Natural">Natural</option>
                    <option value="Ardilla (Squirrel)">Ardilla (Squirrel)</option>
                    <option value="Efecto Kim / Híbrido">Efecto Kim / Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Curvatura Favorita</label>
                  <select
                    value={formData.preferredCurl}
                    onChange={(e) => setFormData({ ...formData, preferredCurl: e.target.value as LashCurl })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  >
                    <option value="C">Curva C</option>
                    <option value="CC">Curva CC</option>
                    <option value="D">Curva D</option>
                    <option value="DD">Curva DD</option>
                    <option value="M">Curva M</option>
                    <option value="L">Curva L</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Alergias o Sensibilidad Ocular
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ojo seco, sensibilidad a parches hidrogel, usar cinta micropore"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Notas Técnicas / Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Detalles de la sesión, remolinos, preferencias de longitud..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

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
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
