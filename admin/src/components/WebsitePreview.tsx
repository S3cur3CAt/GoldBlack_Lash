import React, { useState } from 'react'
import {
  IconGlobe,
  IconSmartphone,
  IconMonitor,
  IconRefreshCw,
  IconExternalLink,
  IconCheck,
} from './Icons'

type ViewMode = 'mobile' | 'desktop'

export const WebsitePreview: React.FC = () => {
  // 'mobile' view is default as requested by user ("vista de telefono que sera por defecto")
  const [viewMode, setViewMode] = useState<ViewMode>('mobile')
  const [iframeKey, setIframeKey] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false)

  const siteUrl = 'https://www.goldblacklash.com/'

  const handleRefresh = () => {
    setIsLoading(true)
    setIframeKey((prev) => prev + 1)
  }

  const handleOpenExternal = () => {
    window.open(siteUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {}
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-ink-950 select-none">
      {/* Top Controls Toolbar */}
      <div className="shrink-0 px-6 py-3 bg-ink-900 border-b border-line flex flex-wrap items-center justify-between gap-4 z-20 shadow-sm">
        {/* Left: Live status & URL display */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-850 border border-line">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-gray-200">En Vivo</span>
            <span className="text-line-strong font-mono text-xs">|</span>
            <button
              onClick={handleCopyUrl}
              title="Copiar URL del sitio"
              className="text-xs text-gold-300/90 font-mono hover:text-gold-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>goldblacklash.com</span>
              {copiedUrl ? (
                <IconCheck size={12} className="text-emerald-400" />
              ) : (
                <span className="text-[10px] text-gray-500">↗</span>
              )}
            </button>
          </div>
        </div>

        {/* Center: View Mode Toggle (Phone View is Default) */}
        <div className="flex items-center bg-ink-850 p-1 rounded-xl border border-line-strong shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'mobile'
                ? 'bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300 border border-gold-500/40 shadow-gold-glow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
            }`}
          >
            <IconSmartphone size={15} />
            <span>Vista Teléfono</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-gold-400/90">
              Por defecto
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'desktop'
                ? 'bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-300 border border-gold-500/40 shadow-gold-glow'
                : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
            }`}
          >
            <IconMonitor size={15} />
            <span>Vista Desktop (Mac)</span>
          </button>
        </div>

        {/* Right: Actions (Refresh & Open in External Browser) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Recargar previsualización"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-850 hover:bg-ink-800 text-gray-300 hover:text-white border border-line text-xs font-medium transition-colors cursor-pointer active:scale-95"
          >
            <IconRefreshCw
              size={13}
              className={`text-gray-400 group-hover:text-gold-300 ${isLoading ? 'animate-spin text-gold-400' : ''}`}
            />
            <span>Recargar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            title="Abrir en Safari o navegador predeterminado"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            <IconExternalLink size={13} />
            <span>Abrir Sitio Web</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-[#07070a]">
        {/* Ambient subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212, 175, 55, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />

        {/* VIEW MODE: MOBILE (Default) */}
        {viewMode === 'mobile' && (
          <div className="relative flex flex-col items-center justify-center h-full w-full max-w-full animate-fadeIn">
            {/* Phone Mockup Frame (iPhone Dimensions: ~390px width) */}
            <div className="relative w-[385px] max-w-[94vw] h-[780px] max-h-[calc(100vh-175px)] rounded-[48px] bg-[#14141c] p-2.5 border-[8px] border-[#22222d] shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.08)] flex flex-col overflow-hidden">
              {/* Dynamic Island Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end pr-3 pointer-events-none shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#161622] border border-white/10" />
              </div>

              {/* Home Indicator Bar */}
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30 pointer-events-none" />

              {/* Mobile Screen Iframe Container */}
              <div className="relative flex-1 w-full h-full rounded-[38px] overflow-hidden bg-black">
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-ink-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-2 border-gold-500/20 border-t-gold-400 animate-spin" />
                      <IconGlobe
                        size={16}
                        className="absolute inset-0 m-auto text-gold-400"
                      />
                    </div>
                    <p className="text-xs font-semibold text-gray-200">Cargando goldblacklash.com...</p>
                    <p className="text-[11px] text-gray-500 max-w-[200px]">
                      Conectando con el sitio web oficial en tiempo real
                    </p>
                  </div>
                )}

                <iframe
                  key={`mobile-${iframeKey}`}
                  src={siteUrl}
                  title="Previsualización móvil de goldblacklash.com"
                  className="w-full h-full border-0"
                  onLoad={() => setIsLoading(false)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              </div>
            </div>

            {/* Mobile Footer Indicator */}
            <div className="mt-2.5 text-center">
              <span className="text-[11px] text-gray-500 font-medium">
                Vista móvil optimizada (390 × 844 px) • Navegación completa interactiva
              </span>
            </div>
          </div>
        )}

        {/* VIEW MODE: DESKTOP (Mac Full Width) */}
        {viewMode === 'desktop' && (
          <div className="relative flex flex-col h-full w-full max-w-7xl animate-fadeIn rounded-2xl border border-line bg-ink-900 shadow-2xl overflow-hidden">
            {/* Mac Safari / Chrome Titlebar */}
            <div className="shrink-0 h-10 px-4 bg-ink-850 border-b border-line flex items-center justify-between gap-4 z-20">
              {/* macOS Window Traffic Lights */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 inline-block" />
              </div>

              {/* Centered URL Address Capsule */}
              <div className="flex-1 max-w-xl mx-auto flex items-center justify-center gap-2 px-4 py-1 rounded-lg bg-ink-950 border border-line text-xs text-gray-300 font-mono">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-400 shrink-0"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-gray-400">https://</span>
                <span className="text-gold-300 font-semibold">www.goldblacklash.com</span>
                <span className="text-gray-500">/</span>
              </div>

              {/* Desktop View Badge */}
              <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                <span className="px-2 py-0.5 rounded bg-ink-800 border border-line text-gray-400 font-mono">
                  Escritorio Mac
                </span>
              </div>
            </div>

            {/* Desktop Screen Iframe Container */}
            <div className="relative flex-1 w-full h-full bg-black overflow-hidden">
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-ink-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center p-6">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-gold-500/20 border-t-gold-400 animate-spin" />
                    <IconGlobe
                      size={16}
                      className="absolute inset-0 m-auto text-gold-400"
                    />
                  </div>
                  <p className="text-xs font-semibold text-gray-200">Cargando goldblacklash.com...</p>
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Conectando con el sitio web oficial en tiempo real
                  </p>
                </div>
              )}

              <iframe
                key={`desktop-${iframeKey}`}
                src={siteUrl}
                title="Previsualización de escritorio de goldblacklash.com"
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
