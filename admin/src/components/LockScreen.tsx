import React, { useState, useEffect, useCallback } from 'react'
import logoImg from '../assets/logo.png'
import { getApiBaseUrl, getStudioConfig } from '../services/storage'
import { IconLock, IconAlertCircle, IconCheck, IconRefreshCw } from './Icons'

interface LockScreenProps {
  onUnlock: () => void
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const isMac = typeof window !== 'undefined' && window.electronAPI?.platform === 'darwin'
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

  const handleVerify = useCallback(async (candidatePin?: string) => {
    const clean = (candidatePin !== undefined ? candidatePin : pin).trim()
    if (!clean) {
      setErrorMsg('Introduce el PIN de acceso del estudio')
      return
    }

    setIsVerifying(true)
    setErrorMsg(null)

    try {
      const baseUrl = getApiBaseUrl()
      let verified = false
      let userName = 'Administrador'

      // 1. Intento de validación con API Gateway central
      try {
        const res = await fetch(`${baseUrl}/api/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: clean }),
        })
        const data = await res.json().catch(() => null)
        if (res.ok && data?.ok) {
          verified = true
          if (data?.user?.name) userName = data.user.name
        } else if (data?.error) {
          setErrorMsg(data.error)
        }
      } catch (networkErr) {
        console.warn('[LockScreen] No se pudo verificar online, probando credenciales locales cacheadas...', networkErr)
      }

      // 2. Fallback offline con credenciales en configuración local
      if (!verified) {
        const localCfg = getStudioConfig()
        const matchUser = localCfg.telegramAllowedCredentials?.find(
          (u) => u.active !== false && String(u.pin || '').trim() === clean
        )
        const matchLegacy = localCfg.miniAppPin && String(localCfg.miniAppPin).trim() === clean

        if (matchUser || matchLegacy) {
          verified = true
          if (matchUser?.name) userName = matchUser.name
          setErrorMsg(null)
        }
      }

      if (verified) {
        try {
          sessionStorage.setItem('gb_admin_auth', 'true')
          sessionStorage.setItem('gb_admin_user', userName)
        } catch {}
        onUnlock()
      } else {
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setErrorMsg((prev) => prev || 'PIN incorrecto. Acceso exclusivo para GoldBlack Lash Studio.')
        setPin('')
      }
    } catch {
      setErrorMsg('Error al conectar. Verifica tu conexión a internet.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPin('')
    } finally {
      setIsVerifying(false)
    }
  }, [pin, onUnlock])

  // Soporte para teclado físico (0-9, Backspace, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        setPin((prev) => {
          if (prev.length < 8) {
            const next = prev + e.key
            // Auto-verificar al completar los 6 dígitos estándar del estudio
            if (next.length === 6) {
              setTimeout(() => handleVerify(next), 50)
            }
            return next
          }
          return prev
        })
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1))
        setErrorMsg(null)
      } else if (e.key === 'Enter') {
        handleVerify()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleVerify])

  const handleDigitPress = (digit: string) => {
    if (isVerifying) return
    setErrorMsg(null)
    setPin((prev) => {
      if (prev.length < 8) {
        const next = prev + digit
        // Auto-verificar al completar los 6 dígitos estándar del estudio
        if (next.length === 6) {
          setTimeout(() => handleVerify(next), 50)
        }
        return next
      }
      return prev
    })
  }

  const handleBackspace = () => {
    if (isVerifying) return
    setPin((prev) => prev.slice(0, -1))
    setErrorMsg(null)
  }

  const handleClear = () => {
    if (isVerifying) return
    setPin('')
    setErrorMsg(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07070a] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Barra de título de ventana integrada */}
      {isElectron && (
        <div
          className="h-9 w-full bg-black/40 flex items-center justify-between select-none shrink-0 z-50 text-xs px-3"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className={`flex items-center gap-2 ${isMac ? 'pl-16' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] text-zinc-400 font-medium">GoldBlack Lash Studio — Acceso Protegido</span>
          </div>

          {!isMac && (
            <div
              className="flex items-center no-drag"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => window.electronAPI?.minimize()}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                title="Minimizar"
              >
                —
              </button>
              <button
                type="button"
                onClick={() => window.electronAPI?.close()}
                className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:bg-rose-600 hover:text-white transition-colors"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fondos luminosos y auras vivos estilo Studio */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-rose-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-gradient-to-t from-purple-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Contenido Central */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto w-full">
        {/* Logotipo oficial con aura dorada/rosa */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/30 via-rose-400/20 to-amber-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-b from-amber-300 via-rose-400 to-amber-600 shadow-2xl">
            <div className="w-full h-full rounded-[14px] bg-[#0a0a0e] flex items-center justify-center overflow-hidden">
              <img
                src={logoImg}
                alt="GoldBlack Lash Studio"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  if (!t.src.endsWith('logo.png')) t.src = './logo.png'
                }}
              />
            </div>
          </div>
        </div>

        {/* Badge de seguridad */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-2 shadow-sm">
          <IconLock size={12} className="text-amber-400" />
          <span>Acceso Protegido</span>
        </div>

        <h1 className="text-2xl font-serif font-bold text-white tracking-wide text-center">
          GoldBlack <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-400">Lash</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1 mb-6 text-center max-w-[280px]">
          Panel de Gestión y Administración
          <span className="block text-[11px] text-zinc-500 mt-0.5 font-mono">Windows 11 / macOS Monterey</span>
        </p>

        {/* Indicadores de PIN (Dots) */}
        <div className={`flex items-center justify-center gap-3 mb-6 transition-transform ${shake ? 'animate-bounce' : ''}`}>
          {Array.from({ length: Math.max(6, Math.min(8, pin.length)) }).map((_, idx) => {
            const hasValue = idx < pin.length
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                  hasValue
                    ? 'bg-gradient-to-br from-amber-300 to-rose-400 border-amber-300 scale-110 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                    : 'bg-white/5 border-white/20'
                }`}
              />
            )
          })}
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 max-w-[280px] text-center animate-fadeIn">
            <IconAlertCircle size={14} className="shrink-0 text-rose-400" />
            <span className="flex-1 leading-tight text-[11px]">{errorMsg}</span>
          </div>
        )}

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isVerifying}
              className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-lg font-bold text-white shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={isVerifying || pin.length === 0}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-xs font-bold text-zinc-400 hover:text-white transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-30"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isVerifying}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-lg font-bold text-white shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isVerifying || pin.length === 0}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-base font-bold text-zinc-400 hover:text-white transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-30"
            title="Borrar"
          >
            ⌫
          </button>
        </div>

        {/* Botón de Desbloqueo */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || pin.length === 0}
          className="w-full max-w-[260px] py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <>
              <IconRefreshCw size={14} className="animate-spin text-black" />
              <span>Verificando PIN...</span>
            </>
          ) : (
            <>
              <IconCheck size={15} className="text-black" />
              <span>Desbloquear Panel {pin.length > 0 ? `(${pin.length})` : ''}</span>
            </>
          )}
        </button>

        {/* Aviso de seguridad al pie */}
        <div className="mt-5 text-center">
          <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
            <span>🛡️</span>
            <span>Se auto-bloquea automáticamente al minimizar la app</span>
          </p>
        </div>
      </div>
    </div>
  )
}
