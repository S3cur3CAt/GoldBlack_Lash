/**
 * GoldBlack Lash Studio — Sistema de Alertas por Voz con ElevenLabs AI y Siri
 *
 * Emite alertas sonoras y anuncios hablados con ElevenLabs AI
 * (configurado desde la sección de Ajustes del panel de administración)
 * con fallback automático a Siri en macOS o síntesis del navegador.
 */

export function getElevenLabsApiKey(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('goldblack_elevenlabs_api_key')
    if (custom && custom.trim()) return custom.trim()
  }
  return ''
}

export function setElevenLabsApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = (key || '').trim()
    if (!trimmed) {
      localStorage.removeItem('goldblack_elevenlabs_api_key')
    } else {
      localStorage.setItem('goldblack_elevenlabs_api_key', trimmed)
    }
  }
}

export function getElevenLabsVoiceId(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('goldblack_elevenlabs_voice_id')
    if (custom && custom.trim()) return custom.trim()
  }
  return ''
}

export function setElevenLabsVoiceId(voiceId: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = (voiceId || '').trim()
    if (!trimmed) {
      localStorage.removeItem('goldblack_elevenlabs_voice_id')
    } else {
      localStorage.setItem('goldblack_elevenlabs_voice_id', trimmed)
    }
  }
}

/**
 * Referencia al elemento de audio actualmente en reproducción
 */
let currentAudio: HTMLAudioElement | null = null

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
 * Detiene cualquier síntesis de voz en curso (ElevenLabs, Siri o Web Speech)
 */
export async function stopSpeechSynthesis(): Promise<void> {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.currentTime = 0
    } catch {}
    currentAudio = null
  }
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
 * Realiza una petición POST a la API de ElevenLabs para generar audio en formato MP3
 */
async function requestElevenLabsAudio(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<Blob> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    try {
      const parsed = JSON.parse(errorText)
      if (parsed?.detail?.message) {
        throw new Error(parsed.detail.message)
      }
    } catch (e: any) {
      if (e?.message && e.message !== errorText) {
        throw e
      }
    }
    throw new Error(`ElevenLabs HTTP ${response.status}: ${errorText}`)
  }

  return await response.blob()
}

/**
 * Reproduce un Blob de audio mediante el objeto HTMLAudioElement
 */
function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      currentAudio = audio

      const cleanup = () => {
        try {
          URL.revokeObjectURL(audioUrl)
        } catch {}
        if (currentAudio === audio) {
          currentAudio = null
        }
      }

      audio.onended = () => {
        cleanup()
        resolve()
      }

      audio.onerror = (e) => {
        cleanup()
        reject(e)
      }

      audio.play().catch((err) => {
        cleanup()
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Síntesis de voz con ElevenLabs utilizando la API Key y Voice ID configurados en Ajustes.
 */
export async function speakWithElevenLabs(
  text: string,
  customVoiceId?: string,
  customApiKey?: string
): Promise<{ success: boolean; voiceUsed?: string; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Entorno no soportado' }
  }

  const apiKey = (customApiKey || getElevenLabsApiKey()).trim()
  const voiceId = (customVoiceId || getElevenLabsVoiceId()).trim()

  if (!apiKey) {
    return { success: false, error: 'No se ha configurado la clave API de ElevenLabs en Ajustes.' }
  }
  if (!voiceId) {
    return { success: false, error: 'No se ha configurado el ID de voz de ElevenLabs en Ajustes.' }
  }

  await stopSpeechSynthesis()

  try {
    const blob = await requestElevenLabsAudio(text, voiceId, apiKey)
    await playAudioBlob(blob)
    return { success: true, voiceUsed: voiceId }
  } catch (err: any) {
    const errMsg = String(err?.message || 'Error desconocido en ElevenLabs')
    console.warn('[ElevenLabs TTS Error]:', errMsg)
    return { success: false, error: errMsg }
  }
}

/**
/**
 * Síntesis de voz gratuita con Siri en macOS (o Web Speech en navegador).
 * NO consume créditos de ElevenLabs (ideal para avisos del sistema y actualizaciones).
 */
export async function speakWithSiriOrSystemVoice(text: string): Promise<void> {
  if (!text || !text.trim()) return

  await stopSpeechSynthesis()

  // 1. En Electron (macOS), invocar directamente la voz nativa de Siri
  if (typeof window !== 'undefined' && (window as any).electronAPI?.speakWithSiri) {
    try {
      const handled = await (window as any).electronAPI.speakWithSiri(text)
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
          utterance.rate = 1.0
          utterance.pitch = 1.05

          const voices = window.speechSynthesis.getVoices()

          // Prioridad: Siri o voces de alta calidad en español
          const siriVoice = voices.find(
            (v) =>
              (v.lang.startsWith('es') || v.lang === '') &&
              v.name.toLowerCase().includes('siri')
          )
          if (siriVoice) {
            utterance.voice = siriVoice
          } else {
            const preferred = [
              'monica',
              'paulina',
              'jorge',
              'alba',
              'natural',
              'neural',
              'enhanced',
              'google español',
            ]
            const hqVoice = voices.find((v) => {
              const name = v.name.toLowerCase()
              const isSpanish = v.lang.startsWith('es') || v.lang === ''
              return isSpanish && preferred.some((p) => name.includes(p))
            })
            if (hqVoice) {
              utterance.voice = hqVoice
            } else {
              const defaultSpanish =
                voices.find((v) => v.lang === 'es-ES') ||
                voices.find((v) => v.lang.startsWith('es'))
              if (defaultSpanish) utterance.voice = defaultSpanish
            }
          }

          utterance.onend = () => {
            clearTimeout(safetyTimeout)
            resolve()
          }
          utterance.onerror = (err) => {
            console.warn('[SpeechSynthesis Error]', err)
            clearTimeout(safetyTimeout)
            resolve()
          }

          window.speechSynthesis.resume()
          window.speechSynthesis.speak(utterance)
        } catch (err) {
          console.warn('[SpeechSynthesis Execute Error]', err)
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
      console.warn('[TTS Error]', e)
      clearTimeout(safetyTimeout)
      resolve()
    }
  })
}

/**
 * Síntesis de voz hablada para reservas de clientes:
 * 1. Prioridad 1: ElevenLabs AI Voice (con la clave e ID de voz configurados en Ajustes)
 * 2. Fallback: Siri nativo en macOS o Web Speech en el navegador (0 créditos)
 */
export async function speakWithFemaleVoice(text: string): Promise<void> {
  if (!text || !text.trim()) return

  // 1. ElevenLabs AI Voice si está configurado en Ajustes
  const apiKey = getElevenLabsApiKey()
  const voiceId = getElevenLabsVoiceId()
  if (apiKey && voiceId) {
    try {
      const res = await speakWithElevenLabs(text, voiceId, apiKey)
      if (res.success) return
    } catch (e) {
      console.warn('[ElevenLabs Fallback a Siri/WebSpeech]:', e)
    }
  }

  // 2. Fallback a voz de Siri o sistema (0 créditos)
  await speakWithSiriOrSystemVoice(text)
}


/**
 * Limpia y extrae el comentario o preferencia de horario para que la voz lo lea de forma natural
 */
function extractCommentForSpeech(rawNotes?: string): string {
  if (!rawNotes || !rawNotes.trim()) return ''
  let cleaned = rawNotes.trim()

  // Descartar mensajes genéricos automáticos si no contienen un comentario real de la clienta
  if (
    cleaned.toLowerCase() === 'solicitud de reserva online desde el sitio web' ||
    cleaned.toLowerCase() === 'solicitud web'
  ) {
    return ''
  }

  // Eliminar prefijos técnicos si venían de versiones anteriores
  cleaned = cleaned.replace(/^solicitud\s+web\s*:\s*/i, '').trim()
  return cleaned
}

/**
 * Anuncia automáticamente con voz la llegada de una nueva reserva desde goldblacklash.com
 * Incluye: Nombre completo, Teléfono, Tratamiento de interés y Preferencia de horario o comentario.
 */
export async function announceNewAppointmentVoice(
  apt: {
    clientName: string
    serviceName?: string
    clientPhone?: string
    date?: string
    time?: string
    notes?: string
  }
): Promise<void> {
  const service = apt.serviceName || 'Servicio de extensiones de pestañas'
  const formattedPhone = apt.clientPhone ? formatPhoneForSpeech(apt.clientPhone) : ''
  const comment = extractCommentForSpeech(apt.notes)
  const commentClause = comment ? ` Preferencia de horario o comentario: ${comment}.` : ''

  let announcement = ''
  if (formattedPhone) {
    const templates = [
      `Atención: Tienes una nueva reserva desde la página web. La clienta ${apt.clientName} ha reservado ${service}, y su teléfono es ${formattedPhone}.${commentClause}`,
      `Nueva cita confirmada desde la web: ${apt.clientName} para ${service}. Teléfono de contacto: ${formattedPhone}.${commentClause}`,
      `Aviso de GoldBlack Lash: Acaba de entrar una reserva de ${apt.clientName} para ${service}. Teléfono: ${formattedPhone}.${commentClause}`,
    ]
    announcement = templates[Math.floor(Math.random() * templates.length)]
  } else {
    announcement = `Atención: Tienes una nueva reserva desde el sitio web de la clienta ${apt.clientName} para ${service}.${commentClause}`
  }

  await speakWithFemaleVoice(announcement)
}
