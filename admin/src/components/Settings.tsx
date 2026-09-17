import React, { useState, useEffect } from 'react'
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
  IconVolume2,
  IconVolumeX,
  IconBell,
  IconBellOff,
  IconWhatsApp,
  IconTelegram,
} from './Icons'
import { exportBackupJSON, importBackupJSON, sendEmailViaResend, sendTestTelegramAlert } from '../services/storage'
import {
  announceNewAppointmentVoice,
  announceUpdateVoice,
  speakWithSiriOrSystemVoice,
  playNotificationChime,
  playUpdateChime,
} from '../services/voiceAssistant'
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

  // Live Email test state
  const [testRecipient, setTestRecipient] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Live Telegram alert test state
  const [isSendingTelegramTest, setIsSendingTelegramTest] = useState(false)
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestTelegram = async () => {
    if (!formData.telegramBotToken?.trim()) {
      setTelegramTestResult({
        success: false,
        message: 'Por favor, introduce el Token de tu Bot de Telegram antes de realizar la prueba.',
      })
      return
    }
    if (!formData.telegramChatId?.trim()) {
      setTelegramTestResult({
        success: false,
        message: 'Por favor, introduce tu Chat ID de Telegram antes de realizar la prueba.',
      })
      return
    }

    setIsSendingTelegramTest(true)
    setTelegramTestResult(null)
    try {
      const res = await sendTestTelegramAlert(formData)
      if (res.ok) {
        setTelegramTestResult({
          success: true,
          message: res.message || '✓ ¡Alerta instantánea (0s) enviada con éxito a tu Telegram!',
        })
      } else {
        setTelegramTestResult({
          success: false,
          message: res.error || 'No se pudo enviar la alerta de prueba a Telegram.',
        })
      }
    } catch (err: any) {
      setTelegramTestResult({
        success: false,
        message: err?.message || 'Error de conexión con el servicio de Telegram.',
      })
    } finally {
      setIsSendingTelegramTest(false)
    }
  }



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

  // Audio, Notification Sound & Siri Voice Controls
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [isTestingSound, setIsTestingSound] = useState(false)
  const [isPlayingSampleAnnouncement, setIsPlayingSampleAnnouncement] = useState(false)
  const [isPlayingUpdateVoiceTest, setIsPlayingUpdateVoiceTest] = useState(false)

  const handleTestVoice = async (testVol?: number) => {
    setIsTestingVoice(true)
    try {
      const vol = testVol !== undefined ? testVol : (formData.voiceVolume ?? 80)
      await speakWithSiriOrSystemVoice(
        'Hola Laura, este es el volumen de voz configurado en GoldBlack Lash.',
        vol
      )
    } finally {
      setIsTestingVoice(false)
    }
  }

  const handleTestNotificationSound = (testVol?: number) => {
    setIsTestingSound(true)
    const vol = testVol !== undefined ? testVol : (formData.notificationSoundVolume ?? 80)
    playNotificationChime(vol)
    setTimeout(() => setIsTestingSound(false), 1200)
  }

  const handleTestAnnouncement = async () => {
    setIsPlayingSampleAnnouncement(true)
    try {
      await announceNewAppointmentVoice(
        {
          clientName: 'Elena Morales',
          serviceName: 'Volumen Ruso',
          clientPhone: '612345678',
          date: new Date().toISOString().split('T')[0],
          time: '17:00',
          notes: 'Preferiblemente por las tardes a partir de las cinco',
        },
        formData.voiceVolume ?? 80
      )
    } finally {
      setIsPlayingSampleAnnouncement(false)
    }
  }

  const handleTestUpdateVoice = async () => {
    setIsPlayingUpdateVoiceTest(true)
    try {
      await announceUpdateVoice(CURRENT_APP_VERSION || '0.7.23', formData.voiceVolume ?? 80)
    } finally {
      setIsPlayingUpdateVoiceTest(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSaveConfig({
        ...formData,
        muteAllNotifications: !!formData.muteAllNotifications,
        voiceAnnounceNewAppointments: formData.voiceAnnounceNewAppointments ?? true,
        voiceAnnounceUpdates: formData.voiceAnnounceUpdates ?? true,
        voiceVolume: Number(formData.voiceVolume ?? 80),
        notificationSoundVolume: Number(formData.notificationSoundVolume ?? 80),
      })
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
    <div className="p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto h-full">
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <IconCheck size={16} />
          <span>¡Ajustes guardados correctamente!</span>
        </div>
      )}

      {importStatus && (
        <div className="p-4 rounded-xl bg-ink-800 border border-gold-500/30 text-gold-300 text-xs flex items-center gap-2">
          <span>{importStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Modo Mantenimiento Card */}
        <div className={`p-6 rounded-2xl border transition-colors duration-200 ${
          formData.maintenanceMode
            ? 'bg-amber-500/[0.07] border-amber-500/40'
            : 'bg-ink-850 border-line'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  formData.maintenanceMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`} />
                <h4 className="font-sans text-base font-semibold tracking-tight text-white uppercase">
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
                  : 'bg-ink-800 text-gray-200 hover:bg-ink-750 border border-gray-700'
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
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />
                <h4 className="font-sans text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
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
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-ink-900 border border-line-strong flex items-center justify-center shadow-inner">
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
              <span className="font-sans text-sm font-bold text-gold-200 block tracking-wide">
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
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-gold-500/10 border-gold-500/50'
                      : 'bg-ink-850 border-line hover:border-line-strong hover:bg-ink-800'
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
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-4">
          <h4 className="font-sans text-base font-bold tracking-tight text-gold-300 uppercase">
            Información del Estudio
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Lema / Subtítulo</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>



            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Teléfono Visible al Público</label>
              <input
                type="text"
                value={formData.phoneDisplay}
                onChange={(e) => setFormData({ ...formData, phoneDisplay: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email de Contacto</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Instagram Handle</label>
              <input
                type="text"
                value={formData.instagramHandle}
                onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-300 mb-1">Dirección del Estudio</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Ciudad / Municipio</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Código Postal</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>
        </div>

        {/* Studio Opening Hours */}
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-4">
          <h4 className="font-sans text-base font-bold tracking-tight text-gold-300 uppercase">
            Horarios de Atención
          </h4>
          <div className="space-y-3">
            {formData.hours.map((h, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-ink-800 border border-line">
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
                    className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white"
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
                    className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-line-strong text-xs text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Email Configuration (Resend + Vercel Domain) */}
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-base font-bold tracking-tight text-gold-300 uppercase flex items-center gap-2">
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
          <div className="p-4 rounded-xl bg-ink-800 border border-line space-y-2.5 text-xs text-gray-300">
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
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-gold-400"
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
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
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
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white focus:outline-none focus:border-gold-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Aquí recibirás una notificación instantánea cada vez que una clienta reserve desde la web.
              </p>
            </div>
          </div>

          {/* Live Test Box */}
          <div className="p-4 rounded-xl bg-ink-850 border border-line space-y-3">
            <label className="block text-xs font-semibold text-gray-300">
              Probar Envío de Correo en Vivo
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Ingresa un correo para recibir la prueba..."
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-400"
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

        {/* Alertas Instantáneas por Telegram Bot (0 segundos) */}
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-950/40 shrink-0">
                <IconTelegram size={22} />
              </div>
              <div>
                <h4 className="font-sans text-base font-semibold tracking-tight text-white flex items-center gap-2 flex-wrap">
                  <span>Alertas Instantáneas por Telegram Bot</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    ⚡ Instantáneo (0s) • 100% Gratis
                  </span>
                </h4>
                <p className="text-xs text-gray-400">
                  Recibe en tu móvil y tu Mac un aviso inmediato en menos de 1 segundo cada vez que una clienta reserve en la web, con tarjeta de diseño en HTML y botón para abrir su WhatsApp.
                </p>
              </div>
            </div>

            {/* Toggle switch for Telegram Alerts */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.telegramAlertsEnabled !== false}
                onChange={(e) =>
                  setFormData({ ...formData, telegramAlertsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ink-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 border border-line"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Token del Bot de Telegram (@BotFather) *
              </label>
              <input
                type="password"
                placeholder="Pega tu token (ej. 1234567890:ABCdefGHI...)"
                value={formData.telegramBotToken || ''}
                onChange={(e) =>
                  setFormData({ ...formData, telegramBotToken: e.target.value.trim() })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-sky-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                El token privado que te entrega @BotFather al crear el bot de tu estudio.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Tu Chat ID de Telegram *
              </label>
              <input
                type="text"
                placeholder="Tu ID numérico (ej. 123456789)"
                value={formData.telegramChatId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, telegramChatId: e.target.value.trim() })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-sky-400"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Tu identificador de usuario en Telegram para que el bot te entregue las alertas a ti.
              </p>
            </div>
          </div>

          {/* Telegram 1-minute setup instructions banner */}
          <div className="p-4 rounded-xl bg-ink-800/80 border border-sky-500/20 text-xs space-y-3 text-gray-300">
            <div className="font-semibold text-sky-400 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span>💡 ¿Cómo configurar tu Bot de Telegram en 1 minuto? (100% Gratis y Privado)</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-300 hover:bg-sky-900/60 font-medium text-[11px] transition-colors"
                >
                  <span>1. Abrir @BotFather</span>
                </a>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-750 border border-line text-gray-300 hover:text-white font-medium text-[11px] transition-colors"
                >
                  <span>2. Abrir @userinfobot</span>
                </a>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] text-gray-300">
              <li>
                <strong>Crea tu Bot:</strong> Abre Telegram, busca a <strong>@BotFather</strong> y pulsa <em>Iniciar</em>. Escríbele <code className="px-1.5 py-0.5 rounded bg-black font-mono text-sky-300">/newbot</code>.
              </li>
              <li>
                <strong>Elige el nombre:</strong> Ponle de nombre <code className="px-1.5 py-0.5 rounded bg-black font-mono text-sky-300">GoldBlack Lash Citas</code> y un usuario que termine en 'bot' (ej. <code className="px-1.5 py-0.5 rounded bg-black font-mono text-sky-300">goldblacklash_citas_bot</code>). @BotFather te responderá con tu <strong>Token</strong>. Pégalo en la casilla de arriba.
              </li>
              <li>
                <strong>Inicia tu Bot y obtén tu Chat ID:</strong> Haz clic en el enlace de tu nuevo bot y pulsa <em>Iniciar</em> (o escribe <code className="px-1.5 py-0.5 rounded bg-black font-mono text-sky-300">/start</code>). Luego habla con <strong>@userinfobot</strong> para ver tu número de <strong>Id</strong> y pégalo en la casilla de Chat ID.
              </li>
            </ol>
          </div>

          {/* Visual Preview of Telegram HTML Card */}
          <div className="p-4 rounded-xl bg-black/40 border border-line space-y-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Vista Previa de la Alerta en Telegram (Tarjeta con HTML y Botones Interactivos):
            </span>
            <div className="p-3.5 rounded-xl bg-[#17212b] border border-line-strong max-w-lg space-y-2 text-xs font-sans text-white shadow-lg">
              <div className="font-bold text-gold-400 flex items-center gap-1.5">
                <span>✨ ¡NUEVA CITA REGISTRADA! — GoldBlack Lash</span>
              </div>
              <div className="border-l-2 border-gold-400 pl-2.5 py-1 text-[11.5px] text-gray-300 space-y-1 bg-white/5 rounded-r-lg">
                <p>👤 <strong>Clienta:</strong> Elena Morales</p>
                <p>💅 <strong>Tratamiento:</strong> Volumen Ruso</p>
                <p>💎 <strong>Detalles:</strong> 55 € • 120 min</p>
                <p>📅 <strong>Fecha y Hora:</strong> <code className="bg-black/50 px-1 py-0.5 rounded text-gold-300 font-mono">2026-09-20 a las 17:00 h</code></p>
                <p>📱 <strong>WhatsApp:</strong> <code className="bg-black/50 px-1 py-0.5 rounded text-emerald-400 font-mono">+34 600 00 00 00</code></p>
              </div>
              <p className="text-[10.5px] text-gray-400 italic">
                ⚡ Recibido al instante en 0 segundos. Pulsa el botón inferior para abrir WhatsApp con la clienta:
              </p>
              <div className="pt-1">
                <div className="w-full px-4 py-2 rounded-lg bg-[#242f3d] text-sky-300 text-center text-xs font-semibold border border-sky-500/30 shadow-sm flex items-center justify-center gap-2">
                  <IconWhatsApp size={16} className="text-emerald-400" />
                  <span>💬 Abrir WhatsApp de la Clienta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Test Box for Telegram */}
          <div className="p-4 rounded-xl bg-ink-800/60 border border-line space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Probar Recepción de Alerta en tu Telegram
              </label>
              <span className="text-[11px] text-gray-500">Envía un mensaje de prueba con HTML y botones</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isSendingTelegramTest}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-950/50 transition-all cursor-pointer active:scale-95"
              >
                <IconTelegram size={16} />
                <span>{isSendingTelegramTest ? 'Enviando Alerta a Telegram...' : 'Enviar Alerta de Prueba a mi Telegram'}</span>
              </button>
            </div>

            {telegramTestResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  telegramTestResult.success
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{telegramTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notificaciones, Sonidos del Sistema y Control de Voz Siri */}
        <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
                <IconVolume2 size={22} />
              </div>
              <div>
                <h4 className="font-sans text-base font-semibold tracking-tight text-white flex items-center gap-2">
                  <span>Notificaciones, Sonido del Sistema y Voz Siri</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/25">
                    Audio &amp; Voz macOS
                  </span>
                </h4>
                <p className="text-xs text-gray-400">
                  Control maestro de volumen, alertas sonoras del sistema y avisos hablados nativos con Siri.
                </p>
              </div>
            </div>

            {formData.muteAllNotifications && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-pulse">
                <IconBellOff size={14} />
                Modo Silencio Activo
              </span>
            )}
          </div>

          <div className="space-y-5">
            {/* Master Silence Toggle */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                formData.muteAllNotifications
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-ink-800 border-line hover:border-line-strong'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      formData.muteAllNotifications
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-ink-900 text-gray-400'
                    }`}
                  >
                    {formData.muteAllNotifications ? <IconBellOff size={20} /> : <IconBell size={20} />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Silenciar Todas las Notificaciones de la Aplicación
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Desactiva todas las campanadas sonoras y las locuciones de voz de Siri en toda la aplicación.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id="muteAllNotificationsToggle"
                    checked={formData.muteAllNotifications ?? false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        muteAllNotifications: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-ink-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 border border-line-strong"></div>
                </label>
              </div>
            </div>

            {/* Sliders Grid: Voice Volume & Sound Volume */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${
                formData.muteAllNotifications ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Voice Volume Slider (Siri) */}
              <div className="p-4 rounded-xl bg-ink-800 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="voiceVolumeSlider" className="text-xs font-semibold text-gray-200 flex items-center gap-2">
                    <IconVolume2 size={16} className="text-gold-400" />
                    <span>Volumen de la Voz (Siri)</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-ink-900 border border-line text-gold-400">
                    {formData.voiceVolume ?? 80}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <IconVolumeX size={16} className="text-gray-500 shrink-0" />
                  <input
                    id="voiceVolumeSlider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.voiceVolume ?? 80}
                    onChange={(e) => {
                      const newVol = Number(e.target.value)
                      setFormData({ ...formData, voiceVolume: newVol })
                    }}
                    className="w-full h-2 bg-ink-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                  <IconVolume2 size={16} className="text-gold-400 shrink-0" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-gray-400">
                    Gradúa el nivel de voz de Siri para los avisos hablados.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTestVoice(formData.voiceVolume ?? 80)}
                    disabled={isTestingVoice || formData.muteAllNotifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-750 border border-gold-500/30 text-gold-300 hover:text-gold-200 font-medium text-[11px] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    <IconVolume2 size={13} />
                    <span>{isTestingVoice ? 'Hablando...' : 'Probar Voz'}</span>
                  </button>
                </div>
              </div>

              {/* System Notification Sound Volume Slider */}
              <div className="p-4 rounded-xl bg-ink-800 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="soundVolumeSlider" className="text-xs font-semibold text-gray-200 flex items-center gap-2">
                    <IconBell size={16} className="text-gold-400" />
                    <span>Sonido de Notificación (Campana)</span>
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-ink-900 border border-line text-gold-400">
                    {formData.notificationSoundVolume ?? 80}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <IconVolumeX size={16} className="text-gray-500 shrink-0" />
                  <input
                    id="soundVolumeSlider"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.notificationSoundVolume ?? 80}
                    onChange={(e) => {
                      const newVol = Number(e.target.value)
                      setFormData({ ...formData, notificationSoundVolume: newVol })
                    }}
                    className="w-full h-2 bg-ink-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                  <IconBell size={16} className="text-gold-400 shrink-0" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-gray-400">
                    Gradúa el volumen del timbre sonoro del sistema de la app.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTestNotificationSound(formData.notificationSoundVolume ?? 80)}
                    disabled={isTestingSound || formData.muteAllNotifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-750 border border-gold-500/30 text-gold-300 hover:text-gold-200 font-medium text-[11px] transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    <IconBell size={13} />
                    <span>{isTestingSound ? 'Sonando...' : 'Probar Sonido'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Siri Voice Specific Announce Controls */}
            <div
              className={`space-y-3 transition-opacity ${
                formData.muteAllNotifications ? 'opacity-50 pointer-events-none' : 'opacity-100'
              }`}
            >
              <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avisos Hablados con Siri (macOS)
              </h5>

              {/* Toggle 1: Announce Received Messages / New Appointments */}
              <div className="p-4 rounded-xl bg-ink-800 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      formData.voiceAnnounceNewAppointments !== false
                        ? 'bg-gold-500/15 text-gold-400'
                        : 'bg-ink-900 text-gray-500'
                    }`}
                  >
                    {formData.voiceAnnounceNewAppointments !== false ? (
                      <IconVolume2 size={16} />
                    ) : (
                      <IconVolumeX size={16} />
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="voiceAnnounceNewAppointments"
                      className="text-xs font-semibold text-white block cursor-pointer"
                    >
                      Anunciar citas y mensajes recibidos de la web con voz Siri
                    </label>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Siri leerá en voz alta el nombre de la clienta, el servicio solicitado, su número de teléfono y comentarios al recibir una reserva en{' '}
                      <code className="text-gold-300/90 font-mono text-[10px]">goldblacklash.com</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleTestAnnouncement}
                    disabled={
                      isPlayingSampleAnnouncement ||
                      formData.muteAllNotifications ||
                      formData.voiceAnnounceNewAppointments === false
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-750 border border-line text-gray-300 hover:text-white font-medium text-[11px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <IconVolume2 size={13} />
                    <span>{isPlayingSampleAnnouncement ? 'Reproduciendo...' : 'Probar Cita'}</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="voiceAnnounceNewAppointments"
                      checked={formData.voiceAnnounceNewAppointments ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          voiceAnnounceNewAppointments: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-ink-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500 border border-line-strong"></div>
                  </label>
                </div>
              </div>

              {/* Toggle 2: Announce Updates */}
              <div className="p-4 rounded-xl bg-ink-800 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      formData.voiceAnnounceUpdates !== false
                        ? 'bg-gold-500/15 text-gold-400'
                        : 'bg-ink-900 text-gray-500'
                    }`}
                  >
                    {formData.voiceAnnounceUpdates !== false ? (
                      <IconVolume2 size={16} />
                    ) : (
                      <IconVolumeX size={16} />
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="voiceAnnounceUpdates"
                      className="text-xs font-semibold text-white block cursor-pointer"
                    >
                      Anunciar actualizaciones del sistema con voz Siri
                    </label>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Siri te avisará con voz natural cuando haya una nueva actualización de la aplicación disponible para instalar:{' '}
                      <span className="text-gold-300 italic">&ldquo;Laura, tienes una nueva actualización disponible...&rdquo;</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleTestUpdateVoice}
                    disabled={
                      isPlayingUpdateVoiceTest ||
                      formData.muteAllNotifications ||
                      formData.voiceAnnounceUpdates === false
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 hover:bg-ink-750 border border-line text-gray-300 hover:text-white font-medium text-[11px] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <IconVolume2 size={13} />
                    <span>{isPlayingUpdateVoiceTest ? 'Reproduciendo...' : 'Probar Actualización'}</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="voiceAnnounceUpdates"
                      checked={formData.voiceAnnounceUpdates ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          voiceAnnounceUpdates: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-ink-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500 border border-line-strong"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-semibold text-xs uppercase tracking-wider transition-colors"
          >
            Guardar Cambios de Configuración
          </button>
        </div>
      </form>

      {/* Real-time Vercel & Supabase Sync Section */}
      <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-sans text-base font-bold tracking-tight text-white flex items-center gap-2">
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

        <div className="p-4 rounded-xl bg-ink-850 border border-line space-y-3">
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
                className="flex-1 px-3.5 py-2 rounded-xl bg-ink-800 border border-line-strong text-xs text-white font-mono"
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
                className="px-4 py-2 rounded-xl bg-ink-750 hover:bg-ink-750 text-xs font-semibold text-gray-200 border border-gray-700/50"
              >
                Probar Conexión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-4">
        <h4 className="font-sans text-base font-bold tracking-tight text-white flex items-center gap-2">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <IconDownload size={16} />
            <span>Descargar Copia de Seguridad (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-800 text-gray-300 border border-gray-700/40 text-xs font-semibold cursor-pointer transition-all">
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
      <div className="p-6 rounded-2xl bg-ink-850 border border-line space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-sans text-base font-bold tracking-tight text-white flex items-center gap-2">
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-750 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <IconRefreshCw size={14} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
            <span>{updateStatus === 'checking' ? 'Buscando en GitHub...' : 'Buscar Actualizaciones'}</span>
          </button>

          <button
            type="button"
            onClick={() => testUpdateNotification()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/15 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Dispara la tira de notificación nativa del sistema de Apple con sonido Glass"
          >
            <span className="text-sm">🔔</span>
            <span>Probar Tira de Notificación en Mac</span>
          </button>
        </div>
      </div>

      {/* System & Architecture Info */}
      <div className="p-6 rounded-2xl bg-ink-900 border border-line space-y-3 text-xs text-gray-400">
        <h5 className="font-sans font-bold tracking-tight text-white text-sm">
          Compatibilidad del Sistema y Versiones
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="p-3 rounded-xl bg-ink-850 border border-line">
            <span className="text-gold-400 font-bold block mb-1">🍏 macOS Monterey (macOS 12.0+)</span>
            <p className="text-gray-400">
              Compatible con macOS 12.0 Monterey y versiones superiores en arquitecturas Intel y Apple Silicon.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-ink-850 border border-line">
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
