import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import { StudioConfig } from '../types/admin'
import {
  IconSettings,
  IconDownload,
  IconUpload,
  IconCheck,
  IconMail,
  IconSend,
  IconSparkles,
  IconAlertCircle,
  IconRefreshCw,
} from './Icons'
import { exportBackupJSON, importBackupJSON, sendEmailViaResend } from '../services/storage'
import { SeasonalPreviewCanvas, SeasonalEffectType } from './SeasonalPreviewCanvas'
import { getCurrentSeasonalInfo, resolveSeasonalEffect } from '../utils/seasonalCalendar'
import { useUpdaterContext } from '../context/UpdaterContext'
import { CURRENT_APP_VERSION } from '../services/updater'

const seasonalOptions = [
  {
    id: 'auto',
    icon: '📅',
    label: 'Calendario Festivo Automático',
    season: 'Inteligente 365 días',
    desc: 'Se activa automáticamente una semana antes y durante cada festividad: Halloween, Navidad, Fin de Año, San Valentín, Primavera y Otoño.',
  },
  {
    id: 'new_year',
    icon: '🎆',
    label: 'Fin de Año & Fuegos Artificiales',
    season: 'Nochevieja y festividades',
    desc: 'Fuegos artificiales con cohetes ascendentes, estelas luminosas y detonaciones esféricas doradas y multicolores.',
  },
  {
    id: 'snow',
    icon: '❄️',
    label: 'Navidad & Invierno',
    season: 'Diciembre — Febrero',
    desc: 'Copos de nieve multicapa con profundidad de campo, balanceo suave por el viento y destellos helados.',
  },
  {
    id: 'halloween',
    icon: '🎃',
    label: 'Halloween & Noche de Brujas',
    season: 'Octubre — Noviembre',
    desc: 'Murciélagos planeando en 3D, niebla mágica y chispas de calabaza brillantes con decoración temática en tarjetas.',
  },
  {
    id: 'rose_petals',
    icon: '🌹',
    label: 'San Valentín & Romance',
    season: 'San Valentín y especiales',
    desc: 'Pétalos aterciopelados de rosa roja y vino oscuro que planean con gracia y sensualidad.',
  },
  {
    id: 'sakura',
    icon: '🌸',
    label: 'Primavera & Sakura',
    season: 'Marzo — Mayo',
    desc: 'Delicados pétalos de flor de cerezo en tonos rosa pastel cayendo con giro 3D en la brisa.',
  },
  {
    id: 'leaves',
    icon: '🍂',
    label: 'Otoño Dorado',
    season: 'Septiembre — Noviembre',
    desc: 'Hojas de arce en tonos ámbar, cobrizo y oro que se mecen como un péndulo y voltean en 3D.',
  },
  {
    id: 'none',
    icon: '🚫',
    label: 'Desactivado',
    season: 'Estándar limpio',
    desc: 'Sin efectos de partículas. Diseño original limpio y minimalista.',
  },
] as const

interface SettingsProps {
  config: StudioConfig
  onSaveConfig: (config: StudioConfig) => void
  onRefreshAllData: () => void
}

export const Settings: React.FC<SettingsProps> = ({
  config,
  onSaveConfig,
  onRefreshAllData,
}) => {
  const { showAlert } = useDialog()
  const { checkUpdates, testUpdateNotification, status: updateStatus } = useUpdaterContext()
  const [formData, setFormData] = useState<StudioConfig>(config)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  // Resend Email Live Test State
  const [testRecipient, setTestRecipient] = useState(config.email || '')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestEmail = async () => {
    if (!testRecipient.trim()) {
      showAlert({
        title: 'Email requerido',
        message: 'Por favor ingresa un correo destinatario para la prueba.',
        type: 'warning',
      })
      return
    }
    setIsSendingTest(true)
    setTestResult(null)
    try {
      const res = await sendEmailViaResend({
        to: testRecipient.trim(),
        subject: `🧪 Prueba de Envío — ${formData.name}`,
        html: `
          <div style="font-family: sans-serif; background-color: #0c0c10; color: #f0f0f5; padding: 32px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #28283c;">
            <h2 style="color: #d4af37; margin-bottom: 12px; font-size: 20px;">✨ Configuración Exitosa</h2>
            <p style="font-size: 14px; line-height: 1.6;">Este es un correo de prueba enviado desde el panel de control de <strong>${formData.name}</strong>.</p>
            <p style="color: #9999aa; font-size: 13px; line-height: 1.5;">Tu integración de correo corporativo mediante Resend y tu dominio en Vercel está funcionando a la perfección.</p>
            <hr style="border: none; border-top: 1px solid #222230; margin: 20px 0;" />
            <p style="font-size: 11px; color: #666677; text-align: center;">GoldBlack Lash • Sistema de Gestión de Citas y Reservas</p>
          </div>
        `,
        text: `Prueba de Envío — ${formData.name}\n\nTu integración de correo corporativo mediante Resend y Vercel está funcionando a la perfección.`,
        from: formData.senderEmail || undefined,
        apiKey: formData.resendApiKey || undefined,
      })
      if (res.ok) {
        setTestResult({
          success: true,
          message: `✓ ¡Correo de prueba enviado con éxito a ${testRecipient}! Revisa tu bandeja de entrada.`,
        })
        showAlert({
          title: 'Prueba Exitosa',
          message: `El correo de prueba se ha emitido correctamente a ${testRecipient} mediante Resend.`,
          type: 'success',
        })
      } else {
        setTestResult({
          success: false,
          message: `❌ Error al enviar: ${res.error || 'Verifica tu API Key o la verificación del dominio'}`,
        })
        showAlert({
          title: 'Fallo al Enviar',
          message: `Resend devolvió un error: ${res.error || 'Verifica que tu API Key sea correcta y que tu dominio esté verificado.'}`,
          type: 'error',
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Error de red: ${err.message}`,
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSaveConfig(formData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
      showAlert({
        title: '¡Configuración Guardada!',
        message:
          'Todos los ajustes del estudio se han guardado correctamente y se han sincronizado con el sitio web en tiempo real.',
        type: 'success',
      })
    } catch (err: any) {
      showAlert({
        title: 'Error al Guardar',
        message: `No se pudieron guardar los ajustes: ${err?.message ?? 'Error desconocido'}`,
        type: 'error',
      })
    }
  }

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `goldblack-lash-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const success = importBackupJSON(content)
      if (success) {
        setImportStatus('✓ Copia de seguridad restaurada correctamente')
        onRefreshAllData()
      } else {
        setImportStatus('❌ Error al procesar el archivo de copia de seguridad')
      }
      setTimeout(() => setImportStatus(null), 4000)
    }
    reader.readAsText(file)
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto h-[calc(100vh-80px)]">
      {/* Header */}
      <div>
        <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2.5">
          <IconSettings size={24} className="text-gold-400" />
          Ajustes del Estudio y Configuración
        </h3>
        <p className="text-xs text-gray-400">
          Personaliza los datos de contacto, enlaces de reserva, copias de seguridad y compatibilidad.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <IconCheck size={16} />
          <span>¡Ajustes guardados correctamente!</span>
        </div>
      )}

      {importStatus && (
        <div className="p-4 rounded-xl bg-[#1a1a28] border border-gold-500/30 text-gold-300 text-xs flex items-center gap-2">
          <span>{importStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modo Mantenimiento Card */}
        <div className={`p-6 rounded-2xl border transition-all duration-300 ${
          formData.maintenanceMode
            ? 'bg-[#1c1408] border-amber-500/50 shadow-[0_4px_25px_rgba(245,158,11,0.15)]'
            : 'bg-[#12121a] border-[#222230]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  formData.maintenanceMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`} />
                <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                  Modo Mantenimiento del Sitio Web
                </h4>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  formData.maintenanceMode
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                }`}>
                  {formData.maintenanceMode ? '⚠️ En Mantenimiento' : '✓ Sitio Activo y en Línea'}
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
                Si activas esta opción, el sitio web público quedará bloqueado temporalmente y mostrará la pantalla oficial con la imagen <code className="text-amber-300/90 font-mono text-[11px]">Mantenimiento.png</code>.
              </p>
            </div>

            {/* Switch button */}
            <button
              type="button"
              onClick={() => {
                const updatedMode = !formData.maintenanceMode
                const updatedConfig = { ...formData, maintenanceMode: updatedMode }
                setFormData(updatedConfig)
                onSaveConfig(updatedConfig)
                showAlert({
                  title: updatedMode ? 'Modo Mantenimiento Activado' : 'Sitio Web Reabierto',
                  message: updatedMode
                    ? 'El sitio web ahora muestra la pantalla de mantenimiento para todos los visitantes.'
                    : 'El sitio web vuelve a estar completamente visible y disponible al público.',
                  type: updatedMode ? 'warning' : 'success',
                })
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                formData.maintenanceMode
                  ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-md'
                  : 'bg-[#1e1e2c] text-gray-200 hover:bg-[#28283c] border border-gray-700'
              }`}
            >
              <span>{formData.maintenanceMode ? 'Desactivar Mantenimiento' : 'Activar Mantenimiento'}</span>
            </button>
          </div>

          {/* Maintenance image preview */}
          {formData.maintenanceMode && (
            <div className="mt-4 pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-48 h-28 rounded-xl overflow-hidden border border-amber-500/30 bg-black/50 shrink-0">
                <img
                  src="/Mantenimiento.png"
                  alt="Vista previa de mantenimiento"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://goldblacklash.com/Mantenimiento.png'
                  }}
                />
              </div>
              <div className="text-xs text-amber-200/80 space-y-1">
                <p className="font-semibold text-amber-300">Imagen configurada: Mantenimiento.png</p>
                <p className="text-[11px] text-gray-400">
                  Los clientes verán esta imagen en pantalla completa junto a los accesos directos de WhatsApp e Instagram para que no pierdas reservas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Efectos Estacionales y Partículas Ambientales */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />
                <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <IconSparkles size={18} className="text-gold-400" />
                  Efectos Estacionales y Partículas en Vivo
                </h4>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  formData.seasonalEffect && formData.seasonalEffect !== 'none'
                    ? 'bg-gold-950/60 text-gold-300 border-gold-500/40'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  {formData.seasonalEffect && formData.seasonalEffect !== 'none'
                    ? '✨ Partículas Activas en el Sitio'
                    : 'Modo Limpio (Sin Efectos)'}
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                Activa efectos visuales realistas que caen suavemente sobre el sitio web según la época del año o festividades. No bloquean clics y cuentan con física 3D a 60 FPS.
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await onSaveConfig(formData)
                  setSaveSuccess(true)
                  setTimeout(() => setSaveSuccess(false), 4000)
                  showAlert({
                    title: 'Efecto Guardado',
                    message: formData.seasonalEffect && formData.seasonalEffect !== 'none'
                      ? `El efecto "${seasonalOptions.find((o) => o.id === formData.seasonalEffect)?.label}" se ha guardado y ya está activo en el sitio web.`
                      : 'Los efectos de partículas han sido desactivados del sitio web.',
                    type: 'success',
                  })
                } catch (err: any) {
                  showAlert({
                    title: 'Error al Guardar',
                    message: `No se pudo guardar: ${err?.message ?? 'Error desconocido'}`,
                    type: 'error',
                  })
                }
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 bg-gold-500/20 text-gold-300 hover:bg-gold-500/30 border border-gold-500/40"
            >
              <IconSparkles size={14} />
              <span>Guardar y Aplicar Efecto</span>
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-[#08080c] border border-[#2b2b3d] flex items-center justify-center shadow-inner">
            <SeasonalPreviewCanvas effect={formData.seasonalEffect || 'none'} />
            
            <div className="absolute top-2.5 left-3 text-[10px] uppercase font-mono tracking-widest text-gray-400 bg-black/80 px-2.5 py-1 rounded-md border border-white/10 pointer-events-none backdrop-blur-sm z-20">
              Simulación en directo • {seasonalOptions.find((o) => o.id === (formData.seasonalEffect || 'none'))?.label}
            </div>

            {formData.seasonalEffect === 'auto' && (
              <div className="absolute bottom-2.5 left-3 text-[10px] font-medium text-gold-300 bg-black/85 px-2.5 py-1 rounded-md border border-gold-500/30 pointer-events-none backdrop-blur-sm z-20 flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-gray-400">Activo hoy:</span>
                <span className="font-bold text-gold-200">{getCurrentSeasonalInfo().name}</span>
                <span className="text-[9px] text-gray-400 font-mono">({getCurrentSeasonalInfo().dateRange})</span>
              </div>
            )}

            <div className="relative z-10 pointer-events-none text-center max-w-sm mx-auto px-5 py-3 rounded-xl bg-black/75 border border-gold-500/25 backdrop-blur-md shadow-2xl">
              <span className="font-serif text-sm font-bold text-gold-200 block tracking-wide">
                GoldBlack Lash Atelier
              </span>
              <span className="text-[11px] text-gray-300 block mt-0.5">
                {formData.seasonalEffect === 'auto'
                  ? `Modo Calendario Activo: ${getCurrentSeasonalInfo().name}`
                  : formData.seasonalEffect === 'new_year'
                  ? 'Fuegos artificiales festivos iluminando el atelier'
                  : 'Las partículas caen suavemente sobre el contenido sin bloquear botones'}
              </span>
            </div>
          </div>

          {formData.seasonalEffect === 'auto' && (
            <div className="p-3.5 rounded-xl bg-gold-950/20 border border-gold-500/30 text-xs text-gold-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg shrink-0">📅</span>
                <div>
                  <span className="font-bold text-gold-300 block text-xs">Programación Automática de Festividades (7 días previos y fechas exactas):</span>
                  <span className="text-[11px] text-gray-400 leading-relaxed block mt-0.5">
                    🎃 Halloween (20 Oct — 2 Nov) • 🎆 Fin de Año Fuegos Artificiales (28 Dic — 2 Ene) • ❄️ Navidad y Reyes (1 Dic — 6 Ene) • 🌹 San Valentín (7 Feb — 16 Feb) • 🌸 Primavera Sakura (20 Mar — 31 May) • 🍂 Otoño Dorado (15 Sep — 30 Nov)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grid of seasonal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {seasonalOptions.map((opt) => {
              const isSelected = (formData.seasonalEffect || 'none') === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, seasonalEffect: opt.id as SeasonalEffectType })
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-[#1e1b12] border-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-gold-400/50'
                      : 'bg-[#181824] border-[#28283c] hover:border-gray-600 hover:bg-[#1f1f2e]'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl shrink-0" aria-hidden="true">{opt.icon}</span>
                      <div>
                        <h5 className={`text-xs font-bold ${isSelected ? 'text-gold-300' : 'text-white'}`}>
                          {opt.label}
                        </h5>
                        <span className="text-[10px] text-gray-400 font-medium">{opt.season}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-gold-400 text-black grid place-items-center text-xs font-black shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">{opt.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Contact and Business Details */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-4">
          <h4 className="font-serif text-base font-bold text-gold-300 uppercase tracking-wider">
            Información del Estudio
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Lema / Subtítulo</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>



            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Teléfono Visible al Público</label>
              <input
                type="text"
                value={formData.phoneDisplay}
                onChange={(e) => setFormData({ ...formData, phoneDisplay: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email de Contacto</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Instagram Handle</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Dirección del Estudio</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Ciudad / Municipio</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Código Postal</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        {/* Studio Opening Hours */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-4">
          <h4 className="font-serif text-base font-bold text-gold-300 uppercase tracking-wider">
            Horarios de Atención
          </h4>
          <div className="space-y-3">
            {formData.hours.map((h, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#181824] border border-[#262638]">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Días</label>
                  <input
                    type="text"
                    value={h.days}
                    onChange={(e) => {
                      const updated = [...formData.hours]
                      updated[i].days = e.target.value
                      setFormData({ ...formData, hours: updated })
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Horas</label>
                  <input
                    type="text"
                    value={h.time}
                    onChange={(e) => {
                      const updated = [...formData.hours]
                      updated[i].time = e.target.value
                      setFormData({ ...formData, hours: updated })
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#20202e] border border-[#303044] text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Email Configuration (Resend + Vercel Domain) */}
        <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-base font-bold text-gold-300 uppercase tracking-wider flex items-center gap-2">
              <IconMail size={18} className="text-gold-400" />
              Configuración de Correo Corporativo (Resend + Dominio Vercel)
            </h4>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-gold-500/10 text-gold-300 border border-gold-500/20">
              Sin WhatsApp • Directo y Elegante
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Conecta tu dominio corporativo comprado en Vercel con la plataforma de envíos Resend para emitir confirmaciones, recordatorios de 24h y avisos de retoque desde tu propio correo de empresa (ej. <code className="text-gold-400 font-mono">citas@goldblacklash.com</code>).
          </p>

          {/* Step by Step Guide Card */}
          <div className="p-4 rounded-xl bg-[#171724] border border-[#27273a] space-y-2.5 text-xs text-gray-300">
            <div className="font-bold text-white flex items-center gap-1.5 text-xs">
              <IconSparkles size={14} className="text-gold-400" />
              Pasos para conectar tu Dominio de Vercel con Resend:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-300">
              <li>
                <strong className="text-white">Dominio en Vercel:</strong> Ten tu dominio añadido o comprado en tu cuenta de Vercel (ej. <span className="font-mono text-gold-300">goldblacklash.com</span>).
              </li>
              <li>
                <strong className="text-white">Cuenta gratis en Resend:</strong> Entra en <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline font-medium">resend.com</a>, crea tu cuenta gratuita y pulsa en <em>Domains &gt; Add Domain</em>.
              </li>
              <li>
                <strong className="text-white">Registros DNS:</strong> Resend te facilitará unos registros DNS tipo <em>TXT (SPF/DKIM)</em> y <em>CNAME</em>. Cópialos y añádelos en la pestaña <em>Domains &gt; DNS Records</em> de tu panel en Vercel.
              </li>
              <li>
                <strong className="text-white">Verificación &amp; API Key:</strong> En unos minutos el dominio queda verificado (estado <span className="text-emerald-400 font-semibold">Verified</span>). Luego crea una <em>API Key</em> en Resend y pégala a continuación.
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                API Key de Resend (empieza por <span className="font-mono text-gold-400">re_...</span>)
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={formData.resendApiKey || ''}
                onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value.trim() })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-gold-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Obtén tu clave desde <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline">resend.com/api-keys</a>. También puedes configurarla como variable de entorno <code className="text-gray-400">RESEND_API_KEY</code> en Vercel.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Correo Remitente Corporativo (From)
              </label>
              <input
                type="text"
                placeholder="GoldBlack Lash <citas@goldblacklash.com>"
                value={formData.senderEmail || ''}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value.trim() })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Dirección con tu dominio verificado. Ejemplo: <span className="font-mono text-gray-400">citas@goldblacklash.com</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Email de Alertas del Estudio (Recepción de Citas)
              </label>
              <input
                type="email"
                placeholder="tu-correo@gmail.com o citas@goldblacklash.com"
                value={formData.alertEmail || ''}
                onChange={(e) => setFormData({ ...formData, alertEmail: e.target.value.trim() })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-sm text-white focus:outline-none focus:border-gold-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Aquí recibirás una notificación instantánea cada vez que una clienta reserve desde la web.
              </p>
            </div>
          </div>

          {/* Live Test Box */}
          <div className="p-4 rounded-xl bg-[#151520] border border-[#222235] space-y-3">
            <label className="block text-xs font-semibold text-gray-300">
              Probar Envío de Correo en Vivo
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Ingresa un correo para recibir la prueba..."
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={isSendingTest}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-ink-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <IconSend size={14} />
                <span>{isSendingTest ? 'Enviando...' : 'Enviar Prueba'}</span>
              </button>
            </div>
            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
              }`}>
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs uppercase tracking-wider shadow-gold-glow transition-all"
          >
            Guardar Cambios de Configuración
          </button>
        </div>
      </form>

      {/* Real-time Vercel & Supabase Sync Section */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Sincronización en Tiempo Real (Vercel & Supabase)
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            Conexión Activa
          </span>
        </div>
        <p className="text-xs text-gray-400">
          Los precios, citas y fotografías editados en este panel se guardan directamente en tu base de datos y almacenamiento de Supabase y se reflejan de inmediato en la web sin necesidad de esperar despliegues de GitHub.
        </p>

        <div className="p-4 rounded-xl bg-[#161622] border border-[#262638] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              URL del Sitio Web en Vercel (API Endpoint)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={localStorage.getItem('goldblack_admin_api_url') || 'https://goldblacklash.com'}
                onChange={(e) => localStorage.setItem('goldblack_admin_api_url', e.target.value.trim())}
                placeholder="https://goldblacklash.com"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  const url = localStorage.getItem('goldblack_admin_api_url') || 'https://goldblacklash.com'
                  try {
                    const res = await fetch(`${url}/api/services`)
                    if (res.ok) {
                      showAlert({
                        title: 'Conexión Exitosa',
                        message: '✓ Conexión en tiempo real establecida con Vercel y Supabase. Los servicios están sincronizados.',
                        type: 'success',
                      })
                    } else {
                      showAlert({
                        title: 'Respuesta del Servidor',
                        message: `El servidor respondió con código HTTP ${res.status}. Verifica que el endpoint esté activo.`,
                        type: 'warning',
                      })
                    }
                  } catch (e: any) {
                    showAlert({
                      title: 'Error de Conexión',
                      message: `No se pudo conectar con ${url}: ${e.message}`,
                      type: 'error',
                    })
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#252538] hover:bg-[#303048] text-xs font-semibold text-gray-200 border border-gray-700/50"
              >
                Probar Conexión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-4">
        <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
          <IconDownload size={18} className="text-gold-400" />
          Copias de Seguridad (Backup y Restauración)
        </h4>
        <p className="text-xs text-gray-400">
          Exporta todas las citas, clientas, notas técnicas y servicios a un archivo JSON seguro para mantener una copia a salvo o transferirla entre tu Mac y PC.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e1e2c] hover:bg-[#2a2a3e] text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <IconDownload size={16} />
            <span>Descargar Copia de Seguridad (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#181824] hover:bg-[#222234] text-gray-300 border border-gray-700/40 text-xs font-semibold cursor-pointer transition-all">
            <IconUpload size={16} />
            <span>Restaurar Copia de Seguridad</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Updates and Sound/Visual Notification Section */}
      <div className="p-6 rounded-2xl bg-[#12121a] border border-[#222230] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <IconRefreshCw size={18} className="text-gold-400" />
            Actualizaciones del Sistema (macOS & Windows)
          </h4>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
            Versión actual: v{CURRENT_APP_VERSION}
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          El panel busca automáticamente nuevas versiones en GitHub en segundo plano. Al detectar una actualización disponible, macOS emite la <strong>tira de notificación del sistema de Apple</strong> con sonido de campanilla (Glass) y activa el salto en el Dock con globo de aviso.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => checkUpdates(true)}
            disabled={updateStatus === 'checking'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e1e2c] hover:bg-[#2a2a3e] text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <IconRefreshCw size={14} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
            <span>{updateStatus === 'checking' ? 'Buscando en GitHub...' : 'Buscar Actualizaciones'}</span>
          </button>

          <button
            type="button"
            onClick={() => testUpdateNotification()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/20 via-amber-500/20 to-gold-500/10 hover:from-gold-500/30 hover:to-amber-500/20 text-gold-300 border border-gold-500/40 text-xs font-semibold transition-all shadow-gold-glow cursor-pointer active:scale-95"
            title="Dispara la tira de notificación nativa del sistema de Apple con sonido Glass"
          >
            <span className="text-sm">🔔</span>
            <span>Probar Tira de Notificación en Mac</span>
          </button>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="p-6 rounded-2xl bg-[#101016] border border-[#1e1e28] space-y-3 text-xs text-gray-400">
        <h5 className="font-serif font-bold text-white text-sm">
          Compatibilidad del Sistema y Versiones
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 rounded-xl bg-[#14141e] border border-[#222232]">
            <span className="text-gold-400 font-bold block mb-1">🍏 macOS Monterey (macOS 12.0+)</span>
            <p className="text-gray-400">
              Compatible con macOS 12.0 Monterey y versiones superiores en arquitecturas Intel y Apple Silicon.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-[#14141e] border border-[#222232]">
            <span className="text-blue-400 font-bold block mb-1">🪟 Windows 11 / Windows 10 (x64)</span>
            <p className="text-gray-400">
              Instalador ejecutable (.exe con NSIS) y versión portable autónoma.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
