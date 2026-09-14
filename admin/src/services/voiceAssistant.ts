/**
 * GoldBlack Lash Studio — Asistente de Voz Inteligente con Gemini Flash + Web Speech (0€ / 1.500 peticiones/día)
 *
 * Funciona de forma 100% nativa en macOS (Electron) y Web:
 * 1. Captura de audio estándar con HTML5 MediaRecorder (sin dependencias externas).
 * 2. Comprensión multimodal ultra-rápida y Function Calling con Gemini 2.0 / 1.5 Flash (Google AI Studio Free Tier).
 * 3. Síntesis de voz hablada de alta fidelidad con Web Speech Synthesis nativo de macOS (voces en español de Apple/Siri).
 */

export interface VoiceToolCall {
  name: string
  args: Record<string, any>
}

export interface VoiceAssistantResponse {
  spokenText: string
  toolCall?: VoiceToolCall
  transcript?: string
  isWakeGreetingOnly?: boolean
  ignored?: boolean
}

export interface VoiceActionHandlers {
  onNavigateTab: (tab: string) => void
  onQueryAgenda: (dateStr?: string, status?: string) => Promise<string>
  onCreateAppointment: (params: {
    clientName: string
    serviceName?: string
    date?: string
    time?: string
    phone?: string
    notes?: string
  }) => Promise<string>
  onUpdateAppointment: (params: {
    clientName?: string
    appointmentId?: string
    status?: string
    paymentStatus?: string
  }) => Promise<string>
  onDeleteAppointment?: (params: {
    clientName: string
    date?: string
    deleteAll?: boolean
  }) => Promise<string>
  onSearchClient: (query: string) => Promise<string>
  onQueryFinance: (period?: string) => Promise<string>
  onOpenModal: (modal: string) => void
  onCheckUpdates?: () => Promise<string> | void
  getStudioContext?: () => string
}

// Function Calling schema for Gemini Flash
const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'navigate_tab',
        description: 'Navega a una pestaña del panel de administración.',
        parameters: {
          type: 'OBJECT',
          properties: {
            tab: {
              type: 'STRING',
              enum: ['dashboard', 'appointments', 'services', 'clients', 'gallery', 'billing', 'settings'],
              description: 'La pestaña a la que navegar en la aplicación (dashboard, appointments, services, clients, gallery, billing, settings).',
            },
          },
          required: ['tab'],
        },
      },
      {
        name: 'query_agenda',
        description: 'Consulta las citas y reservas programadas en la agenda del estudio.',
        parameters: {
          type: 'OBJECT',
          properties: {
            date: {
              type: 'STRING',
              description: 'Fecha a consultar en formato YYYY-MM-DD o términos relativos como "today" (hoy) o "tomorrow" (mañana).',
            },
            status: {
              type: 'STRING',
              enum: ['todas', 'pendiente', 'confirmada', 'completada', 'cancelada'],
              description: 'Filtrar por estado de las citas si se especifica.',
            },
          },
        },
      },
      {
        name: 'create_appointment',
        description: 'Crea o agenda una nueva cita para una clienta en el estudio.',
        parameters: {
          type: 'OBJECT',
          properties: {
            clientName: {
              type: 'STRING',
              description: 'Nombre completo o de pila de la clienta.',
            },
            serviceName: {
              type: 'STRING',
              description: 'Nombre del servicio (ej. "Volumen Ruso", "Pestañas Clásicas 1D", "Lifting de Pestañas", "Diseño de Cejas").',
            },
            date: {
              type: 'STRING',
              description: 'Fecha de la cita en formato YYYY-MM-DD.',
            },
            time: {
              type: 'STRING',
              description: 'Hora de inicio de la cita en formato HH:MM (24 horas, ej. "17:00").',
            },
            phone: {
              type: 'STRING',
              description: 'Teléfono de contacto de la clienta si lo mencionó.',
            },
            notes: {
              type: 'STRING',
              description: 'Notas adicionales, estilo o curvatura si se menciona.',
            },
          },
          required: ['clientName'],
        },
      },
      {
        name: 'update_appointment',
        description: 'Actualiza el estado de una cita existente (por ejemplo marcarla como completada, cobrada, confirmada o cancelada).',
        parameters: {
          type: 'OBJECT',
          properties: {
            clientName: {
              type: 'STRING',
              description: 'Nombre de la clienta cuya cita se desea actualizar.',
            },
            status: {
              type: 'STRING',
              enum: ['pendiente', 'confirmada', 'completada', 'cancelada'],
              description: 'Nuevo estado de la cita.',
            },
            paymentStatus: {
              type: 'STRING',
              enum: ['pendiente', 'seña_pagada', 'pagado'],
              description: 'Nuevo estado de pago de la cita.',
            },
          },
          required: ['clientName'],
        },
      },
      {
        name: 'delete_appointment',
        description: 'Elimina o borra permanentemente una cita de la agenda de citas diciendo el nombre de la persona o clienta (ej: "elimina la cita de Rocío", "borra la cita de María", "elimina la cita de hoy de Carmen", "cancela y borra la cita de Laura").',
        parameters: {
          type: 'OBJECT',
          properties: {
            clientName: {
              type: 'STRING',
              description: 'Nombre de la clienta o persona cuya cita se debe eliminar.',
            },
            date: {
              type: 'STRING',
              description: 'Fecha opcional de la cita (ej. "today", "hoy", "mañana", "YYYY-MM-DD").',
            },
            deleteAll: {
              type: 'BOOLEAN',
              description: 'True si el usuario pidió expresamente eliminar todas las citas de esa clienta.',
            },
          },
          required: ['clientName'],
        },
      },
      {
        name: 'search_client',
        description: 'Busca una clienta en el sistema para consultar su historial, teléfono, alergias o notas.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Nombre o teléfono de la clienta a buscar.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'query_finance',
        description: 'Consulta los ingresos, facturación o cobros del estudio en un período determinado.',
        parameters: {
          type: 'OBJECT',
          properties: {
            period: {
              type: 'STRING',
              enum: ['today', 'this_week', 'this_month', 'all'],
              description: 'Período financiero a consultar (today = hoy, this_week = esta semana, this_month = este mes).',
            },
          },
        },
      },
      {
        name: 'open_modal',
        description: 'Abre un modal o diálogo para crear manualmente una nueva cita, servicio, clienta o factura.',
        parameters: {
          type: 'OBJECT',
          properties: {
            modal: {
              type: 'STRING',
              enum: ['new_appointment', 'new_service', 'new_client', 'new_invoice', 'gallery'],
              description: 'El modal o sección que abrir.',
            },
          },
          required: ['modal'],
        },
      },
      {
        name: 'check_updates',
        description: 'Comprueba si hay nuevas versiones o actualizaciones de software disponibles para la aplicación GoldBlack Lash.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
    ],
  },
]

export interface AudioRecorderOptions {
  onSilence?: () => void
  onTimeout?: () => void
  onWake?: () => void
  onStandbyUtterance?: (audio: { blob: Blob; mimeType: string; base64: string }) => void
  silenceMs?: number
  speechThreshold?: number
  standbyThreshold?: number
  maxWaitSpeechMs?: number
  onVolumeChange?: (volume: number) => void
}

/**
 * Audio Recorder with Standby Hands-Free Voice Detection and real-time VAD
 * - Standby mode: Listens in background, keeps rolling pre-roll buffer, detects "Oye Sofi"
 * - Recording mode: Captures command, animates soundwaves, and auto-executes on silence (0 clicks)
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private headerChunk: Blob | null = null
  private preRollChunks: Blob[] = []
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private scriptProcessor: ScriptProcessorNode | null = null
  private levelIntervalId: any = null  // setInterval instead of rAF for Electron reliability
  private silenceTimer: any = null
  private isStandby = false
  private isStandbyCapturing = false
  private standbySpeechStart = 0
  private standbySilenceTimer: any = null
  private standbyCooldownUntil = 0
  private isRecording = false
  private hasSpoken = false
  private options: AudioRecorderOptions = {}
  private consecutiveSpeechFrames = 0
  private recordingStartTime = 0
  private debugLogCounter = 0
  private currentVolume = 0

  private async initStreamAndAnalyser(): Promise<void> {
    if (!this.stream || !this.stream.active) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu entorno o navegador no soporta captura de audio.')
      }

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      } catch (micErr: any) {
        console.error('[Sofi VAD] ❌ Error al acceder al micrófono:', micErr?.message || micErr)
        console.error('[Sofi VAD] Posible causa: macOS no ha concedido permiso de micrófono a la app.')
        console.error('[Sofi VAD] Solución: Ve a Preferencias del Sistema > Seguridad y Privacidad > Privacidad > Micrófono y activa la app.')
        throw micErr
      }

      // Diagnostic: log track state to verify macOS actually granted real mic access
      const tracks = this.stream.getAudioTracks()
      console.log(`[Sofi VAD] 🎙️ Micrófono obtenido: ${tracks.length} pista(s)`)
      tracks.forEach((t, i) => {
        console.log(`[Sofi VAD]   Track ${i}: label="${t.label}" enabled=${t.enabled} muted=${t.muted} readyState=${t.readyState}`)
        const settings = t.getSettings?.()
        if (settings) {
          console.log(`[Sofi VAD]   Settings: sampleRate=${settings.sampleRate} channelCount=${settings.channelCount} deviceId=${settings.deviceId?.substring(0, 12)}...`)
        }
      })
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtx && (!this.audioContext || this.audioContext.state === 'closed')) {
      // Match AudioContext sample rate to mic native rate to avoid silence bugs
      let micSampleRate;
      try {
        const s = this.stream.getAudioTracks()[0]?.getSettings?.();
        if (s?.sampleRate) micSampleRate = s.sampleRate;
      } catch {}
      this.audioContext = micSampleRate ? new AudioCtx({ sampleRate: micSampleRate }) : new AudioCtx()

      // Ensure AudioContext is running (macOS Monterey can suspend it)
      if (this.audioContext.state === 'suspended') {
        console.log('[Sofi VAD] ⏸️ AudioContext suspendido, reanudando...')
        await this.audioContext.resume()
      }
      console.log(`[Sofi VAD] AudioContext state=${this.audioContext.state} sampleRate=${this.audioContext.sampleRate}`)

      // STORE source node as class property to prevent garbage collection
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)

      // Use ScriptProcessorNode for DIRECT PCM sample reading.
      // AnalyserNode.getByteTimeDomainData() returns all-128 (zeros) in Electron 11 / Chromium 87.
      // ScriptProcessorNode reads raw float PCM samples - most reliable across all Electron versions.
      const bufferSize = 2048
      this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      this.scriptProcessor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        let sumSquares = 0
        for (let i = 0; i < inputData.length; i++) {
          sumSquares += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sumSquares / inputData.length)
        this.currentVolume = Math.min(rms * 4.5, 1.0)
      }

      // Connect: Mic -> Source -> ScriptProcessor -> Destination
      // onaudioprocess ONLY fires when connected to destination
      this.sourceNode.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)

      console.log('[Sofi VAD] Pipeline: Mic -> Source -> ScriptProcessor(PCM) -> Destination')
    }
  }

  private startMediaRecorder(): void {
    if (!this.stream) return
    let mimeType = 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4'
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg'
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        if (!this.headerChunk) {
          this.headerChunk = event.data
        }
        if (this.isStandby && !this.isStandbyCapturing) {
          this.preRollChunks.push(event.data)
          // Keep last 15 slices (~1500ms of rolling pre-roll so initial words "Oye Sofi" are preserved)
          if (this.preRollChunks.length > 15) {
            this.preRollChunks.shift()
          }
        } else {
          this.audioChunks.push(event.data)
        }
      }
    }

    this.mediaRecorder.start(100)
  }

  /**
   * Starts background standby listening.
   * Keeps mic open and continuously analyzes volume.
   * Silently captures speech and calls onStandbyUtterance only if sustained voice is detected.
   */
  async startStandby(options?: AudioRecorderOptions): Promise<void> {
    this.cancel()
    this.options = options || {}
    this.isStandby = true
    this.isStandbyCapturing = false
    this.standbySpeechStart = 0
    this.isRecording = false
    this.hasSpoken = false
    this.audioChunks = []
    this.headerChunk = null
    this.preRollChunks = []
    this.consecutiveSpeechFrames = 0

    await this.initStreamAndAnalyser()
    this.startMediaRecorder()
    this.runLevelLoop()
  }

  /**
   * Starts direct recording immediately (e.g. on manual mic click or follow-up question)
   */
  async start(options?: AudioRecorderOptions): Promise<void> {
    this.options = options || {}
    this.isStandby = false
    this.isStandbyCapturing = false
    this.isRecording = true
    this.hasSpoken = false
    this.recordingStartTime = Date.now()
    this.audioChunks = []
    this.preRollChunks = []

    if (!this.stream || !this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      await this.initStreamAndAnalyser()
      this.startMediaRecorder()
    } else {
      if (this.headerChunk) {
        this.audioChunks.push(this.headerChunk)
      }
    }

    this.runLevelLoop()
  }

  private runLevelLoop(): void {
    // IMPORTANT: Use setInterval instead of requestAnimationFrame!
    // requestAnimationFrame STOPS when the Electron window loses focus or is minimized,
    // which completely kills background voice detection on macOS.
    // setInterval runs reliably regardless of window focus state.
    if (this.levelIntervalId) {
      clearInterval(this.levelIntervalId)
      this.levelIntervalId = null
    }

    const checkLevels = () => {
      // Read volume computed by ScriptProcessorNode (direct PCM, most reliable)
      const normalizedVol = this.currentVolume

      // Diagnostic logging every ~3 seconds so user can verify mic is receiving audio
      this.debugLogCounter++
      if (this.debugLogCounter % 50 === 0) {
        const mode = this.isStandby ? (this.isStandbyCapturing ? 'STANDBY_CAPTURING' : 'STANDBY_IDLE') : this.isRecording ? 'RECORDING' : 'OFF'
        console.log(`[Sofi VAD] mode=${mode} vol=${normalizedVol.toFixed(4)} frames=${this.consecutiveSpeechFrames}`)
      }

      if (this.isStandby) {
        // Cooldown: prevent spamming checks on continuous background noise
        if (Date.now() < this.standbyCooldownUntil) {
          return
        }

        const standbyThreshold = this.options.standbyThreshold ?? 0.038
        const speechThreshold = this.options.speechThreshold ?? 0.025

        if (!this.isStandbyCapturing) {
          if (normalizedVol > standbyThreshold) {
            this.consecutiveSpeechFrames++
            // Require 4 consecutive frames (~240ms) of vocal energy to reject clicks/bumps
            if (this.consecutiveSpeechFrames >= 4) {
              this.isStandbyCapturing = true
              this.consecutiveSpeechFrames = 0
              this.standbySpeechStart = Date.now()
              this.audioChunks = []
              if (this.headerChunk) {
                this.audioChunks.push(this.headerChunk)
              }
              this.audioChunks.push(...this.preRollChunks)
              console.log(`[Sofi VAD] 🎙️ Habla detectada en standby (vol=${normalizedVol.toFixed(4)}). Capturando frase silenciosamente...`)
            }
          } else {
            this.consecutiveSpeechFrames = Math.max(0, this.consecutiveSpeechFrames - 1)
          }
        } else {
          // In silent standby capturing mode:
          if (normalizedVol > speechThreshold) {
            if (this.standbySilenceTimer) {
              clearTimeout(this.standbySilenceTimer)
              this.standbySilenceTimer = null
            }
          } else {
            if (!this.standbySilenceTimer) {
              this.standbySilenceTimer = setTimeout(async () => {
                this.standbySilenceTimer = null
                const speechDuration = Date.now() - this.standbySpeechStart
                this.isStandbyCapturing = false

                // Discard very short sounds (< 450ms) like coughs, clicks, typing
                if (speechDuration < 450) {
                  console.log(`[Sofi VAD] Ruido demasiado corto (${speechDuration}ms). Descartado sin enviar a Gemini.`)
                  this.audioChunks = []
                  return
                }

                console.log(`[Sofi VAD] Frase en standby terminada (${speechDuration}ms). Verificando si dijo «Oye Sofi»...`)
                this.standbyCooldownUntil = Date.now() + 2500 // 2.5s cooldown to respect API limits

                try {
                  const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
                  const blob = new Blob(this.audioChunks, { type: mimeType })
                  this.audioChunks = []
                  const base64 = await this.blobToBase64(blob)
                  this.options.onStandbyUtterance?.({ blob, mimeType: mimeType.split(';')[0], base64 })
                } catch (e) {
                  console.warn('[Sofi VAD Error]', e)
                }
              }, 750)
            }
          }

          // Safety max capture timeout (5.5 seconds max)
          if (Date.now() - this.standbySpeechStart > 5500) {
            if (this.standbySilenceTimer) {
              clearTimeout(this.standbySilenceTimer)
              this.standbySilenceTimer = null
            }
            const speechDuration = Date.now() - this.standbySpeechStart
            this.isStandbyCapturing = false
            this.standbyCooldownUntil = Date.now() + 2500
            try {
              const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
              const blob = new Blob(this.audioChunks, { type: mimeType })
              this.audioChunks = []
              this.blobToBase64(blob).then((base64) => {
                this.options.onStandbyUtterance?.({ blob, mimeType: mimeType.split(';')[0], base64 })
              })
            } catch {}
          }
        }
      } else if (this.isRecording) {
        this.options.onVolumeChange?.(normalizedVol)

        const speechThreshold = this.options.speechThreshold ?? 0.02
        const silenceMs = this.options.silenceMs ?? 1200
        const maxWaitSpeechMs = this.options.maxWaitSpeechMs ?? 7000

        if (normalizedVol > speechThreshold) {
          this.hasSpoken = true
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer)
            this.silenceTimer = null
          }
        } else if (this.hasSpoken) {
          // Silence detected after speech
          if (!this.silenceTimer && this.options.onSilence) {
            this.silenceTimer = setTimeout(() => {
              this.stopVAD()
              this.options.onSilence?.()
            }, silenceMs)
          }
        } else if (Date.now() - this.recordingStartTime > maxWaitSpeechMs) {
          // No speech detected after timeout
          this.stopVAD()
          this.options.onTimeout?.()
          return
        }
      }
    }

    // 60ms interval ≈ ~16 checks/second — reliable and low CPU
    this.levelIntervalId = setInterval(checkLevels, 60)
  }

  private stopVAD(): void {
    if (this.levelIntervalId) {
      clearInterval(this.levelIntervalId)
      this.levelIntervalId = null
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
    if (this.standbySilenceTimer) {
      clearTimeout(this.standbySilenceTimer)
      this.standbySilenceTimer = null
    }
  }

  async stop(): Promise<{ blob: Blob; mimeType: string; base64: string }> {
    this.stopVAD()
    this.isStandby = false
    this.isRecording = false

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('No hay una grabación activa'))
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
          const blob = new Blob(this.audioChunks, { type: mimeType })

          // Release tracks immediately
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop())
            this.stream = null
          }
          if (this.audioContext) {
            try { this.audioContext.close() } catch {}
            this.audioContext = null
          }
          this.mediaRecorder = null
          this.sourceNode = null
          this.scriptProcessor = null

          const base64 = await this.blobToBase64(blob)
          resolve({ blob, mimeType: mimeType.split(';')[0], base64 })
        } catch (err) {
          reject(err)
        }
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop()
      }
    })
  }

  cancel(): void {
    this.stopVAD()
    this.isStandby = false
    this.isStandbyCapturing = false
    this.standbySpeechStart = 0
    this.isRecording = false

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    if (this.audioContext) {
      try { this.audioContext.close() } catch {}
      this.audioContext = null
    }
    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect() } catch {}
      this.scriptProcessor = null
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect() } catch {}
      this.sourceNode = null
    }
    this.audioChunks = []
    this.preRollChunks = []
    this.headerChunk = null
    this.mediaRecorder = null
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const res = reader.result as string
        const base64 = res.split(',')[1] || ''
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

/**
 * Plays a discrete, elegant 2-tone chime when Sofi wakes up
 */
export function playWakeChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // C5 (523 Hz) -> E5 (659 Hz)
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(659.25, now + 0.1)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.3)
  } catch {}
}

/**
 * Checks if SpeechRecognition is available in the current browser/Electron runtime
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  // Standard Electron cannot use Chromium's SpeechRecognition because it lacks Google Chrome API keys
  if (
    (window as any).electronAPI?.isElectron ||
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron'))
  ) {
    return false
  }
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  return Boolean(SpeechRec)
}

/**
 * Continuous Wake-Word ("Sofi") Listener
 * Uses SpeechRecognition to detect "Sofi" or "Oye Sofi" hands-free in the background
 */
export class WakeWordListener {
  private recognition: any = null
  private isListening = false
  private onWakeCallback: ((commandText?: string) => void) | null = null
  private onFallbackCallback: (() => void) | null = null
  private restartTimer: any = null
  private consecutiveErrors = 0

  start(onWake: (commandText?: string) => void, onFallback?: () => void): void {
    this.onWakeCallback = onWake
    this.onFallbackCallback = onFallback || null
    this.isListening = true
    this.consecutiveErrors = 0
    this.initRecognition()
  }

  private initRecognition(): void {
    if (!this.isListening) return

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      console.warn('[WakeWordListener] SpeechRecognition no soportado. Activando fallback.')
      this.onFallbackCallback?.()
      return
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.onend = null
          this.recognition.onerror = null
          this.recognition.onresult = null
          this.recognition.stop()
        } catch {}
      }

      this.recognition = new SpeechRec()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'es-ES'

      this.recognition.onresult = (event: any) => {
        if (!this.isListening) return
        this.consecutiveErrors = 0
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript?.trim() || ''
          // Regex for Sofi wake word variations: "Sofi", "Oye Sofi", "Hola Sofi", "Hey Sofi", "Sophie", etc.
          const match = transcript.match(
            /(?:^|\s)(?:oye sofi|hola sofi|hey sofi|escucha sofi|dime sofi|sofi|sophie|oye m[oó]nica|hola m[oó]nica|m[oó]nik?a)(?:[,: ]+(.*)|$)/i
          )
          if (match) {
            const command = match[1]?.trim() || ''
            this.stop()
            this.onWakeCallback?.(command)
            break
          }
        }
      }

      this.recognition.onerror = (event: any) => {
        this.consecutiveErrors++
        console.warn('[WakeWordListener Error]', event?.error || event)

        if (event.error === 'not-allowed' || event.error === 'network' || this.consecutiveErrors >= 2) {
          console.warn('[WakeWordListener] Pasando a fallback local de audio VAD.')
          this.stop()
          this.onFallbackCallback?.()
          return
        }

        // Restart with slight backoff on non-fatal errors
        if (this.isListening) {
          if (this.restartTimer) clearTimeout(this.restartTimer)
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              this.initRecognition()
            }
          }, 800)
        }
      }

      this.recognition.onend = () => {
        // Chromium ends recognition after silence pause; restart cleanly with a tick
        if (this.isListening) {
          if (this.restartTimer) clearTimeout(this.restartTimer)
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              this.initRecognition()
            }
          }, 350)
        }
      }

      this.recognition.start()
    } catch (e) {
      console.warn('[WakeWordListener Init Error]', e)
      this.consecutiveErrors++
      if (this.consecutiveErrors >= 2) {
        this.stop()
        this.onFallbackCallback?.()
        return
      }
      if (this.isListening) {
        if (this.restartTimer) clearTimeout(this.restartTimer)
        this.restartTimer = setTimeout(() => {
          if (this.isListening) this.initRecognition()
        }, 1000)
      }
    }
  }

  stop(): void {
    this.isListening = false
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null
        this.recognition.onerror = null
        this.recognition.onresult = null
        this.recognition.stop()
      } catch {}
      this.recognition = null
    }
  }
}

/**
 * Text-to-Speech using Web Speech API (macOS native voices / offline / 0€)
 */
export function speakWithNativeVoice(text: string): Promise<void> {
  return speakWithFemaleVoice(text)
}

/**
 * Formats a phone number so SpeechSynthesis pronounces it naturally in Spanish digit groups
 * (e.g., "612 34 56 78" -> "6 12, 34, 56, 78")
 */
export function formatPhoneForSpeech(phone: string): string {
  if (!phone) return ''
  const clean = phone.replace(/[^\d+]/g, '')
  let prefix = ''
  let local = clean

  if (clean.startsWith('+34')) {
    prefix = 'prefijo más 34, '
    local = clean.slice(3)
  } else if (clean.startsWith('0034')) {
    prefix = 'prefijo más 34, '
    local = clean.slice(4)
  }

  if (local.length === 9) {
    const p1 = local.slice(0, 3)
    const p2 = local.slice(3, 5)
    const p3 = local.slice(5, 7)
    const p4 = local.slice(7, 9)
    return `${prefix}${p1}, ${p2}, ${p3}, ${p4}`
  }

  const groups: string[] = []
  for (let i = 0; i < local.length; i += 2) {
    groups.push(local.slice(i, i + 2))
  }
  return `${prefix}${groups.join(', ')}`
}

/**
 * Text-to-Speech using Siri on macOS Monterey, or high quality natural Spanish female voices
 */
export async function speakWithFemaleVoice(text: string): Promise<void> {
  if (!text || !text.trim()) return

  // 1. If running inside Electron on macOS Monterey, use native Siri voice directly via osascript
  if (typeof window !== 'undefined' && (window as any).electronAPI?.speakWithSiri) {
    try {
      const handled = await (window as any).electronAPI.speakWithSiri(text)
      if (handled) return
    } catch (e) {
      console.warn('[Native Siri Error, falling back to Web Speech]', e)
    }
  }

  // 2. Web Speech Synthesis fallback (prioritizing Siri voice if installed in browser)
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve()
      return
    }

    // Safety timeout: never hang longer than 6 seconds even if Chromium fails to fire onend
    const safetyTimeout = setTimeout(() => {
      resolve()
    }, 6000)

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }

      const executeSpeak = () => {
        try {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = 'es-ES'
          utterance.rate = 1.0 // Cadencia natural y prestigiosa
          utterance.pitch = 1.08 // Tono femenino cálido y elegante

          const voices = window.speechSynthesis.getVoices()

          // 1st Priority: Siri Spanish voice in system voices (if exposed)
          const siriVoice = voices.find(
            (v) =>
              (v.lang.startsWith('es') || v.lang === '') &&
              v.name.toLowerCase().includes('siri')
          )
          if (siriVoice) {
            utterance.voice = siriVoice
          } else {
            // 2nd Priority: Modern Neural / Natural / Enhanced / Google / Online Spanish voices
            const hqVoice = voices.find((v) => {
              const name = v.name.toLowerCase()
              const isSpanish = v.lang.startsWith('es') || v.lang === ''
              const isHQ =
                name.includes('natural') ||
                name.includes('neural') ||
                name.includes('enhanced') ||
                name.includes('premium') ||
                name.includes('online') ||
                name.includes('google')
              return isSpanish && isHQ
            })
            if (hqVoice) {
              utterance.voice = hqVoice
            } else {
              // 3rd Priority: High-quality Apple natural female voices (Paulina, Alba, Victoria, etc.)
              const preferredFemaleKeywords = [
                'paulina',
                'alba',
                'victoria',
                'elvira',
                'paloma',
                'laura',
                'helena',
                'sabina',
                'luciana',
                'female',
              ]

              let preferredVoice = voices.find((v) => {
                const name = v.name.toLowerCase()
                return (
                  v.lang.startsWith('es') &&
                  preferredFemaleKeywords.some((keyword) => name.includes(keyword))
                )
              })

              if (!preferredVoice) {
                preferredVoice =
                  voices.find((v) => v.lang === 'es-ES') ||
                  voices.find((v) => v.lang.startsWith('es'))
              }

              if (preferredVoice) {
                utterance.voice = preferredVoice
              }
            }
          }

          utterance.onend = () => {
            clearTimeout(safetyTimeout)
            resolve()
          }
          utterance.onerror = (err) => {
            console.warn('[SpeechSynthesis utterance error]', err)
            clearTimeout(safetyTimeout)
            resolve()
          }

          window.speechSynthesis.resume()
          window.speechSynthesis.speak(utterance)
        } catch (err) {
          console.warn('[SpeechSynthesis execute error]', err)
          clearTimeout(safetyTimeout)
          resolve()
        }
      }

      if (window.speechSynthesis.getVoices().length > 0) {
        executeSpeak()
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          executeSpeak()
        }
      }
    } catch (e) {
      console.warn('[TTS Female Error]', e)
      clearTimeout(safetyTimeout)
      resolve()
    }
  })
}

// Available Gemini Flash models in order of priority (Google AI Studio Free Tier 0€)
export const GEMINI_FLASH_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']

/**
 * Automatically announces a new incoming real-time appointment from goldblacklash.com
 * with natural female voice, stating client name, service, and phone number.
 */
export async function announceNewAppointmentVoice(
  apt: {
    clientName: string
    serviceName: string
    clientPhone: string
    date?: string
    time?: string
  },
  apiKey?: string
): Promise<void> {
  const formattedPhone = formatPhoneForSpeech(apt.clientPhone)
  let announcement = `Atención: Tienes una nueva reserva desde el sitio web. La clienta ${apt.clientName} ha solicitado el servicio de ${apt.serviceName}, y su número de teléfono es ${formattedPhone}.`

  // If Gemini API Key is available, generate a personalized luxury concierge announcement
  if (apiKey && apiKey.trim()) {
    try {
      const prompt = `Eres la recepcionista ejecutiva de GoldBlack Lash Studio. Acaba de entrar una nueva reserva en tiempo real desde el sitio web oficial https://www.goldblacklash.com.
Clienta: "${apt.clientName}"
Servicio: "${apt.serviceName}"
Teléfono: "${apt.clientPhone}"

Redacta en una sola frase breve, fluida, natural y elegante lo que le dirás en voz alta a la lash artist para avisarle de inmediato. Debes mencionar obligatoriamente:
1. Que tiene un nuevo servicio de esa clienta desde la web.
2. El nombre de la clienta.
3. El servicio seleccionado.
4. Su teléfono de contacto pronunciable: "${formattedPhone}".
Responde únicamente con el texto a pronunciar en voz alta, sin comillas ni aclaraciones.`

      let success = false
      for (const model of GEMINI_FLASH_MODELS) {
        if (success) break
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`
          const res = await Promise.race([
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
              }),
            }),
            new Promise<Response>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 2500)
            ),
          ])

          if (res.ok) {
            const data = await res.json()
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text && text.trim()) {
              announcement = text.trim()
              success = true
            }
          }
        } catch {}
      }
    } catch {}
  }

  await speakWithFemaleVoice(announcement)
}

/**
 * Send voice audio or text to Gemini Flash with Function Calling
 */
export async function processVoiceWithGemini(
  input: { base64Audio?: string; mimeType?: string; textQuery?: string; isStandbyWakeCheck?: boolean },
  apiKey: string,
  handlers: VoiceActionHandlers
): Promise<VoiceAssistantResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Falta la clave de API de Gemini. Por favor configúrala en Ajustes (es 100% gratis en Google AI Studio).')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()
  const studioContext = handlers.getStudioContext ? handlers.getStudioContext() : ''
  const isStandby = Boolean(input.isStandbyWakeCheck)

  const systemInstructionText = `
Eres Sofi, la asistente de voz inteligente, ejecutiva y personal de GoldBlack Lash Studio (estudio de alta gama de extensiones de pestañas, cejas y belleza en Montequinto, Sevilla).
Tu nombre oficial es Sofi. Los administradores y artistas del estudio se dirigirán a ti diciendo «Sofi», «Oye Sofi» o pronunciando directamente su orden.

${
  isStandby
    ? `REGLAS ESTRICTAS DE ESCUCHA EN SEGUNDO PLANO (STANDBY):
El audio ha sido capturado automáticamente en segundo plano.
1. OBLIGATORIO: El usuario DEBE haber dicho explícitamente «Oye Sofi» o «Sofi» (o «Hola Sofi», «Hey Sofi»).
2. Si el audio NO contiene «Oye Sofi» ni «Sofi», responde ÚNICAMENTE con la palabra exacta: [IGNORAR].
   Bajo ninguna circunstancia te actives si son ruidos de fondo, música, tos, teclados o charlas entre personas del salón que no van dirigidas a Sofi.
3. Si el audio dice «Oye Sofi» o «Sofi» solo como saludo o llamada: responde EXACTAMENTE: «Dime, te escucho.».
4. Si el audio dice «Oye Sofi» o «Sofi» seguido de una orden para la app:
   - ELIMINAR/BORRAR/CANCELAR CITA: Si pide eliminar, borrar o cancelar la cita de una persona (ej: «Oye Sofi, elimina la cita de Rocío», «Sofi, borra la cita de María», «elimina la cita de hoy de Carmen»), invoca OBLIGATORIAMENTE la herramienta delete_appointment con el nombre de la clienta.
   - OTRAS ACCIONES: invoca la herramienta correspondiente y confirma la acción en una breve oración en español.`
    : `REGLAS DE PROCESAMIENTO DIRECTO (BOTÓN O TEXTO):
El usuario ha presionado el botón del micrófono o ha escrito una orden en la app.
1. ELIMINAR/BORRAR/CANCELAR CITA: Si pide eliminar, borrar o cancelar la cita de una persona (ej: «elimina la cita de Rocío», «borra la cita de María», «cancela la cita de Laura»), invoca OBLIGATORIAMENTE delete_appointment con el clientName.
2. Si el usuario solo dice «Sofi» u «Oye Sofi»: responde «Dime, te escucho.».
3. Si pide cualquier otra orden del estudio: invoca la herramienta adecuada y confirma en una breve oración elegante.`
}

Fecha actual: ${today} (Año ${currentYear}).
${studioContext ? `Contexto del estudio:\n${studioContext}` : ''}
`

  const parts: any[] = []

  if (input.base64Audio && input.mimeType) {
    parts.push({
      inlineData: {
        mimeType: input.mimeType,
        data: input.base64Audio,
      },
    })
    parts.push({
      text: 'Escucha atentamente el audio en español. Si el usuario te llama diciendo «Sofi» u «Oye Sofi», responde «Dime, te escucho.». Si pide una acción de la app, invoca la herramienta adecuada. Si es ruido o silencio no dirigido a ti, responde [IGNORAR].',
    })
  } else if (input.textQuery) {
    parts.push({
      text: input.textQuery,
    })
  } else {
    throw new Error('No se proporcionó audio ni texto para procesar.')
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstructionText }],
    },
    tools: GEMINI_TOOLS,
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO',
      },
    },
  }

  // Iterate through available Gemini Flash models (prioritizing gemini-3.6-flash)
  let data: any = null
  let lastErrorMsg = ''

  for (const model of GEMINI_FLASH_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const msg = errorData?.error?.message || `Error en la API de Gemini (${response.status})`
        lastErrorMsg = msg
        // If the model is not found or deprecated, try the next model in GEMINI_FLASH_MODELS
        if (
          response.status === 404 ||
          msg.toLowerCase().includes('no longer available') ||
          msg.toLowerCase().includes('not found')
        ) {
          console.warn(`[Gemini Flash] Model ${model} is not available, trying next fallback...`)
          continue
        }
        throw new Error(msg)
      }

      data = await response.json()
      if (data?.candidates?.[0]?.content?.parts) {
        break
      }
    } catch (err: any) {
      lastErrorMsg = err?.message || String(err)
      if (
        lastErrorMsg.toLowerCase().includes('no longer available') ||
        lastErrorMsg.toLowerCase().includes('not found')
      ) {
        continue
      }
      throw err
    }
  }

  if (!data) {
    throw new Error(lastErrorMsg || 'No se pudo conectar con la API de Gemini.')
  }

  const candidate = data?.candidates?.[0]
  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error('Gemini no devolvió una respuesta válida.')
  }

  let spokenText = ''
  let toolCall: VoiceToolCall | undefined = undefined

  for (const part of candidate.content.parts) {
    if (part.text) {
      spokenText += part.text + ' '
    }
    if (part.functionCall) {
      toolCall = {
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      }
    }
  }

  spokenText = spokenText.trim()

  // If Gemini determined this audio was background salon noise or unrelated conversation
  if (spokenText.toUpperCase().includes('[IGNORAR]')) {
    return {
      spokenText: '',
      ignored: true,
    }
  }

  // Execute tool call if returned
  if (toolCall) {
    try {
      const executionResult = await executeVoiceTool(toolCall, handlers)
      if (executionResult && !spokenText) {
        spokenText = executionResult
      }
    } catch (toolError: any) {
      console.error('[Tool Execution Error]', toolError)
      spokenText = `Hubo un inconveniente al ejecutar la acción: ${toolError.message || 'error desconocido'}`
    }
  }

  if (!spokenText) {
    spokenText = 'Acción procesada con éxito.'
  }

  // Detect if user solely prompted the wake word/greeting ("Dime, te escucho")
  const isWakeGreetingOnly =
    !toolCall &&
    Boolean(
      spokenText.match(
        /(?:te escucho|dime|en qué te puedo ayudar|en qué puedo ayudarte|aquí estoy|a tu disposición|qué necesitas)/i
      )
    )

  return {
    spokenText,
    toolCall,
    isWakeGreetingOnly,
  }
}

/**
 * Dispatches and executes the selected tool against application state
 */
async function executeVoiceTool(tool: VoiceToolCall, handlers: VoiceActionHandlers): Promise<string> {
  const { name, args } = tool

  switch (name) {
    case 'navigate_tab': {
      const tab = (args.tab || 'dashboard').toLowerCase()
      handlers.onNavigateTab(tab)
      const tabNames: Record<string, string> = {
        dashboard: 'el Panel Principal',
        appointments: 'la Agenda de Citas',
        services: 'el Catálogo de Servicios',
        clients: 'la Ficha de Clientas',
        gallery: 'la Galería',
        billing: 'Facturación e Ingresos',
        settings: 'Ajustes del Estudio',
      }
      return `Te he llevado a ${tabNames[tab] || tab}.`
    }

    case 'query_agenda': {
      return await handlers.onQueryAgenda(args.date, args.status)
    }

    case 'create_appointment': {
      return await handlers.onCreateAppointment({
        clientName: args.clientName,
        serviceName: args.serviceName,
        date: args.date,
        time: args.time,
        phone: args.phone,
        notes: args.notes,
      })
    }

    case 'update_appointment': {
      return await handlers.onUpdateAppointment({
        clientName: args.clientName,
        appointmentId: args.appointmentId,
        status: args.status,
        paymentStatus: args.paymentStatus,
      })
    }

    case 'delete_appointment': {
      if (handlers.onDeleteAppointment) {
        return await handlers.onDeleteAppointment({
          clientName: args.clientName,
          date: args.date,
          deleteAll: args.deleteAll,
        })
      }
      return `No se pudo procesar la eliminación de la cita de ${args.clientName}.`
    }

    case 'search_client': {
      return await handlers.onSearchClient(args.query)
    }

    case 'query_finance': {
      return await handlers.onQueryFinance(args.period)
    }

    case 'open_modal': {
      handlers.onOpenModal(args.modal)
      const modalNames: Record<string, string> = {
        new_appointment: 'nueva cita',
        new_service: 'nuevo servicio',
        new_client: 'nueva clienta',
        new_invoice: 'nueva factura',
        gallery: 'galería',
      }
      return `He abierto el formulario para ${modalNames[args.modal] || args.modal}.`
    }

    case 'check_updates': {
      if (handlers.onCheckUpdates) {
        const res = await handlers.onCheckUpdates()
        return res || 'Buscando actualizaciones de software para GoldBlack Lash...'
      }
      return 'Comprobando si hay actualizaciones disponibles...'
    }

    default:
      return 'Comando ejecutado.'
  }
}

/**
 * Executes direct studio commands locally (0€ / offline) without calling any external API.
 * Handles deleting appointments, navigation, agenda queries, creation modals, etc.
 */
export async function executeLocalVoiceCommand(
  text: string,
  handlers: VoiceActionHandlers
): Promise<{ handled: boolean; spokenText?: string }> {
  if (!text || !text.trim()) return { handled: false }
  const clean = text.trim().toLowerCase()

  // 1. Eliminar cita por nombre de persona
  const deleteMatch = clean.match(
    /(?:elimina|eliminar|borra|borrar|cancela|cancelar|quita|quitar)\s+(?:la\s+)?cita\s+(?:de\s+)?(.+)/i
  )
  if (deleteMatch && handlers.onDeleteAppointment) {
    const rawName = deleteMatch[1].replace(/[.,!?;]+$/, '').trim()
    const result = await handlers.onDeleteAppointment({ clientName: rawName })
    return { handled: true, spokenText: result }
  }

  // 2. Navegar a pestañas
  if (clean.includes('agenda') || clean.includes('citas')) {
    handlers.onNavigateTab('appointments')
    return { handled: true, spokenText: 'Te he llevado a la Agenda de Citas.' }
  }
  if (clean.includes('clienta')) {
    handlers.onNavigateTab('clients')
    return { handled: true, spokenText: 'Te he llevado a la Ficha de Clientas.' }
  }
  if (clean.includes('servicio')) {
    handlers.onNavigateTab('services')
    return { handled: true, spokenText: 'Te he llevado al Catálogo de Servicios.' }
  }
  if (clean.includes('factura') || clean.includes('caja') || clean.includes('ingreso')) {
    handlers.onNavigateTab('billing')
    return { handled: true, spokenText: 'Te he llevado a Facturación y Control de Caja.' }
  }
  if (clean.includes('galer')) {
    handlers.onNavigateTab('gallery')
    return { handled: true, spokenText: 'Te he llevado a la Galería.' }
  }
  if (clean.includes('ajuste') || clean.includes('configura')) {
    handlers.onNavigateTab('settings')
    return { handled: true, spokenText: 'Te he llevado a los Ajustes del Estudio.' }
  }
  if (clean.includes('panel') || clean.includes('inicio') || clean.includes('dashboard')) {
    handlers.onNavigateTab('dashboard')
    return { handled: true, spokenText: 'Te he llevado al Panel Principal.' }
  }

  // 3. Consultar citas de hoy / mañana
  if (clean.includes('cita') && (clean.includes('hoy') || clean.includes('tengo hoy'))) {
    const res = await handlers.onQueryAgenda('today')
    return { handled: true, spokenText: res }
  }
  if (clean.includes('cita') && (clean.includes('mañana') || clean.includes('tengo mañana'))) {
    const res = await handlers.onQueryAgenda('tomorrow')
    return { handled: true, spokenText: res }
  }

  // 4. Modales de creación
  if (clean.includes('nueva cita') || clean.includes('crear cita') || clean.includes('añadir cita')) {
    handlers.onOpenModal('new_appointment')
    return { handled: true, spokenText: 'He abierto el formulario para nueva cita.' }
  }
  if (clean.includes('nueva clienta') || clean.includes('crear clienta') || clean.includes('añadir clienta')) {
    handlers.onOpenModal('new_client')
    return { handled: true, spokenText: 'He abierto el formulario para nueva clienta.' }
  }
  if (clean.includes('nuevo servicio') || clean.includes('añadir servicio')) {
    handlers.onOpenModal('new_service')
    return { handled: true, spokenText: 'He abierto el formulario para nuevo servicio.' }
  }
  if (clean.includes('nueva factura') || clean.includes('emitir factura')) {
    handlers.onOpenModal('new_invoice')
    return { handled: true, spokenText: 'He abierto el formulario para emitir factura.' }
  }

  // 5. Comprobar actualizaciones
  if (clean.includes('actualiza')) {
    if (handlers.onCheckUpdates) {
      const res = await handlers.onCheckUpdates()
      return { handled: true, spokenText: res || 'Comprobando actualizaciones de software.' }
    }
  }

  return { handled: false }
}

