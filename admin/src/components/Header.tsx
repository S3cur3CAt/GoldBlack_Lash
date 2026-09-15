import React, { useState, useEffect } from 'react'
import { IconPlus, IconClock } from './Icons'
import { StudioConfig } from '../types/admin'

interface HeaderProps {
  title: string
  subtitle: string
  config: StudioConfig
  actionLabel?: string | null
  onAction?: () => void
  onNewAppointment?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  config,
  actionLabel,
  onAction,
  onNewAppointment,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

  const effectiveAction = onAction || onNewAppointment
  const effectiveLabel = actionLabel !== undefined ? actionLabel : 'Nueva Cita'

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setCurrentDate(
        now.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="relative z-30 h-20 bg-ink-900/95 backdrop-blur-md border-b border-line px-8 flex items-center justify-between shrink-0">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-xl font-semibold font-sans tracking-tight text-white flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>

      {/* Right controls: Dynamic Action CTA & Live Time */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Dynamic CTA */}
        {effectiveAction && effectiveLabel && (
          <button
            onClick={effectiveAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-xs tracking-wide uppercase transition-colors duration-150 cursor-pointer"
          >
            <IconPlus size={16} className="stroke-[2.5]" />
            <span>{effectiveLabel}</span>
          </button>
        )}

        {/* Live Date and Clock */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-ink-850 border border-line text-xs">
          <IconClock size={16} className="text-gold-400" />
          <div className="text-right">
            <div className="font-mono font-semibold text-gray-200 tabular-nums">{currentTime}</div>
            <div className="text-[10px] text-faint capitalize">{currentDate}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
