import React, { useState, useMemo } from 'react'
import {
  IconX,
  IconSparkles,
  IconMic,
  IconSearch,
  IconPlay,
  IconCheck,
} from './Icons'

export interface VoiceCommandItem {
  id: string
  phrase: string
  description: string
  category: 'navigation' | 'agenda' | 'clients' | 'finance' | 'updates' | 'assistant'
  actionHint?: string
}

const COMMAND_LIST: VoiceCommandItem[] = [
  // 🧭 Navegación
  {
    id: 'nav-agenda',
    phrase: 'Mónica, abre la agenda',
    description: 'Navega inmediatamente a la vista de calendario y citas.',
    category: 'navigation',
    actionHint: 'Ir a Agenda',
  },
  {
    id: 'nav-clients',
    phrase: 'Mónica, muéstrame las clientas',
    description: 'Abre la lista y fichas completas de clientas registradas.',
    category: 'navigation',
    actionHint: 'Ir a Clientas',
  },
  {
    id: 'nav-services',
    phrase: 'Mónica, ve a catálogo de servicios',
    description: 'Muestra los tratamientos de pestañas, cejas y precios.',
    category: 'navigation',
    actionHint: 'Ir a Servicios',
  },
  {
    id: 'nav-billing',
    phrase: 'Mónica, abre facturación',
    description: 'Accede al panel de finanzas, ingresos y cobros.',
    category: 'navigation',
    actionHint: 'Ir a Facturación',
  },
  {
    id: 'nav-gallery',
    phrase: 'Mónica, ve a la galería',
    description: 'Abre el gestor de fotos y trabajos del estudio.',
    category: 'navigation',
    actionHint: 'Ir a Galería',
  },
  {
    id: 'nav-settings',
    phrase: 'Mónica, abre configuración',
    description: 'Abre los ajustes del estudio, horarios y voz.',
    category: 'navigation',
    actionHint: 'Ir a Ajustes',
  },
  {
    id: 'nav-dashboard',
    phrase: 'Mónica, ve al panel principal',
    description: 'Regresa a la pantalla de resumen y estadísticas.',
    category: 'navigation',
    actionHint: 'Ir a Inicio',
  },

  // 📅 Agenda y Citas
  {
    id: 'apt-today',
    phrase: 'Mónica, ¿qué citas tengo hoy?',
    description: 'Consulta y lee en voz alta todas las citas del día.',
    category: 'agenda',
    actionHint: 'Consultar Citas Hoy',
  },
  {
    id: 'apt-tomorrow',
    phrase: 'Mónica, ¿cuántas citas hay para mañana?',
    description: 'Te dice cuántas reservas hay programadas para el día siguiente.',
    category: 'agenda',
    actionHint: 'Consultar Citas Mañana',
  },
  {
    id: 'apt-create-full',
    phrase: 'Mónica, crea una cita para Carmen el viernes a las cinco de la tarde',
    description: 'Agenda automáticamente una nueva cita con nombre, fecha y hora.',
    category: 'agenda',
    actionHint: 'Agendar Cita',
  },
  {
    id: 'apt-create-service',
    phrase: 'Mónica, añade una cita para Laura en volumen ruso mañana a las once',
    description: 'Crea la cita asignándole el servicio de pestañas deseado.',
    category: 'agenda',
    actionHint: 'Agendar con Servicio',
  },
  {
    id: 'apt-complete',
    phrase: 'Mónica, marca la cita de Marta como completada',
    description: 'Actualiza el estado de la cita a realizada.',
    category: 'agenda',
    actionHint: 'Completar Cita',
  },
  {
    id: 'apt-cancel',
    phrase: 'Mónica, cancela la cita de Rocío',
    description: 'Marca como cancelada la cita seleccionada.',
    category: 'agenda',
    actionHint: 'Cancelar Cita',
  },
  {
    id: 'apt-open-modal',
    phrase: 'Mónica, abre el formulario de nueva cita',
    description: 'Despliega la ventana emergente para rellenar los datos de una cita.',
    category: 'agenda',
    actionHint: 'Abrir Modal',
  },

  // 👥 Clientas
  {
    id: 'cli-search',
    phrase: 'Mónica, busca la ficha de Elena',
    description: 'Localiza a la clienta y lee sus visitas, notas y alergias.',
    category: 'clients',
    actionHint: 'Buscar Ficha',
  },
  {
    id: 'cli-phone',
    phrase: 'Mónica, ¿cuál es el teléfono de Nuria?',
    description: 'Busca el contacto y te lo dice verbalmente con cadencia natural.',
    category: 'clients',
    actionHint: 'Consultar Teléfono',
  },
  {
    id: 'cli-modal',
    phrase: 'Mónica, añade una nueva clienta',
    description: 'Abre el formulario para registrar a una clienta en la base de datos.',
    category: 'clients',
    actionHint: 'Nueva Clienta',
  },

  // 💰 Finanzas y Facturación
  {
    id: 'fin-month',
    phrase: 'Mónica, ¿cuánto hemos facturado este mes?',
    description: 'Calcula y te informa de la facturación total del mes en curso.',
    category: 'finance',
    actionHint: 'Ingresos del Mes',
  },
  {
    id: 'fin-today',
    phrase: 'Mónica, ¿cuánto dinero hemos ingresado hoy?',
    description: 'Suma todos los cobros del día y te da el balance.',
    category: 'finance',
    actionHint: 'Caja del Día',
  },
  {
    id: 'fin-invoice-modal',
    phrase: 'Mónica, crea una nueva factura',
    description: 'Abre el modal de emisión de facturas y recibos con IVA.',
    category: 'finance',
    actionHint: 'Nueva Factura',
  },

  // 🔄 Actualizaciones
  {
    id: 'upd-check',
    phrase: 'Mónica, busca actualizaciones',
    description: 'Comprueba en los servidores de GoldBlack Lash si hay una nueva versión.',
    category: 'updates',
    actionHint: 'Buscar Actualización',
  },
  {
    id: 'upd-news',
    phrase: 'Mónica, ¿hay alguna nueva versión disponible?',
    description: 'Verifica y te confirma por voz si tu aplicación está al día.',
    category: 'updates',
    actionHint: 'Verificar Versión',
  },

  // ✨ Saludos y Asistente
  {
    id: 'ast-hello',
    phrase: 'Hola Mónica',
    description: 'Mónica te saluda y se pone a tu disposición.',
    category: 'assistant',
    actionHint: 'Saludar',
  },
  {
    id: 'ast-help',
    phrase: 'Mónica, ¿qué puedes hacer?',
    description: 'Te resume sus capacidades y cómo puede asistirte con las manos libres.',
    category: 'assistant',
    actionHint: 'Capacidades',
  },
  {
    id: 'ast-thanks',
    phrase: 'Mónica, gracias',
    description: 'Cortesía con respuesta amable y distinguida.',
    category: 'assistant',
    actionHint: 'Agradecer',
  },
]

interface VoiceCommandsModalProps {
  isOpen: boolean
  onClose: () => void
  onExecuteCommand?: (commandText: string) => void
}

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [testedCommandId, setTestedCommandId] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'Todos', icon: '✨' },
    { id: 'navigation', label: 'Navegación', icon: '🧭' },
    { id: 'agenda', label: 'Agenda y Citas', icon: '📅' },
    { id: 'clients', label: 'Clientas', icon: '👥' },
    { id: 'finance', label: 'Finanzas', icon: '💰' },
    { id: 'updates', label: 'Actualizaciones', icon: '🔄' },
    { id: 'assistant', label: 'Mónica IA', icon: '💎' },
  ]

  const filteredCommands = useMemo(() => {
    return COMMAND_LIST.filter((cmd) => {
      const matchCat = selectedCategory === 'all' || cmd.category === selectedCategory
      if (!matchCat) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return (
        cmd.phrase.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        (cmd.actionHint && cmd.actionHint.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, selectedCategory])

  const handleTest = (cmd: VoiceCommandItem) => {
    setTestedCommandId(cmd.id)
    setTimeout(() => setTestedCommandId(null), 2000)

    if (onExecuteCommand) {
      onExecuteCommand(cmd.phrase)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#111118] border border-amber-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.15)] text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-800/80 bg-gradient-to-b from-[#181822] to-[#111118]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 shadow-[0_0_16px_rgba(212,175,55,0.35)] shrink-0">
              <IconSparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Comandos de Voz de Mónica
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Voz Siri • 0€
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Di <span className="text-amber-300 font-semibold">«Mónica»</span> seguido de cualquier orden o pulsa en <span className="text-amber-400">Probar</span> para ejecutarla al instante.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-zinc-800/60 bg-[#14141d]/70 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <IconSearch size={16} className="absolute left-3.5 top-3 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar comando (ej. agenda, cita Laura, clienta, factura, actualización...)"
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#0c0c12] border border-zinc-700/60 focus:border-amber-500 focus:outline-none text-xs text-zinc-200 placeholder-zinc-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium text-[11px] ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                    : 'bg-[#1a1a26] text-zinc-300 hover:bg-[#242435] border border-zinc-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <IconMic size={28} className="mx-auto text-zinc-600" />
              <p className="text-xs">No se encontraron comandos para &ldquo;{searchQuery}&rdquo;</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="text-xs text-amber-400 underline cursor-pointer"
              >
                Ver todos los comandos
              </button>
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              const isTested = testedCommandId === cmd.id
              return (
                <div
                  key={cmd.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#151520] hover:bg-[#1b1b2a] border border-zinc-800/80 hover:border-amber-500/40 transition-all shadow-sm"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-300 tracking-wide select-all font-sans">
                        «{cmd.phrase}»
                      </span>
                      {cmd.actionHint && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] bg-zinc-800/90 text-zinc-400 font-mono">
                          {cmd.actionHint}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-snug">
                      {cmd.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleTest(cmd)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      isTested
                        ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'bg-[#222233] group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-amber-600 text-amber-300 group-hover:text-zinc-950 border border-amber-500/30 group-hover:border-transparent active:scale-95'
                    }`}
                    title="Ejecutar esta orden en la app ahora"
                  >
                    {isTested ? (
                      <>
                        <IconCheck size={13} />
                        <span>Ejecutado</span>
                      </>
                    ) : (
                      <>
                        <IconPlay size={12} />
                        <span>Probar</span>
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer with Pro Tips */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0d0d14] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px]">
              Atajo rápido: <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono border border-zinc-700 text-[10px]">⌘ + Shift + V</kbd> (Mac) o <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono border border-zinc-700 text-[10px]">Ctrl + Shift + V</kbd>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Cerrar Guía
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
