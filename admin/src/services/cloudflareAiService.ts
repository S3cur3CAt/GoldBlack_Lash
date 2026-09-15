/**
 * GoldBlack Lash Studio — Servicio de IA y Voz con Cloudflare Workers AI
 *
 * Utiliza el modelo avanzado @cf/qwen/qwen3-30b-a3b-fp8 para responder dudas,
 * gestionar citas y automatizar tareas del estudio por comandos de voz y texto.
 */

import { speakWithFemaleVoice } from './voiceAssistant'

export interface CloudflareCredentials {
  accountId: string
  apiToken: string
}

/**
 * Obtiene las credenciales de Cloudflare desde localStorage o variables de entorno
 */
export function getCloudflareCredentials(): CloudflareCredentials {
  if (typeof window === 'undefined') {
    return { accountId: '', apiToken: '' }
  }
  const accountId = localStorage.getItem('goldblack_cf_account_id') || ''
  const apiToken = localStorage.getItem('goldblack_cf_api_token') || ''
  return { accountId, apiToken }
}

/**
 * Guarda las credenciales de Cloudflare en localStorage
 */
export function saveCloudflareCredentials(accountId: string, apiToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('goldblack_cf_account_id', accountId.trim())
  localStorage.setItem('goldblack_cf_api_token', apiToken.trim())
}

/**
 * Llama al modelo @cf/qwen/qwen3-30b-a3b-fp8 en Cloudflare Workers AI con contexto del estudio
 */
export async function generateAiResponse(
  prompt: string,
  context?: {
    appointments?: any[]
    clients?: any[]
    services?: any[]
  }
): Promise<string> {
  const { accountId, apiToken } = getCloudflareCredentials()

  if (!accountId || !apiToken) {
    throw new Error(
      'Faltan las credenciales de Cloudflare (Account ID o API Token). Configúralas en Ajustes.'
    )
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/qwen/qwen3-30b-a3b-fp8`

  // Formatear el contexto del estudio de forma compacta para no saturar los tokens de la API
  const formattedAppointments = context?.appointments
    ? context.appointments
        .map((a) => `${a.date} a las ${a.time}: ${a.clientName} para ${a.serviceName} (${a.status}, ${a.price}€)`)
        .join('\n')
    : 'No hay citas registradas.'

  const formattedClients = context?.clients
    ? context.clients
        .map((c) => `${c.name} (Tlf: ${c.phone}, Alergias: ${c.allergies || 'ninguna'})`)
        .join('\n')
    : 'No hay clientas registradas.'

  const formattedServices = context?.services
    ? context.services
        .map((s) => `${s.name}: ${s.price}€ (${s.duration})`)
        .join('\n')
    : 'No hay servicios configurados.'

  const systemContent = `Eres la IA asistente virtual del prestigioso estudio de belleza "GoldBlack Lash".
Ayudas a gestionar reservas, citas de pestañas, clientas y precios.

Tienes acceso directo en tiempo real al estado del estudio:

[CITAS ACTUALES]
${formattedAppointments}

[CLIENTAS REGISTRADAS]
${formattedClients}

[CATÁLOGO DE SERVICIOS]
${formattedServices}

Responde preguntas de forma muy profesional, clara y ultra-breve (máximo 2 o 3 frases) en español, ya que tu respuesta será leída en voz alta por un sintetizador de voz (Siri).`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `Error de Cloudflare Workers AI (HTTP ${response.status}): ${errorBody || 'Petición fallida'}`
    )
  }

  const data = await response.json()
  const result = data?.result?.response || data?.result?.text || ''
  
  if (!result) {
    throw new Error('La respuesta de Cloudflare Workers AI está vacía.')
  }

  return result
}

/**
 * Interfaz para el estado del reconocimiento de voz
 */
export interface VoiceRecognitionState {
  isListening: boolean
  transcript: string
  error: string | null
}

/**
 * Inicia el reconocimiento de voz nativo en macOS o navegador y procesa con IA
 */
export class VoiceAssistantManager {
  private recognition: any = null
  private onStateChange: (state: VoiceRecognitionState) => void

  constructor(onStateChange: (state: VoiceRecognitionState) => void) {
    this.onStateChange = onStateChange
    
    // Configurar SpeechRecognition nativo
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.lang = 'es-ES'
      this.recognition.interimResults = false
      this.recognition.maxAlternatives = 1

      this.recognition.onstart = () => {
        this.onStateChange({ isListening: true, transcript: '', error: null })
      }

      this.recognition.onerror = (event: any) => {
        console.error('[SpeechRecognition Error]', event.error)
        this.onStateChange({
          isListening: false,
          transcript: '',
          error: `Error de voz: ${event.error}`,
        })
      }

      this.recognition.onend = () => {
        this.onStateChange({ isListening: false, transcript: '', error: null })
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition
  }

  public startListening(onSuccess: (text: string) => void): void {
    if (!this.recognition) {
      this.onStateChange({
        isListening: false,
        transcript: '',
        error: 'El reconocimiento de voz no está soportado en este dispositivo.',
      })
      return
    }

    try {
      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript
        this.onStateChange({ isListening: false, transcript: text, error: null })
        onSuccess(text)
      }
      this.recognition.start()
    } catch (e: any) {
      this.onStateChange({ isListening: false, transcript: '', error: e.message })
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {}
    }
  }
}

/**
 * Ejecuta un comando de voz completo: Escucha -> Transcribe -> IA de Cloudflare -> Lee respuesta en voz alta
 */
export async function executeVoiceCommand(
  onStateChange: (state: VoiceRecognitionState & { isProcessing: boolean; responseText?: string }) => void,
  context?: {
    appointments?: any[]
    clients?: any[]
    services?: any[]
  }
): Promise<void> {
  const manager = new VoiceAssistantManager((state) => {
    onStateChange({ ...state, isProcessing: false })
  })

  if (!manager.isSupported()) {
    onStateChange({
      isListening: false,
      transcript: '',
      error: 'Reconocimiento de voz no soportado.',
      isProcessing: false,
    })
    return
  }

  manager.startListening(async (transcript) => {
    onStateChange({
      isListening: false,
      transcript,
      error: null,
      isProcessing: true,
    })

    try {
      // 1. Enviar transcripción a Cloudflare Workers AI con el contexto del estudio
      const aiResponse = await generateAiResponse(transcript, context)
      
      // 2. Notificar resultado a la UI
      onStateChange({
        isListening: false,
        transcript,
        error: null,
        isProcessing: false,
        responseText: aiResponse,
      })

      // 3. Hablar la respuesta mediante Siri / TTS
      await speakWithFemaleVoice(aiResponse)
    } catch (err: any) {
      onStateChange({
        isListening: false,
        transcript,
        error: err.message || 'Error al procesar con IA',
        isProcessing: false,
      })
    }
  })
}
