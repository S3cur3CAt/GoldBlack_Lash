import React from 'react'
import logoImg from '../assets/logo.png'
import {
  IconDashboard,
  IconCalendar,
  IconSparkles,
  IconUsers,
  IconImage,
  IconSettings,
} from './Icons'

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

      {/* Footer Info */}
      <div className="p-3 m-3 rounded-xl bg-[#111118] border border-[#20202c] flex items-center justify-center">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e1e2c] text-gold-400">v1.0.0</span>
      </div>
    </aside>
  )
}
