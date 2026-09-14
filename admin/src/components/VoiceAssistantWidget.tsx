import React, { useState, useEffect, useRef } from 'react'
import {
  IconMic,
  IconMicOff,
  IconSparkles,
  IconVolume2,
  IconX,
} from './Icons'
import {
  AudioRecorder,
  executeLocalVoiceCommand,
  isSpeechRecognitionSupported,
  playWakeChime,
  speakWithNativeVoice,
  VoiceActionHandlers,
  WakeWordListener,
} from '../services/voiceAssistant'
import { VoiceCommandsModal } from './VoiceCommandsModal'
import { StudioConfig } from '../types/admin'

interface VoiceAssistantWidgetProps {
  config?: StudioConfig
  apiKey?: string
  voiceAutoSpeak?: boolean
  wakeWordEnabled?: boolean
  handlers: VoiceActionHandlers
  onOpenSettings: () => void
}

type VoiceStatus = 'idle' | 'recording' | 'processing' | 'speaking' | 'error'

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  config,
  voiceAutoSpeak = true,
  wakeWordEnabled = true,
  handlers,
}) => {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastActionText, setLastActionText] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [showCommandsModal, setShowCommandsModal] = useState(false)
  const [liveVolume, setLiveVolume] = useState<number>(0)
  const [liveTranscript, setLiveTranscript] = useState<string>('')
  const [textCommandInput, setTextCommandInput] = useState<string>('')
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
  const speechRecognitionRef = useRef<any>(null)
  const wakeWordListenerRef = useRef<WakeWordListener | null>(null)
  const timerRef = useRef<any>(null)
  const autoCloseTimerRef = useRef<any>(null)

  // Track status in a ref so callbacks can read it without triggering re-renders
  const statusRef = useRef<VoiceStatus>(status)
  useEffect(() => {
    statusRef.current = status
  }, [status])

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
  }, [status])

  // Start / stop native macOS continuous listener automatically on mount or when isHandsFree changes
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).electronAPI) return

    if (isHandsFree && wakeWordEnabled) {
      console.log('[Sofi] 🎧 Activando escucha continua en segundo plano («Oye Sofi» manos libres)...')
      ;(window as any).electronAPI.startContinuousListen?.().catch((err: any) => {
        console.warn('[Sofi] Error al iniciar escucha continua nativa:', err)
      })
    } else {
      ;(window as any).electronAPI.stopContinuousListen?.().catch(() => {})
    }
  }, [isHandsFree, wakeWordEnabled])

  // Native macOS Siri Speech events from Electron
  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).electronAPI) return

    const unsubTranscript = (window as any).electronAPI.onNativeTranscript?.((text: string) => {
      console.log('[Native Siri Speech Partial]:', text)
      const clean = text.trim()
      if (!clean) return

      // If idle and hands-free is enabled: check if the user just spoke the wake word
      if (statusRef.current === 'idle' && isHandsFree && wakeWordEnabled) {
        const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (/(?:sofi|sophie|sofy|sofia)/i.test(norm)) {
          playWakeChime()
          setIsExpanded(true)
          setStatus('recording')
          setLiveTranscript(clean)
          return
        }
      }

      if (statusRef.current === 'recording') {
        setLiveTranscript(clean)
      }
    })

    const unsubResult = (window as any).electronAPI.onNativeResult?.(async (text: string) => {
      console.log('[Native Siri Speech Final]:', text)
      if (!text || !text.trim()) return
      const clean = text.trim()
      const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

      const wakePrefixRegex = /^(?:.*?\b(?:oye|hola|hey|ok|escucha)\s+(?:sofi|sophie|sofy|sofia)\b|\b(?:sofi|sophie|sofy|sofia)\b)[,\s:]*/i
      const hasWakeWord = /(?:sofi|sophie|sofy|sofia)/i.test(norm)

      if (statusRef.current === 'recording') {
        const command = clean.replace(wakePrefixRegex, '').trim()
        if (command.length > 1) {
          await handleExecuteCommandText(command)
        } else if (hasWakeWord) {
          // Said only "Oye Sofi"
          await handleWakeGreeting()
        } else if (clean.length > 1) {
          // Direct command spoken while recording
          await handleExecuteCommandText(clean)
        } else {
          setStatus('idle')
          setIsExpanded(false)
        }
      } else if (isHandsFree && wakeWordEnabled) {
        // Was in standby idle: only trigger if wake word is mentioned
        if (hasWakeWord) {
          playWakeChime()
          setIsExpanded(true)
          const command = clean.replace(wakePrefixRegex, '').trim()
          if (command.length > 1) {
            await handleExecuteCommandText(command)
          } else {
            await handleWakeGreeting()
          }
        }
      }
    })

    return () => {
      unsubTranscript?.()
      unsubResult?.()
    }
  }, [isHandsFree, wakeWordEnabled])

  // Hands-free Wake Word listener for Web browser fallback ("Oye Sofi" / "Sofi")
  useEffect(() => {
    if (!isHandsFree || !wakeWordEnabled) {
      if (wakeWordListenerRef.current) {
        wakeWordListenerRef.current.stop()
        wakeWordListenerRef.current = null
      }
      return
    }

    if (statusRef.current !== 'idle') return

    let isCancelled = false

    if (isSpeechRecognitionSupported()) {
      const listener = new WakeWordListener()
      wakeWordListenerRef.current = listener

      listener.start(
        async (commandText) => {
          if (isCancelled) return
          console.log('[Sofi] Wake word detectado:', commandText)
          playWakeChime()
          setIsExpanded(true)
          if (commandText && commandText.trim().length > 1) {
            await handleExecuteCommandText(commandText.trim())
          } else {
            await handleWakeGreeting()
          }
        },
        () => {
          console.log('[Sofi] Fallback standby activo.')
        }
      )

      return () => {
        isCancelled = true
        listener.stop()
        wakeWordListenerRef.current = null
      }
    }
  }, [isHandsFree, wakeWordEnabled, status])

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

    // Immediately switch to recording state so user can speak the command
    setStatus('recording')
    setLiveTranscript('')
    setLiveVolume(0.3)
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

  // Stop listening and process command
  const stopAndProcess = async () => {
    if (recorderRef.current) {
      try {
        await recorderRef.current.stop()
      } catch {}
      recorderRef.current = null
    }

    if (liveTranscript && liveTranscript.trim()) {
      await handleExecuteCommandText(liveTranscript.trim())
      return
    }

    setStatus('idle')
    setIsExpanded(false)
  }

  // Start listening with real-time Apple Siri or Web Speech
  const startListening = async () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)

    setIsExpanded(true)
    setErrorMessage(null)
    setLastActionText(null)
    setLiveTranscript('')
    setLiveVolume(0)

    // 1. macOS Native Apple Speech Recognition (via Swift in Electron)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.startNativeListen) {
      try {
        const res = await (window as any).electronAPI.startNativeListen()
        if (res?.supported) {
          setStatus('recording')
          console.log('[Sofi] 🎙️ Escucha nativa Siri iniciada en macOS...')
          return
        }
      } catch (e) {
        console.warn('[Native Listen Start Exception]', e)
      }
    }

    // 2. Web SpeechRecognition API (Chromium / Safari)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        if (speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.stop()
          } catch {}
        }
        const recognition = new SpeechRecognition()
        speechRecognitionRef.current = recognition
        recognition.lang = 'es-ES'
        recognition.interimResults = true
        recognition.continuous = false

        recognition.onstart = () => {
          setStatus('recording')
        }

        recognition.onresult = (event: any) => {
          let current = ''
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript
          }
          setLiveTranscript(current)
          if (event.results[0].isFinal) {
            recognition.stop()
            handleExecuteCommandText(current)
          }
        }

        recognition.onerror = (err: any) => {
          console.warn('[SpeechRecognition Error]', err)
          if (err.error === 'network') {
            setErrorMessage('Reconocimiento por voz en la nube no disponible. Puedes escribir tu orden aquí abajo:')
            setStatus('error')
            setIsExpanded(true)
          } else if (err.error === 'not-allowed') {
            setErrorMessage('Permiso de micrófono no concedido. Puedes escribir tu orden aquí abajo:')
            setStatus('error')
            setIsExpanded(true)
          } else if (statusRef.current === 'recording') {
            setStatus('idle')
          }
        }

        recognition.onend = () => {
          if (statusRef.current === 'recording' && !liveTranscript) {
            setStatus('idle')
          }
        }

        recognition.start()
        return
      } catch (srErr) {
        console.warn('[SpeechRecognition Init Error]', srErr)
      }
    }

    // 3. Fallback VAD Audio Recorder
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
          stopAndProcess()
        },
        onTimeout: () => {
          handleCancel()
        },
      })
      setStatus('recording')
    } catch (err: any) {
      console.error('[Start Listening Error]', err)
      setStatus('error')
      setErrorMessage(err.message || 'No se pudo activar el micrófono.')
    }
  }

  const toggleListening = async () => {
    if (status === 'recording') {
      if (liveTranscript && liveTranscript.trim()) {
        await handleExecuteCommandText(liveTranscript.trim())
      } else {
        setStatus('idle')
        setIsExpanded(false)
      }
    } else if (status === 'speaking') {
      if ((window as any).electronAPI?.stopSiri) {
        await (window as any).electronAPI.stopSiri()
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setStatus('idle')
    } else {
      playWakeChime()
      setIsExpanded(true)
      setStatus('recording')
      setLiveTranscript('')
      setErrorMessage(null)
      setLastActionText(null)
      if ((window as any).electronAPI?.startContinuousListen) {
        await (window as any).electronAPI.startContinuousListen()
      } else {
        await startListening()
      }
    }
  }

  const handleExecuteCommandText = async (text: string) => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    const cleanText = text.trim()
    if (!cleanText) return

    setIsExpanded(true)
    setErrorMessage(null)
    setLiveVolume(0)
    setLiveTranscript('')

    // Ejecución con Cloudflare Workers AI (Qwen 30B) y motor local
    setStatus('processing')
    try {
      const localRes = await executeLocalVoiceCommand(cleanText, handlers, config)
      const spoken = localRes.spokenText || 'Comando procesado.'
      console.log('[Sofi] ⚡ Orden ejecutada con Cloudflare AI / Siri:', cleanText, '->', spoken)
      setLastActionText(spoken)
      setStatus('speaking')

      if (voiceAutoSpeak && spoken) {
        await speakWithNativeVoice(spoken)
      }

      autoCloseTimerRef.current = setTimeout(() => {
        setStatus('idle')
        setIsExpanded(false)
      }, 4500)
    } catch (err: any) {
      console.error('[Voice Assistant Command Error]', err)
      setStatus('error')
      setErrorMessage(err.message || 'Error al procesar el comando.')
      if (voiceAutoSpeak) {
        speakWithNativeVoice('No pude procesar el comando. Inténtalo de nuevo.')
      }
    }
  }

  const handleTextCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textCommandInput.trim()) return
    const cmd = textCommandInput.trim()
    setTextCommandInput('')
    await handleExecuteCommandText(cmd)
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
    if (typeof window !== 'undefined' && (window as any).electronAPI?.stopNativeListen && !isHandsFree) {
      ;(window as any).electronAPI.stopNativeListen()
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch {}
    }
    setLiveVolume(0)
    setLiveTranscript('')
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
                  Sofi • Asistente IA
                </h4>
                <p className="text-[10px] text-zinc-400">Cloudflare AI (Qwen 30B) + Siri</p>
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
                    ? 'Manos libres activado: Di «Oye Sofi» en cualquier momento'
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
                {/* Dynamic Real-time Soundwave or Live Transcript */}
                {liveTranscript ? (
                  <div className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-amber-500/30 text-amber-200 text-xs italic text-center animate-pulse">
                    &ldquo;{liveTranscript}&rdquo;
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    {[0.6, 1.0, 1.4, 0.9, 0.5].map((multiplier, idx) => {
                      const heightPx = Math.max(
                        8,
                        Math.min(42, Math.round(8 + (liveVolume || 0.3) * 45 * multiplier))
                      )
                      return (
                        <span
                          key={idx}
                          style={{ height: `${heightPx}px` }}
                          className="w-1.5 bg-gradient-to-t from-amber-500 via-amber-400 to-amber-200 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                        />
                      )
                    })}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-semibold text-amber-200">Sofi escuchando tu orden...</p>
                  <p className="text-xs text-amber-400 font-medium mt-0.5 flex items-center justify-center gap-1">
                    <span>⚡</span>
                    <span>Se confirmará y ejecutará automáticamente con Siri</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {recordingSeconds}s • Di por ejemplo «elimina la cita de Rocío»
                  </p>
                </div>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center justify-center py-3 space-y-2 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                <p className="text-xs font-medium text-amber-200">Sofi procesando orden con Siri...</p>
                <p className="text-[11px] text-zinc-400">Ejecutando acción local inmediata</p>
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
              </div>
            )}
          </div>

          {/* Quick text command box */}
          <form onSubmit={handleTextCommandSubmit} className="mb-2.5 flex items-center gap-1.5">
            <input
              type="text"
              value={textCommandInput}
              onChange={(e) => setTextCommandInput(e.target.value)}
              placeholder="O escribe una orden (ej: elimina cita de Rocío)..."
              className="flex-1 bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-500/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!textCommandInput.trim()}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-zinc-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Ejecutar orden escrita"
            >
              ↵
            </button>
          </form>

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
            <span className="text-amber-400/80 font-medium">Cloudflare AI • Qwen 30B</span>
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
        title="Control por voz con Siri (Di «Oye Sofi» o pulsa Cmd+Shift+V)"
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
            title="Escucha activa en segundo plano: Di «Oye Sofi»"
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
