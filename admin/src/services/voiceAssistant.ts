/**
 * GoldBlack Lash Studio — Sistema de Alertas por Voz con Siri (macOS • 0€)
 *
 * Emite alertas sonoras y anuncios hablados con la voz nativa de Siri en español (España)
 * cuando entran nuevas reservas desde el sitio web o cuando hay actualizaciones del sistema.
 */

/**
 * Formatea un número de teléfono para que Siri lo dicte de forma natural en grupos de 2-3 dígitos
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
 * Síntesis de voz hablada utilizando la voz nativa de Siri en macOS,
 * o voces en español de alta calidad en navegadores web.
 */
export async function speakWithFemaleVoice(text: string): Promise<void> {
  if (!text || !text.trim()) return

  // 1. En Electron (macOS), invocar directamente la voz nativa de Siri del sistema
  if (typeof window !== 'undefined' && (window as any).electronAPI?.speakWithSiri) {
    try {
      const handled = await (window as any).electronAPI.speakWithSiri(text)
      if (handled) return
    } catch (e) {
      console.warn('[Siri Native TTS Error, fallback a Web Speech]:', e)
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

          // 1st Prioridad: Voz Siri en español si está disponible en el navegador
          const siriVoice = voices.find(
            (v) =>
              (v.lang.startsWith('es') || v.lang === '') &&
              v.name.toLowerCase().includes('siri')
          )
          if (siriVoice) {
            utterance.voice = siriVoice
          } else {
            // 2nd Prioridad: Voces de alta calidad en español de España
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
 * Anuncia automáticamente con la voz de Siri la llegada de una nueva reserva desde goldblacklash.com
 */
export async function announceNewAppointmentVoice(
  apt: {
    clientName: string
    serviceName?: string
    clientPhone?: string
    date?: string
    time?: string
  }
): Promise<void> {
  const service = apt.serviceName || 'Servicio de extensiones de pestañas'
  const formattedPhone = apt.clientPhone ? formatPhoneForSpeech(apt.clientPhone) : ''

  let announcement = ''
  if (formattedPhone) {
    const templates = [
      `Atención: Tienes una nueva reserva desde la página web. La clienta ${apt.clientName} ha reservado ${service}, y su teléfono es ${formattedPhone}.`,
      `Nueva cita confirmada desde la web: ${apt.clientName} para ${service}. Teléfono de contacto: ${formattedPhone}.`,
      `Aviso de GoldBlack Lash: Acaba de entrar una reserva de ${apt.clientName} para ${service}. Puedes contactarla al ${formattedPhone}.`,
    ]
    announcement = templates[Math.floor(Math.random() * templates.length)]
  } else {
    announcement = `Atención: Tienes una nueva reserva desde el sitio web de la clienta ${apt.clientName} para ${service}.`
  }

  await speakWithFemaleVoice(announcement)
}
