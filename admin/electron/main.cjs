const { app, BrowserWindow, Menu, shell, ipcMain, Notification } = require('electron')
const path = require('path')
const https = require('https')
const { exec, spawn, execSync } = require('child_process')
const fs = require('fs')
const { setupUpdaterIPC } = require('./updater.cjs')

// Set explicit Application User Model ID for Windows 10/11 taskbar icon grouping
if (process.platform === 'win32') {
  app.setAppUserModelId('com.goldblacklash.admin')
}

// Optimize Chromium rendering and network for macOS Monterey & Windows
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
}
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

// Bypass certificate validation errors on macOS for studio backend and Supabase
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (
    url.includes('goldblacklash.com') ||
    url.includes('supabase.co') ||
    url.includes('vercel.app')
  ) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

let mainWindow = null

function createWindow() {
  const isMac = process.platform === 'darwin'
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  const iconPath = path.join(__dirname, iconFile)

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0a0a0d',
    title: 'GoldBlack Lash — Panel de Administración',
    icon: iconPath,
    show: true,
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : undefined,
    trafficLightPosition: isMac ? { x: 14, y: 11 } : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  })

  // Set macOS dock icon dynamically if supported
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(path.join(__dirname, 'icon.png'))
    } catch (e) {
      console.warn('Could not set dock icon dynamically:', e.message)
    }
  }

  // Load the built production frontend
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
  mainWindow.loadFile(indexPath)

  // Developer mode: F12 / Ctrl+Shift+I toggles DevTools (app menu is hidden on Windows)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.type === 'keyDown' &&
      (input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i'))
    ) {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  // Open DevTools automatically (detached) when launched with GB_DEVTOOLS=1
  if (process.env.GB_DEVTOOLS === '1') {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    })
  }

  // Show gracefully when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Clear dock notification badge on window focus
  mainWindow.on('focus', () => {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setBadge('')
    }
  })

  // Auto-bloqueo al minimizar o esconder la ventana (Windows y macOS)
  mainWindow.on('minimize', () => {
    mainWindow?.webContents?.send('app:lock')
  })
  mainWindow.on('hide', () => {
    mainWindow?.webContents?.send('app:lock')
  })

  // Initialize auto-updater IPC
  setupUpdaterIPC(mainWindow)

  // Handle media/microphone permissions automatically for Voice Assistant
  if (mainWindow.webContents.session && mainWindow.webContents.session.setPermissionRequestHandler) {
    mainWindow.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media' || permission === 'microphone') {
        callback(true)
      } else {
        callback(true)
      }
    })
  }

  // Open external links (like WhatsApp desktop app, mailto, tel, browser) safely
  if (mainWindow.webContents.setWindowOpenHandler) {
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (
        url.startsWith('https:') ||
        url.startsWith('http:') ||
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('whatsapp:')
      ) {
        shell.openExternal(url).catch((err) => {
          console.warn('[openExternal Warning]', err)
        })
        return { action: 'deny' }
      }
      return { action: 'allow' }
    })
  } else {
    // Electron < 12 fallback
    mainWindow.webContents.on('new-window', (event, url) => {
      if (
        url.startsWith('https:') ||
        url.startsWith('http:') ||
        url.startsWith('mailto:') ||
        url.startsWith('tel:') ||
        url.startsWith('whatsapp:')
      ) {
        event.preventDefault()
        shell.openExternal(url).catch((err) => {
          console.warn('[openExternal Warning]', err)
        })
      }
    })
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  createApplicationMenu()
}

function createApplicationMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac
      ? [
          {
            label: 'GoldBlack Lash',
            submenu: [
              { role: 'about', label: 'Acerca de GoldBlack Lash Admin' },
              { type: 'separator' },
              { role: 'services', label: 'Servicios' },
              { type: 'separator' },
              { role: 'hide', label: 'Ocultar' },
              { role: 'hideothers', label: 'Ocultar otros' },
              { role: 'unhide', label: 'Mostrar todos' },
              { type: 'separator' },
              { role: 'quit', label: 'Salir' },
            ],
          },
        ]
      : []),
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nueva Cita',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('action:new-appointment')
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Cerrar ventana' } : { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño real' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Reducir zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Sitio Web Oficial',
          click: async () => {
            await shell.openExternal('https://goldblacklash.com')
          },
        },
        {
          label: 'Correo de Soporte',
          click: async () => {
            await shell.openExternal('mailto:citas@goldblacklash.com')
          },
        },
      ],
    },
  ]

  if (isMac) {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  } else {
    Menu.setApplicationMenu(null)
  }
}

// Window controls IPC
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

// Safe external application launcher for WhatsApp Desktop (macOS/Win), browsers, etc.
ipcMain.handle('shell:open-external', async (_event, url) => {
  try {
    if (!url || typeof url !== 'string') {
      return { ok: false, error: 'URL no válida' }
    }
    const trimmed = url.trim()
    console.log('[shell:open-external] Opening URL:', trimmed.substring(0, 50))
    await shell.openExternal(trimmed)
    return { ok: true }
  } catch (err) {
    console.error('[shell:open-external Error]', err)
    return { ok: false, error: err?.message || 'Error al abrir aplicación' }
  }
})

// Visual and sound notification for new real-time appointment
ipcMain.on('notification:appointment', (_event, data) => {
  try {
    if (process.platform === 'darwin' && app.dock) {
      app.dock.bounce('informational')
    }

    if (Notification.isSupported()) {
      const notif = new Notification({
        title: data?.title || 'GoldBlack Lash — Nueva Cita Recibida',
        body: data?.body || 'Una clienta ha registrado una nueva reserva.',
        icon: path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
        silent: false,
      })

      notif.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
          mainWindow.webContents.send('navigate:tab', 'appointments')
        }
      })

      notif.show()
    }
  } catch (err) {
    console.warn('[Notification Error]', err)
  }
})

// ── Native macOS Siri Speech Synthesis (Alertas de Citas y Actualizaciones) ──
let currentSayProcess = null

ipcMain.handle('voice:speak-siri', async (_event, payload) => {
  if (process.platform !== 'darwin' || !payload) return false

  const text = typeof payload === 'object' && payload !== null ? payload.text : payload
  const volume = typeof payload === 'object' && payload !== null && typeof payload.volume === 'number'
    ? Math.max(0, Math.min(1, payload.volume / 100))
    : 1

  if (volume <= 0) return true

  return new Promise((resolve) => {
    try {
      if (currentSayProcess) {
        try { currentSayProcess.kill('SIGKILL') } catch {}
        currentSayProcess = null
      }

      const cleanText = String(text || '').trim()
      if (!cleanText) {
        resolve(false)
        return
      }

      // Apple Speech Synthesis Manager supports [[volm <float>]] from 0.0 to 1.0
      const textWithVol = volume < 1 ? `[[volm ${volume.toFixed(2)}]] ${cleanText}` : cleanText
      const escaped = textWithVol.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const osaProc = spawn('/usr/bin/osascript', ['-e', `say "${escaped}"`])
      currentSayProcess = osaProc

      let hasExited = false
      const onFinishSpeech = (success) => {
        if (hasExited) return
        hasExited = true
        currentSayProcess = null
        resolve(success)
      }

      osaProc.on('close', (code) => {
        if (code === 0) {
          onFinishSpeech(true)
        } else {
          const sayProc = spawn('/usr/bin/say', [textWithVol])
          currentSayProcess = sayProc
          sayProc.on('close', (c) => onFinishSpeech(c === 0))
          sayProc.on('error', () => onFinishSpeech(false))
        }
      })
      osaProc.on('error', () => {
        const sayProc = spawn('/usr/bin/say', [textWithVol])
        currentSayProcess = sayProc
        sayProc.on('close', (c) => onFinishSpeech(c === 0))
        sayProc.on('error', () => onFinishSpeech(false))
      })
    } catch (err) {
      currentSayProcess = null
      resolve(false)
    }
  })
})

ipcMain.handle('voice:stop-siri', async () => {
  if (currentSayProcess) {
    try { currentSayProcess.kill('SIGKILL') } catch {}
    currentSayProcess = null
  }
  return true
})

app.whenReady().then(async () => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

