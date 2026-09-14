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
  executeLocalVoiceCommand,
  isSpeechRecognitionSupported,
  playWakeChime,
  processVoiceWithGemini,
  speakWithNativeVoice,
  VoiceActionHandlers,
  WakeWordListener,
} from '../services/voiceAssistant'
import { VoiceCommandsModal } from './VoiceCommandsModal'

interface VoiceAssistantWidgetProps {
  apiKey?: string
  voiceAutoSpeak?: boolean
  wakeWordEnabled?: boolean
  handlers: VoiceActionHandlers
  onOpenSettings: () => void
}

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'speaking' | 'error'

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  apiKey,
  voiceAutoSpeak = true,
  wakeWordEnabled = true,
  handlers,
  onOpenSettings,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastActionText, setLastActionText] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [showCommandsModal, setShowCommandsModal] = useState(false)
  const [liveVolume, setLiveVolume] = useState<number>(0)
  const [isHandsFree, setIsHandsFree] = useState<boolean>(() => {
    const saved = localStorage.getItem('goldblack_voice_handsfree')
    return saved !== null ? saved === 'true' : wakeWordEnabled
  })

  // Keep isHandsFree in sync if settings toggle wakeWordEnabled
  useEffect(() => {
    if (wakeWordEnabled !== undefined) {
      setIsHandsFree(wakeWordEnabled)
    }
  }, [wakeWordEnabled])

  const recorderRef = useRef<AudioRecorder | null>(null)
  const wakeWordListenerRef = useRef<WakeWordListener | null>(null)
  const timerRef = useRef<any>(null)
  const autoCloseTimerRef = useRef<any>(null)

  // Unlock Web Audio API context on first interaction to avoid browser/Chromium autoplay blocks
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {})
          }
        }
      } catch {}
    }

    window.addEventListener('click', unlockAudio, { once: true })
    window.addEventListener('keydown', unlockAudio, { once: true })
    window.addEventListener('touchstart', unlockAudio, { once: true })
    return () => {
      window.removeEventListener('click', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
      window.removeEventListener('touchstart', unlockAudio)
    }
  }, [])

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

  // Track status in a ref so callbacks can read it without triggering re-renders
  const statusRef = useRef<VoiceStatus>(status)
  useEffect(() => { statusRef.current = status }, [status])

  // Continuous background hands-free listener ("Oye Sofi" / "Sofi")
  // IMPORTANT: `status` is NOT in the dependency array on purpose!
  // When onWake fires and changes status to 'recording', we must NOT re-run this effect
  // because the cleanup would cancel the recorder that is actively recording the user's command.
  useEffect(() => {
    if (!isHandsFree || !wakeWordEnabled) {
      if (wakeWordListenerRef.current) {
        wakeWordListenerRef.current.stop()
        wakeWordListenerRef.current = null
      }
      if (recorderRef.current) {
        recorderRef.current.cancel()
        recorderRef.current = null
      }
      return
    }

    // Only start standby if currently idle
    if (statusRef.current !== 'idle') return

    let isCancelled = false

    const startVADStandby = () => {
      if (isCancelled) return
      console.log('[Sofi] 🎧 Iniciando escucha pasiva en segundo plano (esperando «Oye Sofi»)...')
      const recorder = new AudioRecorder()
      recorderRef.current = recorder

      recorder
        .startStandby({
          standbyThreshold: 0.038,
          speechThreshold: 0.025,
          onStandbyUtterance: async (audioData) => {
            if (isCancelled || statusRef.current !== 'idle') return
            const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
            if (!effectiveApiKey.trim()) return

            try {
              console.log('[Sofi] 🔍 Verificando audio en segundo plano con Gemini Flash...')
              const res = await processVoiceWithGemini(
                {
                  base64Audio: audioData.base64,
                  mimeType: audioData.mimeType,
                  isStandbyWakeCheck: true,
                },
                effectiveApiKey,
                handlers
              )

              if (res.ignored) {
                console.log('[Sofi] 🔇 Audio ignorado (ruido ambiental o charla sin «Sofi»). Sin abrir interfaz.')
                return
              }

              // ¡El usuario ha dicho «Oye Sofi» o una orden directa!
              playWakeChime()
              setIsExpanded(true)
              setErrorMessage(null)

              if (res.isWakeGreetingOnly) {
                console.log('[Sofi] 🌟 Wake word «Oye Sofi» detectado, saludando...')
                await handleWakeGreeting()
              } else {
                console.log('[Sofi] ⚡ Orden directa detectada en standby:', res.spokenText)
                setStatus('speaking')
                setLastActionText(res.spokenText)
                if (voiceAutoSpeak && res.spokenText) {
                  await speakWithNativeVoice(res.spokenText)
                }

                if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
                autoCloseTimerRef.current = setTimeout(() => {
                  setStatus('idle')
                  setIsExpanded(false)
                }, 4000)
              }
            } catch (err: any) {
              console.warn('[Standby Utterance Process Error]', err?.message || err)
            }
          },
        })
        .catch((err) => {
          console.warn('[Standby Mic Start Error]', err)
        })
    }

    if (isSpeechRecognitionSupported()) {
      const listener = new WakeWordListener()
      wakeWordListenerRef.current = listener

      listener.start(
        async (commandText) => {
          if (isCancelled) return
          console.log('[Sofi] Wake word detectado:', commandText)
          if (commandText && commandText.trim().length > 1) {
            playWakeChime()
            await handleExecuteCommandText(commandText.trim())
          } else {
            await handleWakeGreeting()
          }
        },
        () => {
          console.log('[Sofi] SpeechRecognition no disponible, activando VAD local.')
          if (!isCancelled && statusRef.current === 'idle') {
            startVADStandby()
          }
        }
      )

      return () => {
        isCancelled = true
        listener.stop()
        wakeWordListenerRef.current = null
      }
    } else {
      // Direct local Web Audio Standby VAD (macOS Electron / Windows Electron / Safari)
      startVADStandby()

      return () => {
        isCancelled = true
        // ONLY cancel if still in standby — do NOT cancel if the recorder transitioned to recording!
        // This prevents destroying the active recording when the effect re-runs.
        if (recorderRef.current && statusRef.current === 'idle') {
          console.log('[Sofi] Cleanup: cancelando VAD standby (estado idle).')
          recorderRef.current.cancel()
          recorderRef.current = null
        } else {
          console.log('[Sofi] Cleanup: preservando recorder activo (estado:', statusRef.current, ')')
        }
      }
    }
  }, [isHandsFree, wakeWordEnabled, apiKey])

  // Re-engage VAD standby when status returns to 'idle' after processing a command
  // This is separate from the main effect above so that it can depend on `status`
  // without causing the cleanup-during-recording bug
  useEffect(() => {
    if (status === 'idle' && isHandsFree && wakeWordEnabled && !recorderRef.current) {
      // Small delay to avoid re-entrance issues
      const restartTimer = setTimeout(() => {
        if (statusRef.current === 'idle' && !recorderRef.current) {
          console.log('[Sofi] 🔄 Re-activando escucha VAD en segundo plano...')
          const recorder = new AudioRecorder()
          recorderRef.current = recorder

          recorder
            .startStandby({
              standbyThreshold: 0.038,
              speechThreshold: 0.025,
              onStandbyUtterance: async (audioData) => {
                if (statusRef.current !== 'idle') return
                const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
                if (!effectiveApiKey.trim()) return

                try {
                  const res = await processVoiceWithGemini(
                    {
                      base64Audio: audioData.base64,
                      mimeType: audioData.mimeType,
                      isStandbyWakeCheck: true,
                    },
                    effectiveApiKey,
                    handlers
                  )

                  if (res.ignored) {
                    console.log('[Sofi] 🔇 Audio ignorado en segundo plano (sin «Sofi»).')
                    return
                  }

                  playWakeChime()
                  setIsExpanded(true)
                  setErrorMessage(null)

                  if (res.isWakeGreetingOnly) {
                    console.log('[Sofi] 🌟 Wake word «Oye Sofi» detectado...')
                    await handleWakeGreeting()
                  } else {
                    console.log('[Sofi] ⚡ Orden ejecutada:', res.spokenText)
                    setStatus('speaking')
                    setLastActionText(res.spokenText)
                    if (voiceAutoSpeak && res.spokenText) {
                      await speakWithNativeVoice(res.spokenText)
                    }

                    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
                    autoCloseTimerRef.current = setTimeout(() => {
                      setStatus('idle')
                      setIsExpanded(false)
                    }, 4000)
                  }
                } catch (err: any) {
                  console.warn('[Standby Process Error]', err?.message || err)
                }
              },
            })
            .catch((err) => {
              console.warn('[Standby Re-engage Error]', err)
            })
        }
      }, 500)

      return () => clearTimeout(restartTimer)
    }
  }, [status, isHandsFree, wakeWordEnabled])

  // Handles when user says "Oye Sofi" alone: speaks out loud "Dime, te escucho." and listens!
  const handleWakeGreeting = async () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    if (recorderRef.current) {
      recorderRef.current.cancel()
      recorderRef.current = null
    }

    playWakeChime()
    setIsExpanded(true)
    setStatus('speaking')
    setLastActionText('Dime, te escucho...')

    // Verbal audio response from Siri / macOS native voice
    if (voiceAutoSpeak) {
      await speakWithNativeVoice('Dime, te escucho.')
    }

    // Immediately open mic and listen for the actual command!
    await startListening()
  }

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
    setLiveVolume(0)

    try {
      const { base64, mimeType } = await recorderRef.current.stop()
      recorderRef.current = null

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

      // If Gemini determined this audio was background salon noise or unrelated conversation
      if (response.ignored) {
        console.log('[Sofi] Audio ignorado (no dirigido a Sofi ni comando de la app).')
        setStatus('idle')
        setIsExpanded(false)
        return
      }

      // If user only said "Oye Sofi" without giving a command yet:
      if (response.isWakeGreetingOnly) {
        setLastActionText(response.spokenText)
        setStatus('speaking')
        if (voiceAutoSpeak && response.spokenText) {
          await speakWithNativeVoice(response.spokenText)
        }
        // Immediately re-open the mic for their command!
        await startListening()
        return
      }

      setLastActionText(response.spokenText)
      setStatus('speaking')

      // Speak response automatically with Siri / macOS native voice
      if (voiceAutoSpeak && response.spokenText) {
        await speakWithNativeVoice(response.spokenText)
      }

      // Auto-collapse after 4.5 seconds and return to idle standby
      autoCloseTimerRef.current = setTimeout(() => {
        setStatus('idle')
        setIsExpanded(false)
      }, 4500)
    } catch (err: any) {
      console.error('[Voice Assistant Error]', err)
      setStatus('error')
      setErrorMessage(err.message || 'Error al procesar el comando de voz.')
      if (voiceAutoSpeak) {
        speakWithNativeVoice('No pude entender la orden. Inténtalo de nuevo.')
      }
    }
  }

  // Start listening with real-time VAD for automatic zero-click execution
  const startListening = async () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)

    // Check if API key is present
    const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
    if (!effectiveApiKey.trim()) {
      setIsExpanded(true)
      setStatus('error')
      setErrorMessage('Necesitas una API Key gratuita de Gemini (0€ / 1.500 peticiones/día).')
      return
    }

    setIsExpanded(true)
    setErrorMessage(null)
    setLastActionText(null)
    setLiveVolume(0)

    try {
      let recorder = recorderRef.current
      if (!recorder) {
        recorder = new AudioRecorder()
        recorderRef.current = recorder
      }

      await recorder.start({
        silenceMs: 1200,
        speechThreshold: 0.02,
        onVolumeChange: (vol) => setLiveVolume(vol),
        onSilence: () => {
          // Automatic hands-free confirmation and execution upon silence (0 clicks required)
          console.log('[Mónica] Silencio detectado tras hablar -> Ejecución automática sin clics')
          stopAndProcess()
        },
        onTimeout: () => {
          console.log('[Mónica] Tiempo de espera agotado sin voz detectada.')
          handleCancel()
        },
      })
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

  // Toggle listening manually
  const toggleListening = async () => {
    if (status === 'recording') {
      await stopAndProcess()
    } else {
      await startListening()
    }
  }

  const handleExecuteCommandText = async (text: string) => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    const cleanText = text.trim()
    if (!cleanText) return

    setIsExpanded(true)
    setErrorMessage(null)
    setLiveVolume(0)

    // 1. Prioridad: Comprobación local directa (0€ / 100% offline sin consumir API)
    const localRes = await executeLocalVoiceCommand(cleanText, handlers)
    if (localRes.handled && localRes.spokenText) {
      console.log('[Sofi] ⚡ Comando ejecutado localmente (0€ / sin API):', cleanText)
      setLastActionText(localRes.spokenText)
      setStatus('speaking')
      if (voiceAutoSpeak && localRes.spokenText) {
        await speakWithNativeVoice(localRes.spokenText)
      }
      autoCloseTimerRef.current = setTimeout(() => {
        setStatus('idle')
        setIsExpanded(false)
      }, 4500)
      return
    }

    // 2. Si no es un patrón local reconocido, procesar con Gemini Flash
    setStatus('processing')
    try {
      const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
      if (!effectiveApiKey.trim()) {
        setStatus('error')
        setErrorMessage('Configura tu API Key gratuita de Gemini en Ajustes.')
        return
      }

      const response = await processVoiceWithGemini(
        { textQuery: cleanText },
        effectiveApiKey,
        handlers
      )

      setLastActionText(response.spokenText)
      setStatus('speaking')

      if (voiceAutoSpeak && response.spokenText) {
        await speakWithNativeVoice(response.spokenText)
      }

      autoCloseTimerRef.current = setTimeout(() => {
        setStatus('idle')
        setIsExpanded(false)
      }, 4500)
    } catch (err: any) {
      console.error('[Voice Assistant Text Command Error]', err)
      setStatus('error')
      setErrorMessage(err.message || 'Error al procesar el comando.')
      if (voiceAutoSpeak) {
        speakWithNativeVoice('No pude procesar el comando. Inténtalo de nuevo.')
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
    if (typeof window !== 'undefined' && (window as any).electronAPI?.stopSiri) {
      ;(window as any).electronAPI.stopSiri()
    }
    if (typeof window !== 'undefined' && (window as any).electronAPI?.stopNativeListen) {
      ;(window as any).electronAPI.stopNativeListen()
    }
    setLiveVolume(0)
    setStatus('idle')
    setIsExpanded(false)
    setErrorMessage(null)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Expanded Interactive Card */}
      {isExpanded && (
        <div className="mb-3 w-88 max-w-[90vw] bg-[#121218]/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.15)] text-zinc-100 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                <IconSparkles size={15} />
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wide uppercase text-amber-300/90 font-mono">
                  Sofi • Asistente de Voz
                </h4>
                <p className="text-[10px] text-zinc-400">Gemini Flash • Voz Siri</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Hands-Free Toggle */}
              <button
                onClick={() => {
                  const next = !isHandsFree
                  setIsHandsFree(next)
                  localStorage.setItem('goldblack_voice_handsfree', String(next))
                }}
                className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 ${
                  isHandsFree
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
                }`}
                title={
                  isHandsFree
                    ? 'Manos libres activado: Di «Sofi» en cualquier momento'
                    : 'Manos libres pausado: Haz clic para reactivar escucha continua'
                }
              >
                <span className={isHandsFree ? 'animate-pulse' : ''}>🎙️</span>
                <span>{isHandsFree ? 'Oye Sofi: ON' : 'Oye Sofi: OFF'}</span>
              </button>

              <button
                onClick={() => setShowCommandsModal(true)}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                title="Ver todos los comandos disponibles"
              >
                <span>📖</span>
                <span>Comandos</span>
              </button>
              <button
                onClick={handleCancel}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800/60 cursor-pointer"
                title="Cerrar asistente"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          {/* Body Content by Status */}
          <div className="py-3">
            {status === 'recording' && (
              <div className="flex flex-col items-center justify-center py-3 space-y-3">
                {/* Dynamic Real-time Soundwave reacting to live mic volume */}
                <div className="flex items-center justify-center gap-1.5 h-12">
                  {[0.6, 1.0, 1.4, 0.9, 0.5].map((multiplier, idx) => {
                    const heightPx = Math.max(8, Math.min(42, Math.round(8 + liveVolume * 45 * multiplier)))
                    return (
                      <span
                        key={idx}
                        style={{ height: `${heightPx}px` }}
                        className="w-1.5 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-200 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                      />
                    )
                  })}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-amber-200">Sofi escuchando tu orden...</p>
                  <p className="text-xs text-amber-400 font-medium mt-0.5 flex items-center justify-center gap-1">
                    <span>⚡</span>
                    <span>Se confirmará y ejecutará automáticamente al callar</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {recordingSeconds}s • Habla normalmente, no tienes que presionar nada
                  </p>
                </div>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-3 space-y-2 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                <p className="text-xs font-medium text-amber-200">Sofi interpretando orden con Gemini...</p>
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
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-semibold hover:brightness-110 active:scale-95 transition-all text-center shadow-[0_0_12px_rgba(212,175,55,0.25)] cursor-pointer"
                  >
                    ⚙️ Configurar Clave de Gemini en Ajustes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botón principal para abrir catálogo de comandos */}
          <div className="pt-2 pb-1 border-t border-zinc-800/60">
            <button
              onClick={() => setShowCommandsModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#1b1b28] hover:bg-[#232334] border border-amber-500/30 hover:border-amber-400/50 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <span>✨</span>
              <span>Ver todos los comandos disponibles</span>
            </button>
          </div>

          {/* Quick Examples footer */}
          <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Atajo: ⌘ + Shift + V</span>
            <span className="text-zinc-500">Google AI Studio 0€</span>
          </div>
        </div>
      )}

      {/* Modal de Comandos Disponibles de Sofi */}
      <VoiceCommandsModal
        isOpen={showCommandsModal}
        onClose={() => setShowCommandsModal(false)}
        onExecuteCommand={handleExecuteCommandText}
      />

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
        title="Control por voz con IA (Di «Sofi» o pulsa Cmd+Shift+V)"
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

        {/* Indicator badge: Green pulse if Hands-Free ("Oye Sofi") is actively listening */}
        {status === 'idle' && isHandsFree && (
          <span
            className="absolute -top-1 -right-1 flex h-4 w-4"
            title="Escucha activa en segundo plano: Di «Sofi»"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[8px] font-bold text-zinc-950 items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              ✦
            </span>
          </span>
        )}

        {/* Standard spark badge when idle and hands-free is off */}
        {status === 'idle' && !isHandsFree && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-zinc-950 flex items-center justify-center text-[9px] font-bold shadow-[0_0_8px_rgba(212,175,55,0.5)]">
            ✦
          </span>
        )}
      </button>
    </div>
  )
}
