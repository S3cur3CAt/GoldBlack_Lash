import React, { useState, useMemo } from 'react'
import { useDialog } from '../context/DialogContext'
import { GalleryItem } from '../types/admin'
import {
  IconImage,
  IconPlus,
  IconTrash,
  IconEdit,
  IconX,
  IconUpload,
  IconCheck,
  IconSparkles,
  IconSearch,
} from './Icons'

interface GalleryManagerProps {
  galleryItems: GalleryItem[]
  onSaveItem: (item: GalleryItem) => void
  onDeleteItem: (id: string) => void
}

const DEFAULT_CATEGORIES = [
  'Fibras Tecnológicas',
  'Densidad y Negro Intenso',
  'Volumen Ruso',
  'Clásicas Pelo a Pelo',
  'Mega Volumen',
  'Híbridas / Kim',
  'Lifting de Pestañas',
  'Cuidado Facial',
]

const QUICK_ELEMENT_SUGGESTIONS = [
  'Curvatura D',
  'Curvatura C',
  'Curvatura M',
  'Curvatura CC',
  'Grosor 0.07',
  'Grosor 0.05',
  'Fibras Tecnológicas',
  'Efecto Cat Eye',
  'Efecto Doll Eye',
  'Efecto Ardilla',
  'Efecto Mojado',
  'Efecto Eyeliner',
  'Largo 8-13 mm',
  'Negro Carbón Mate',
  '100% Personalizado',
  'Retención +4 semanas',
]

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  galleryItems,
  onSaveItem,
  onDeleteItem,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Fibras Tecnológicas')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [customCatInput, setCustomCatInput] = useState('')
  const [price, setPrice] = useState('')
  const [badge, setBadge] = useState('')
  const [detail, setDetail] = useState('')
  const [featured, setFeatured] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  // Elements Manager State
  const [elements, setElements] = useState<string[]>([])
  const [newElementInput, setNewElementInput] = useState('')

  // Dynamically compute available categories from existing items + defaults
  const categoriesList = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES)
    galleryItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set)
  }, [galleryItems])

  // Filtered gallery items
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(query)
        const matchesCategory = item.category.toLowerCase().includes(query)
        const matchesDetail = item.detail?.toLowerCase().includes(query) || false
        const matchesPrice = item.price?.toLowerCase().includes(query) || false
        const matchesBadge = item.badge?.toLowerCase().includes(query) || false
        const matchesElements = item.elements?.some((e) => e.toLowerCase().includes(query)) || false

        if (!matchesTitle && !matchesCategory && !matchesDetail && !matchesPrice && !matchesBadge && !matchesElements) {
          return false
        }
      }
      return true
    })
  }, [galleryItems, selectedCategory, searchQuery])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setTitle('')
    setCategory('Fibras Tecnológicas')
    setIsCreatingCategory(false)
    setCustomCatInput('')
    setPrice('27 €')
    setBadge('')
    setDetail('')
    setFeatured(false)
    setElements(['Curvatura D', 'Fibras Tecnológicas'])
    setNewElementInput('')
    setPreviewUrl('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setTitle(item.title)
    setCategory(item.category)
    setIsCreatingCategory(false)
    setCustomCatInput('')
    setPrice(item.price || '')
    setBadge(item.badge || '')
    setDetail(item.detail || '')
    setFeatured(!!item.featured)
    setElements(item.elements && item.elements.length > 0 ? [...item.elements] : [])
    setNewElementInput('')
    setPreviewUrl(item.url)
    setIsModalOpen(true)
  }

  const handleAddElement = (elem?: string) => {
    const val = (elem || newElementInput).trim()
    if (!val) return
    if (!elements.includes(val)) {
      setElements([...elements, val])
    }
    if (!elem) {
      setNewElementInput('')
    }
  }

  const handleRemoveElement = (index: number) => {
    const updated = [...elements]
    updated.splice(index, 1)
    setElements(updated)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      showAlert({
        title: 'Título requerido',
        message: 'Por favor introduce un título para la fotografía.',
        type: 'warning',
      })
      return
    }

    if (!previewUrl) {
      showAlert({
        title: 'Fotografía requerida',
        message: 'Por favor selecciona una imagen para el catálogo.',
        type: 'warning',
      })
      return
    }

    let finalCategory = category
    if (isCreatingCategory) {
      const customTrim = customCatInput.trim()
      if (!customTrim) {
        showAlert({
          title: 'Categoría requerida',
          message: 'Por favor introduce el nombre de la nueva categoría o selecciona una de la lista.',
          type: 'warning',
        })
        return
      }
      finalCategory = customTrim
    }

    const itemToSave: GalleryItem = {
      id: editingItem ? editingItem.id : `gal-${Date.now()}`,
      key: editingItem ? editingItem.key : `custom-${Date.now()}`,
      title: title.trim(),
      category: finalCategory,
      detail: detail.trim() || undefined,
      price: price.trim() || undefined,
      badge: badge.trim() || undefined,
      featured,
      elements: elements.filter((el) => el.trim().length > 0),
      url: previewUrl,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    onSaveItem(itemToSave)
    setIsModalOpen(false)
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
            <IconImage size={24} className="text-gold-400" />
            Galería y Catálogo Multimedia
          </h3>
          <p className="text-xs text-gray-400">
            Administra los trabajos de pestañas, edita sus elementos, curvaturas, precios y fotos del catálogo.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow self-start sm:self-auto"
        >
          <IconPlus size={16} />
          <span>Subir Fotografía</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('Todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'Todas'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                : 'bg-[#14141d] text-gray-400 hover:text-white border border-[#222230]'
            }`}
          >
            Todas ({galleryItems.length})
          </button>
          {categoriesList.map((cat) => {
            const count = galleryItems.filter((i) => i.category === cat).length
            if (count === 0 && selectedCategory !== cat) return null
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                    : 'bg-[#14141d] text-gray-400 hover:text-white border border-[#222230]'
                }`}
              >
                {cat} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por técnica, curvatura..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#14141d] border border-[#222230] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
          />
        </div>
      </div>

      {/* Grid of Gallery Cards */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-[#222232] bg-[#12121a] p-12 text-center">
          <IconImage size={36} className="mx-auto text-gray-600 mb-3" />
          <h4 className="font-serif text-lg text-white font-semibold">No se encontraron fotografías</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No hay resultados que coincidan con la búsqueda. Intenta con otros términos.'
              : 'No hay fotografías en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl bg-[#12121a] border border-[#222230] overflow-hidden hover:border-gold-500/40 transition-all flex flex-col shadow-lg"
            >
              {/* Photo Container */}
              <div className="relative aspect-[4/5] w-full bg-[#0d0d12] overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (item.key && !target.src.includes('goldblacklash.vercel.app')) {
                      target.src = `https://goldblacklash.vercel.app/api/images/${item.key}`
                    } else {
                      target.style.display = 'none'
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/75 text-gold-300 border border-gold-500/30 backdrop-blur-md shadow-sm">
                    {item.category}
                  </span>
                  {item.featured && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50 backdrop-blur-md flex items-center gap-1 shadow-sm">
                      ★ Destacada
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-gold-500/30 text-gold-200 border border-gold-400/40 backdrop-blur-md shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Top Right Action Buttons */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-black/70 hover:bg-[#252538] text-gray-200 hover:text-white border border-[#3b3b52] transition-colors backdrop-blur-md shadow-sm"
                    title="Editar fotografía y elementos"
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={() => {
                      showConfirm({
                        title: 'Eliminar Fotografía',
                        message: `¿Estás seguro de que deseas eliminar permanentemente la foto "${item.title}"?`,
                        confirmText: 'Eliminar',
                        danger: true,
                        onConfirm: () => onDeleteItem(item.id),
                      })
                    }}
                    className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 transition-colors backdrop-blur-md shadow-sm"
                    title="Eliminar foto"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>

                {/* Overlaid Bottom Title & Price */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <h5 className="font-serif font-bold text-white text-sm truncate" title={item.title}>
                      {item.title}
                    </h5>
                    {item.price && (
                      <span className="font-serif font-bold text-gold-300 text-sm shrink-0">
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.detail && (
                    <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5 leading-snug">
                      {item.detail}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Elements / Characteristics Chips */}
              <div className="p-3 bg-[#101017] flex-1 flex flex-col justify-between border-t border-[#1e1e2c]">
                <div>
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-gray-500 block mb-1.5">
                    Elementos & Ficha Técnica:
                  </span>
                  {item.elements && item.elements.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {item.elements.map((el, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[#181826] text-gold-300 border border-gold-500/20"
                        >
                          <IconCheck size={10} className="text-gold-400 shrink-0" />
                          <span className="truncate max-w-[130px]">{el}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500 italic">Sin elementos personalizados</span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#181824] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>Clave: {item.key}</span>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="text-gold-400 hover:text-gold-300 font-sans font-semibold flex items-center gap-1"
                  >
                    <IconEdit size={11} />
                    <span>Modificar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Upload / Edit Image & Elements */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <IconSparkles size={20} className="text-gold-400" />
                {editingItem ? 'Editar Fotografía y Elementos' : 'Subir Fotografía al Catálogo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222230] transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Título de la Foto / Trabajo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Volumen Ruso Efecto Seda"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300">Técnica / Categoría</label>
                    {isCreatingCategory ? (
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(false)}
                        className="text-[11px] text-gold-400 hover:underline"
                      >
                        ← Seleccionar existente
                      </button>
                    ) : null}
                  </div>

                  {isCreatingCategory ? (
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoría..."
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-gold-500/50 text-sm text-white focus:outline-none"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCreatingCategory(true)
                          setCustomCatInput('')
                        } else {
                          setCategory(e.target.value)
                        }
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__" className="text-gold-400 font-semibold">
                        + Crear nueva categoría...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Row 2: Price & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Precio orientativo (€)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 27 € o 30 €"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Insignia / Badge
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Más Pedido, Nuevo, Tendencia"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Row 3: Detail / Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Descripción o Detalles del Trabajo
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalla el efecto, las fibras utilizadas y el resultado..."
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Row 4: Elements & Attributes Manager ("Añadir elementos al gusto") */}
              <div className="rounded-xl p-4 bg-[#181824] border border-[#252536] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gold-300 flex items-center gap-1.5">
                    <IconSparkles size={14} className="text-gold-400" />
                    Elementos y Características del Trabajo (Al gusto)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {elements.length} {elements.length === 1 ? 'elemento' : 'elementos'}
                  </span>
                </div>

                {/* Add Element Input Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un elemento: Ej. Curvatura D, Grosor 0.07, Cat Eye..."
                    value={newElementInput}
                    onChange={(e) => setNewElementInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddElement()
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white focus:outline-none focus:border-gold-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddElement()}
                    className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs transition-all shadow-gold-glow"
                  >
                    Añadir
                  </button>
                </div>

                {/* Quick Suggestion Chips */}
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block mb-1">
                    Sugerencias rápidas para añadir con 1 clic:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ELEMENT_SUGGESTIONS.map((sug) => {
                      const alreadyAdded = elements.includes(sug)
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleAddElement(sug)}
                          disabled={alreadyAdded}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            alreadyAdded
                              ? 'bg-[#1e1e2a] text-gray-500 border-gray-800 opacity-50 cursor-not-allowed'
                              : 'bg-[#20202e] hover:bg-gold-500/20 text-gray-300 hover:text-gold-300 border-[#2f2f42] hover:border-gold-500/40'
                          }`}
                        >
                          + {sug}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Current Elements List */}
                <div className="pt-2 border-t border-[#222234]">
                  <span className="text-[10.5px] text-gray-400 block mb-1.5 font-medium">
                    Elementos asignados a esta imagen:
                  </span>
                  {elements.length === 0 ? (
                    <p className="text-[11px] text-gray-500 italic">
                      No has añadido ningún elemento aún. Añade los elementos que caracterizan este trabajo.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {elements.map((el, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14141d] border border-gold-500/30 text-xs text-gold-200"
                        >
                          <IconCheck size={12} className="text-gold-400 shrink-0" />
                          <span>{el}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveElement(i)}
                            className="ml-1 text-red-400 hover:text-red-300 p-0.5 rounded"
                            title="Eliminar elemento"
                          >
                            <IconX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: Image File Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {editingItem ? 'Imagen (Mantener actual o sustituir)' : 'Seleccionar Archivo (JPG, PNG) *'}
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-[#2b2b3d] border-dashed rounded-xl bg-[#181824] hover:border-gold-500/40 transition-colors">
                  {previewUrl ? (
                    <div className="relative shrink-0 w-28 h-28 rounded-lg overflow-hidden border border-gold-500/30 bg-black/50">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-end p-1">
                        <span className="text-[9px] font-bold text-emerald-300 bg-black/70 px-1.5 py-0.5 rounded">
                          ✓ Cargada
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-[#14141c] border border-[#2b2b3d] flex items-center justify-center shrink-0">
                      <IconUpload size={28} className="text-gray-500" />
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <label className="inline-block px-4 py-2 rounded-xl bg-[#28283a] hover:bg-[#34344c] text-gold-400 hover:text-gold-300 font-semibold text-xs cursor-pointer border border-[#393952] transition-colors">
                      <span>{previewUrl ? 'Cambiar por otra foto...' : 'Seleccionar archivo del equipo...'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-[10px] text-gray-500">
                      Formatos compatibles: JPG, PNG, WEBP, AVIF.
                    </p>
                  </div>
                </div>
              </div>

              {/* Featured toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded text-gold-500 focus:ring-0"
                  />
                  <span>Destacar como trabajo principal en el catálogo</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#20202e] hover:bg-[#28283a] text-gray-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all"
                >
                  {editingItem ? 'Guardar Cambios' : 'Subir Fotografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
