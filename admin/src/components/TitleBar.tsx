import React, { useState, useEffect } from 'react'
import logoImg from '../assets/logo.png'

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron
  const isMac = typeof window !== 'undefined' && window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    if (isElectron && window.electronAPI?.isMaximized) {
      window.electronAPI.isMaximized().then(setIsMaximized).catch(() => {})
    }
  }, [isElectron])

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximize()
    setIsMaximized(!isMaximized)
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  return (
    <div
      className="h-9 w-full bg-[#08080b] border-b border-[#1c1c27] flex items-center justify-between select-none shrink-0 z-50 text-xs overflow-hidden"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left brand area */}
      <div className={`flex items-center gap-2.5 ${isMac ? 'pl-20' : 'pl-3.5'}`}>
        <div
          className="w-5 h-5 rounded-[4px] bg-gradient-to-br from-gold-400 to-gold-600 p-[0.75px] shadow-gold-glow shrink-0 overflow-hidden"
          style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', maxWidth: '20px', maxHeight: '20px' }}
        >
          <img
            src={logoImg}
            alt="GoldBlack"
            width={20}
            height={20}
            style={{ width: '20px', height: '20px', objectFit: 'cover' }}
            className="w-full h-full object-cover rounded-[3px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-[13px] text-white tracking-wide">
            GoldBlack <span className="text-gold-400 font-light">Lash</span>
          </span>
          <span className="text-gray-500 text-[11px] hidden sm:inline">
            — Panel de Administración
          </span>
        </div>
      </div>

      {/* Middle status & drag filler */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-[10px] tracking-widest text-gold-400/60 font-mono hidden md:inline">
          ESTUDIO MONTEQUINTO · SEVILLA
        </span>
      </div>

      {/* Right controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden lg:inline text-gray-400 text-[11px]">Sincronizado</span>
        </div>

        {/* Windows Custom Window Controls (rendered when on Windows or when running Electron) */}
        {!isMac && isElectron && (
          <div className="flex items-center h-full">
            {/* Minimize */}
            <button
              onClick={handleMinimize}
              title="Minimizar"
              className="w-11 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1a24] transition-colors"
            >
              <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
                <rect width="10" height="1" />
              </svg>
            </button>

            {/* Maximize / Restore */}
            <button
              onClick={handleMaximize}
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
              className="w-11 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1a1a24] transition-colors"
            >
              {isMaximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M2.5 1.5H8.5V7.5" />
                  <rect x="1.5" y="2.5" width="6" height="6" />
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="0.5" y="0.5" width="8" height="8" />
                </svg>
              )}
            </button>

            {/* Close */}
            <button
              onClick={handleClose}
              title="Cerrar"
              className="w-11 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600/90 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1L9 9M9 1L1 9" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
