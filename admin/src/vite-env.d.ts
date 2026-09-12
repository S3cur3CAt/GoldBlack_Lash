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
  }
}
