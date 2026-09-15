const { app, BrowserWindow, Menu, shell, ipcMain, Notification, systemPreferences } = require('electron')
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

// Forward diagnostic logs to renderer so they show in DevTools console
function logToRenderer(level, ...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
  try { mainWindow?.webContents.send('voice:diagnostic', { level, msg }) } catch {}
  if (level === 'error') console.error(...args)
  else if (level === 'warn') console.warn(...args)
  else console.log(...args)
}

function sendListenerCommand(cmd) {
  if (!currentListenProcess || currentListenProcess.killed) return false
  try {
    currentListenProcess.stdin.write(cmd + '\n')
    return true
  } catch (e) {
    logToRenderer('warn', '[Sofi] Error stdin:', e?.message)
    return false
  }
}

function pauseListener() {
  if (sendListenerCommand('PAUSE')) {
    logToRenderer('info', '[Sofi] ⏸️ Listener pausado')
  }
}

function resumeListener() {
  if (sendListenerCommand('RESUME')) {
    logToRenderer('info', '[Sofi] ▶️ Listener reanudado')
  } else if (isContinuousListeningActive) {
    logToRenderer('info', '[Sofi] Proceso muerto, relanzando...')
    spawnNativeListener().catch(() => {})
  }
}

function stopNativeListener() {
  isContinuousListeningActive = false
  if (listenerRestartTimer) {
    clearTimeout(listenerRestartTimer)
    listenerRestartTimer = null
  }
  if (currentListenProcess) {
    sendListenerCommand('QUIT')
    setTimeout(() => {
      if (currentListenProcess) {
        try { currentListenProcess.kill('SIGTERM') } catch {}
        currentListenProcess = null
      }
    }, 500)
  }
}

// ── Sofi Helper App Bundle Configuration & Compilation ─────────────────────
const SOFI_HELPER_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.goldblacklash.sofilistener</string>
    <key>CFBundleName</key>
    <string>SofiListener</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>SofiListener</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSBackgroundOnly</key>
    <true/>
    <key>LSUIElement</key>
    <true/>
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>GoldBlack Lash requiere reconocimiento de voz nativo de Siri/Apple para el asistente Sofi («Oye Sofi» manos libres).</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>GoldBlack Lash requiere acceso al micrófono para el control por voz del asistente Sofi.</string>
</dict>
</plist>
`

function getNativeAppBundlePaths() {
  const userDataDir = app.getPath('userData')
  const appBundleDir = path.join(userDataDir, 'SofiListener.app')
  const contentsDir = path.join(appBundleDir, 'Contents')
  const macosDir = path.join(contentsDir, 'MacOS')
  const binaryPath = path.join(macosDir, 'SofiListener')
  const infoPlistPath = path.join(contentsDir, 'Info.plist')
  const swiftSrcPath = path.join(userDataDir, 'speech-listener.swift')
  return { userDataDir, appBundleDir, contentsDir, macosDir, binaryPath, infoPlistPath, swiftSrcPath }
}

let nativeBinaryReady = false
let consecutiveCrashes = 0
let lastSpawnTime = 0

async function ensureNativeListenerBinary() {
  if (process.platform !== 'darwin') {
    return { supported: false, error: 'not_darwin' }
  }

  const paths = getNativeAppBundlePaths()

  try {
    fs.mkdirSync(paths.macosDir, { recursive: true })
    fs.writeFileSync(paths.infoPlistPath, SOFI_HELPER_PLIST, 'utf8')
  } catch (e) {
    logToRenderer('error', '[Sofi Bundle] Error creando bundle directories:', e?.message)
  }

  // Extract Swift source from bundle/resources to userData
  const bundleSrc = path.join(__dirname, 'speech-listener.swift')
  let swiftContent = ''
  try {
    swiftContent = fs.readFileSync(bundleSrc, 'utf8')
  } catch (e) {
    if (fs.existsSync(paths.swiftSrcPath)) {
      swiftContent = fs.readFileSync(paths.swiftSrcPath, 'utf8')
    }
  }

  if (!swiftContent) {
    logToRenderer('error', '[Sofi Compiler] No se encontró speech-listener.swift')
    return { supported: false, error: 'no_swift_source' }
  }

  // Only write if content changed to preserve mtime
  let sourceChanged = true
  try {
    if (fs.existsSync(paths.swiftSrcPath)) {
      const existing = fs.readFileSync(paths.swiftSrcPath, 'utf8')
      if (existing === swiftContent) {
        sourceChanged = false
      }
    }
  } catch {}

  if (sourceChanged) {
    fs.writeFileSync(paths.swiftSrcPath, swiftContent, 'utf8')
  }

  // Check if compiled binary exists and is newer than source
  try {
    if (fs.existsSync(paths.binaryPath)) {
      const srcStat = fs.statSync(paths.swiftSrcPath)
      const binStat = fs.statSync(paths.binaryPath)
      if (!sourceChanged && binStat.mtimeMs >= srcStat.mtimeMs) {
        logToRenderer('info', '[Sofi Compiler] ✅ Binario nativo listo y actualizado:', paths.binaryPath)
        nativeBinaryReady = true
        return { supported: true, binaryPath: paths.binaryPath }
      }
      logToRenderer('info', '[Sofi Compiler] ♻️ Código fuente actualizado, recompilando...')
    }
  } catch {}

  // Check if swiftc is available
  logToRenderer('info', '[Sofi Compiler] 🔨 Compilando SofiListener nativo con swiftc...')
  return new Promise((resolve) => {
    const compileArgs = [
      '-O',
      '-o', paths.binaryPath,
      paths.swiftSrcPath,
      '-framework', 'Cocoa',
      '-framework', 'Speech',
      '-framework', 'AVFoundation',
      '-framework', 'CoreAudio',
      '-Xlinker', '-sectcreate',
      '-Xlinker', '__TEXT',
      '-Xlinker', '__info_plist',
      '-Xlinker', paths.infoPlistPath,
    ]

    const proc = spawn('/usr/bin/swiftc', compileArgs)
    let stderr = ''
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(paths.binaryPath)) {
        try {
          execSync(`chmod +x "${paths.binaryPath}"`)
          const signRes = execSync(`/usr/bin/codesign -s - --force --deep "${paths.appBundleDir}" 2>&1`, { encoding: 'utf8' })
          logToRenderer('info', '[Sofi Compiler] Codesign:', signRes.trim() || 'OK')
        } catch (e) {
          logToRenderer('warn', '[Sofi Compiler] Codesign notice:', e?.message)
        }

        try {
          execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${paths.appBundleDir}" 2>/dev/null || true`)
          logToRenderer('info', '[Sofi Compiler] LaunchServices registrado')
        } catch {}

        logToRenderer('info', '[Sofi Compiler] ✅ Compilación nativa completada:', paths.binaryPath)
        nativeBinaryReady = true
        resolve({ supported: true, binaryPath: paths.binaryPath })
      } else {
        logToRenderer('warn', '[Sofi Compiler] Falló compilación con -sectcreate, reintentando...')
        // Fallback compilation without -sectcreate
        const fallbackProc = spawn('/usr/bin/swiftc', [
          '-O',
          '-o', paths.binaryPath,
          paths.swiftSrcPath,
          '-framework', 'Cocoa',
          '-framework', 'Speech',
          '-framework', 'AVFoundation',
        ])
        let fallbackStderr = ''
        fallbackProc.stderr.on('data', (d) => { fallbackStderr += d.toString() })
        fallbackProc.on('close', (fCode) => {
          if (fCode === 0 && fs.existsSync(paths.binaryPath)) {
            try {
              execSync(`chmod +x "${paths.binaryPath}"`)
              execSync(`/usr/bin/codesign -s - --force --deep "${paths.appBundleDir}" 2>/dev/null || true`)
            } catch {}
            try {
              execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${paths.appBundleDir}" 2>/dev/null || true`)
            } catch {}
            logToRenderer('info', '[Sofi Compiler] ✅ Compilación fallback exitosa:', paths.binaryPath)
            nativeBinaryReady = true
            resolve({ supported: true, binaryPath: paths.binaryPath })
          } else {
            logToRenderer('error', '[Sofi Compiler] ❌ Error compilación fallback:', fallbackStderr || stderr)
            resolve({ supported: false, error: 'compilation_failed', details: fallbackStderr || stderr })
          }
        })
      }
    })

    proc.on('error', (err) => {
      logToRenderer('error', '[Sofi Compiler] ❌ swiftc no disponible:', err?.message)
      resolve({ supported: false, error: 'swiftc_not_found', details: err?.message })
    })
  })
}

async function spawnNativeListener() {
  if (process.platform !== 'darwin') {
    logToRenderer('warn', '[Sofi] ⚠️ Solo macOS soportado. platform=' + process.platform)
    return { supported: false, error: 'not_darwin', platform: process.platform }
  }

  if (currentListenProcess) {
    try { currentListenProcess.kill('SIGKILL') } catch {}
    currentListenProcess = null
  }

  const prep = await ensureNativeListenerBinary()
  if (!prep.supported || !prep.binaryPath) {
    return prep
  }

  const execPath = prep.binaryPath

  return new Promise((resolve) => {
    try {
      lastSpawnTime = Date.now()
      logToRenderer('info', '[Sofi] 📡 Ejecutando SofiListener nativo:', execPath)
      const proc = spawn(execPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })
      currentListenProcess = proc
      logToRenderer('info', '[Sofi] PID:', proc.pid)

      let started = false

      // Timeout: if LISTENING_READY not received in 30s, give up
      const startupTimeout = setTimeout(() => {
        if (!started) {
          started = true
          logToRenderer('error', '[Sofi] ❌ Timeout: LISTENING_READY no recibido en 30s')
          resolve({ supported: false, error: 'startup_timeout' })
        }
      }, 30000)

      proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('TRANSCRIPT:')) {
            const text = trimmed.substring(11).trim()
            if (text) {
              logToRenderer('info', '[Sofi] 🗣️', text)
              mainWindow?.webContents.send('voice:native-transcript', text)
            }
          } else if (trimmed.startsWith('FINAL:')) {
            const text = trimmed.substring(6).trim()
            if (text) {
              logToRenderer('info', '[Sofi] ✅ Final:', text)
              mainWindow?.webContents.send('voice:native-result', text)
            }
          }
        }
      })

      proc.stderr.on('data', (data) => {
        const text = data.toString().trim()
        for (const line of text.split('\n')) {
          const l = line.trim()
          if (!l) continue

          logToRenderer('info', '[Swift]', l)

          if (l.includes('LISTENING_READY')) {
            consecutiveCrashes = 0
            clearTimeout(startupTimeout)
            if (!started) {
              started = true
              logToRenderer('info', '[Sofi] ✅ ESCUCHA ACTIVA (PID ' + proc.pid + ')')
              resolve({ supported: true })
            }
          } else if (l.startsWith('ERROR:')) {
            clearTimeout(startupTimeout)
            logToRenderer('error', '[Sofi] ❌', l)
            isContinuousListeningActive = false
            if (!started) {
              started = true
              resolve({ supported: false, error: l })
            }
          }
        }
      })

      proc.on('close', (code, signal) => {
        clearTimeout(startupTimeout)
        logToRenderer('warn', '[Sofi] Proceso cerrado — code:', code, 'signal:', signal)
        currentListenProcess = null

        const runtime = Date.now() - lastSpawnTime
        if (runtime < 3000) {
          consecutiveCrashes++
        } else {
          consecutiveCrashes = 0
        }

        if (!started) {
          started = true
          resolve({ supported: false, error: 'process_exited', code, signal })
        }

        if (consecutiveCrashes >= 3) {
          logToRenderer('error', '[Sofi] 🛑 El proceso nativo falló 3 veces consecutivas en el arranque. Deteniendo auto-reinicio para evitar bucle.')
          isContinuousListeningActive = false
          return
        }

        if (isContinuousListeningActive && !isSpeaking) {
          logToRenderer('info', '[Sofi] ♻️ Relanzando en 2s...')
          if (listenerRestartTimer) clearTimeout(listenerRestartTimer)
          listenerRestartTimer = setTimeout(() => {
            listenerRestartTimer = null
            if (isContinuousListeningActive && !isSpeaking) {
              spawnNativeListener().catch(() => {})
            }
          }, 2000)
        }
      })

      proc.on('error', (err) => {
        clearTimeout(startupTimeout)
        logToRenderer('error', '[Sofi] ❌ Spawn error:', err?.message)
        currentListenProcess = null
        if (!started) {
          started = true
          resolve({ supported: false, error: err?.message })
        }
      })
    } catch (e) {
      logToRenderer('error', '[Sofi] ❌ Excepción:', e?.message)
      currentListenProcess = null
      resolve({ supported: false, error: e?.message })
    }
  })
}

// ── Siri Speech Synthesis ──────────────────────────────────────────────────
ipcMain.handle('voice:speak-siri', async (_event, text) => {
  if (process.platform !== 'darwin' || !text) return false
  isSpeaking = true
  pauseListener()

  return new Promise((resolve) => {
    try {
      if (currentSayProcess) {
        try { currentSayProcess.kill('SIGKILL') } catch {}
        currentSayProcess = null
      }

      const cleanText = String(text).trim()
      if (!cleanText) {
        isSpeaking = false
        resumeListener()
        resolve(false)
        return
      }

      const escaped = cleanText.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const osaProc = spawn('/usr/bin/osascript', ['-e', `say "${escaped}"`])
      currentSayProcess = osaProc

      let hasExited = false
      const onFinishSpeech = (success) => {
        if (hasExited) return
        hasExited = true
        currentSayProcess = null
        setTimeout(() => {
          isSpeaking = false
          resumeListener()
        }, 500)
        resolve(success)
      }

      osaProc.on('close', (code) => {
        if (code === 0) {
          onFinishSpeech(true)
        } else {
          const sayProc = spawn('/usr/bin/say', [cleanText])
          currentSayProcess = sayProc
          sayProc.on('close', (c) => onFinishSpeech(c === 0))
          sayProc.on('error', () => onFinishSpeech(false))
        }
      })
      osaProc.on('error', () => {
        const sayProc = spawn('/usr/bin/say', [cleanText])
        currentSayProcess = sayProc
        sayProc.on('close', (c) => onFinishSpeech(c === 0))
        sayProc.on('error', () => onFinishSpeech(false))
      })
    } catch (err) {
      currentSayProcess = null
      isSpeaking = false
      resumeListener()
      resolve(false)
    }
  })
})

ipcMain.handle('voice:stop-siri', async () => {
  if (currentSayProcess) {
    try { currentSayProcess.kill('SIGKILL') } catch {}
    currentSayProcess = null
  }
  isSpeaking = false
  resumeListener()
  return true
})

// ── Native Speech IPC Handlers ─────────────────────────────────────────────
ipcMain.handle('voice:native-listen-start', async () => {
  isContinuousListeningActive = true
  if (currentListenProcess && !currentListenProcess.killed) {
    resumeListener()
    return { supported: true }
  }
  return spawnNativeListener()
})

ipcMain.handle('voice:native-listen-stop', async () => {
  stopNativeListener()
  return true
})

ipcMain.handle('voice:native-listen-continuous-start', async () => {
  logToRenderer('info', '[Sofi] 🎧 === INICIANDO ESCUCHA CONTINUA ===')
  logToRenderer('info', '[Sofi]   platform:', process.platform, 'arch:', process.arch)
  logToRenderer('info', '[Sofi]   userData:', app.getPath('userData'))
  isContinuousListeningActive = true
  consecutiveCrashes = 0
  if (currentListenProcess && !currentListenProcess.killed) {
    resumeListener()
    return { supported: true }
  }
  return spawnNativeListener()
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

