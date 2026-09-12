import React, { useState } from 'react'
import { AdminService } from '../types/admin'
import {
  IconSparkles,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconEuro,
} from './Icons'

interface ServicesProps {
  services: AdminService[]
  onSaveService: (service: AdminService) => void
  onDeleteService: (id: string) => void
}

export const Services: React.FC<ServicesProps> = ({
  services,
  onSaveService,
  onDeleteService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<AdminService | null>(null)

  const [formData, setFormData] = useState<Partial<AdminService>>({
    name: '',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    price: '30 €',
    priceNumber: 30,
    duration: '2 h',
    badge: '',
    description: '',
    featured: false,
    active: true,
    includes: ['Diseño personalizado', 'Sellado y baño de vitaminas'],
  })

  const [newInclusion, setNewInclusion] = useState('')

  const categories = [
    { id: 'all', name: 'Todos los servicios' },
    { id: 'extensiones', name: 'Extensiones' },
    { id: 'mantenimiento', name: 'Mantenimiento' },
    { id: 'lifting', name: 'Lifting & Tinte' },
    { id: 'extras', name: 'Extras' },
  ]

  const handleEdit = (service: AdminService) => {
    setEditingService(service)
    setFormData(service)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingService(null)
    setFormData({
      name: '',
      categoryId: 'extensiones',
      categoryName: 'Extensiones de pestañas',
      price: '30 €',
      priceNumber: 30,
      duration: '2 h',
      badge: 'Nuevo',
      description: '',
      featured: false,
      active: true,
      includes: ['Diseño anatómico de ojo', 'Cepillo de peinado de regalo'],
    })
    setIsModalOpen(true)
  }

  const handleAddInclusion = () => {
    if (!newInclusion.trim()) return
    setFormData({
      ...formData,
      includes: [...(formData.includes || []), newInclusion.trim()],
    })
    setNewInclusion('')
  }

  const handleRemoveInclusion = (index: number) => {
    const updated = [...(formData.includes || [])]
    updated.splice(index, 1)
    setFormData({ ...formData, includes: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert('Por favor introduce el nombre del servicio')
      return
    }

    const catName =
      formData.categoryId === 'extensiones'
        ? 'Extensiones de pestañas'
        : formData.categoryId === 'mantenimiento'
        ? 'Mantenimiento & Retoques'
        : formData.categoryId === 'lifting'
        ? 'Lifting & Tratamientos'
        : 'Servicios Extras'

    const serviceToSave: AdminService = {
      id: editingService ? editingService.id : `srv-${Date.now()}`,
      categoryId: formData.categoryId || 'extensiones',
      categoryName: catName,
      name: formData.name || '',
      badge: formData.badge || '',
      description: formData.description || '',
      duration: formData.duration || '1 h 30 min',
      price: `${formData.priceNumber} €`,
      priceNumber: Number(formData.priceNumber) || 30,
      featured: !!formData.featured,
      active: formData.active !== false,
      includes: formData.includes && formData.includes.length > 0 ? formData.includes : ['Atención exclusiva personalizada'],
    }

    onSaveService(serviceToSave)
    setIsModalOpen(false)
  }

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false
    return true
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
            <IconSparkles size={24} className="text-gold-400" />
            Catálogo de Servicios y Tarifas
          </h3>
          <p className="text-xs text-gray-400">
            Configura precios, duraciones, insignias y detalles incluidos en cada tratamiento.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow self-start sm:self-auto"
        >
          <IconPlus size={16} />
          <span>Añadir Servicio</span>
        </button>
      </div>

      {/* Real-Time Sync Status Banner */}
      <div className="p-3.5 px-4 rounded-xl bg-[#14141e] border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <p className="text-gray-300">
            <strong className="text-white font-semibold">Sincronización en Tiempo Real Activa: </strong>
            Al editar o crear un servicio aquí, el precio se actualiza inmediatamente en{' '}
            <span className="text-gold-300 font-medium">goldblacklash.vercel.app</span> sin esperas.
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shrink-0">
          ● Neon DB Live
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'bg-[#14141d] text-gray-400 hover:text-white border border-[#222230]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`rounded-2xl p-6 transition-all flex flex-col justify-between border ${
              service.featured
                ? 'bg-gradient-to-b from-[#181824] to-[#12121a] border-gold-500/40 shadow-gold-glow'
                : 'bg-[#12121a] border-[#222230] hover:border-gold-500/20'
            }`}
          >
            <div>
              {/* Header: Badge & Actions */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  {service.categoryName}
                </span>
                <div className="flex items-center gap-1.5">
                  {service.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                      {service.badge}
                    </span>
                  )}
                  {service.featured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ★ Destacado
                    </span>
                  )}
                </div>
              </div>

              {/* Service Name & Price */}
              <h4 className="text-lg font-bold font-serif text-white">{service.name}</h4>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-serif text-gold-300">{service.price}</span>
                <span className="text-xs text-gray-400 font-mono">/ {service.duration}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                {service.description}
              </p>

              {/* Inclusions */}
              <div className="mt-4 pt-4 border-t border-[#20202e] space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                  Qué incluye:
                </span>
                {service.includes.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <IconCheck size={13} className="text-gold-400 shrink-0" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 pt-4 border-t border-[#20202e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    service.active ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {service.active ? 'Activo en web' : 'Pausado'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 rounded-xl bg-[#1c1c28] hover:bg-[#28283a] text-gray-300 hover:text-white border border-[#2b2b3e] transition-colors"
                  title="Editar servicio"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar servicio "${service.name}"?`)) {
                      onDeleteService(service.id)
                    }
                  }}
                  className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 transition-colors"
                  title="Eliminar servicio"
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <IconSparkles size={20} className="text-gold-400" />
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio de Pestañas'}
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
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nombre del Tratamiento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Volumen Ruso Intenso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Categoría</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  >
                    <option value="extensiones">Extensiones de pestañas</option>
                    <option value="mantenimiento">Mantenimiento & Retoques</option>
                    <option value="lifting">Lifting & Tratamientos</option>
                    <option value="extras">Servicios Extras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Insignia / Badge</label>
                  <input
                    type="text"
                    placeholder="Ej. Más Popular, 3D-6D, Nuevo"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    required
                    value={formData.priceNumber}
                    onChange={(e) => setFormData({ ...formData, priceNumber: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Duración</label>
                  <input
                    type="text"
                    placeholder="Ej. 1 h 30 min, 2 h"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explica el efecto, las fibras utilizadas y para qué tipo de ojo se recomienda..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Inclusions editor */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Puntos Incluidos</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Añadir punto incluido..."
                    value={newInclusion}
                    onChange={(e) => setNewInclusion(e.target.value)}
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-3.5 py-1.5 rounded-xl bg-[#28283a] hover:bg-[#34344c] text-xs text-white font-medium"
                  >
                    Añadir
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.includes?.map((inc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#181824] border border-[#252536] text-xs text-gray-300"
                    >
                      <span>• {inc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(i)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded text-gold-500 focus:ring-0"
                  />
                  <span>Destacar en tarjeta dorada</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded text-gold-500 focus:ring-0"
                  />
                  <span>Servicio activo</span>
                </label>
              </div>

              {/* Submit Buttons */}
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
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
