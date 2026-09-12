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
})
