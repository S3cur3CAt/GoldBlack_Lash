import React, { createContext, useContext, ReactNode } from 'react'
import { useUpdater, UpdateInfo, UpdateStatus } from '../services/updater'

interface UpdaterContextType {
  status: UpdateStatus
  updateInfo: UpdateInfo | null
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  progress: number
  receivedBytes: number
  totalBytes: number
  errorMessage: string | null
  isSimulated: boolean
  checkUpdates: (manual?: boolean) => Promise<UpdateInfo | null>
  startDownload: () => Promise<void>
  applyAndRestart: () => Promise<void>
  simulateUpdate: (fakeVersion?: string) => void
  testUpdateNotification: (fakeVersion?: string) => void
  dismiss: () => void
}

const UpdaterContext = createContext<UpdaterContextType | null>(null)

export const useUpdaterContext = (): UpdaterContextType => {
  const ctx = useContext(UpdaterContext)
  if (!ctx) {
    throw new Error('useUpdaterContext must be used within an UpdaterProvider')
  }
  return ctx
}

export const UpdaterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const updater = useUpdater()

  return (
    <UpdaterContext.Provider value={updater}>
      {children}
    </UpdaterContext.Provider>
  )
}
