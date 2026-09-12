import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import { GalleryItem } from '../types/admin'
import {
  IconImage,
  IconPlus,
  IconTrash,
  IconX,
  IconUpload,
} from './Icons'

interface GalleryManagerProps {
  galleryItems: GalleryItem[]
  onSaveItem: (item: GalleryItem) => void
  onDeleteItem: (id: string) => void
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({
  galleryItems,
  onSaveItem,
  onDeleteItem,
}) => {
  const { showAlert, showConfirm } = useDialog()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Volumen Ruso')
  const [previewUrl, setPreviewUrl] = useState('')

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
    if (!previewUrl || !title) {
      showAlert({
        title: 'Fotografía y título requeridos',
        message: 'Por favor selecciona una imagen y asigna un título para agregarla al catálogo multimedia.',
        type: 'warning',
      })
      return
    }

    const newItem: GalleryItem = {
      id: `gal-${Date.now()}`,
      key: `custom-${Date.now()}`,
      title,
      category,
      url: previewUrl,
      updatedAt: new Date().toISOString().split('T')[0],
    }

    onSaveItem(newItem)
    setIsModalOpen(false)
    setTitle('')
    setPreviewUrl('')
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
            Administra los trabajos de pestañas y fotografías destacadas del estudio.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-gold-glow self-start sm:self-auto"
        >
          <IconPlus size={16} />
          <span>Subir Fotografía</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-2xl bg-[#12121a] border border-[#222230] overflow-hidden hover:border-gold-500/40 transition-all flex flex-col"
          >
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-gold-300 border border-gold-500/30 backdrop-blur-md">
                  {item.category}
                </span>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    showConfirm({
                      title: 'Eliminar Fotografía',
                      message: `¿Estás seguro de que deseas eliminar la foto "${item.title}"?`,
                      confirmText: 'Eliminar',
                      danger: true,
                      onConfirm: () => onDeleteItem(item.id),
                    })
                  }}
                  className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 transition-colors backdrop-blur-md"
                  title="Eliminar foto"
                >
                  <IconTrash size={14} />
                </button>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <h5 className="font-serif font-bold text-white text-sm truncate">{item.title}</h5>
                <span className="text-[10px] text-gray-400 font-mono">Clave: {item.key}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Upload Image */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#14141c] border border-gold-500/30 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-[#252536] pb-4 mb-5">
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                <IconImage size={20} className="text-gold-400" />
                Subir Fotografía al Catálogo
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
                <label className="block text-xs font-semibold text-gray-300 mb-1">Título de la Foto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Volumen Ruso Efecto Seda Curva D"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Técnica / Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white"
                >
                  <option value="Volumen Ruso">Volumen Ruso</option>
                  <option value="Clásicas Pelo a Pelo">Clásicas Pelo a Pelo</option>
                  <option value="Mega Volumen">Mega Volumen</option>
                  <option value="Híbridas / Kim">Híbridas / Kim</option>
                  <option value="Lifting de Pestañas">Lifting de Pestañas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Seleccionar Archivo (JPG, PNG)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#2b2b3d] border-dashed rounded-xl hover:border-gold-500/50 transition-colors bg-[#181824]">
                  <div className="space-y-1 text-center">
                    {previewUrl ? (
                      <div className="mb-2">
                        <img src={previewUrl} alt="Preview" className="h-28 w-auto mx-auto rounded-lg object-cover" />
                        <span className="text-[11px] text-emerald-400 block mt-1">✓ Imagen cargada</span>
                      </div>
                    ) : (
                      <IconUpload size={28} className="mx-auto text-gray-400" />
                    )}
                    <div className="flex text-xs text-gray-400 justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-gold-400 hover:text-gold-300">
                        <span>Selecciona un archivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-500">PNG, JPG hasta 5 MB</p>
                  </div>
                </div>
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
                  Subir Fotografía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
