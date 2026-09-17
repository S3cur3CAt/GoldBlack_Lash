/**
 * GoldBlack Lash Studio — Sistema de Alertas por Voz (Siri) y Notificaciones del Sistema
 *
 * Emite alertas sonoras con Web Audio API y locuciones nativas con Siri en macOS
 * (o síntesis natural del navegador) con control total de volumen y silenciado.
 */

import { getStudioConfig } from './storage'

/**
 * Sintetiza un sonido de notificación de alta gama (campana / chime) usando Web Audio API.
 * Escala su volumen de acuerdo a la configuración del sistema (0 - 100%).
 * Respeta el modo silencio maestro (muteAllNotifications).
 */
export function playNotificationChime(customVolume?: number): void {
  try {
    const config = getStudioConfig()
    if (config.muteAllNotifications && customVolume === undefined) return

    const volPct = customVolume !== undefined ? customVolume : (config.notificationSoundVolume ?? 80)
    if (volPct <= 0) return
    const scale = Math.max(0, Math.min(1, volPct / 100))

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    const playTone = (freq: number, start: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(peakGain * scale, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration)
    }

    // Acorde ascendente claro de 3 tonos: D5 (587Hz) -> A5 (880Hz) -> D6 (1174Hz)
    playTone(587.33, now, 0.5, 0.28)
    playTone(880.0, now + 0.12, 0.7, 0.32)
    playTone(1174.66, now + 0.24, 0.95, 0.24)

    setTimeout(() => {
      try {
        ctx.close()
      } catch {}
    }, 1500)
  } catch (err) {
    console.warn('[Notification Chime Error]', err)
  }
}

/**
 * Sintetiza un sonido de celebración/actualización de 4 tonos usando Web Audio API.
 * Escala su volumen de acuerdo a la configuración del sistema (0 - 100%).
 * Respeta el modo silencio maestro (muteAllNotifications).
 */
export function playUpdateChime(customVolume?: number): void {
  try {
    const config = getStudioConfig()
    if (config.muteAllNotifications && customVolume === undefined) return

    const volPct = customVolume !== undefined ? customVolume : (config.notificationSoundVolume ?? 80)
    if (volPct <= 0) return
    const scale = Math.max(0, Math.min(1, volPct / 100))

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    const playTone = (freq: number, start: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(peakGain * scale, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration)
    }

    // 4-Tone ascending chord: C5 -> E5 -> G5 -> C6
    playTone(523.25, now, 0.45, 0.28)
    playTone(659.25, now + 0.11, 0.55, 0.32)
    playTone(783.99, now + 0.22, 0.70, 0.35)
    playTone(1046.5, now + 0.33, 0.9, 0.25)

    setTimeout(() => {
      try {
        ctx.close()
      } catch {}
    }, 1800)
  } catch (err) {
    console.warn('[Update Chime Error]', err)
  }
}

/**
 * Formatea un número de teléfono para que se dicte de forma natural en grupos de 2-3 dígitos
 */
export function formatPhoneForSpeech(phone?: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (!digits) return phone

  let prefix = ''
  let local = digits
  if (digits.startsWith('34') && digits.length >= 11) {
    prefix = 'más treinta y cuatro, '
    local = digits.slice(2)
  }

  const groups: string[] = []
  if (local.length % 2 !== 0 && local.length >= 3) {
    groups.push(local.slice(0, 3))
    local = local.slice(3)
  }
  for (let i = 0; i < local.length; i += 2) {
    groups.push(local.slice(i, i + 2))
  }
  return `${prefix}${groups.join(', ')}`
}

/**
 * Detiene cualquier síntesis de voz en curso (Siri o Web Speech)
 */
export async function stopSpeechSynthesis(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.stopSiri) {
    try {
      await (window as any).electronAPI.stopSiri()
    } catch {}
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
}

/**
 * Síntesis de voz con Siri en macOS (o Web Speech en navegador).
 * Respeta el volumen configurado (voiceVolume: 0 - 100%) y el modo silencio maestro (muteAllNotifications).
 */
export async function speakWithSiriOrSystemVoice(
  text: string,
  customVolume?: number
): Promise<void> {
  if (!text || !text.trim()) return

  const config = getStudioConfig()

  // Comprobar si todas las notificaciones están silenciadas
  if (config.muteAllNotifications && customVolume === undefined) {
    return
  }

  const volumePct = customVolume !== undefined ? customVolume : (config.voiceVolume ?? 80)
  if (volumePct <= 0) return

  await stopSpeechSynthesis()

  // 1. En Electron (macOS), invocar directamente la voz nativa de Siri con control de volumen
  if (typeof window !== 'undefined' && (window as any).electronAPI?.speakWithSiri) {
    try {
      const handled = await (window as any).electronAPI.speakWithSiri(text, volumePct)
      if (handled) return
    } catch (e) {
      console.warn('[Siri Native TTS Fallback]:', e)
    }
  }

  // 2. Fallback con Web Speech Synthesis en el navegador
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve()
      return
    }

    const safetyTimeout = setTimeout(() => resolve(), 12000)

    try {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1.02
      utterance.pitch = 1.05
      utterance.volume = Math.max(0, Math.min(1, volumePct / 100))

      const selectBestSpanishVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        if (!voices || voices.length === 0) return

        const candidates = voices.filter(
          (v) =>
            (v.lang.startsWith('es') || v.lang.startsWith('ES')) &&
            !v.name.toLowerCase().includes('bad')
        )

        const preferred = candidates.find((v) => {
          const n = v.name.toLowerCase()
          return (
            n.includes('monica') ||
            n.includes('paulina') ||
            n.includes('helena') ||
            n.includes('lucia') ||
            n.includes('laura') ||
            n.includes('natural') ||
            n.includes('female') ||
            n.includes('siri')
          )
        })

        if (preferred) {
          utterance.voice = preferred
        } else if (candidates.length > 0) {
          utterance.voice = candidates[0]
        }
      }

      selectBestSpanishVoice()

      utterance.onend = () => {
        clearTimeout(safetyTimeout)
        resolve()
      }

      utterance.onerror = () => {
        clearTimeout(safetyTimeout)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('[TTS Error]', e)
      clearTimeout(safetyTimeout)
      resolve()
    }
  })
}

/**
 * Alias de compatibilidad para locuciones con voz femenina natural
 */
export async function speakWithFemaleVoice(
  text: string,
  customVolume?: number
): Promise<void> {
  await speakWithSiriOrSystemVoice(text, customVolume)
}

/**
 * Limpia y extrae el comentario o preferencia de horario para que la voz lo lea de forma natural
 */
function extractCommentForSpeech(rawNotes?: string): string {
  if (!rawNotes || !rawNotes.trim()) return ''
  let cleaned = rawNotes.trim()

  if (
    cleaned.toLowerCase() === 'solicitud de reserva online desde el sitio web' ||
    cleaned.toLowerCase() === 'solicitud web'
  ) {
    return ''
  }

  cleaned = cleaned.replace(/^solicitud\s+web\s*:\s*/i, '').trim()
  return cleaned
}

/**
 * Anuncia automáticamente con voz la llegada de una nueva reserva o mensaje desde goldblacklash.com
 * Respeta si el usuario ha silenciado Siri para citas recibidas (voiceAnnounceNewAppointments = false).
 */
export async function announceNewAppointmentVoice(
  apt: {
    clientName: string
    serviceName?: string
    clientPhone?: string
    date?: string
    time?: string
    notes?: string
  },
  customVolume?: number
): Promise<void> {
  const config = getStudioConfig()

  // Comprobar si está silenciado el asistente para nuevas citas
  if (config.muteAllNotifications && customVolume === undefined) return
  if (config.voiceAnnounceNewAppointments === false && customVolume === undefined) return

  const service = apt.serviceName || 'Servicio de extensiones de pestañas'
  const formattedPhone = apt.clientPhone ? formatPhoneForSpeech(apt.clientPhone) : ''
  const comment = extractCommentForSpeech(apt.notes)
  const commentClause = comment ? ` Preferencia de horario o comentario: ${comment}.` : ''

  let announcement = ''
  if (formattedPhone) {
    const templates = [
      `Laura, tienes una nueva reserva desde la página web. La clienta ${apt.clientName} ha solicitado el tratamiento de ${service}, su número de teléfono móvil es ${formattedPhone}.${commentClause}`,
      `Laura, nueva cita confirmada desde la web: la clienta ${apt.clientName} para el tratamiento de ${service}. Su teléfono móvil de contacto es ${formattedPhone}.${commentClause}`,
      `Laura, aviso de GoldBlack Lash: acaba de entrar una reserva de la clienta ${apt.clientName} para el tratamiento de ${service}. Número de teléfono: ${formattedPhone}.${commentClause}`,
    ]
    announcement = templates[Math.floor(Math.random() * templates.length)]
  } else {
    announcement = `Laura, tienes una nueva reserva desde la página web de la clienta ${apt.clientName} para el tratamiento de ${service}.${commentClause}`
  }

  await speakWithSiriOrSystemVoice(announcement, customVolume)
}

/**
 * Anuncia actualizaciones de software del sistema con Siri
 * Respeta si el usuario ha silenciado Siri para actualizaciones (voiceAnnounceUpdates = false).
 */
export async function announceUpdateVoice(
  version: string,
  customVolume?: number
): Promise<void> {
  const config = getStudioConfig()

  if (config.muteAllNotifications && customVolume === undefined) return
  if (config.voiceAnnounceUpdates === false && customVolume === undefined) return

  const versionClean = (version || '').replace(/^v/, '')
  const text = `Laura, tienes una nueva actualización disponible de GoldBlack Lash, versión ${versionClean}.`
  await speakWithSiriOrSystemVoice(text, customVolume)
}
