const { contextBridge, ipcRenderer } = require('electron')

// Expose safe platform APIs to React app
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onNewAppointmentAction: (callback) => {
    ipcRenderer.on('action:new-appointment', () => callback())
  },
})
