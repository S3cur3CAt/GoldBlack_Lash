/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    platform: string
    isElectron: boolean
    onNewAppointmentAction: (callback: () => void) => void
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    checkForUpdates?: (currentVersion: string) => Promise<any>
    downloadUpdate?: (url: string, assetName: string) => Promise<{ success: boolean; filePath: string }>
    installUpdate?: (filePath?: string) => Promise<{ success: boolean }>
    onUpdateProgress?: (callback: (data: { percent: number; receivedBytes: number; totalBytes: number }) => void) => () => void
  }
}
