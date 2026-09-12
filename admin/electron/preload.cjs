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
  // Auto-Updater from GitHub Releases
  checkForUpdates: (currentVersion) => ipcRenderer.invoke('updater:check', currentVersion),
  downloadUpdate: (url, assetName) => ipcRenderer.invoke('updater:download', { url, assetName }),
  installUpdate: (filePath) => ipcRenderer.invoke('updater:install', { filePath }),
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('updater:progress', handler)
    return () => ipcRenderer.removeListener('updater:progress', handler)
  },
})
