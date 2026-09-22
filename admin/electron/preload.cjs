const { contextBridge, ipcRenderer } = require('electron')

// Expose safe platform APIs and window controls to React app
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  onNewAppointmentAction: (callback) => {
    ipcRenderer.on('action:new-appointment', () => callback())
  },
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  // Real-time notifications (macOS / Win)
  notifyNewAppointment: (data) => ipcRenderer.send('notification:appointment', data),
  notifyUpdateAvailable: (data) => ipcRenderer.send('notification:update-available', data),
  clearDockBadge: () => ipcRenderer.send('dock:clear-badge'),
  onNavigateTab: (callback) => {
    const handler = (_event, tab) => callback(tab)
    ipcRenderer.on('navigate:tab', handler)
    return () => ipcRenderer.removeListener('navigate:tab', handler)
  },
  // Auto-Updater from GitHub Releases
  checkForUpdates: (currentVersion) => ipcRenderer.invoke('updater:check', currentVersion),
  downloadUpdate: (url, assetName) => ipcRenderer.invoke('updater:download', { url, assetName }),
  installUpdate: (filePath) => ipcRenderer.invoke('updater:install', { filePath }),
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  },
  // Native macOS Siri Speech Synthesis for website alerts
  speakWithSiri: (text, volume) => ipcRenderer.invoke('voice:speak-siri', typeof text === 'object' ? text : { text, volume }),
  stopSiri: () => ipcRenderer.invoke('voice:stop-siri'),
  // Launch native external apps (WhatsApp Desktop, Safari, mailto)
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  // Auto-lock when window is minimized in Windows or macOS
  onAppLock: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('app:lock', handler)
    return () => ipcRenderer.removeListener('app:lock', handler)
  },
})
