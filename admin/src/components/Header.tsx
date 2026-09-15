import React, { useState, useEffect } from 'react'
import { IconPlus, IconClock, IconSparkles } from './Icons'
import { StudioConfig } from '../types/admin'
import { VoiceCopilotModal } from './VoiceCopilotModal'

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
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)

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
    <header className="h-20 bg-[#0c0c10]/95 backdrop-blur-md border-b border-[#1f1f2a] px-8 flex items-center justify-between shrink-0">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>

      {/* Right controls: Dynamic Action CTA & Live Time */}
      <div className="flex items-center gap-4">
        {/* Voice AI Copilot */}
        <button
          onClick={() => setIsCopilotOpen(true)}
          title="Abrir Copiloto de IA por Voz"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-gold-500/25 text-gold-400 hover:text-gold-300 font-bold text-xs tracking-wide uppercase transition-all duration-200 shadow-md hover:shadow-gold-glow cursor-pointer"
        >
          <IconSparkles size={15} className="animate-pulse" />
          <span className="hidden sm:inline">Copiloto IA</span>
        </button>

        {/* Dynamic CTA */}
        {effectiveAction && effectiveLabel && (
          <button
            onClick={effectiveAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-ink-950 font-bold text-xs tracking-wide uppercase transition-all duration-200 shadow-gold-glow hover:shadow-gold-glow-lg transform hover:-translate-y-0.5 cursor-pointer"
          >
            <IconPlus size={16} className="stroke-[2.5]" />
            <span>{effectiveLabel}</span>
          </button>
        )}

        {/* Live Date and Clock */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#14141d] border border-[#232330] text-xs">
          <IconClock size={16} className="text-gold-400" />
          <div className="text-right">
            <div className="font-mono font-bold text-gray-200">{currentTime}</div>
            <div className="text-[10px] text-gray-500 capitalize">{currentDate}</div>
          </div>
        </div>
      </div>

      <VoiceCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </header>
  )
}
