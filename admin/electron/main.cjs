const { app, BrowserWindow, Menu, shell, ipcMain, Notification } = require('electron')
const path = require('path')
const { setupUpdaterIPC } = require('./updater.cjs')

// Set explicit Application User Model ID for Windows 10/11 taskbar icon grouping
if (process.platform === 'win32') {
  app.setAppUserModelId('com.goldblacklash.admin')
}

// Optimize Chromium rendering for macOS Monterey
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
}

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
      webSecurity: true,
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

  // Show gracefully when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Initialize auto-updater IPC
  setupUpdaterIPC(mainWindow)

  // Open external links (like email mailto, Instagram, Maps) in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
