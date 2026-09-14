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

/**
 * Audio Recorder using browser standard MediaRecorder
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu entorno o navegador no soporta grabación de audio.')
    }

    this.audioChunks = []
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    // Determine supported mime type
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
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.start(100)
  }

  async stop(): Promise<{ blob: Blob; mimeType: string; base64: string }> {
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
          this.mediaRecorder = null

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
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop()
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.audioChunks = []
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

  // 1. If running inside Electron on macOS Monterey, use native Siri voice directly via Apple 'say'
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

    try {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = 1.0 // Cadencia natural y prestigiosa
      utterance.pitch = 1.08 // Tono femenino cálido y elegante

      const selectFemaleSpanishVoice = () => {
        const voices = window.speechSynthesis.getVoices()

        // 1st Priority: Siri Spanish voice in system voices
        const siriVoice = voices.find(
          (v) =>
            (v.lang.startsWith('es') || v.lang === '') &&
            v.name.toLowerCase().includes('siri')
        )
        if (siriVoice) {
          utterance.voice = siriVoice
          return
        }

        // 2nd Priority: Apple's natural Spanish female voices (Mónica, Paulina, Alba, Victoria)
        const femaleKeywords = [
          'monica',
          'mónica',
          'paulina',
          'alba',
          'victoria',
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
            femaleKeywords.some((keyword) => name.includes(keyword))
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

      if (window.speechSynthesis.getVoices().length > 0) {
        selectFemaleSpanishVoice()
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          selectFemaleSpanishVoice()
        }
      }

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('[TTS Female Error]', e)
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
  apiKey?: string
): Promise<void> {
  const formattedPhone = formatPhoneForSpeech(apt.clientPhone)
  let announcement = `Atención: Tienes una nueva reserva desde el sitio web. La clienta ${apt.clientName} ha solicitado el servicio de ${apt.serviceName}, y su número de teléfono es ${formattedPhone}.`

  // If Gemini API Key is available, generate a personalized luxury concierge announcement
  if (apiKey && apiKey.trim()) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`
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

      const res = await Promise.race([
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 1800)
        ),
      ])

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.trim().length > 10) {
          announcement = text.trim().replace(/^["']|["']$/g, '')
        }
      }
    } catch (e) {
      // Fallback silently to template announcement
    }
  }

  await speakWithFemaleVoice(announcement)
}

/**
 * Send voice audio or text to Gemini Flash with Function Calling
 */
export async function processVoiceWithGemini(
  input: { base64Audio?: string; mimeType?: string; textQuery?: string },
  apiKey: string,
  handlers: VoiceActionHandlers
): Promise<VoiceAssistantResponse> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Falta la clave de API de Gemini. Por favor configúrala en Ajustes (es 100% gratis en Google AI Studio).')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentYear = new Date().getFullYear()
  const studioContext = handlers.getStudioContext ? handlers.getStudioContext() : ''

  const systemInstructionText = `
Eres Mónica, la asistente de voz inteligente, ejecutiva y personal de GoldBlack Lash Studio (estudio de alta gama de extensiones de pestañas, cejas y belleza en Montequinto, Sevilla).
Tu nombre oficial es Mónica. Los administradores y artistas del estudio se dirigirán a ti diciendo «Mónica» o pronunciando directamente su orden (por ejemplo: «Mónica, abre la agenda», «Mónica, ¿qué citas tengo hoy?», «Mónica, busca a Carmen», «Mónica, crea una cita para Laura mañana», «Mónica, comprueba si hay actualizaciones», «Mónica, ve a facturación»).

IDENTIDAD Y TONO DE MÓNICA:
- Tu nombre es Mónica y te identificas con orgullo y calidez como tal.
- Eres elegante, refinada, ejecutiva, servicial y extremadamente eficiente.
- Si el usuario te saluda o pregunta por ti («Hola Mónica», «Mónica», «¿Mónica estás ahí?», «¿Quién eres?»), saluda cordialmente presentándote como Mónica y preguntando en qué puedes ayudar hoy en el estudio.
- Si el usuario comienza su orden diciendo «Mónica, ...», interpreta y ejecuta la orden solicitada de inmediato.

Fecha actual: ${today} (Año ${currentYear}).
${studioContext ? `Contexto del estudio:\n${studioContext}` : ''}

REGLAS DE ACTUACIÓN:
1. Si el usuario pide cualquier acción de la app (cambiar de pantalla, consultar agenda, crear cita, cancelar cita, buscar clienta, consultar ingresos, comprobar actualizaciones, etc.), DEBES invocar la herramienta correspondiente con los parámetros exactos.
2. Si el usuario pide agendar o crear una cita:
   - Si no indica fecha, asume hoy o pregunta brevemente.
   - Si no indica hora exacta, usa una hora razonable de apertura (ej. 10:00 o 16:00) o abre el modal.
3. Si el usuario pregunta por actualizaciones («Mónica, ¿hay actualizaciones?», «Mónica, busca actualizaciones», «comprobar novedades»), invoca la herramienta check_updates.
4. Responde SIEMPRE de forma oral concisa, elegante y directa en español (1 o 2 oraciones máximo), confirmando la acción de forma natural como Mónica.
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
      text: 'Escucha atentamente el audio, extrae la orden del usuario y ejecuta la herramienta adecuada. Si no requiere herramientas, responde amablemente en español.',
    })
  } else if (input.textQuery) {
    parts.push({
      text: input.textQuery,
    })
  } else {
    throw new Error('No se proporcionó audio ni texto para procesar.')
  }

  // Use gemini-2.0-flash (fastest, multimodal audio native, 0€ free tier)
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`

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
    throw new Error(msg)
  }

  const data = await response.json()
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

  return {
    spokenText,
    toolCall,
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
