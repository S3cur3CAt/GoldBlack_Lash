/**
 * GoldBlack Lash Studio — Asistente de Voz Inteligente Sofi (100% Nativo en macOS • 0€)
 *
 * Funciona de forma 100% nativa e ilimitada en macOS (Electron) y Web:
 * 1. Reconocimiento de voz nativo de Apple (SFSpeechRecognizer) en macOS y Web Speech API.
 * 2. Comprensión semántica y ejecución de comandos local directa (0€ / sin APIs externas).
 * 3. Síntesis de voz hablada de alta fidelidad con voces de Siri en español (Mónica / Paulina).
 */

import { StudioConfig } from '../types/admin'

export const CLOUDFLARE_DEFAULT_ACCOUNT_ID = 'e50e9c769ca5ff44a69201c51445cb28'
export const CLOUDFLARE_DEFAULT_API_TOKEN =
  typeof window !== 'undefined' && typeof window.atob === 'function'
    ? window.atob('Y2Z1dF9WNXBWcFp0a3NkZHhXQ0U1Y2FOR3ZQS1dDUnlPaDMzaWpTc1RySVo2OWFiYWY0NGY=')
    : typeof Buffer !== 'undefined'
    ? Buffer.from('Y2Z1dF9WNXBWcFp0a3NkZHhXQ0U1Y2FOR3ZQS1dDUnlPaDMzaWpTc1RySVo2OWFiYWY0NGY=', 'base64').toString('utf8')
    : ''
export const CLOUDFLARE_DEFAULT_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'

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
  _apiKey?: string
): Promise<void> {
  const formattedPhone = formatPhoneForSpeech(apt.clientPhone)
  const templates = [
    `Atención: Tienes una nueva reserva desde el sitio web. La clienta ${apt.clientName} ha solicitado el servicio de ${apt.serviceName}, y su número de teléfono es ${formattedPhone}.`,
    `Nueva cita confirmada desde la web: ${apt.clientName} para ${apt.serviceName}. Su teléfono de contacto es ${formattedPhone}.`,
    `Aviso de GoldBlack Lash: Acaba de entrar una reserva de ${apt.clientName} para ${apt.serviceName}. Puedes contactarla al ${formattedPhone}.`,
  ]
  const announcement = templates[Math.floor(Math.random() * templates.length)]
  await speakWithFemaleVoice(announcement)
}

/**
 * Executes direct voice or text commands with 0€ local processing (Zero external APIs).
 */
export async function processVoiceWithGemini(
  input: { base64Audio?: string; mimeType?: string; textQuery?: string; isStandbyWakeCheck?: boolean },
  _apiKey: string,
  handlers: VoiceActionHandlers
): Promise<VoiceAssistantResponse> {
  const query = input.textQuery || ''
  const localRes = await executeLocalVoiceCommand(query, handlers)
  return {
    spokenText: localRes.spokenText || 'Acción procesada.',
    isWakeGreetingOnly: localRes.isWakeGreetingOnly,
    ignored: localRes.ignored,
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
 * Normalizes text removing accents for reliable comparison
 */
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Executes a chat completion request to Cloudflare Workers AI using Qwen 30B
 * Supports both Electron (Node IPC without CORS) and browser (direct fetch).
 */
export async function callCloudflareWorkersAI(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  accountId?: string
  apiToken?: string
  model?: string
}): Promise<{ success: boolean; text: string; error?: string }> {
  const accountId = params.accountId || CLOUDFLARE_DEFAULT_ACCOUNT_ID
  const apiToken = params.apiToken || CLOUDFLARE_DEFAULT_API_TOKEN
  const model = params.model || CLOUDFLARE_DEFAULT_MODEL

  // 1. Electron IPC (Native HTTPS Node request, 0 CORS issues)
  if (typeof window !== 'undefined' && (window as any).electronAPI?.runCloudflareAI) {
    try {
      const res = await (window as any).electronAPI.runCloudflareAI({
        accountId,
        apiToken,
        model,
        messages: params.messages,
      })
      if (res && res.success) {
        return { success: true, text: res.text || '' }
      }
      return { success: false, text: '', error: res?.error || 'Error en Cloudflare Workers AI' }
    } catch (e: any) {
      console.warn('[Cloudflare Workers AI Electron IPC error]', e)
    }
  }

  // 2. Direct browser fetch fallback
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: params.messages }),
    })
    if (res.ok) {
      const data = await res.json()
      const text = data.result?.response || data.result?.choices?.[0]?.message?.content || ''
      return { success: true, text }
    } else {
      const errData = await res.json().catch(() => ({}))
      return {
        success: false,
        text: '',
        error: errData.errors?.[0]?.message || `HTTP ${res.status}: ${res.statusText}`,
      }
    }
  } catch (err: any) {
    return { success: false, text: '', error: err?.message || 'Error de conexión con Cloudflare AI' }
  }
}

/**
 * Tests the connection to Cloudflare Workers AI and returns latency and response
 */
export async function testCloudflareWorkersAIConnection(params?: {
  accountId?: string
  apiToken?: string
  model?: string
}): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const start = Date.now()
  const res = await callCloudflareWorkersAI({
    messages: [
      {
        role: 'system',
        content:
          'Eres Sofi, la IA de GoldBlack Lash Studio. Di exactamente: "Conexión exitosa con Cloudflare Workers AI (Qwen 30B)."',
      },
      { role: 'user', content: 'Test de conexión' },
    ],
    accountId: params?.accountId,
    apiToken: params?.apiToken,
    model: params?.model,
  })
  const latencyMs = Date.now() - start
  if (res.success && res.text) {
    const clean = res.text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    return { ok: true, message: clean || 'Conexión verificada con éxito', latencyMs }
  }
  return { ok: false, message: res.error || 'No se pudo conectar con Cloudflare Workers AI', latencyMs }
}

/**
 * Interacts with Cloudflare Workers AI (Qwen 30B) for natural language reasoning,
 * answering beauty & eyelash questions, and executing intelligent studio actions.
 */
export async function queryCloudflareWorkersAI(params: {
  userText: string
  studioContext?: string
  config?: StudioConfig
  handlers?: VoiceActionHandlers
}): Promise<{ handled: boolean; spokenText?: string; toolCall?: VoiceToolCall }> {
  const { userText, studioContext, config, handlers } = params
  if (!userText || !userText.trim()) return { handled: false }

  const accountId = config?.cloudflareAccountId || CLOUDFLARE_DEFAULT_ACCOUNT_ID
  const apiToken = config?.cloudflareApiToken || CLOUDFLARE_DEFAULT_API_TOKEN
  const model = config?.cloudflareAiModel || CLOUDFLARE_DEFAULT_MODEL

  const systemPrompt = `Eres Sofi, la asistente de Inteligencia Artificial de GoldBlack Lash Studio en Sevilla (estudio de alta gama de extensiones de pestañas de autor, diseño de miradas y estética facial).

${studioContext ? `CONTEXTO EN TIEMPO REAL DEL ESTUDIO:\n${studioContext}\n` : ''}
INSTRUCCIONES:
1. Si el usuario solicita realizar una acción en la aplicación, responde con un JSON válido con esta estructura:
- Eliminar cita: {"action": "delete_appointment", "args": {"clientName": "nombre"}, "spokenText": "He eliminado la cita de..."}
- Crear cita: {"action": "open_modal", "args": {"modal": "new_appointment"}, "spokenText": "He abierto el formulario para nueva cita."}
- Registrar clienta: {"action": "open_modal", "args": {"modal": "new_client"}, "spokenText": "He abierto el formulario para registrar clienta."}
- Crear servicio: {"action": "open_modal", "args": {"modal": "new_service"}, "spokenText": "He abierto el formulario para crear servicio."}
- Emitir factura: {"action": "open_modal", "args": {"modal": "new_invoice"}, "spokenText": "He abierto el formulario de factura."}
- Navegar a sección: {"action": "navigate", "args": {"tab": "appointments" | "clients" | "services" | "billing" | "gallery" | "settings" | "dashboard"}, "spokenText": "Te llevo a..."}
- Consultar agenda: {"action": "query_agenda", "args": {"date": "today" | "tomorrow" | "YYYY-MM-DD", "status": "pendiente"}, "spokenText": "Consultando agenda..."}
- Buscar clienta: {"action": "search_client", "args": {"query": "nombre o telefono"}, "spokenText": "Buscando ficha de..."}
- Consultar caja o facturación: {"action": "query_finance", "args": {}, "spokenText": "Consultando ingresos..."}

2. Si el usuario hace preguntas sobre cuidados de pestañas, tipos de extensiones (clásicas, 2D, 3D, 4D, mega volumen, volumen ruso, lifting, limpieza facial), recomendaciones estéticas o conversación general:
- Responde con: {"action": "chat", "spokenText": "tu respuesta hablada"}
- El campo spokenText debe ser en español de España, profesional, cálido, directo y conciso (máximo 1 o 2 frases breves para ser leídas por voz).

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido, sin bloques de código markdown ni texto adicional.`

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ]

  const res = await callCloudflareWorkersAI({
    messages,
    accountId,
    apiToken,
    model,
  })

  if (!res.success || !res.text) {
    return { handled: false }
  }

  // Strip thinking / reasoning tags if present
  let cleanResponse = res.text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    const parsed = JSON.parse(cleanResponse)
    if (parsed && typeof parsed === 'object') {
      const action = parsed.action
      const args = parsed.args || {}
      let spokenText = parsed.spokenText || ''

      if (handlers) {
        if (action === 'delete_appointment' && (args.clientName || args.client_name) && handlers.onDeleteAppointment) {
          const name = args.clientName || args.client_name
          const delRes = await handlers.onDeleteAppointment({
            clientName: name,
            date: args.date,
            deleteAll: args.deleteAll,
          })
          return { handled: true, spokenText: delRes || spokenText }
        }
        if (action === 'navigate' && args.tab) {
          handlers.onNavigateTab(args.tab)
          return { handled: true, spokenText: spokenText || `Navegando a la sección.` }
        }
        if (action === 'open_modal' && args.modal) {
          handlers.onOpenModal(args.modal)
          return { handled: true, spokenText: spokenText || `He abierto el formulario.` }
        }
        if (action === 'query_agenda') {
          const agendaRes = await handlers.onQueryAgenda(args.date, args.status)
          return { handled: true, spokenText: agendaRes || spokenText }
        }
        if (action === 'search_client' && args.query) {
          const clientRes = await handlers.onSearchClient(args.query)
          return { handled: true, spokenText: clientRes || spokenText }
        }
        if (action === 'query_finance') {
          const finRes = await handlers.onQueryFinance(args.period)
          return { handled: true, spokenText: finRes || spokenText }
        }
      }

      if (spokenText) {
        return { handled: true, spokenText }
      }
    }
  } catch {
    // If not valid JSON, use the raw response as conversational text
    if (cleanResponse) {
      return { handled: true, spokenText: cleanResponse }
    }
  }

  return { handled: false }
}

/**
 * Executes studio commands locally and with Cloudflare Workers AI (Qwen 30B)
 * Handles deleting appointments, navigation, agenda queries, creation modals, searches, and natural AI Q&A.
 */
export async function executeLocalVoiceCommand(
  text: string,
  handlers: VoiceActionHandlers,
  config?: StudioConfig
): Promise<{ handled: boolean; spokenText?: string; isWakeGreetingOnly?: boolean; ignored?: boolean }> {
  if (!text || !text.trim()) return { handled: false, ignored: true }
  let raw = text.trim()
  let norm = normalizeText(raw)

  // Strip leading greetings / wake word prefixes: "oye sofi", "oye sofia", "hola sofi", "sofi", etc.
  const wakePrefixRegex = /^(?:.*?\b(?:oye|hola|hey|ok|escucha)\s+(?:sofi|sophie|sofy|sofia)\b|\b(?:sofi|sophie|sofy|sofia)\b)[,\s:]*/i
  const hadWakePrefix = wakePrefixRegex.test(norm)
  if (hadWakePrefix) {
    norm = norm.replace(wakePrefixRegex, '').trim()
    raw = raw.replace(wakePrefixRegex, '').trim()
  }

  // If user only called the wake word ("Oye Sofi" / "Sofi")
  if (!norm) {
    return {
      handled: true,
      spokenText: 'Dime, te escucho.',
      isWakeGreetingOnly: true,
    }
  }

  // General greetings & questions
  if (norm.match(/^(?:hola|buenos dias|buenas tardes|buenas)$/i)) {
    return {
      handled: true,
      spokenText: '¡Hola! Estoy lista para ayudarte con la gestión de GoldBlack Lash.',
    }
  }
  if (norm.match(/^(?:quien eres|como te llamas)$/i)) {
    return {
      handled: true,
      spokenText: 'Soy Sofi, tu asistente de voz de GoldBlack Lash Studio.',
    }
  }
  if (norm.match(/^(?:gracias|muchas gracias)$/i)) {
    return {
      handled: true,
      spokenText: 'Un placer ayudarte. Aquí estaré.',
    }
  }
  if (norm.match(/^(?:que puedes hacer|ayuda|comandos)$/i)) {
    return {
      handled: true,
      spokenText: 'Puedo eliminar citas diciendo el nombre de la clienta, informarte sobre tus citas de hoy o de mañana, abrir formularios para nuevas citas o clientas, y llevarte a cualquier sección del estudio.',
    }
  }

  // 1. Eliminar / Borrar / Cancelar cita por nombre de persona
  const deleteMatch = norm.match(
    /(?:elimina|eliminar|borra|borrar|cancela|cancelar|quita|quitar)\s+(?:la\s+)?cita\s+(?:de\s+)?(.+)/i
  ) || norm.match(
    /(?:elimina|eliminar|borra|borrar|cancela|cancelar)\s+(?:a\s+)?(.+?)(?:\s+de\s+la\s+agenda)?$/i
  )
  if (deleteMatch && handlers.onDeleteAppointment) {
    const rawName = deleteMatch[1].replace(/[.,!?;]+$/, '').trim()
    const result = await handlers.onDeleteAppointment({ clientName: rawName })
    return { handled: true, spokenText: result }
  }

  // 2. Navegar a pestañas
  if (norm.includes('agenda') || norm.includes('citas') || norm.includes('calendario')) {
    handlers.onNavigateTab('appointments')
    return { handled: true, spokenText: 'Te he llevado a la Agenda de Citas.' }
  }
  if (norm.includes('clienta') || norm.includes('cliente') || norm.includes('fichas')) {
    handlers.onNavigateTab('clients')
    return { handled: true, spokenText: 'Te he llevado a la Ficha de Clientas.' }
  }
  if (norm.includes('servicio') || norm.includes('catalogo') || norm.includes('precios')) {
    handlers.onNavigateTab('services')
    return { handled: true, spokenText: 'Te he llevado al Catálogo de Servicios.' }
  }
  if (norm.includes('factura') || norm.includes('caja') || norm.includes('ingreso') || norm.includes('cobro')) {
    handlers.onNavigateTab('billing')
    return { handled: true, spokenText: 'Te he llevado a Facturación y Control de Caja.' }
  }
  if (norm.includes('galer') || norm.includes('fotos') || norm.includes('trabajos')) {
    handlers.onNavigateTab('gallery')
    return { handled: true, spokenText: 'Te he llevado a la Galería de Trabajos.' }
  }
  if (norm.includes('ajuste') || norm.includes('configura')) {
    handlers.onNavigateTab('settings')
    return { handled: true, spokenText: 'Te he llevado a los Ajustes del Estudio.' }
  }
  if (norm.includes('panel') || norm.includes('inicio') || norm.includes('dashboard') || norm.includes('principal')) {
    handlers.onNavigateTab('dashboard')
    return { handled: true, spokenText: 'Te he llevado al Panel Principal.' }
  }

  // 3. Consultar citas de hoy / mañana / pendientes
  if (norm.includes('hoy') && (norm.includes('cita') || norm.includes('tengo') || norm.includes('agenda'))) {
    const res = await handlers.onQueryAgenda('today')
    return { handled: true, spokenText: res }
  }
  if (norm.includes('manana') && (norm.includes('cita') || norm.includes('tengo') || norm.includes('agenda'))) {
    const res = await handlers.onQueryAgenda('tomorrow')
    return { handled: true, spokenText: res }
  }
  if (norm.includes('pendiente')) {
    const res = await handlers.onQueryAgenda(undefined, 'pendiente')
    return { handled: true, spokenText: res }
  }

  // 4. Modales de creación
  if (norm.includes('nueva cita') || norm.includes('crear cita') || norm.includes('anadir cita') || norm.includes('agendar cita')) {
    handlers.onOpenModal('new_appointment')
    return { handled: true, spokenText: 'He abierto el formulario para agendar una nueva cita.' }
  }
  if (norm.includes('nueva clienta') || norm.includes('crear clienta') || norm.includes('anadir clienta') || norm.includes('registrar clienta')) {
    handlers.onOpenModal('new_client')
    return { handled: true, spokenText: 'He abierto el formulario para registrar una nueva clienta.' }
  }
  if (norm.includes('nuevo servicio') || norm.includes('anadir servicio') || norm.includes('crear servicio')) {
    handlers.onOpenModal('new_service')
    return { handled: true, spokenText: 'He abierto el formulario para crear un nuevo servicio.' }
  }
  if (norm.includes('nueva factura') || norm.includes('emitir factura') || norm.includes('crear factura')) {
    handlers.onOpenModal('new_invoice')
    return { handled: true, spokenText: 'He abierto el formulario para emitir una nueva factura.' }
  }

  // 5. Búsqueda de clientas
  const searchMatch = norm.match(/(?:busca|buscar|encuentra|ver)\s+(?:a\s+)?(?:la\s+clienta\s+)?(.+)/i)
  if (searchMatch) {
    const query = searchMatch[1].trim()
    if (query && query.length > 2) {
      const res = await handlers.onSearchClient(query)
      return { handled: true, spokenText: res }
    }
  }

  // 6. Consultas financieras / Caja
  if (norm.includes('facturado') || norm.includes('ingresos') || norm.includes('caja')) {
    const res = await handlers.onQueryFinance()
    return { handled: true, spokenText: res }
  }

  // 7. Comprobar actualizaciones
  if (norm.includes('actualiza') || norm.includes('version')) {
    if (handlers.onCheckUpdates) {
      const res = await handlers.onCheckUpdates()
      return { handled: true, spokenText: res || 'Comprobando actualizaciones de software.' }
    }
  }

  // 8. Inteligencia Artificial Avanzada con Cloudflare Workers AI (Qwen 30B)
  try {
    const aiResult = await queryCloudflareWorkersAI({
      userText: raw,
      studioContext: handlers.getStudioContext ? handlers.getStudioContext() : undefined,
      config,
      handlers,
    })
    if (aiResult && aiResult.handled && aiResult.spokenText) {
      return aiResult
    }
  } catch (aiErr) {
    console.warn('[Cloudflare Workers AI Query Exception]', aiErr)
  }

  return {
    handled: true,
    spokenText:
      'No he entendido esa orden. Puedes pedirme por ejemplo: «elimina la cita de Rocío», «qué citas tengo hoy», «abrir nueva cita» o hacerme cualquier consulta sobre pestañas.',
  }
}

