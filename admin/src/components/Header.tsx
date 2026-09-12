import React, { useState, useEffect } from 'react'
import { IconPlus, IconClock } from './Icons'
import { StudioConfig } from '../types/admin'

interface HeaderProps {
  title: string
  subtitle: string
  config: StudioConfig
  onNewAppointment: () => void
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  config,
  onNewAppointment,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentDate, setCurrentDate] = useState<string>('')

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
        <h2 className="text-xl font-bold font-serif text-white tracking-wide flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>

      {/* Right controls: New Appointment CTA & Live Time */}
      <div className="flex items-center gap-4">
        {/* Primary CTA: Nueva Cita */}
        <button
          onClick={onNewAppointment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-ink-950 font-bold text-xs tracking-wide uppercase transition-all duration-200 shadow-gold-glow hover:shadow-gold-glow-lg transform hover:-translate-y-0.5"
        >
          <IconPlus size={16} className="stroke-[2.5]" />
          <span>Nueva Cita</span>
        </button>

        {/* Live Date and Clock */}
        <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#14141d] border border-[#232330] text-xs">
          <IconClock size={16} className="text-gold-400" />
          <div className="text-right">
            <div className="font-mono font-bold text-gray-200">{currentTime}</div>
            <div className="text-[10px] text-gray-500 capitalize">{currentDate}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
