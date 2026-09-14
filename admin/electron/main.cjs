const { app, BrowserWindow, Menu, shell, ipcMain, Notification, systemPreferences } = require('electron')
const path = require('path')
const https = require('https')
const { exec, spawn } = require('child_process')
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

let currentSayProcess = null
let currentListenProcess = null
let isContinuousListeningActive = false
let isSpeaking = false
let listenerRestartTimer = null

function ensureNativeListenerRunning() {
  if (process.platform !== 'darwin') return Promise.resolve({ supported: false })
  if (isSpeaking) {
    return Promise.resolve({ supported: true, paused: true })
  }
  if (currentListenProcess && !currentListenProcess.killed) {
    try {
      currentListenProcess.stdin.write('RESUME\n')
    } catch {}
    return Promise.resolve({ supported: true })
  }
  return spawnNativeListener()
}

function stopNativeListener() {
  isContinuousListeningActive = false
  if (listenerRestartTimer) {
    clearTimeout(listenerRestartTimer)
    listenerRestartTimer = null
  }
  if (currentListenProcess) {
    try {
      currentListenProcess.stdin.write('QUIT\n')
      currentListenProcess.kill('SIGTERM')
    } catch {}
    currentListenProcess = null
  }
}

function resumeListeningAfterSpeech() {
  if (listenerRestartTimer) {
    clearTimeout(listenerRestartTimer)
    listenerRestartTimer = null
  }
  // Wait 500ms after speech stops to allow acoustic room decay (avoid microphone feedback)
  setTimeout(() => {
    isSpeaking = false
    if (isContinuousListeningActive) {
      if (currentListenProcess && !currentListenProcess.killed) {
        try {
          currentListenProcess.stdin.write('RESUME\n')
        } catch {
          spawnNativeListener().catch(() => {})
        }
      } else {
        spawnNativeListener().catch(() => {})
      }
    }
  }, 500)
}

function spawnNativeListener() {
  if (process.platform !== 'darwin') return Promise.resolve({ supported: false })
  if (isSpeaking) {
    return Promise.resolve({ supported: true, paused: true })
  }

  const swiftPath = '/usr/bin/swift'
  let scriptPath = path.join(__dirname, 'speech-listener.swift')

  // If inside asar archive, extract to real disk location in userData
  try {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8')
    const diskPath = path.join(app.getPath('userData'), 'speech-listener.swift')
    fs.writeFileSync(diskPath, scriptContent, 'utf8')
    scriptPath = diskPath
  } catch (extractErr) {
    console.warn('[Swift Script Extract Warning]', extractErr?.message || extractErr)
  }

  if (currentListenProcess) {
    try { currentListenProcess.kill('SIGTERM') } catch {}
    currentListenProcess = null
  }

  return new Promise((resolve) => {
    try {
      const proc = spawn(swiftPath, [scriptPath])
      currentListenProcess = proc

      let started = false

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('TRANSCRIPT:')) {
            const text = trimmed.substring(11).trim()
            mainWindow?.webContents.send('voice:native-transcript', text)
          } else if (trimmed.startsWith('FINAL:')) {
            const text = trimmed.substring(6).trim()
            mainWindow?.webContents.send('voice:native-result', text)
          }
        }
      })

      proc.stderr.on('data', (data) => {
        const text = data.toString().trim()
        if (text.includes('LISTENING_READY')) {
          if (!started) {
            started = true
            resolve({ supported: true })
          }
        } else if (text.includes('ERROR_NOT_AUTHORIZED')) {
          console.warn('[macOS Speech Recognition] No autorizado.')
          isContinuousListeningActive = false
          if (!started) {
            started = true
            resolve({ supported: false, error: 'not_authorized' })
          }
        }
      })

      proc.on('close', () => {
        currentListenProcess = null
        if (!started) {
          started = true
          resolve({ supported: false })
        }
        // Auto-restart supervisor if continuous listening is enabled and Siri is not speaking
        if (isContinuousListeningActive && !isSpeaking) {
          if (listenerRestartTimer) clearTimeout(listenerRestartTimer)
          listenerRestartTimer = setTimeout(() => {
            if (isContinuousListeningActive && !isSpeaking) {
              spawnNativeListener().catch(() => {})
            }
          }, 800)
        }
      })

      proc.on('error', (err) => {
        console.warn('[Native Speech Spawn Error]', err?.message || err)
        currentListenProcess = null
        if (!started) {
          started = true
          resolve({ supported: false, error: err?.message })
        }
      })
    } catch (e) {
      console.warn('[Native Speech Exception]', e)
      currentListenProcess = null
      if (!started) {
        started = true
        resolve({ supported: false, error: e?.message })
      }
    }
  })
}

// Native macOS Monterey Siri Speech Synthesis via osascript / Apple 'say' engine
// In macOS Monterey, osascript 'say' executes in the GUI session using the exact
// System Voice selected in System Preferences > Accessibility > Spoken Content (Siri)
ipcMain.handle('voice:speak-siri', async (_event, text) => {
  if (process.platform !== 'darwin' || !text) return false

  // Pause native listener so Siri does NOT hear her own speech
  isSpeaking = true
  if (currentListenProcess && !currentListenProcess.killed) {
    try {
      currentListenProcess.stdin.write('PAUSE\n')
    } catch {}
  }

  return new Promise((resolve) => {
    try {
      // Kill previous speech if still speaking
      if (currentSayProcess) {
        try {
          currentSayProcess.kill('SIGKILL')
        } catch {}
        currentSayProcess = null
      }

      const cleanText = String(text).trim()
      if (!cleanText) {
        resumeListeningAfterSpeech()
        resolve(false)
        return
      }

      const escaped = cleanText.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

      // 1. First priority: osascript 'say' (uses the active Siri voice set in Accessibility)
      const osaProc = spawn('/usr/bin/osascript', ['-e', `say "${escaped}"`])
      currentSayProcess = osaProc

      let hasExited = false

      const onFinishSpeech = (success) => {
        if (hasExited) return
        hasExited = true
        currentSayProcess = null
        resumeListeningAfterSpeech()
        resolve(success)
      }

      osaProc.on('close', (code) => {
        if (code === 0) {
          onFinishSpeech(true)
        } else {
          // Fallback to /usr/bin/say if osascript returned non-zero
          const sayProc = spawn('/usr/bin/say', [cleanText])
          currentSayProcess = sayProc
          sayProc.on('close', (c) => onFinishSpeech(c === 0))
          sayProc.on('error', () => onFinishSpeech(false))
        }
      })

      osaProc.on('error', (err) => {
        console.warn('[osascript error, falling back to /usr/bin/say]', err?.message || err)
        const sayProc = spawn('/usr/bin/say', [cleanText])
        currentSayProcess = sayProc
        sayProc.on('close', (c) => onFinishSpeech(c === 0))
        sayProc.on('error', () => onFinishSpeech(false))
      })
    } catch (err) {
      console.warn('[macOS Say Exception]', err?.message || err)
      currentSayProcess = null
      resumeListeningAfterSpeech()
      resolve(false)
    }
  })
})

ipcMain.handle('voice:stop-siri', async () => {
  if (currentSayProcess) {
    try {
      currentSayProcess.kill('SIGKILL')
    } catch {}
    currentSayProcess = null
  }
  resumeListeningAfterSpeech()
  return true
})

// Native macOS Siri Speech Recognition via Apple Speech framework & Swift (0€ / 0 APIs)
ipcMain.handle('voice:native-listen-start', async () => {
  isContinuousListeningActive = true
  return ensureNativeListenerRunning()
})

ipcMain.handle('voice:native-listen-stop', async () => {
  stopNativeListener()
  return true
})

ipcMain.handle('voice:native-listen-continuous-start', async () => {
  isContinuousListeningActive = true
  return ensureNativeListenerRunning()
})

ipcMain.handle('voice:native-listen-continuous-stop', async () => {
  stopNativeListener()
  return true
})

// Cloudflare Workers AI with Qwen 30B (qwen3-30b-a3b-fp8)
const CLOUDFLARE_DEFAULT_ACCOUNT_ID = 'e50e9c769ca5ff44a69201c51445cb28'
const CLOUDFLARE_DEFAULT_API_TOKEN = Buffer.from(
  'Y2Z1dF9WNXBWcFp0a3NkZHhXQ0U1Y2FOR3ZQS1dDUnlPaDMzaWpTc1RySVo2OWFiYWY0NGY=',
  'base64'
).toString('utf8')
const CLOUDFLARE_DEFAULT_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8'

ipcMain.handle('ai:cloudflare-run', async (_event, params = {}) => {
  const accountId = params.accountId || CLOUDFLARE_DEFAULT_ACCOUNT_ID
  const apiToken = params.apiToken || CLOUDFLARE_DEFAULT_API_TOKEN
  const model = params.model || CLOUDFLARE_DEFAULT_MODEL
  const messages = params.messages || []

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url)
      const postData = JSON.stringify({ messages })

      const req = https.request(
        {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
          timeout: 25000,
        },
        (res) => {
          let rawData = ''
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            try {
              const json = JSON.parse(rawData)
              if (json.success && json.result) {
                const responseText =
                  json.result.response || json.result.choices?.[0]?.message?.content || ''
                resolve({ success: true, text: responseText, result: json.result })
              } else {
                resolve({
                  success: false,
                  error:
                    json.errors?.[0]?.message || 'Error en respuesta de Cloudflare Workers AI',
                  raw: json,
                })
              }
            } catch (err) {
              resolve({
                success: false,
                error: 'Error al parsear respuesta JSON de Cloudflare: ' + err.message,
              })
            }
          })
        }
      )

      req.on('error', (e) => {
        resolve({ success: false, error: e.message })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          success: false,
          error: 'Tiempo de espera agotado con Cloudflare Workers AI (25s)',
        })
      })

      req.write(postData)
      req.end()
    } catch (e) {
      resolve({ success: false, error: e.message })
    }
  })
})

app.whenReady().then(() => {
  // Proactively check/request microphone access on macOS Monterey & above
  if (process.platform === 'darwin' && systemPreferences && systemPreferences.askForMediaAccess) {
    try {
      // First check current status
      const micStatus = systemPreferences.getMediaAccessStatus('microphone')
      console.log('[macOS Mic Permission] Estado actual:', micStatus)

      if (micStatus !== 'granted') {
        console.log('[macOS Mic Permission] Solicitando permiso de micrófono...')
        systemPreferences.askForMediaAccess('microphone').then((granted) => {
          console.log('[macOS Mic Permission] Micrófono autorizado:', granted)
          if (!granted) {
            console.error('[macOS Mic Permission] ❌ PERMISO DENEGADO. La detección de voz NO funcionará.')
            console.error('[macOS Mic Permission] Ve a Preferencias del Sistema > Seguridad y Privacidad > Privacidad > Micrófono')
          }
        }).catch((err) => {
          console.warn('[macOS Mic Permission Warning]', err?.message || err)
        })
      } else {
        console.log('[macOS Mic Permission] ✅ Micrófono ya autorizado')
      }
    } catch (e) {
      console.warn('[macOS Mic Permission Error]', e?.message || e)
    }
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  stopNativeListener()
})

