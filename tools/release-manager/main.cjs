const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const { spawn } = require('child_process')

const REPO_OWNER = 'S3cur3CAt'
const REPO_NAME = 'GoldBlack_Lash'

function getAdminRoot() {
  const candidates = [
    path.join(__dirname, '..', '..', 'admin'),
    path.join(app.getPath('documents'), 'GoldBlack_Lash', 'admin'),
    'C:\\Users\\antonio\\Documents\\GoldBlack_Lash\\admin',
  ]
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) {
      return c
    }
  }
  return candidates[0]
}

const adminRoot = getAdminRoot()
const distInstallersDir = path.join(adminRoot, 'dist-installers')

let mainWindow = null

function createWindow() {
  const iconPath = fs.existsSync(path.join(__dirname, 'icon.ico'))
    ? path.join(__dirname, 'icon.ico')
    : path.join(adminRoot, 'build', 'icon.ico')

  mainWindow = new BrowserWindow({
    width: 980,
    height: 820,
    minWidth: 840,
    minHeight: 650,
    backgroundColor: '#0a0a0d',
    title: 'GoldBlack Lash — Gestor de Actualizaciones',
    frame: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Window Controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) mainWindow.unmaximize()
  else mainWindow.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() || false)

// Token Persistence
const tokenFilePath = path.join(app.getPath('userData'), 'publisher_token.json')

ipcMain.handle('publisher:load-token', () => {
  try {
    if (fs.existsSync(tokenFilePath)) {
      const data = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'))
      return data.token || ''
    }
  } catch (e) {}
  return ''
})

ipcMain.handle('publisher:save-token', (event, { token }) => {
  try {
    fs.writeFileSync(tokenFilePath, JSON.stringify({ token: token ? token.trim() : '' }), 'utf8')
    return true
  } catch (e) {
    return false
  }
})

// Read Admin App Package Version
ipcMain.handle('publisher:get-admin-version', () => {
  try {
    const pkgPath = path.join(adminRoot, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      return { version: pkg.version || '0.0.1' }
    }
  } catch (e) {}
  return { version: '0.0.1' }
})

// Find Generated Installers in admin/dist-installers
ipcMain.handle('publisher:find-installers', () => {
  try {
    if (!fs.existsSync(distInstallersDir)) return []
    const files = fs.readdirSync(distInstallersDir)
    return files
      .filter((f) => f.endsWith('.exe'))
      .map((f) => {
        const fullPath = path.join(distInstallersDir, f)
        const stats = fs.statSync(fullPath)
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(1)
        return {
          name: f,
          fullPath,
          sizeBytes: stats.size,
          sizeFormatted: `${sizeMb} MB`,
          mtime: stats.mtime,
        }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
  } catch (e) {
    return []
  }
})

// Select Custom Installer File via Dialog
ipcMain.handle('publisher:select-installer-file', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar archivo instalador de Windows (.exe)',
    filters: [{ name: 'Instalador ejecutable', extensions: ['exe'] }],
    properties: ['openFile'],
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const fullPath = result.filePaths[0]
    const stats = fs.statSync(fullPath)
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(1)
    return {
      name: path.basename(fullPath),
      fullPath,
      sizeBytes: stats.size,
      sizeFormatted: `${sizeMb} MB`,
      mtime: stats.mtime,
    }
  }
  return null
})

// Check GitHub Releases
ipcMain.handle('publisher:check-github', async (event, { token }) => {
  return new Promise((resolve) => {
    const headers = {
      'User-Agent': 'GoldBlack-Release-Publisher',
      Accept: 'application/vnd.github.v3+json',
    }
    if (token) {
      headers.Authorization = `token ${token.trim()}`
    }

    const req = https.get(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      { headers },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const releases = JSON.parse(data)
              resolve({
                ok: true,
                count: releases.length,
                latest: releases[0] || null,
              })
            } catch {
              resolve({ ok: false, error: 'JSON inválido' })
            }
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            resolve({ ok: false, error: 'Token no autorizado o expirado (HTTP ' + res.statusCode + ')' })
          } else {
            resolve({ ok: false, error: `HTTP ${res.statusCode}` })
          }
        })
      }
    )
    req.on('error', (err) => resolve({ ok: false, error: err.message }))
  })
})

// Build Installer Live Execution
ipcMain.handle('publisher:build-installer', async () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(adminRoot, 'scripts', 'build-win.mjs')
    const child = spawn(process.execPath, [scriptPath], {
      cwd: adminRoot,
      env: { ...process.env, NODE_ENV: 'production' },
    })

    const sendLog = (line) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('publisher:build-log', line)
      }
    }

    child.stdout.on('data', (d) => sendLog(d.toString()))
    child.stderr.on('data', (d) => sendLog(d.toString()))

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        reject(new Error(`El proceso de compilación falló con código ${code}`))
      }
    })

    child.on('error', (err) => reject(err))
  })
})

// Publish Release to GitHub & Upload Binary Asset
ipcMain.handle('publisher:publish-release', async (event, payload) => {
  const { token, version, title, notes, isPrerelease, installerPath } = payload

  if (!token) throw new Error('Se requiere un GitHub Personal Access Token con permisos repo.')
  if (!version) throw new Error('Se requiere especificar la versión (ej. 0.0.2).')
  if (!installerPath || !fs.existsSync(installerPath)) {
    throw new Error('El archivo instalador seleccionado no existe en disco.')
  }

  const cleanTag = `v${version.replace(/^v/, '').trim()}`
  const fileName = path.basename(installerPath)
  const fileStat = fs.statSync(installerPath)

  // 1. Create Release
  const releasePayload = JSON.stringify({
    tag_name: cleanTag,
    target_commitish: 'main',
    name: title || `GoldBlack Lash Admin ${cleanTag}`,
    body: notes || `Versión ${cleanTag} de GoldBlack Lash Admin.`,
    draft: false,
    prerelease: !!isPrerelease,
  })

  const releaseData = await new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        method: 'POST',
        headers: {
          'User-Agent': 'GoldBlack-Release-Publisher',
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(releasePayload),
        },
      },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body))
            } catch (e) {
              reject(new Error('Respuesta de GitHub inválida'))
            }
          } else {
            try {
              const errObj = JSON.parse(body)
              reject(new Error(errObj.message || `Error al crear release: HTTP ${res.statusCode}`))
            } catch {
              reject(new Error(`Error al crear release: HTTP ${res.statusCode}`))
            }
          }
        })
      }
    )
    req.on('error', reject)
    req.write(releasePayload)
    req.end()
  })

  // 2. Upload Asset (.exe)
  const rawUploadUrl = releaseData.upload_url.replace(/\{[^{}]*\}$/, '')
  const uploadUrl = `${rawUploadUrl}?name=${encodeURIComponent(fileName)}`
  const parsedUploadUrl = new URL(uploadUrl)

  await new Promise((resolve, reject) => {
    const totalBytes = fileStat.size
    let uploadedBytes = 0
    let lastReport = 0

    const uploadReq = https.request(
      parsedUploadUrl,
      {
        method: 'POST',
        headers: {
          'User-Agent': 'GoldBlack-Release-Publisher',
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/vnd.microsoft.portable-executable',
          'Content-Length': totalBytes,
        },
      },
      (res) => {
        let respBody = ''
        res.on('data', (c) => (respBody += c))
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('publisher:upload-progress', {
                percent: 100,
                uploadedBytes: totalBytes,
                totalBytes,
              })
            }
            resolve()
          } else {
            try {
              const err = JSON.parse(respBody)
              reject(new Error(err.message || `Error en subida de asset: HTTP ${res.statusCode}`))
            } catch {
              reject(new Error(`Error en subida de asset: HTTP ${res.statusCode}`))
            }
          }
        })
      }
    )

    uploadReq.on('error', reject)

    const fileStream = fs.createReadStream(installerPath)

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length
      const now = Date.now()
      if (now - lastReport > 120 || uploadedBytes === totalBytes) {
        lastReport = now
        const percent = Math.round((uploadedBytes / totalBytes) * 100)
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('publisher:upload-progress', {
            percent,
            uploadedBytes,
            totalBytes,
          })
        }
      }
    })

    fileStream.on('error', reject)
    fileStream.pipe(uploadReq)
  })

  return {
    success: true,
    releaseUrl: releaseData.html_url,
    tagName: releaseData.tag_name,
    assetName: fileName,
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
