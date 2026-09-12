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
} from './Icons'
import { useUpdater, CURRENT_APP_VERSION, formatBytes } from '../services/updater'

export type TabId = 'dashboard' | 'appointments' | 'services' | 'clients' | 'gallery' | 'settings'

interface SidebarProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  pendingAppointmentsCount: number
  clientsRecallCount: number
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingAppointmentsCount,
  clientsRecallCount,
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
  } = useUpdater()
  const menuItems = [
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
      label: 'Clientas CRM',
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
      id: 'settings' as TabId,
      label: 'Ajustes de Estudio',
      subtitle: 'Horarios y datos',
      icon: IconSettings,
    },
  ]

  return (
    <aside className="w-72 bg-[#0c0c10] border-r border-[#22222d] flex flex-col justify-between h-full shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-[#1c1c26]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-[1.5px] shadow-gold-glow shrink-0 overflow-hidden"
              style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', maxWidth: '48px', maxHeight: '48px' }}
            >
              <div className="w-full h-full bg-[#0e0e14] rounded-[10.5px] overflow-hidden flex items-center justify-center">
                <img
                  src={logoImg}
                  alt="GoldBlack Lash Studio"
                  width={48}
                  height={48}
                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  className="w-full h-full object-cover rounded-[10.5px]"
                />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold tracking-wide text-white leading-tight">
                GoldBlack <span className="text-gold-400 font-light">Lash</span>
              </h1>
              <p className="text-[11px] tracking-widest uppercase text-muted font-medium">
                Studio Manager
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/15 via-gold-500/8 to-transparent text-white border-l-4 border-gold-400 shadow-sm'
                    : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-[#14141c]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-500/20 text-gold-400 shadow-gold-glow'
                      : 'bg-[#181822] text-gray-400 group-hover:text-gold-300'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Area: Update Widget & Version */}
      <div className="flex flex-col justify-end w-full">
        {/* If update is available / downloading / downloaded / error */}
        {(status === 'available' || status === 'downloading' || status === 'downloaded' || status === 'error') && (
          <div className="mx-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-[#161622] to-[#0e0e16] border border-gold-500/30 shadow-xl flex flex-col items-center text-center space-y-2.5 transition-all">
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
                className="text-gray-500 hover:text-gray-300 p-0.5 rounded transition-colors cursor-pointer"
                title="Ocultar aviso"
              >
                <IconX size={12} />
              </button>
            </div>

            {/* State: Available -> Button "Actualizar" */}
            {status === 'available' && (
              <div className="w-full space-y-2">
                <p className="text-[10.5px] text-gray-400 leading-tight line-clamp-2 text-left">
                  {updateInfo?.notes ? updateInfo.notes.slice(0, 75) + '...' : 'Mejoras y nuevas funciones disponibles en GitHub.'}
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
                <div className="w-full h-2 rounded-full bg-[#1e1e2c] overflow-hidden border border-[#2b2b3d] p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300 rounded-full transition-all duration-200 shadow-gold-glow"
                    style={{ width: `${Math.max(progress, 4)}%` }}
                  />
                </div>
                {totalBytes > 0 && (
                  <div className="text-[9.5px] text-gray-500 font-mono text-right">
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
        )}

        {/* Footer Version: automatic background polling every 5s */}
        <div className="p-3.5 flex justify-end items-center text-gray-500 border-t border-[#1c1c26]/60">
          <span
            title={`Versión instalada: v${CURRENT_APP_VERSION} (Búsqueda automática cada 5 segundos)`}
            className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#1e1e2c] text-gold-400 border border-[#2b2b3d] select-none shadow-sm font-semibold"
          >
            v{CURRENT_APP_VERSION}
          </span>
        </div>
      </div>
    </aside>
  )
}
