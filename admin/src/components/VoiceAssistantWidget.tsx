import React, { useState, useEffect, useRef } from 'react'
import {
  IconMic,
  IconMicOff,
  IconSparkles,
  IconVolume2,
  IconVolumeX,
  IconX,
} from './Icons'
import {
  AudioRecorder,
  processVoiceWithGemini,
  speakWithNativeVoice,
  VoiceActionHandlers,
} from '../services/voiceAssistant'

interface VoiceAssistantWidgetProps {
  apiKey?: string
  voiceAutoSpeak?: boolean
  handlers: VoiceActionHandlers
  onOpenSettings: () => void
}

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'speaking' | 'error'

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  apiKey,
  voiceAutoSpeak = true,
  handlers,
  onOpenSettings,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastActionText, setLastActionText] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  const recorderRef = useRef<AudioRecorder | null>(null)
  const timerRef = useRef<any>(null)
  const autoCloseTimerRef = useRef<any>(null)

  // Listen for Cmd+Shift+V / Ctrl+Shift+V keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        toggleListening()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [status, apiKey])

  // Timer while recording
  useEffect(() => {
    if (status === 'recording') {
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  // Stop listening and process audio with Gemini Flash
  const stopAndProcess = async () => {
    if (!recorderRef.current) return
    setStatus('processing')

    try {
      const { base64, mimeType } = await recorderRef.current.stop()

      const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
      if (!effectiveApiKey.trim()) {
        setStatus('error')
        setErrorMessage('Configura tu API Key gratuita de Gemini en Ajustes.')
        return
      }

      const response = await processVoiceWithGemini(
        { base64Audio: base64, mimeType },
        effectiveApiKey,
        handlers
      )

      setLastActionText(response.spokenText)
      setStatus('speaking')

      // Speak response if voiceAutoSpeak is true
      if (voiceAutoSpeak && response.spokenText) {
        await speakWithNativeVoice(response.spokenText)
      }

      // Auto-collapse after 5 seconds of completion
      autoCloseTimerRef.current = setTimeout(() => {
        setStatus('idle')
        setIsExpanded(false)
      }, 5000)
    } catch (err: any) {
      console.error('[Voice Assistant Error]', err)
      setStatus('error')
      setErrorMessage(err.message || 'Error al procesar el comando de voz.')
      if (voiceAutoSpeak) {
        speakWithNativeVoice('No pude entender la orden. Inténtalo de nuevo.')
      }
    }
  }

  // Toggle listening
  const toggleListening = async () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)

    // Check if API key is present
    const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
    if (!effectiveApiKey.trim()) {
      setIsExpanded(true)
      setStatus('error')
      setErrorMessage('Necesitas una API Key gratuita de Gemini (0€ / 1.500 peticiones/día).')
      return
    }

    if (status === 'recording') {
      await stopAndProcess()
    } else if (status === 'idle' || status === 'error' || status === 'speaking') {
      setIsExpanded(true)
      setErrorMessage(null)
      setLastActionText(null)

      try {
        const recorder = new AudioRecorder()
        recorderRef.current = recorder
        await recorder.start()
        setStatus('recording')
      } catch (err: any) {
        console.error('[Mic Permission Error]', err)
        setStatus('error')
        setErrorMessage(
          err.message ||
            'No se pudo acceder al micrófono. Verifica los permisos en los Ajustes del Sistema de tu Mac.'
        )
      }
    }
  }

  const handleCancel = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    if (recorderRef.current) {
      recorderRef.current.cancel()
      recorderRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setStatus('idle')
    setIsExpanded(false)
    setErrorMessage(null)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Expanded Interactive Card */}
      {isExpanded && (
        <div className="mb-3 w-84 max-w-[90vw] bg-[#121218]/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.15)] text-zinc-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                <IconSparkles size={15} />
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wide uppercase text-amber-300/90 font-mono">
                  GoldBlack Voice IA
                </h4>
                <p className="text-[10px] text-zinc-400">Gemini Flash • 0€</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800/60"
              title="Cerrar asistente"
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Body Content by Status */}
          <div className="py-3">
            {status === 'recording' && (
              <div className="flex flex-col items-center justify-center py-2 space-y-3">
                {/* Pulsing Soundwave Bars */}
                <div className="flex items-center justify-center gap-1.5 h-10">
                  <span className="w-1.5 h-4 bg-amber-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-8 bg-amber-300 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" />
                  <span className="w-1.5 h-10 bg-amber-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s]" />
                  <span className="w-1.5 h-6 bg-amber-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.15s]" />
                  <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-amber-200">Te escucho atentamente...</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {recordingSeconds}s • Di tu orden (ej. &ldquo;Ve a facturación&rdquo;, &ldquo;Crea cita para Laura&rdquo;)
                  </p>
                </div>
                <button
                  onClick={stopAndProcess}
                  className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-semibold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                >
                  ✓ Terminar y Ejecutar
                </button>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-3 space-y-2 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                <p className="text-xs font-medium text-amber-200">Gemini Flash interpretando orden...</p>
                <p className="text-[11px] text-zinc-400">Analizando intención y ejecutando herramientas</p>
              </div>
            )}

            {status === 'speaking' && (
              <div className="space-y-2 py-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <IconVolume2 size={16} className="animate-pulse" />
                  <span>Acción Ejecutada</span>
                </div>
                <p className="text-xs text-zinc-200 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5 leading-relaxed">
                  {lastActionText}
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={toggleListening}
                    className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors underline underline-offset-2"
                  >
                    Dar otra orden
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3 py-1">
                <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                  <IconMicOff size={16} className="shrink-0 mt-0.5" />
                  <p className="leading-snug">{errorMessage}</p>
                </div>
                {(!apiKey || !apiKey.trim()) && (
                  <button
                    onClick={() => {
                      onOpenSettings()
                      handleCancel()
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-semibold hover:brightness-110 active:scale-95 transition-all text-center shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                  >
                    ⚙️ Configurar Clave de Gemini en Ajustes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Examples footer */}
          <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Atajo: ⌘ + Shift + V</span>
            <span className="text-zinc-500">Google AI Studio 0€</span>
          </div>
        </div>
      )}

      {/* Floating Main Mic Button */}
      <button
        onClick={toggleListening}
        aria-label="Asistente de Voz GoldBlack Lash"
        className={`group relative flex items-center gap-2.5 p-3.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 active:scale-95 ${
          status === 'recording'
            ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse'
            : status === 'processing'
            ? 'bg-[#1a1a24] text-amber-300 border border-amber-500/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
            : 'bg-gradient-to-r from-[#171722] to-[#0d0d12] text-amber-400 border border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]'
        }`}
        title="Control por voz con IA (Cmd+Shift+V)"
      >
        {/* Pulsing ring when recording */}
        {status === 'recording' && (
          <span className="absolute -inset-1 rounded-full border-2 border-rose-500 animate-ping opacity-75" />
        )}

        {status === 'recording' ? (
          <IconMic size={22} className="text-white animate-pulse" />
        ) : status === 'processing' ? (
          <div className="w-5 h-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        ) : (
          <IconMic size={22} className="text-amber-400 group-hover:scale-110 transition-transform" />
        )}

        {/* Small badge spark */}
        {status === 'idle' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center text-[9px] font-bold shadow-[0_0_8px_rgba(212,175,55,0.5)]">
            ✦
          </span>
        )}
      </button>
    </div>
  )
}
