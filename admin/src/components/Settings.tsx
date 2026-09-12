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
} from './Icons'
import { exportBackupJSON, importBackupJSON, sendEmailViaResend } from '../services/storage'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSaveConfig(formData)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
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
                defaultValue={localStorage.getItem('goldblack_admin_api_url') || 'https://goldblacklash.vercel.app'}
                onChange={(e) => localStorage.setItem('goldblack_admin_api_url', e.target.value.trim())}
                placeholder="https://goldblacklash.vercel.app"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#1c1c28] border border-[#2b2b3d] text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  const url = localStorage.getItem('goldblack_admin_api_url') || 'https://goldblacklash.vercel.app'
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
