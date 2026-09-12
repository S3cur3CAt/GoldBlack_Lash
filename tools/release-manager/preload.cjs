const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('publisherAPI', {
  platform: process.platform,
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  openExternal: (url) => shell.openExternal(url),

  // Config & Info
  getAdminVersion: () => ipcRenderer.invoke('publisher:get-admin-version'),
  setVersion: (version) => ipcRenderer.invoke('publisher:set-version', { version }),
  checkGitHub: (token) => ipcRenderer.invoke('publisher:check-github', { token }),
  findInstallers: () => ipcRenderer.invoke('publisher:find-installers'),
  selectInstallerFile: () => ipcRenderer.invoke('publisher:select-installer-file'),
  saveToken: (token) => ipcRenderer.invoke('publisher:save-token', { token }),
  loadToken: () => ipcRenderer.invoke('publisher:load-token'),

  // Build
  buildInstaller: (opts) => ipcRenderer.invoke('publisher:build-installer', opts),
  onBuildLog: (callback) => {
    const handler = (_event, line) => callback(line)
    ipcRenderer.on('publisher:build-log', handler)
    return () => ipcRenderer.removeListener('publisher:build-log', handler)
  },

  // Publish
  publishRelease: (payload) => ipcRenderer.invoke('publisher:publish-release', payload),
  onUploadProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('publisher:upload-progress', handler)
    return () => ipcRenderer.removeListener('publisher:upload-progress', handler)
  },
})
