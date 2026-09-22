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
    notifyNewAppointment?: (data: { title: string; body: string }) => void
    notifyUpdateAvailable?: (data: any) => void
    clearDockBadge?: () => void
    onNavigateTab?: (callback: (tab: string) => void) => () => void
    checkForUpdates?: (currentVersion: string) => Promise<any>
    downloadUpdate?: (url: string, assetName: string) => Promise<{ success: boolean; filePath: string }>
    installUpdate?: (filePath?: string) => Promise<{ success: boolean }>
    onUpdateProgress?: (callback: (data: { percent: number; receivedBytes: number; totalBytes: number }) => void) => () => void
    speakWithSiri?: (text: string | { text: string; volume?: number }, volume?: number) => Promise<boolean>
    stopSiri?: () => Promise<void>
    openExternal?: (url: string) => Promise<{ ok: boolean; error?: string }>
    onAppLock?: (callback: () => void) => () => void
  }
}
