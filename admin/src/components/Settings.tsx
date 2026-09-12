import React, { useState } from 'react'
import { useDialog } from '../context/DialogContext'
import { StudioConfig } from '../types/admin'
import {
  IconSettings,
  IconDownload,
  IconUpload,
  IconCheck,
  IconWhatsApp,
  IconAlertCircle,
} from './Icons'
import { exportBackupJSON, importBackupJSON } from '../services/storage'

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
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                WhatsApp Oficial (formato internacional, ej. 34604187676)
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
