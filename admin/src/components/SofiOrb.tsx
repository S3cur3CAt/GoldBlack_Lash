import React, { useEffect } from 'react'
import { IconX } from './Icons'

interface SofiOrbProps {
  isActive: boolean
  isListening: boolean
  isProcessing: boolean
  transcript: string
  response: string
  error?: string | null
  onClose: () => void
}

/**
 * SofiOrb — asistente de voz estilo Siri a pantalla completa.
 * No tiene botón de activación: se activa solo con la palabra clave
 * «Oye Sofi» (SofiWakeWordManager). Al activarse cubre la pantalla con
 * un velo oscuro desenfocado y muestra una gran bola luminosa de
 * colores vívidos girando, con la transcripción y la respuesta encima.
 */
export const SofiOrb: React.FC<SofiOrbProps> = ({
  isActive,
  isListening,
  isProcessing,
  transcript,
  response,
  error,
  onClose,
}) => {
  // Escape cierra el orbe
  useEffect(() => {
    if (!isActive) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, onClose])

  if (!isActive) return null

  const statusLabel = isProcessing
    ? 'Pensando…'
    : isListening
      ? 'Escuchando «Oye Sofi»'
      : 'Respondiendo'

  // El remolino gira más rápido mientras procesa la consulta
  const spinDuration = isProcessing ? 2.5 : 7
  const spinReverseDuration = isProcessing ? 3.5 : 10

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-14 animate-fade-in"
      style={{
        background:
          'radial-gradient(ellipse at 50% 62%, rgba(9,9,11,0.45) 0%, rgba(9,9,11,0.82) 55%, rgba(9,9,11,0.94) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      role="status"
      aria-label={`Sofi: ${statusLabel}`}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        title="Cerrar (Esc)"
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/60 hover:text-white cursor-pointer transition-colors"
      >
        <IconX size={15} />
      </button>

      {/* Estado */}
      <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/50 mb-5">
        {statusLabel}
      </span>

      {/* Transcripción — la pregunta del usuario en grande */}
      {transcript && (
        <p className="text-2xl font-medium text-white/90 text-center max-w-2xl mb-6 px-8 leading-snug animate-fade-in-up">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {/* Respuesta en tarjeta de cristal */}
      {response && (
        <div className="mb-10 w-[min(560px,calc(100vw-3rem))] rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-2xl p-5 shadow-raised animate-scale-up">
          <p className="text-sm text-zinc-100 leading-relaxed font-medium text-center">
            {response}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-8 w-[min(440px,calc(100vw-3rem))] rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs p-3.5 text-center animate-scale-up">
          {error}
        </div>
      )}

      {/* Gran bola estilo Siri */}
      <div className="relative" style={{ width: 176, height: 176 }}>
        {/* Resplandor ambiental amplio */}
        <div
          className={`absolute -inset-16 rounded-full ${isListening ? 'sofi-breathe' : ''}`}
          style={{
            background:
              'radial-gradient(circle, rgba(191,90,242,0.42) 0%, rgba(10,132,255,0.34) 38%, rgba(255,55,95,0.26) 68%, rgba(255,159,10,0.16) 82%, transparent 88%)',
            filter: 'blur(30px)',
          }}
        />

        {/* Ondas al responder */}
        {Boolean(response) && !isProcessing && (
          <>
            <span
              className="absolute inset-0 rounded-full sofi-ripple"
              style={{ boxShadow: '0 0 40px 8px rgba(191,90,242,0.55)' }}
            />
            <span
              className="absolute inset-0 rounded-full sofi-ripple"
              style={{
                animationDelay: '900ms',
                boxShadow: '0 0 40px 8px rgba(10,132,255,0.55)',
              }}
            />
          </>
        )}

        {/* Cuerpo del orbe: capas de conic-gradient vívidas girando */}
        <div
          className={`absolute inset-0 rounded-full overflow-hidden ${isListening ? 'sofi-breathe' : ''}`}
          style={{
            boxShadow: '0 12px 48px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.35)',
          }}
        >
          <div
            className="absolute sofi-spin"
            style={{
              inset: '-35%',
              animationDuration: `${spinDuration}s`,
              background:
                'conic-gradient(from 0deg, #ff375f, #ff9f0a, #ffd60a, #30d158, #40c8e0, #0a84ff, #bf5af2, #ff375f)',
              filter: 'blur(18px)',
            }}
          />
          <div
            className="absolute sofi-spin-reverse"
            style={{
              inset: '-45%',
              animationDuration: `${spinReverseDuration}s`,
              background:
                'conic-gradient(from 180deg, #bf5af2, #ff2d55, #0a84ff, #40c8e0, #30d158, #ffd60a, #ff9f0a, #bf5af2)',
              filter: 'blur(24px)',
            }}
          />
          {/* Núcleo luminoso para dar volumen */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '20%',
              background:
                'radial-gradient(circle at 34% 30%, rgba(255,255,255,0.35), rgba(64,200,224,0.18) 35%, rgba(9,9,11,0.45) 68%, rgba(9,9,11,0.78))',
              filter: 'blur(5px)',
            }}
          />
          {/* Capa brillante tipo esfera de cristal */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.35), rgba(255,255,255,0.07) 38%, transparent 55%)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
