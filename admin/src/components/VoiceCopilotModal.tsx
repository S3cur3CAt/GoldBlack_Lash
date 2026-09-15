import React, { useState, useEffect } from 'react'
import {
  generateAiResponse,
  executeVoiceCommand,
  VoiceRecognitionState,
} from '../services/cloudflareAiService'
import {
  IconX,
  IconMic,
  IconSparkles,
  IconVolume2,
} from './Icons'

interface VoiceCopilotModalProps {
  isOpen: boolean
  onClose: () => void
  appointments: any[]
  clients: any[]
  services: any[]
}

export const VoiceCopilotModal: React.FC<VoiceCopilotModalProps> = ({
  isOpen,
  onClose,
  appointments,
  clients,
  services,
}) => {
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [voiceState, setVoiceState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    error: null,
  })

  useEffect(() => {
    if (!isOpen) {
      setResponse('')
      setTranscript('')
      setError(null)
      setTextInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStartVoice = async () => {
    setError(null)
    setTranscript('')
    setResponse('')
    
    try {
      await executeVoiceCommand(
        (state) => {
          setVoiceState({
            isListening: state.isListening,
            transcript: state.transcript,
            error: state.error,
          })
          setIsProcessing(state.isProcessing)
          if (state.transcript) {
            setTranscript(state.transcript)
          }
          if (state.responseText) {
            setResponse(state.responseText)
          }
          if (state.error) {
            setError(state.error)
          }
        },
        { appointments, clients, services }
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isProcessing) return

    setIsProcessing(true)
    setError(null)
    setTranscript(textInput)
    setResponse('')
    const query = textInput
    setTextInput('')

    try {
      const aiResponse = await generateAiResponse(query, { appointments, clients, services })
      setResponse(aiResponse)
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Workers AI')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0e0e14] border border-gold-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Decorative ambient background orb */}
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-gold-500/10 filter blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <IconSparkles className="text-gold-400 animate-pulse" size={20} />
            <h3 className="font-sans font-bold text-base text-white">
              Copiloto Inteligente de Voz
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Status Area */}
        <div className="space-y-4 my-6">
          {voiceState.isListening ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-gold-400 opacity-75" />
                <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-zinc-950 shadow-gold-glow">
                  <IconMic size={24} />
                </div>
              </div>
              <p className="text-xs font-semibold text-gold-300 animate-pulse">
                Escuchando... Habla ahora
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleStartVoice}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-gold-glow transition-all active:scale-95 cursor-pointer"
              >
                <IconMic size={16} />
                <span>Hablar por Micrófono</span>
              </button>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-[#14141e] border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                Tus Palabras
              </span>
              <p className="text-xs text-zinc-200 italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
              <p className="text-xs text-zinc-400 font-medium">Procesando con @cf/qwen...</p>
            </div>
          )}

          {/* AI Response Display */}
          {response && (
            <div className="bg-gradient-to-br from-gold-500/10 to-transparent border border-gold-500/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <IconVolume2 className="text-gold-400" size={14} />
                <span className="text-[10px] font-bold text-gold-400 uppercase tracking-widest">
                  Respuesta de Qwen 30B
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-medium">{response}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3">
              <p className="font-semibold">Algo salió mal:</p>
              <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>
            </div>
          )}
        </div>

        {/* Text fallback input */}
        <form onSubmit={handleTextSubmit} className="border-t border-zinc-800/80 pt-4 flex gap-2">
          <input
            type="text"
            placeholder="O escribe tu consulta aquí..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isProcessing || voiceState.isListening}
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#14141d] border border-zinc-800 text-xs text-white focus:outline-none focus:border-gold-400"
          />
          <button
            type="submit"
            disabled={isProcessing || voiceState.isListening || !textInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#1c1c28] hover:bg-[#252538] border border-zinc-800 disabled:opacity-40 text-xs font-semibold text-gray-200 cursor-pointer"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
