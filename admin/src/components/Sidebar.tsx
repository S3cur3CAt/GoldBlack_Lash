import React from 'react'
import logoImg from '../assets/logo.png'
import {
  IconDashboard,
  IconCalendar,
  IconSparkles,
  IconUsers,
  IconImage,
  IconSettings,
  IconDownload,
  IconRefreshCw,
  IconCheck,
  IconX,
  IconReceipt,
  IconGripVertical,
} from './Icons'
import { CURRENT_APP_VERSION, formatBytes } from '../services/updater'
import { useUpdaterContext } from '../context/UpdaterContext'

export type TabId = 'dashboard' | 'appointments' | 'services' | 'clients' | 'gallery' | 'billing' | 'settings'

export const DEFAULT_SIDEBAR_ORDER: TabId[] = [
  'dashboard',
  'appointments',
  'services',
  'clients',
  'gallery',
  'billing',
  'settings',
]

interface SidebarProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  pendingAppointmentsCount: number
  clientsRecallCount: number
  isReorderMode?: boolean
  sidebarOrder?: TabId[]
  onReorder?: (newOrder: TabId[]) => void
  onToggleReorder?: () => void
  onResetOrder?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingAppointmentsCount,
  clientsRecallCount,
  isReorderMode = false,
  sidebarOrder,
  onReorder,
  onToggleReorder,
  onResetOrder,
}) => {
  const {
    status,
    updateInfo,
    progress,
    receivedBytes,
    totalBytes,
    errorMessage,
    startDownload,
    applyAndRestart,
    dismiss,
  } = useUpdaterContext()

  const [draggedId, setDraggedId] = React.useState<TabId | null>(null)
  const [dragOverId, setDragOverId] = React.useState<TabId | null>(null)

  const baseMenuItems = [
    {
      id: 'dashboard' as TabId,
      label: 'Panel Principal',
      subtitle: 'Resumen & Métricas',
      icon: IconDashboard,
    },
    {
      id: 'appointments' as TabId,
      label: 'Agenda & Citas',
      subtitle: 'Gestión de turnos',
      icon: IconCalendar,
      badge: pendingAppointmentsCount > 0 ? `${pendingAppointmentsCount}` : undefined,
      badgeColor: 'bg-gold-500/20 text-gold-300 border border-gold-500/30',
    },
    {
      id: 'services' as TabId,
      label: 'Servicios & Tarifas',
      subtitle: 'Catálogo de pestañas',
      icon: IconSparkles,
    },
    {
      id: 'clients' as TabId,
      label: 'Ficha de Clientas',
      subtitle: 'Fichas y fidelización',
      icon: IconUsers,
      badge: clientsRecallCount > 0 ? `${clientsRecallCount} retoques` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'gallery' as TabId,
      label: 'Galería & Fotos',
      subtitle: 'Catálogo de trabajos',
      icon: IconImage,
    },
    {
      id: 'billing' as TabId,
      label: 'Facturación & Caja',
      subtitle: 'Tickets, cobros y caja',
      icon: IconReceipt,
    },
    {
      id: 'settings' as TabId,
      label: 'Ajustes de Estudio',
      subtitle: 'Horarios y datos',
      icon: IconSettings,
    },
  ]

  // Ordenar según sidebarOrder si se proporciona; fallback a orden por defecto
  const orderedMenuItems = React.useMemo(() => {
    if (!sidebarOrder || sidebarOrder.length === 0) return baseMenuItems
    const orderMap = new Map<TabId, number>()
    sidebarOrder.forEach((id, idx) => orderMap.set(id, idx))
    return [...baseMenuItems].sort((a, b) => {
      const aIdx = orderMap.has(a.id) ? orderMap.get(a.id)! : 999
      const bIdx = orderMap.has(b.id) ? orderMap.get(b.id)! : 999
      return aIdx - bIdx
    })
  }, [baseMenuItems, sidebarOrder, pendingAppointmentsCount, clientsRecallCount])

  const handleDragStart = (e: React.DragEvent, id: TabId) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    // Ghost image nativo del navegador es suficiente
  }

  const handleDragOver = (e: React.DragEvent, id: TabId) => {
    e.preventDefault()
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: TabId) => {
    e.preventDefault()
    setDragOverId(null)
    if (!draggedId || draggedId === targetId || !onReorder) return
    const orderedIds = orderedMenuItems.map((i) => i.id)
    const fromIndex = orderedIds.indexOf(draggedId)
    const toIndex = orderedIds.indexOf(targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const newIds = [...orderedIds]
    const [moved] = newIds.splice(fromIndex, 1)
    newIds.splice(toIndex, 0, moved)
    onReorder(newIds)
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <aside className="w-72 bg-[#0c0c10] border-r border-[#22222d] flex flex-col h-full shrink-0 select-none overflow-hidden relative">
      {/* Brand Header */}
      <div className="p-4 px-5 border-b border-[#1c1c26] shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-[1.5px] shadow-gold-glow shrink-0 overflow-hidden"
            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px', maxWidth: '44px', maxHeight: '44px' }}
          >
            <div className="w-full h-full bg-[#0e0e14] rounded-[10px] overflow-hidden flex items-center justify-center">
              <img
                src={logoImg}
                alt="GoldBlack Lash Studio"
                width={44}
                height={44}
                style={{ width: '44px', height: '44px', objectFit: 'cover' }}
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  if (!t.src.endsWith('logo.png')) t.src = './logo.png'
                }}
              />
            </div>
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold tracking-tight text-white leading-tight">
              GoldBlack <span className="text-gold-400 font-light">Lash</span>
            </h1>
            <p className="text-[10px] tracking-widest uppercase text-muted font-medium">
              Studio Manager
            </p>
          </div>
        </div>
      </div>

      {/* Hint cuando está en modo reordenar */}
      {isReorderMode && (
        <div className="mx-2.5 mt-2.5 px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center gap-2 shrink-0">
          <IconGripVertical size={14} className="text-gold-400 shrink-0" />
          <p className="text-[11px] font-medium text-gold-300 leading-tight">
            Arrastra los botones para reordenar
          </p>
        </div>
      )}

      {/* Flexible & Scrollable Navigation Menu */}
      <nav className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
        {orderedMenuItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          const isDragged = draggedId === item.id
          const isDragOver = dragOverId === item.id
          return (
            <button
              key={item.id}
              draggable={isReorderMode}
              onDragStart={(e) => isReorderMode && handleDragStart(e, item.id)}
              onDragOver={(e) => isReorderMode && handleDragOver(e, item.id)}
              onDragLeave={() => { if (isReorderMode) handleDragLeave() }}
              onDrop={(e) => isReorderMode && handleDrop(e, item.id)}
              onDragEnd={() => { if (isReorderMode) handleDragEnd() }}
              onClick={() => {
                // Evita navegar si se estaba arrastrando (pequeño threshold)
                if (isReorderMode && draggedId) return
                onSelectTab(item.id)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group cursor-pointer relative ${
                isActive
                  ? 'bg-gradient-to-r from-gold-500/15 via-gold-500/8 to-transparent text-white border-l-4 border-gold-400 shadow-sm'
                  : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-[#14141c]'
              } ${
                isReorderMode ? 'cursor-grab active:cursor-grabbing border border-dashed ' + (isDragOver ? 'border-gold-400/60 bg-gold-500/10 -translate-y-[1px] shadow-md' : 'border-transparent') : ''
              } ${isDragged ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
            >
              {/* Handle visible solo en modo reordenar */}
              {isReorderMode && (
                <span
                  className="shrink-0 -ml-1 p-1 rounded-md hover:bg-[#1e1e2c] text-gray-500 hover:text-gold-300 transition-colors cursor-grab active:cursor-grabbing"
                  aria-hidden
                  title="Arrastra para mover"
                >
                  <IconGripVertical size={14} />
                </span>
              )}
              <div
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  isActive
                    ? 'bg-gold-500/20 text-gold-400 shadow-gold-glow'
                    : 'bg-[#181822] text-gray-400 group-hover:text-gold-300'
                }`}
              >
                <Icon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-gray-500 truncate">{item.subtitle}</p>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Pinned Footer Area: Reorder Toolbar, Update Widget & Version */}
      <div className="shrink-0 mt-auto w-full bg-[#0c0c10] border-t border-[#1c1c26]/80 flex flex-col">
        {/* Barra de Reordenar menú en flujo normal (sin solapar la actualización) */}
        {onToggleReorder && (
          <div className="px-3.5 py-2 border-b border-[#1c1c26]/60 flex items-center justify-between gap-2 bg-[#0e0e14]">
            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
              <IconGripVertical size={13} className="text-gray-500" />
              Menú
            </span>
            <div className="flex items-center gap-1.5">
              {isReorderMode && onResetOrder && (
                <button
                  type="button"
                  onClick={onResetOrder}
                  title="Restaurar orden original del menú"
                  className="px-2 py-1 rounded-lg bg-[#1a1a24] hover:bg-[#232332] border border-[#2b2b3d] text-gray-400 hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                  Restablecer
                </button>
              )}
              <button
                type="button"
                onClick={onToggleReorder}
                title={isReorderMode ? 'Guardar y salir del modo reordenar' : 'Reordenar botones del panel - arrastrar para ordenar a tu gusto'}
                className={`px-3 py-1 rounded-lg font-bold text-[10.5px] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                  isReorderMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-400/50 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-gold-500 to-gold-400 text-black border-gold-400/50 hover:from-gold-400 hover:to-gold-300 shadow-gold-500/20'
                }`}
              >
                {isReorderMode ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    Listo
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                    Reordenar menú
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* If update is available / downloading / downloaded / error */}
        {(status === 'available' || status === 'downloading' || status === 'downloaded' || status === 'error') && (
          <div className="p-3 pb-2 border-b border-[#1c1c26]/60">
            <div className="p-3 rounded-xl bg-gradient-to-b from-[#161622] to-[#0e0e16] border border-gold-500/30 shadow-lg flex flex-col space-y-2 transition-all">
              {/* Header info */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-400"></span>
                  </span>
                  <span className="text-[11px] font-bold text-gold-300">
                    {status === 'downloaded' ? 'Actualización lista' : `Nueva versión ${updateInfo?.latestVersion || ''}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#20202d] transition-colors cursor-pointer"
                  title="Ocultar aviso"
                >
                  <IconX size={12} />
                </button>
              </div>

              {/* State: Available -> Button "Actualizar" */}
              {status === 'available' && (
                <div className="w-full space-y-2">
                  <p className="text-[10px] text-gray-400 leading-tight line-clamp-2 text-left">
                    {updateInfo?.notes ? updateInfo.notes.slice(0, 80) + '...' : 'Mejoras y nuevas funciones disponibles en GitHub.'}
                  </p>
                  <button
                    type="button"
                    onClick={startDownload}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <IconDownload size={13} />
                    Actualizar
                  </button>
                </div>
              )}

              {/* State: Downloading -> Progress bar */}
              {status === 'downloading' && (
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <IconRefreshCw size={10} className="animate-spin text-gold-400" />
                      Descargando...
                    </span>
                    <span className="font-mono font-bold text-gold-300">{progress}%</span>
                  </div>
                  {/* Progress bar container with rounded corners */}
                  <div className="w-full h-1.5 rounded-full bg-[#1e1e2c] overflow-hidden border border-[#2b2b3d]">
                    <div
                      className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300 rounded-full transition-all duration-200 shadow-gold-glow"
                      style={{ width: `${Math.max(progress, 4)}%` }}
                    />
                  </div>
                  {totalBytes > 0 && (
                    <div className="text-[9px] text-gray-500 font-mono text-right">
                      {formatBytes(receivedBytes)} / {formatBytes(totalBytes)}
                    </div>
                  )}
                </div>
              )}

              {/* State: Downloaded -> Button "Reiniciar aplicación" */}
              {status === 'downloaded' && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <IconCheck size={13} className="text-emerald-400" />
                    <span>Descarga completada</span>
                  </div>
                  <button
                    type="button"
                    onClick={applyAndRestart}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <IconRefreshCw size={13} />
                    Reiniciar aplicación
                  </button>
                </div>
              )}

              {/* State: Error */}
              {status === 'error' && (
                <div className="w-full space-y-1.5">
                  <p className="text-[10px] text-red-400">{errorMessage || 'Error en la descarga'}</p>
                  <button
                    type="button"
                    onClick={startDownload}
                    className="text-[10px] text-gold-400 hover:underline cursor-pointer"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Version: automatic background polling every 5s */}
        <div className="px-4 py-2.5 flex justify-between items-center text-gray-500 text-[10px]">
          <span className="text-gray-500 font-medium">GoldBlack Studio</span>
          <span
            title={`Versión instalada: v${CURRENT_APP_VERSION} (Búsqueda automática cada 5 segundos)`}
            className="font-mono px-2 py-0.5 rounded bg-[#1e1e2c] text-gold-400/90 border border-[#2b2b3d] select-none shadow-sm font-semibold"
          >
            v{CURRENT_APP_VERSION}
          </span>
        </div>
      </div>
    </aside>
  )
}
