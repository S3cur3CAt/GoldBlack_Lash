import React from 'react'
import { useUpdaterContext } from '../context/UpdaterContext'
import { formatBytes } from '../services/updater'
import {
  IconDownload,
  IconRefreshCw,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconSparkles,
} from './Icons'

export const UpdateModal: React.FC = () => {
  const {
    status,
    updateInfo,
    isModalOpen,
    setIsModalOpen,
    progress,
    receivedBytes,
    totalBytes,
    errorMessage,
    startDownload,
    applyAndRestart,
  } = useUpdaterContext()

  if (!isModalOpen || !updateInfo) return null

  const isDownloading = status === 'downloading'
  const isDownloaded = status === 'downloaded'
  const isError = status === 'error'

  const handleClose = () => {
    if (isDownloading) return // Do not close while actively downloading
    setIsModalOpen(false)
    if (typeof window !== 'undefined' && window.electronAPI?.clearDockBadge) {
      window.electronAPI.clearDockBadge()
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c12] border border-gold-500/40 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-gold-500/15 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        {!isDownloading && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#252536] transition-colors cursor-pointer z-10"
            title="Cerrar y recordar más tarde"
          >
            <IconX size={18} />
          </button>
        )}

        {/* Header with Icon */}
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/25 via-amber-500/20 to-transparent border border-gold-500/40 flex items-center justify-center text-gold-400 shadow-gold-glow shrink-0 relative">
            <span className="text-2xl animate-bounce">🚀</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                Actualización Disponible
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                macOS & Windows
              </span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
              {updateInfo.releaseName || `Versión ${updateInfo.latestVersion}`}
            </h3>

            <p className="text-xs text-gray-400 mt-1">
              Versión instalada actual: <span className="font-mono text-gray-300">v{updateInfo.currentVersion}</span>
              {' • '}
              Nueva versión: <span className="font-mono font-bold text-gold-400">{updateInfo.latestVersion}</span>
            </p>
          </div>
        </div>

        {/* Release Notes / Details Box */}
        <div className="mt-5 p-4 rounded-2xl bg-[#0e0e16] border border-[#222232] relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span className="flex items-center gap-1.5 text-gold-300">
              <IconSparkles size={14} className="text-gold-400" />
              Novedades y Mejoras Incluidas
            </span>
            {updateInfo.assetSize ? (
              <span className="font-mono text-[11px] text-gray-400">
                Tamaño: {formatBytes(updateInfo.assetSize)}
              </span>
            ) : null}
          </div>

          <div className="text-xs text-gray-300 leading-relaxed max-h-44 overflow-y-auto pr-2 space-y-1.5 whitespace-pre-line custom-scrollbar">
            {updateInfo.notes ? (
              updateInfo.notes
            ) : (
              <p className="text-gray-400 italic">
                Esta actualización incluye optimizaciones de rendimiento, sincronización automática con Supabase y compatibilidad con las últimas versiones de macOS y Windows.
              </p>
            )}
          </div>
        </div>

        {/* State: Downloading progress */}
        {isDownloading && (
          <div className="mt-5 p-4 rounded-2xl bg-[#141420] border border-gold-500/30 space-y-2.5 relative z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gold-300 font-semibold">
                <IconRefreshCw size={14} className="animate-spin text-gold-400" />
                Descargando paquete de actualización...
              </span>
              <span className="font-mono font-bold text-gold-400 text-sm">
                {progress}%
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#1e1e2c] overflow-hidden border border-[#2b2b3d] p-[2px]">
              <div
                className="h-full bg-gradient-to-r from-gold-500 via-amber-400 to-gold-300 rounded-full transition-all duration-200 shadow-gold-glow"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>

            {totalBytes > 0 && (
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span>Progreso de descarga</span>
                <span>{formatBytes(receivedBytes)} de {formatBytes(totalBytes)}</span>
              </div>
            )}
          </div>
        )}

        {/* State: Downloaded */}
        {isDownloaded && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <IconCheck size={20} />
            </div>
            <div className="text-xs">
              <strong className="block text-emerald-200 font-semibold text-sm">
                ¡Descarga completada con éxito!
              </strong>
              <span>
                La aplicación está lista para actualizarse. Haz clic a continuación para reiniciar e instalar.
              </span>
            </div>
          </div>
        )}

        {/* State: Error */}
        {isError && (
          <div className="mt-5 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-300 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <IconAlertTriangle size={20} />
            </div>
            <div className="text-xs">
              <strong className="block text-red-200 font-semibold text-sm">
                Error en la descarga
              </strong>
              <span>{errorMessage || 'Ocurrió un problema al descargar el paquete de actualización.'}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#202030] relative z-10">
          {!isDownloading && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-[#1e1e2c] hover:bg-[#28283a] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Recordar más tarde
            </button>
          )}

          {isDownloaded ? (
            <button
              type="button"
              autoFocus
              onClick={applyAndRestart}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <IconRefreshCw size={15} />
              Reiniciar e Instalar Ahora
            </button>
          ) : isDownloading ? (
            <button
              type="button"
              disabled
              className="px-6 py-2.5 rounded-xl bg-[#262638] text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-80"
            >
              <IconRefreshCw size={15} className="animate-spin text-gold-400" />
              Descargando ({progress}%)...
            </button>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={startDownload}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <IconDownload size={15} />
              Descargar e Instalar Ahora
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
