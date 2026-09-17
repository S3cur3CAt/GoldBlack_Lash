import React, { useState, useRef, useEffect } from 'react'
import {
  IconGlobe,
  IconSmartphone,
  IconMonitor,
  IconRefreshCw,
  IconExternalLink,
  IconCheck,
} from './Icons'

type ViewMode = 'mobile' | 'desktop'
type ZoomMode = 'auto' | '100' | '75'

export const WebsitePreview: React.FC = () => {
  // 'mobile' view is default as explicitly requested ("vista de telefono que sera por defecto")
  const [viewMode, setViewMode] = useState<ViewMode>('mobile')
  const [desktopResolution, setDesktopResolution] = useState<1440 | 1280>(1440)
  const [zoomMode, setZoomMode] = useState<ZoomMode>('auto')
  const [iframeKey, setIframeKey] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 700,
  })

  const siteUrl = 'https://www.goldblacklash.com/'

  // Track container dimensions to dynamically scale previews so they never overflow
  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

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

  // Realistic device target specifications
  // Phone: iPhone 15/16 Pro standard viewport (390 x 844 px)
  const mobileScreenWidth = 390
  const mobileScreenHeight = 844
  const mobileBezel = 12
  const mobileFrameWidth = mobileScreenWidth + mobileBezel * 2 // 414px
  const mobileFrameHeight = mobileScreenHeight + mobileBezel * 2 // 868px

  // Desktop: Apple Mac screen (1440 x 900 or 1280 x 800)
  const desktopScreenWidth = desktopResolution
  const desktopScreenHeight = desktopResolution === 1440 ? 900 : 800
  const desktopHeaderHeight = 42
  const desktopFrameWidth = desktopScreenWidth
  const desktopFrameHeight = desktopScreenHeight + desktopHeaderHeight

  // Calculate dynamic scale factor so previews ALWAYS fit without horizontal or vertical overflow
  let scale = 1
  const paddingX = 32
  const paddingY = 32

  if (viewMode === 'mobile') {
    if (zoomMode === 'auto') {
      const availW = Math.max(containerSize.width - paddingX, 200)
      const availH = Math.max(containerSize.height - paddingY, 200)
      const scaleW = availW / mobileFrameWidth
      const scaleH = availH / mobileFrameHeight
      // Scale down to fit both dimensions, capped at 100%
      scale = Math.min(scaleW, scaleH, 1)
      scale = Math.max(scale, 0.4)
    } else if (zoomMode === '75') {
      scale = 0.75
    } else {
      scale = 1
    }
  } else {
    // Desktop Mac mode: enables real desktop media queries (>= 1024px)
    if (zoomMode === 'auto') {
      const availW = Math.max(containerSize.width - paddingX, 300)
      const availH = Math.max(containerSize.height - paddingY, 300)
      const scaleW = availW / desktopFrameWidth
      const scaleH = availH / desktopFrameHeight
      scale = Math.min(scaleW, scaleH, 1)
      scale = Math.max(scale, 0.35)
    } else if (zoomMode === '75') {
      scale = 0.75
    } else {
      scale = 1
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-ink-950 select-none">
      {/* Top Luxury Controls Toolbar — Consistent with GoldBlack Admin Theme */}
      <div className="shrink-0 px-6 py-3.5 bg-ink-900 border-b border-line flex flex-wrap items-center justify-between gap-4 z-20 shadow-md">
        {/* Left: Live status badge & domain capsule */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-ink-850 border border-line shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-gray-200">En Vivo</span>
            <span className="text-line-strong font-mono text-xs">|</span>
            <button
              type="button"
              onClick={handleCopyUrl}
              title="Copiar URL del sitio web"
              className="text-xs text-gold-300 font-mono hover:text-gold-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>goldblacklash.com</span>
              {copiedUrl ? (
                <IconCheck size={12} className="text-emerald-400" />
              ) : (
                <span className="text-[11px] text-gray-500">↗</span>
              )}
            </button>
          </div>
        </div>

        {/* Center: View Mode Segmented Controls (Phone view is Default) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-ink-850 p-1 rounded-xl border border-line-strong shadow-inner">
            {/* Phone View Button (Default) */}
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-gradient-to-r from-gold-500/25 to-gold-600/15 text-gold-300 border border-gold-500/40 shadow-gold-glow'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
              }`}
            >
              <IconSmartphone size={15} />
              <span>Vista Teléfono</span>
              <span className="text-[9.5px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-black/50 text-gold-400 border border-gold-500/20">
                Por defecto
              </span>
            </button>

            {/* Desktop Mac View Button */}
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-gradient-to-r from-gold-500/25 to-gold-600/15 text-gold-300 border border-gold-500/40 shadow-gold-glow'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-ink-800'
              }`}
            >
              <IconMonitor size={15} />
              <span>Vista Desktop (Mac)</span>
            </button>
          </div>

          {/* Additional Resolution Switcher for Mac when desktop is selected */}
          {viewMode === 'desktop' && (
            <div className="hidden sm:flex items-center bg-ink-850 p-1 rounded-xl border border-line text-[11px]">
              <button
                type="button"
                onClick={() => setDesktopResolution(1440)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  desktopResolution === 1440
                    ? 'bg-gold-500/20 text-gold-300 font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                1440 px
              </button>
              <button
                type="button"
                onClick={() => setDesktopResolution(1280)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  desktopResolution === 1280
                    ? 'bg-gold-500/20 text-gold-300 font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                1280 px
              </button>
            </div>
          )}

          {/* Zoom / Scale Mode Control */}
          <div className="flex items-center bg-ink-850 p-1 rounded-xl border border-line text-[11px]">
            <button
              type="button"
              onClick={() => setZoomMode('auto')}
              title="Ajustar automáticamente al tamaño de la pantalla"
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                zoomMode === 'auto'
                  ? 'bg-gold-500/20 text-gold-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Ajustar
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('100')}
              title="Tamaño real 100%"
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                zoomMode === '100'
                  ? 'bg-gold-500/20 text-gold-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('75')}
              title="Escala 75%"
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                zoomMode === '75'
                  ? 'bg-gold-500/20 text-gold-300 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              75%
            </button>
          </div>
        </div>

        {/* Right: Actions (Refresh & Open in External Browser) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Recargar previsualización del sitio web"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-850 hover:bg-ink-800 text-gray-300 hover:text-white border border-line text-xs font-medium transition-colors cursor-pointer active:scale-95"
          >
            <IconRefreshCw
              size={13}
              className={`text-gray-400 ${isLoading ? 'animate-spin text-gold-400' : ''}`}
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
            <span>Abrir Web</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage — Perfectly Centered & Responsive */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-auto flex items-center justify-center p-4 bg-[#08080c]"
      >
        {/* Subtle Luxury Radial Gold Aura */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0) 75%)',
          }}
        />

        {/* ============================================================ */}
        {/* VIEW MODE: MOBILE (Default) — iPhone 15/16 Pro Frame */}
        {/* ============================================================ */}
        {viewMode === 'mobile' && (
          <div
            className="relative flex items-center justify-center transition-all duration-300 ease-out"
            style={{
              width: mobileFrameWidth * scale,
              height: mobileFrameHeight * scale,
            }}
          >
            {/* Phone Scaled Wrapper */}
            <div
              className="relative shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(212,175,55,0.15)] rounded-[50px] bg-[#1a1a24] border-[10px] border-[#252532] flex flex-col overflow-hidden"
              style={{
                width: mobileFrameWidth,
                height: mobileFrameHeight,
                zoom: scale,
              }}
            >
              {/* Dynamic Island Pill with Camera Sensor */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-end pr-3 pointer-events-none shadow-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#181824] border border-white/10" />
              </div>

              {/* iOS Home Indicator Bar */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30 pointer-events-none" />

              {/* Screen Container with exact mobile viewport */}
              <div
                className="relative flex-1 w-full h-full rounded-[40px] overflow-hidden bg-black"
                style={{
                  width: mobileScreenWidth,
                  height: mobileScreenHeight,
                }}
              >
                {/* Smooth Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-ink-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full border-2 border-gold-500/20 border-t-gold-400 animate-spin" />
                      <IconGlobe
                        size={18}
                        className="absolute inset-0 m-auto text-gold-400"
                      />
                    </div>
                    <p className="text-xs font-semibold text-gray-200">Cargando goldblacklash.com...</p>
                    <p className="text-[11px] text-gray-500 max-w-[210px]">
                      Conectando con el sitio web oficial en tiempo real
                    </p>
                  </div>
                )}

                {/* The Mobile Iframe */}
                <iframe
                  key={`mobile-${iframeKey}`}
                  src={siteUrl}
                  title="Previsualización móvil de goldblacklash.com"
                  className="w-full h-full border-0 bg-black"
                  style={{
                    width: mobileScreenWidth,
                    height: mobileScreenHeight,
                  }}
                  onLoad={() => setIsLoading(false)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE: DESKTOP — Mac Sequoia Window Frame */}
        {/* ============================================================ */}
        {viewMode === 'desktop' && (
          <div
            className="relative flex items-center justify-center transition-all duration-300 ease-out"
            style={{
              width: desktopFrameWidth * scale,
              height: desktopFrameHeight * scale,
            }}
          >
            {/* Desktop Scaled Wrapper */}
            <div
              className="relative shadow-[0_35px_100px_rgba(0,0,0,0.95),0_0_60px_rgba(212,175,55,0.15)] rounded-2xl bg-[#101016] border border-gold-500/25 flex flex-col overflow-hidden"
              style={{
                width: desktopFrameWidth,
                height: desktopFrameHeight,
                zoom: scale,
              }}
            >
              {/* macOS Window Header Bar */}
              <div
                className="shrink-0 px-4 bg-[#161622] border-b border-line flex items-center justify-between gap-4 z-20"
                style={{ height: desktopHeaderHeight }}
              >
                {/* Traffic Lights (Red, Yellow, Green) */}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 inline-block shadow-sm" />
                </div>

                {/* Mac Resolution Badge */}
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-ink-850 border border-line text-gray-300">
                    {desktopResolution} × {desktopScreenHeight} (Mac)
                  </span>
                </div>
              </div>

              {/* Desktop Screen Container */}
              <div
                className="relative flex-1 w-full h-full bg-black overflow-hidden"
                style={{
                  width: desktopScreenWidth,
                  height: desktopScreenHeight,
                }}
              >
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-ink-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full border-2 border-gold-500/20 border-t-gold-400 animate-spin" />
                      <IconGlobe
                        size={18}
                        className="absolute inset-0 m-auto text-gold-400"
                      />
                    </div>
                    <p className="text-xs font-semibold text-gray-200">Cargando goldblacklash.com...</p>
                    <p className="text-[11px] text-gray-500 max-w-xs">
                      Conectando con el sitio web oficial en tiempo real
                    </p>
                  </div>
                )}

                {/* The Desktop Iframe */}
                <iframe
                  key={`desktop-${iframeKey}`}
                  src={siteUrl}
                  title="Previsualización de escritorio de goldblacklash.com"
                  className="w-full h-full border-0 bg-black"
                  style={{
                    width: desktopScreenWidth,
                    height: desktopScreenHeight,
                  }}
                  onLoad={() => setIsLoading(false)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discreet Bottom Bar Indicator */}
      <div className="shrink-0 px-6 py-2 bg-ink-900 border-t border-line flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <span>Modo activo:</span>
          <span className="text-gold-300 font-medium">
            {viewMode === 'mobile' ? 'iPhone 15/16 Pro (390 × 844 px)' : `Escritorio Mac (${desktopResolution} × ${desktopScreenHeight} px)`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Escala aplicada: <strong className="text-gray-300 font-mono">{Math.round(scale * 100)}%</strong></span>
          <span>•</span>
          <span>Interacción táctil y scroll habilitados</span>
        </div>
      </div>
    </div>
  )
}
