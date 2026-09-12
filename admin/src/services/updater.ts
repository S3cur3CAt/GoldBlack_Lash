import { useState, useEffect, useCallback, useRef } from 'react'

export interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion: string
  releaseName?: string
  notes?: string
  publishedAt?: string
  assetUrl?: string | null
  assetName?: string | null
  assetSize?: number
  htmlUrl?: string
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

export const CURRENT_APP_VERSION = '0.0.8'
export const GITHUB_REPO = 'S3cur3CAt/GoldBlack_Lash'



export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState(0)
  const [receivedBytes, setReceivedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSimulated, setIsSimulated] = useState(false)
  const filePathRef = useRef<string | null>(null)
  const simulationTimerRef = useRef<any>(null)

  // Listen for real progress from Electron main process
  useEffect(() => {
    if (window.electronAPI?.onUpdateProgress) {
      const unsubscribe = window.electronAPI.onUpdateProgress((data) => {
        setProgress(data.percent || 0)
        setReceivedBytes(data.receivedBytes || 0)
        setTotalBytes(data.totalBytes || 0)
      })
      return () => {
        unsubscribe?.()
      }
    }
  }, [])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current)
      }
    }
  }, [])

  const statusRef = useRef<UpdateStatus>('idle')
  statusRef.current = status

  const checkUpdates = useCallback(async (manual = false): Promise<UpdateInfo | null> => {
    // Never interrupt an ongoing download or ready installation
    if (statusRef.current === 'downloading' || statusRef.current === 'downloaded') {
      return null
    }

    if (manual) {
      setStatus('checking')
      setErrorMessage(null)
    }

    try {
      if (window.electronAPI?.checkForUpdates) {
        const result = await window.electronAPI.checkForUpdates(CURRENT_APP_VERSION)
        if (result && result.available) {
          setUpdateInfo(result)
          setStatus('available')
          setIsSimulated(false)
          return result
        } else {
          if (statusRef.current !== 'available') {
            setStatus('idle')
            setUpdateInfo(null)
          }
          return null
        }
      } else {
        // Web / Dev fallback: Query GitHub API directly
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        })
        if (res.status === 200) {
          const release = await res.json()
          const tag = release.tag_name || ''
          const isNewer = compareSemver(tag, CURRENT_APP_VERSION)
          const validAsset = release.assets?.find(
            (a: any) =>
              a.name?.endsWith('.exe') &&
              (a.state === 'uploaded' || a.state === undefined) &&
              (a.size ? a.size > 1000000 : false)
          )
          if (isNewer && validAsset && validAsset.browser_download_url) {
            const info: UpdateInfo = {
              available: true,
              currentVersion: CURRENT_APP_VERSION,
              latestVersion: tag,
              releaseName: release.name || tag,
              notes: release.body || '',
              assetUrl: validAsset.browser_download_url,
              assetName: validAsset.name || `${tag}-update.exe`,
              assetSize: validAsset.size || 0,
              htmlUrl: release.html_url,
            }
            setUpdateInfo(info)
            setStatus('available')
            setIsSimulated(false)
            return info
          }
        }
        if (statusRef.current !== 'available') {
          setStatus('idle')
          setUpdateInfo(null)
        }
        return null
      }
    } catch (err: any) {
      if (manual) {
        console.warn('[Updater check error]:', err)
        setStatus('error')
        setErrorMessage(err.message || 'Error comprobando actualizaciones')
      }
      return null
    }
  }, [])

  const startDownload = useCallback(async () => {
    if (!updateInfo) return

    setStatus('downloading')
    setProgress(0)
    setReceivedBytes(0)
    setTotalBytes(updateInfo.assetSize || 0)
    setErrorMessage(null)

    if (isSimulated || !window.electronAPI?.downloadUpdate || !updateInfo.assetUrl) {
      // Realistic simulation mode (e.g. for testing before GitHub release is published)
      let currentPercent = 0
      const totalSimulatedBytes = updateInfo.assetSize || 104857600 // ~100MB
      setTotalBytes(totalSimulatedBytes)

      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = setInterval(() => {
        currentPercent += Math.floor(Math.random() * 8) + 4
        if (currentPercent >= 100) {
          currentPercent = 100
          clearInterval(simulationTimerRef.current)
          setProgress(100)
          setReceivedBytes(totalSimulatedBytes)
          setStatus('downloaded')
        } else {
          setProgress(currentPercent)
          setReceivedBytes(Math.round((currentPercent / 100) * totalSimulatedBytes))
        }
      }, 200)
      return
    }

    // Real Electron download
    try {
      const result = await window.electronAPI.downloadUpdate(updateInfo.assetUrl, updateInfo.assetName || 'update.exe')
      if (result.success) {
        filePathRef.current = result.filePath
        setProgress(100)
        setStatus('downloaded')
      } else {
        throw new Error('Fallo al completar la descarga')
      }
    } catch (err: any) {
      console.error('[Download error]:', err)
      setStatus('error')
      setErrorMessage(err.message || 'Error durante la descarga')
    }
  }, [updateInfo, isSimulated])

  const applyAndRestart = useCallback(async () => {
    if (isSimulated || !window.electronAPI?.installUpdate) {
      // In simulation or dev web mode, simulate restart
      window.location.reload()
      return
    }

    try {
      await window.electronAPI.installUpdate(filePathRef.current || undefined)
    } catch (err: any) {
      console.error('[Install error]:', err)
      alert(`Error al reiniciar: ${err.message}`)
    }
  }, [isSimulated])

  const simulateUpdate = useCallback((fakeVersion = 'v1.0.1') => {
    setIsSimulated(true)
    setUpdateInfo({
      available: true,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: fakeVersion,
      releaseName: `GoldBlack Lash Admin ${fakeVersion}`,
      notes: 'Mejoras de rendimiento, sincronización automática con Neon y correcciones visuales.',
      assetName: `GoldBlack-Lash-Admin-Setup-${fakeVersion.replace(/^v/, '')}.exe`,
      assetSize: 101655309, // ~97 MB installer
    })
    setStatus('available')
    setProgress(0)
  }, [])

  const dismiss = useCallback(() => {
    setStatus('idle')
  }, [])

  // Auto-check on mount and poll every 5 seconds (5000 ms)
  useEffect(() => {
    // Initial check shortly after load
    const initialTimer = setTimeout(() => {
      checkUpdates(false)
    }, 1500)

    // Periodic check every 5 seconds
    const interval = setInterval(() => {
      checkUpdates(false)
    }, 5000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [checkUpdates])

  return {
    status,
    updateInfo,
    progress,
    receivedBytes,
    totalBytes,
    errorMessage,
    isSimulated,
    checkUpdates,
    startDownload,
    applyAndRestart,
    simulateUpdate,
    dismiss,
  }
}

function compareSemver(latest: string, current: string): boolean {
  const cleanL = latest.replace(/^v/i, '').trim()
  const cleanC = current.replace(/^v/i, '').trim()
  const partsL = cleanL.split('.').map((n) => parseInt(n, 10) || 0)
  const partsC = cleanC.split('.').map((n) => parseInt(n, 10) || 0)

  for (let i = 0; i < Math.max(partsL.length, partsC.length); i++) {
    const l = partsL[i] || 0
    const c = partsC[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}
