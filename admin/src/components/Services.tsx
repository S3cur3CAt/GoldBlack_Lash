import React, { useState, useRef, useMemo } from 'react'
import { AdminService } from '../types/admin'
import { useDialog } from '../context/DialogContext'
import { resolveImageUrl } from '../services/storage'
import {
  IconSparkles,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconGrid,
  IconList,
  IconImage,
  IconUpload,
} from './Icons'

interface ServicesProps {
  services: AdminService[]
  onSaveService: (service: AdminService) => void
  onDeleteService: (id: string) => void
  isModalOpen?: boolean
  setIsModalOpen?: (open: boolean) => void
}

/**
 * Optimiza y comprime las imágenes seleccionadas desde el Mac para garantizar
 * que se almacenen de forma ligera sin saturar la base de datos ni retardar la web.
 */
const compressImageFile = (
  file: File,
  maxWidth = 1400,
  maxHeight = 1400,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      if (!src) {
        resolve('')
        return
      }
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(src)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(src)
      img.src = src
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

export const Services: React.FC<ServicesProps> = ({
  services,
  onSaveService,
  onDeleteService,
  isModalOpen: propIsModalOpen,
  setIsModalOpen: propSetIsModalOpen,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  const isModalOpen = propIsModalOpen !== undefined ? propIsModalOpen : internalModalOpen
  const setIsModalOpen = propSetIsModalOpen !== undefined ? propSetIsModalOpen : setInternalModalOpen
  const [editingService, setEditingService] = useState<AdminService | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState<Partial<AdminService>>({
    name: '',
    categoryId: 'extensiones',
    categoryName: 'Extensiones de pestañas',
    price: '30 €',
    priceNumber: 30,
    duration: '1 h',
    badge: '',
    description: '',
    image: '',
    featured: false,
    pinnedFirst: false,
    active: true,
    includes: ['Diseño personalizado', 'Sellado y baño de vitaminas'],
  })

  const [newInclusion, setNewInclusion] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [customCatInput, setCustomCatInput] = useState('')

  const [customCategories, setCustomCategories] = useState<{ id: string; name: string }[]>(() => {
    try {
      const raw = localStorage.getItem('goldblack_admin_custom_categories')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const DEFAULT_CATEGORIES: { id: string; name: string }[] = [
    { id: 'extensiones', name: 'Extensiones de pestañas' },
    { id: 'extras', name: 'Tratamientos y extras' },
  ]

  const allCategories = useMemo(() => {
    const map = new Map<string, string>()
    DEFAULT_CATEGORIES.forEach((c) => map.set(c.id, c.name))
    customCategories.forEach((c) => map.set(c.id, c.name))
    services.forEach((s) => {
      if (s.categoryId && s.categoryName) {
        map.set(s.categoryId, s.categoryName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [services, customCategories])

  const filterTabs = useMemo(
    () => [{ id: 'all', name: 'Todos los servicios' }, ...allCategories],
    [allCategories]
  )

  const handleEdit = (service: AdminService) => {
    setEditingService(service)
    setFormData({
      ...service,
      image: service.image || '',
      pinnedFirst: !!service.pinnedFirst,
    })
    setIsCreatingCategory(false)
    setCustomCatInput('')
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingService(null)
    setIsCreatingCategory(false)
    setCustomCatInput('')
    setFormData({
      name: '',
      categoryId: 'extensiones',
      categoryName: 'Extensiones de pestañas',
      price: '30 €',
      priceNumber: 30,
      duration: '1 h',
      badge: 'Nuevo',
      description: '',
      image: '',
      featured: false,
      pinnedFirst: false,
      active: true,
      includes: ['Diseño anatómico de ojo', 'Cepillo de peinado de regalo'],
    })
    setIsModalOpen(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImageFile(file)
      if (compressed) {
        setFormData((prev) => ({ ...prev, image: compressed }))
      }
    } catch (err) {
      console.warn('Error al comprimir la imagen:', err)
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImageFile(file)
      if (compressed) {
        setFormData((prev) => ({ ...prev, image: compressed }))
      }
    } catch (err) {
      console.warn('Error al procesar la imagen arrastrada:', err)
    }
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
      showAlert({
        title: 'Nombre requerido',
        message: 'Por favor introduce el nombre del servicio para continuar.',
        type: 'warning',
      })
      return
    }

    let finalCatId = formData.categoryId || 'extensiones'
    let finalCatName = formData.categoryName || 'Extensiones de pestañas'

    if (isCreatingCategory) {
      const trimmed = customCatInput.trim()
      if (!trimmed) {
        showAlert({
          title: 'Categoría requerida',
          message: 'Por favor introduce el nombre de la nueva categoría.',
          type: 'warning',
        })
        return
      }
      finalCatName = trimmed
      finalCatId =
        trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || `cat-${Date.now()}`

      const updated = [
        ...customCategories.filter((c) => c.id !== finalCatId),
        { id: finalCatId, name: finalCatName },
      ]
      setCustomCategories(updated)
      try {
        localStorage.setItem('goldblack_admin_custom_categories', JSON.stringify(updated))
      } catch (err) {
        console.warn('Error saving custom category:', err)
      }
    } else {
      const found = allCategories.find((c) => c.id === finalCatId)
      if (found) finalCatName = found.name
    }

    const serviceToSave: AdminService = {
      id: editingService ? editingService.id : `srv-${Date.now()}`,
      categoryId: finalCatId,
      categoryName: finalCatName,
      name: formData.name || '',
      badge: formData.badge || '',
      description: formData.description || '',
      duration: formData.duration || '1 h 30 min',
      price: `${formData.priceNumber} €`,
      priceNumber: Number(formData.priceNumber) || 30,
      featured: !!formData.featured,
      pinnedFirst: !!formData.pinnedFirst,
      active: formData.active !== false,
      includes: Array.isArray(formData.includes) ? formData.includes : [],
      image: formData.image ? formData.image.trim() : undefined,
    }

    onSaveService(serviceToSave)
    setIsModalOpen(false)
  }

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (a.pinnedFirst && !b.pinnedFirst) return -1
      if (!a.pinnedFirst && b.pinnedFirst) return 1
      return 0
    })
  }, [services])

  const filteredServices = sortedServices.filter((s) => {
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false
    return true
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full select-none">
      {/* Filter and View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'bg-ink-850 text-gray-400 hover:text-white border border-line hover:border-line-strong'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* View Toggle & New Service Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-ink-950 font-bold text-xs transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <IconPlus size={14} />
            <span>Nuevo Servicio</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-850 border border-line">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista Cuadrícula con Fotografías"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <IconGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Vista Lista con Miniaturas"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <IconList size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Services Presentation: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`rounded-2xl overflow-hidden transition-all flex flex-col justify-between border group ${
                service.featured
                  ? 'bg-ink-850 border-gold-500/40 shadow-lg shadow-gold-950/20'
                  : 'bg-ink-850 border-line hover:border-gold-500/30'
              }`}
            >
              <div>
                {/* Visual Banner of the Service */}
                <div className="relative w-full h-44 bg-ink-900 overflow-hidden shrink-0 border-b border-line">
                  {service.image ? (
                    <>
                      <img
                        src={resolveImageUrl(service.image)}
                        alt={service.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.opacity = '0.3'
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-black/20 to-black/40" />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-ink-900 to-ink-850 text-gray-500 group-hover:text-gray-400 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-ink-800 border border-line-strong flex items-center justify-center mb-1.5 group-hover:border-gold-500/40 group-hover:text-gold-400 transition-colors">
                        <IconImage size={22} className="text-gray-500 group-hover:text-gold-400 transition-colors" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="text-[11px] text-gold-400 hover:text-gold-300 font-semibold underline cursor-pointer flex items-center gap-1 mt-0.5"
                      >
                        <span>+ Añadir foto desde tu Mac</span>
                      </button>
                    </div>
                  )}

                  {/* Top Floating Badges over the image */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="text-[9.5px] uppercase font-mono tracking-wider text-gold-300 font-bold px-2.5 py-0.5 rounded-full bg-black/75 border border-gold-500/30 backdrop-blur-md truncate max-w-[140px] shadow-sm">
                      {service.categoryName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {service.pinnedFirst && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-black border border-amber-300 backdrop-blur-md shadow-sm">
                          ⭐ 1º web
                        </span>
                      )}
                      {service.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold-500/90 text-black border border-gold-300 backdrop-blur-md shadow-sm">
                          {service.badge}
                        </span>
                      )}
                      {service.featured && !service.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black border border-amber-300 backdrop-blur-md shadow-sm">
                          ★
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick change photo button on hover */}
                  {service.image && (
                    <button
                      type="button"
                      onClick={() => handleEdit(service)}
                      title="Cambiar fotografía del servicio desde tu Mac"
                      className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/75 hover:bg-black text-gray-200 hover:text-gold-300 border border-white/20 text-[10px] font-medium transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-md cursor-pointer"
                    >
                      <IconImage size={12} />
                      <span>Cambiar foto</span>
                    </button>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-bold font-sans text-white truncate" title={service.name}>
                    {service.name}
                  </h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold font-sans text-gold-300">{service.price}</span>
                    <span className="text-[11px] text-gray-400 font-mono">/ {service.duration}</span>
                  </div>

                  {/* Description */}
                  <p className="text-[11.5px] text-gray-400 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Inclusions */}
                  {Array.isArray(service.includes) && service.includes.length > 0 && (
                    <div className="pt-2 border-t border-line flex flex-wrap gap-1">
                      {service.includes.map((inc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-ink-800 text-gray-300 border border-line"
                        >
                          <IconCheck size={10} className="text-gold-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{inc}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="p-4 pt-0">
                <div className="pt-2.5 border-t border-line flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        service.active ? 'bg-emerald-400' : 'bg-gray-500'
                      }`}
                    />
                    <span className="text-[11px] text-gray-400">
                      {service.active ? 'Activo en web' : 'Pausado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white border border-line-strong transition-colors cursor-pointer"
                      title="Editar servicio y foto"
                    >
                      <IconEdit size={13} />
                    </button>
                    <button
                      onClick={() => {
                        showConfirm({
                          title: 'Eliminar Servicio',
                          message: `¿Estás seguro de que deseas eliminar permanentemente el servicio "${service.name}"? Esta acción se sincronizará con la base de datos y la web.`,
                          confirmText: 'Eliminar',
                          danger: true,
                          onConfirm: () => onDeleteService(service.id),
                        })
                      }}
                      className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                      title="Eliminar servicio"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="rounded-2xl border border-line bg-ink-850 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-ink-850 text-gray-400 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Servicio &amp; Fotografía</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Duración</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Inclusiones</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-ink-800/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail with quick Mac photo trigger */}
                      <div
                        onClick={() => handleEdit(service)}
                        className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-line-strong bg-ink-900 cursor-pointer group/thumb hover:border-gold-400 transition-colors shadow-sm"
                        title="Clic para ver o cambiar fotografía desde tu Mac"
                      >
                        {service.image ? (
                          <img
                            src={resolveImageUrl(service.image)}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 group-hover/thumb:text-gold-400">
                            <IconImage size={18} />
                            <span className="text-[7px] text-gray-500 font-mono uppercase mt-0.5">+ Foto</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <IconEdit size={12} />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{service.name}</span>
                          {service.pinnedFirst && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1 shadow-sm">
                              ⭐ 1º en la web
                            </span>
                          )}
                          {service.featured && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              ★ Destacado
                            </span>
                          )}
                          {service.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/30">
                              {service.badge}
                            </span>
                          )}
                        </div>
                        {service.image ? (
                          <span className="text-[10px] text-gold-400/80 font-mono flex items-center gap-1 mt-0.5">
                            <IconCheck size={10} className="text-emerald-400" />
                            <span>Con foto de catálogo</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                            Sin fotografía asignada
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">{service.categoryName}</td>
                  <td className="py-3 px-4 text-gray-300 font-mono">{service.duration}</td>
                  <td className="py-3 px-4 text-gold-300 font-bold font-sans text-sm">{service.price}</td>
                  <td className="py-3 px-4 text-gray-400 max-w-xs truncate">
                    {service.includes.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] ${
                        service.active ? 'text-emerald-400' : 'text-gray-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          service.active ? 'bg-emerald-400' : 'bg-gray-500'
                        }`}
                      />
                      {service.active ? 'Activo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-750 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <IconEdit size={13} />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: 'Eliminar Servicio',
                            message: `¿Estás seguro de que deseas eliminar permanentemente el servicio "${service.name}"? Esta acción se sincronizará con la base de datos y la web.`,
                            confirmText: 'Eliminar',
                            danger: true,
                            onConfirm: () => onDeleteService(service.id),
                          })
                        }}
                        className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/40 text-red-400 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-ink-900 border border-line shadow-raised animate-scale-up p-6 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <h3 className="font-sans text-xl font-semibold text-white flex items-center gap-2">
                <IconSparkles size={20} className="text-gold-400" />
                {editingService ? 'Editar Servicio y Fotografía' : 'Nuevo Servicio de Pestañas'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-300">
                      Categoría *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(!isCreatingCategory)
                        setCustomCatInput('')
                      }}
                      className="text-[11px] text-gold-400 hover:text-gold-300 font-medium transition-colors cursor-pointer"
                    >
                      {isCreatingCategory ? '← Elegir existente' : '+ Crear nueva categoría'}
                    </button>
                  </div>

                  {isCreatingCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ej. Cejas & Microblading, Masajes..."
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-gold-500/40 text-sm text-white focus:outline-none focus:border-gold-400 placeholder-gray-500"
                      />
                      <p className="text-[10px] text-gray-400 leading-snug">
                        Se guardará como categoría independiente en los filtros y listas.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingCategory(true)
                          setCustomCatInput('')
                        } else {
                          const found = allCategories.find((c) => c.id === e.target.value)
                          setFormData({
                            ...formData,
                            categoryId: e.target.value,
                            categoryName: found?.name || e.target.value,
                          })
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                      <option value="__new__" className="text-gold-400 font-semibold">
                        + Crear nueva categoría...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Insignia / Badge</label>
                  <input
                    type="text"
                    placeholder="Ej. Más Popular, 3D-6D, Nuevo"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    required
                    value={formData.priceNumber}
                    onChange={(e) => setFormData({ ...formData, priceNumber: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Duración</label>
                  <input
                    type="text"
                    placeholder="Ej. 30 min, 1 h, 1 h 15 min"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white"
                  />
                </div>
              </div>

              {/* Fotografía del Servicio (Seleccionar desde tu Mac) */}
              <div className="rounded-xl p-4 bg-ink-800 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                    <IconImage size={15} className="text-gold-400" />
                    <span>Fotografía del Servicio (Seleccionar desde tu Mac)</span>
                  </label>
                  {formData.image && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      ✓ Foto asignada
                    </span>
                  )}
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed rounded-xl transition-all ${
                    isDragging
                      ? 'border-gold-400 bg-gold-950/20'
                      : 'border-line-strong bg-ink-850 hover:border-gold-500/40'
                  }`}
                >
                  {formData.image ? (
                    <div className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden border border-gold-500/40 bg-black/60 shadow-md">
                      <img
                        src={resolveImageUrl(formData.image)}
                        alt="Vista previa del servicio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-end p-1.5">
                        <span className="text-[9px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded">
                          Vista previa
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-ink-900 border border-line-strong flex flex-col items-center justify-center shrink-0 text-gray-500">
                      <IconUpload size={26} className="text-gray-500 mb-1" />
                      <span className="text-[9px] uppercase font-mono text-gray-500">Sin foto</span>
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-ink-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <IconUpload size={14} />
                        <span>{formData.image ? 'Cambiar imagen desde tu Mac' : 'Seleccionar Imagen desde tu Mac'}</span>
                      </button>

                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-ink-800 hover:bg-rose-950/40 text-gray-400 hover:text-rose-300 border border-line hover:border-rose-500/30 text-xs transition-colors cursor-pointer"
                        >
                          <IconTrash size={13} />
                          <span>Eliminar foto</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Haz clic para buscar en los archivos de tu Mac o arrastra una imagen directamente aquí.
                      <span className="text-gray-500 block text-[10px] mt-0.5">
                        Formatos: JPG, PNG, WEBP. Se optimiza y comprime automáticamente para la web.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explica el efecto, las fibras utilizadas y para qué tipo de ojo se recomienda..."
                  className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
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
                    className="flex-1 px-3.5 py-1.5 rounded-xl bg-ink-800 border border-line-strong text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-3.5 py-1.5 rounded-xl bg-ink-750 hover:bg-ink-750 text-xs text-white font-medium cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.includes?.map((inc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-ink-800 border border-line text-xs text-gray-300"
                    >
                      <span>• {inc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(i)}
                        className="text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        <IconX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded text-gold-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Destacar en tarjeta dorada</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gold-400 font-semibold hover:text-gold-300 transition-colors bg-gold-950/30 border border-gold-500/40 px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={formData.pinnedFirst}
                    onChange={(e) => setFormData({ ...formData, pinnedFirst: e.target.checked })}
                    className="rounded text-gold-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <span>⭐</span> Posicionar como primer servicio de toda la página
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded text-gold-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Servicio activo en web</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 border border-line-strong text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95"
                >
                  Guardar Servicio y Fotografía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
