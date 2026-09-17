const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const { spawn } = require('child_process')

const REPO_OWNER = 'S3cur3CAt'
const REPO_NAME = 'GoldBlack_Lash'

function getAdminRoot() {
  const docs = (() => {
    try {
      return app.getPath('documents')
    } catch (e) {
      return path.join(process.env.USERPROFILE || 'C:\\Users\\antonio', 'Documents')
    }
  })()

  const candidates = [
    path.join(__dirname, '..', '..', 'admin'),
    path.join(docs, 'GoldBlack_Lash', 'admin'),
    path.join(process.env.USERPROFILE || 'C:\\Users\\antonio', 'Documents', 'GoldBlack_Lash', 'admin'),
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
    width: 1380,
    height: 760,
    minWidth: 1100,
    minHeight: 620,
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
      .filter((f) => f.endsWith('.exe') || f.endsWith('.zip'))
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
    title: 'Seleccionar archivo ejecutable (Windows .exe o macOS .zip)',
    filters: [{ name: 'Paquetes de instalación', extensions: ['exe', 'zip'] }],
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

// Automatically update version in project package.json and updater.ts
function applyVersionToProject(newVersion) {
  const clean = newVersion.replace(/^v/, '').trim()
  if (!clean) return { ok: false, error: 'Versión vacía' }

  const modifiedFiles = []

  // 1. admin/package.json
  const adminPkgPath = path.join(adminRoot, 'package.json')
  if (fs.existsSync(adminPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(adminPkgPath, 'utf8'))
      pkg.version = clean
      fs.writeFileSync(adminPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
      modifiedFiles.push('admin/package.json')
    } catch (e) {
      console.warn('Error actualizando admin/package.json:', e)
    }
  }

  // 2. admin/src/services/updater.ts
  const updaterPath = path.join(adminRoot, 'src', 'services', 'updater.ts')
  if (fs.existsSync(updaterPath)) {
    try {
      let content = fs.readFileSync(updaterPath, 'utf8')
      content = content.replace(
        /export const CURRENT_APP_VERSION = ['"][^'"]+['"]/,
        `export const CURRENT_APP_VERSION = '${clean}'`
      )
      fs.writeFileSync(updaterPath, content, 'utf8')
      modifiedFiles.push('admin/src/services/updater.ts')
    } catch (e) {
      console.warn('Error actualizando updater.ts:', e)
    }
  }

  const projectRoot = path.resolve(adminRoot, '..')

  // 3. tools/release-manager/package.json
  const managerPkgPath = path.join(projectRoot, 'tools', 'release-manager', 'package.json')
  if (fs.existsSync(managerPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(managerPkgPath, 'utf8'))
      pkg.version = clean
      fs.writeFileSync(managerPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
      modifiedFiles.push('tools/release-manager/package.json')
    } catch (e) {}
  }

  // 4. Root package.json
  const rootPkgPath = path.join(projectRoot, 'package.json')
  if (fs.existsSync(rootPkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'))
      pkg.version = clean
      fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
      modifiedFiles.push('package.json')
    } catch (e) {}
  }

  console.log(`[Publisher] Versión v${clean} aplicada a:`, modifiedFiles)
  return { ok: true, version: clean, modifiedFiles }
}

ipcMain.handle('publisher:set-version', (event, { version }) => {
  return applyVersionToProject(version)
})

// Build Script Runner Helper
function runBuildScript(scriptPath, label) {
  return new Promise((resolve, reject) => {
    const sendLog = (line) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('publisher:build-log', line)
      }
    }

    sendLog(`\n▶ ${label}...\n`)
    const child = spawn('node', [scriptPath], {
      cwd: adminRoot,
      env: { ...process.env, NODE_ENV: 'production' },
      shell: true,
    })

    child.stdout.on('data', (d) => sendLog(d.toString()))
    child.stderr.on('data', (d) => sendLog(d.toString()))

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        reject(new Error(`Falló: ${label} (código ${code})`))
      }
    })

    child.on('error', (err) => reject(err))
  })
}

// Build Admin Installers (Windows .exe and macOS .zip)
async function buildAdminInstallers() {
  const winScript = path.join(adminRoot, 'scripts', 'build-win.mjs')
  const macScript = path.join(adminRoot, 'scripts', 'build-mac.mjs')

  await runBuildScript(winScript, '[1/2] Compilando instalador de Windows 11 (.exe)')
  await runBuildScript(macScript, '[2/2] Compilando paquete de macOS Monterey (.zip)')
  return { success: true }
}

/**
 * Comprueba si los instaladores generados están desactualizados respecto al
 * código fuente. Devuelve { stale, reason } para poder mostrar al usuario
 * por qué se recompila. Esto garantiza que la release publicada en GitHub
 * siempre lleve el zip/exe con el frontend más reciente, aunque ya existiera
 * un instalador previo con el mismo número de versión.
 */
function checkInstallersStale(installerPaths) {
  // Fuentes cuyo cambio exige recompilar: frontend, proceso principal de
  // Electron, scripts de build y manifiesto de paquete.
  const sourceRoots = [
    path.join(adminRoot, 'src'),
    path.join(adminRoot, 'electron'),
    path.join(adminRoot, 'scripts'),
  ]
  const sourceFiles = [path.join(adminRoot, 'package.json')]

  const collectFiles = (dir) => {
    let entries = []
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch (e) {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue
        collectFiles(full)
      } else if (entry.isFile()) {
        sourceFiles.push(full)
      }
    }
  }
  for (const root of sourceRoots) collectFiles(root)

  let newestSourceMtime = 0
  let newestSourceFile = ''
  for (const file of sourceFiles) {
    try {
      const mtime = fs.statSync(file).mtimeMs
      if (mtime > newestSourceMtime) {
        newestSourceMtime = mtime
        newestSourceFile = file
      }
    } catch (e) {}
  }

  for (const installerPath of installerPaths) {
    if (!fs.existsSync(installerPath)) {
      return { stale: true, reason: `falta ${path.basename(installerPath)}` }
    }
    const installerMtime = fs.statSync(installerPath).mtimeMs
    if (newestSourceMtime > installerMtime) {
      return {
        stale: true,
        reason: `el código fuente es más reciente que ${path.basename(installerPath)} (cambiado: ${path.relative(adminRoot, newestSourceFile)})`,
      }
    }
  }

  return { stale: false, reason: 'instaladores ya actualizados con el código actual' }
}

ipcMain.handle('publisher:build-installer', async (event, payload) => {
  const version = payload?.version
  if (version) {
    applyVersionToProject(version)
  }
  return await buildAdminInstallers()
})

// Helper to delete an asset by ID
function deleteAsset(assetId, token) {
  return new Promise((resolve) => {
    const delReq = https.request(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${assetId}`,
      {
        method: 'DELETE',
        headers: {
          'User-Agent': 'GoldBlack-Release-Publisher',
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
      () => resolve(true)
    )
    delReq.on('error', () => resolve(false))
    delReq.end()
  })
}

// Helper to list all current assets of a release
function getReleaseAssets(releaseId, token) {
  return new Promise((resolve) => {
    const req = https.request(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'GoldBlack-Release-Publisher',
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) || [])
          } catch {
            resolve([])
          }
        })
      }
    )
    req.on('error', () => resolve([]))
    req.end()
  })
}

// Upload Single Asset Helper with Automatic Retry and Collision Protection
async function uploadAssetToRelease(releaseId, rawUploadUrlTemplate, filePath, token, onProgress, onStatus) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`)
  }

  const fileName = path.basename(filePath)
  const fileStat = fs.statSync(filePath)
  const totalBytes = fileStat.size

  const cleanBaseUrl = rawUploadUrlTemplate.replace(/\{[^{}]*\}$/, '')
  const targetUploadUrl = `${cleanBaseUrl}?name=${encodeURIComponent(fileName)}`
  const parsedUrl = new URL(targetUploadUrl)

  const contentType = fileName.endsWith('.exe')
    ? 'application/vnd.microsoft.portable-executable'
    : fileName.endsWith('.zip')
    ? 'application/zip'
    : 'application/octet-stream'

  const MAX_ATTEMPTS = 3
  let lastError = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // 1. Limpieza preventiva: eliminar cualquier asset previo con el mismo nombre (ej. fallido/incompleto)
    try {
      const currentAssets = await getReleaseAssets(releaseId, token)
      const duplicate = currentAssets.find((a) => a.name === fileName)
      if (duplicate) {
        console.log(`[Publisher] Eliminando asset previo/incompleto "${fileName}" (ID: ${duplicate.id})...`)
        await deleteAsset(duplicate.id, token)
        await new Promise((r) => setTimeout(r, 1500))
      }
    } catch (e) {
      console.warn('[Publisher] Aviso al revisar assets previos:', e.message)
    }

    if (attempt > 1) {
      onStatus?.(`Reintentando subida de ${fileName} tras corte de conexión (intento ${attempt}/${MAX_ATTEMPTS})...`)
    }

    // 2. Subida del archivo
    try {
      await new Promise((resolve, reject) => {
        let uploadedBytes = 0
        let lastReport = 0

        const uploadReq = https.request(
          parsedUrl,
          {
            method: 'POST',
            agent: false,
            headers: {
              'User-Agent': 'GoldBlack-Release-Publisher',
              Authorization: `token ${token.trim()}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': contentType,
              'Content-Length': totalBytes,
              'Connection': 'close',
            },
            timeout: 1800000, // 30 minutos para subidas grandes en conexiones lentas
          },
          (res) => {
            let respBody = ''
            res.on('data', (c) => (respBody += c))
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ fileName, size: totalBytes })
              } else {
                try {
                  const err = JSON.parse(respBody)
                  reject(new Error(err.message || `Error en subida de ${fileName}: HTTP ${res.statusCode}`))
                } catch {
                  reject(new Error(`Error en subida de ${fileName}: HTTP ${res.statusCode}`))
                }
              }
            })
          }
        )

        uploadReq.on('timeout', () => {
          uploadReq.destroy(new Error('Timeout de red (30 min) en la subida a GitHub.'))
        })

        uploadReq.on('error', (err) => {
          reject(err)
        })

        const fileStream = fs.createReadStream(filePath, { highWaterMark: 256 * 1024 })
        fileStream.on('data', (chunk) => {
          uploadedBytes += chunk.length
          const ok = uploadReq.write(chunk)
          if (!ok) {
            fileStream.pause()
          }
          const now = Date.now()
          if (now - lastReport > 200 || uploadedBytes === totalBytes) {
            lastReport = now
            const percent = Math.round((uploadedBytes / totalBytes) * 100)
            onProgress?.({ fileName, uploadedBytes, totalBytes, percent })
          }
        })

        uploadReq.on('drain', () => {
          fileStream.resume()
        })

        fileStream.on('end', () => {
          uploadReq.end()
        })

        fileStream.on('error', (err) => {
          uploadReq.destroy()
          reject(err)
        })
      })

      return { fileName, size: totalBytes }
    } catch (err) {
      lastError = err
      console.warn(`[Publisher] Subida de ${fileName} falló en intento ${attempt}:`, err.message)

      // Comprobar si a pesar del error de socket/504 el asset quedó guardado completamente
      try {
        await new Promise((r) => setTimeout(r, 2000))
        const checkAssets = await getReleaseAssets(releaseId, token)
        const savedAsset = checkAssets.find(
          (a) => a.name === fileName && a.size === totalBytes && a.state === 'uploaded'
        )
        if (savedAsset) {
          console.log(`[Publisher] Asset ${fileName} verificado en GitHub exitosamente.`)
          return { fileName, size: totalBytes }
        }
      } catch {}

      if (attempt < MAX_ATTEMPTS) {
        onStatus?.(`Conexión interrumpida al subir ${fileName}. Reintentando en 3s...`)
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
  }

  throw lastError || new Error(`No se pudo subir ${fileName} tras ${MAX_ATTEMPTS} intentos.`)
}

// Check for existing release (including drafts) or create a new release
async function getOrCreateGitHubRelease(token, cleanTag, title, notes, isPrerelease) {
  // 1. List recent releases to detect both published releases and drafts
  const existing = await new Promise((resolve) => {
    const req = https.request(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=30`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'GoldBlack-Release-Publisher',
          Authorization: `token ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const list = JSON.parse(body)
              const match = list.find((r) => r.tag_name === cleanTag)
              resolve(match || null)
            } catch {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.end()
  })

  if (existing && existing.id) {
    console.log(`[Publisher] Release existente detectada para ${cleanTag} (ID: ${existing.id}). Actualizando assets...`)
    // Delete any existing assets to allow clean replacement
    if (Array.isArray(existing.assets)) {
      for (const asset of existing.assets) {
        await deleteAsset(asset.id, token)
      }
    }
    return existing
  }

  // 2. Not existing: create new release with retry (up to 3 attempts) for transient errors
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Publisher] Creando nueva release en GitHub para ${cleanTag} (intento ${attempt}/3)...`)

      const payloadObj = {
        tag_name: cleanTag,
        name: title || `GoldBlack Lash Admin ${cleanTag}`,
        body: notes || `Versión ${cleanTag} de GoldBlack Lash Admin para Windows y macOS.`,
        draft: true,
        prerelease: !!isPrerelease,
      }
      if (attempt === 1) {
        payloadObj.target_commitish = 'main'
      }

      const releasePayload = JSON.stringify(payloadObj)

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
                  reject(new Error('Respuesta JSON de GitHub inválida'))
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

      return releaseData
    } catch (err) {
      lastError = err
      console.warn(`[Publisher] Intento ${attempt} de creación de release falló:`, err.message)
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt))
      }
    }
  }

  throw lastError || new Error(`No se pudo crear la release ${cleanTag} tras 3 intentos.`)
}

// Publish Release to GitHub & Upload Binary Assets (Windows + macOS)
ipcMain.handle('publisher:publish-release', async (event, payload) => {
  const { token, version, title, notes, isPrerelease, autoBuild, installerPath: userInstallerPath } = payload

  if (!token) throw new Error('Se requiere un GitHub Personal Access Token con permisos repo.')
  if (!version) throw new Error('Se requiere especificar la versión (ej. 0.0.8).')

  const cleanVersion = version.replace(/^v/, '').trim()
  const cleanTag = `v${cleanVersion}`

  // STEP 1: Automatically apply new version to packages.json, updater.ts, etc.
  const syncResult = applyVersionToProject(cleanVersion)
  console.log('[Publisher] Versión aplicada a packages.json:', syncResult)

  const expectedWinName = `GoldBlack-Lash-Admin-Setup-${cleanVersion}.exe`
  const expectedWinPath = path.join(distInstallersDir, expectedWinName)
  const expectedMacName = `GoldBlack-Lash-Admin-${cleanVersion}-macOS-Monterey.zip`
  const expectedMacPath = path.join(distInstallersDir, expectedMacName)

  // STEP 2: Recompilar si se pidió autoBuild, si falta algún instalador o si
  // el código fuente es más reciente que los instaladores ya generados (para
  // no subir nunca a GitHub un zip con frontend antiguo).
  const staleness = checkInstallersStale([expectedWinPath, expectedMacPath])
  console.log(`[Publisher] Estado de instaladores: ${staleness.reason}`)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('publisher:build-log', `\nℹ Instaladores: ${staleness.reason}\n`)
  }

  if (autoBuild || staleness.stale) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('publisher:upload-progress', {
        step: 'compiling',
        percent: 0,
        message: `Compilando instaladores para Windows y macOS Monterey (v${cleanVersion})...`,
      })
    }
    await buildAdminInstallers()
  }

  // Gather available assets for this version
  const assetsToUpload = []
  if (fs.existsSync(expectedWinPath)) {
    assetsToUpload.push({ path: expectedWinPath, label: 'Instalador de Windows (.exe)' })
  }
  if (fs.existsSync(expectedMacPath)) {
    assetsToUpload.push({ path: expectedMacPath, label: 'Paquete de macOS Monterey (.zip)' })
  } else {
    const fallbackMacName = `GoldBlack-Lash-Admin-${cleanVersion}-macOS-ElCapitan.zip`
    const fallbackMacPath = path.join(distInstallersDir, fallbackMacName)
    if (fs.existsSync(fallbackMacPath)) {
      assetsToUpload.push({ path: fallbackMacPath, label: 'Paquete de macOS (.zip)' })
    }
  }

  // If user selected a custom file and it's not in the list, add it
  if (userInstallerPath && fs.existsSync(userInstallerPath) && !assetsToUpload.some(a => a.path === userInstallerPath)) {
    assetsToUpload.unshift({ path: userInstallerPath, label: path.basename(userInstallerPath) })
  }

  if (assetsToUpload.length === 0) {
    throw new Error(`No se encontraron instaladores para v${cleanVersion} tras compilar.`)
  }

  // 1. Get existing Release for this tag or Create new Release as DRAFT with automatic retry
  const releaseData = await getOrCreateGitHubRelease(token, cleanTag, title, notes, isPrerelease)

  // 2. Upload All Assets (Windows .exe and macOS .zip)
  for (let i = 0; i < assetsToUpload.length; i++) {
    const asset = assetsToUpload[i]
    const fileIndexStr = `[${i + 1}/${assetsToUpload.length}]`

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('publisher:upload-progress', {
        step: 'uploading',
        currentFile: i + 1,
        totalFiles: assetsToUpload.length,
        fileName: path.basename(asset.path),
        message: `Subiendo ${fileIndexStr} ${asset.label}...`,
        percent: 0,
      })
    }

    await uploadAssetToRelease(
      releaseData.id,
      releaseData.upload_url,
      asset.path,
      token,
      (prog) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('publisher:upload-progress', {
            step: 'uploading',
            currentFile: i + 1,
            totalFiles: assetsToUpload.length,
            fileName: prog.fileName,
            message: `Subiendo ${fileIndexStr} ${asset.label} (${prog.percent}%)...`,
            percent: prog.percent,
            uploadedBytes: prog.uploadedBytes,
            totalBytes: prog.totalBytes,
          })
        }
      },
      (statusMsg) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('publisher:upload-progress', {
            step: 'uploading',
            currentFile: i + 1,
            totalFiles: assetsToUpload.length,
            fileName: path.basename(asset.path),
            message: `${fileIndexStr} ${statusMsg}`,
            percent: 0,
          })
        }
      }
    )
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('publisher:upload-progress', {
      step: 'upload-complete',
      percent: 100,
      message: 'Todos los instaladores (Windows y Mac) subidos al 100%. Publicando release oficial...',
    })
  }

  // 3. Publish Release (Convert draft: true -> draft: false now that all assets are attached)
  const publishPayload = JSON.stringify({ draft: false })
  let publishedRelease = null
  let patchLastError = null

  for (let patchAttempt = 1; patchAttempt <= 3; patchAttempt++) {
    try {
      publishedRelease = await new Promise((resolve, reject) => {
        const patchReq = https.request(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseData.id}`,
          {
            method: 'PATCH',
            agent: false,
            headers: {
              'User-Agent': 'GoldBlack-Release-Publisher',
              Authorization: `token ${token.trim()}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(publishPayload),
              'Connection': 'close',
            },
            timeout: 30000,
          },
          (res) => {
            let respBody = ''
            res.on('data', (c) => (respBody += c))
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve(JSON.parse(respBody))
                } catch (e) {
                  resolve(releaseData)
                }
              } else {
                reject(new Error(`Error al publicar release tras subir assets: HTTP ${res.statusCode}`))
              }
            })
          }
        )
        patchReq.on('timeout', () => patchReq.destroy(new Error('Timeout publicando release')))
        patchReq.on('error', reject)
        patchReq.write(publishPayload)
        patchReq.end()
      })
      break
    } catch (err) {
      patchLastError = err
      console.warn(`[Publisher] Intento ${patchAttempt} de publicación falló:`, err.message)
      if (patchAttempt < 3) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  if (!publishedRelease) {
    throw patchLastError || new Error('No se pudo publicar la release oficial en GitHub.')
  }

  return {
    success: true,
    releaseUrl: publishedRelease.html_url || releaseData.html_url,
    tagName: publishedRelease.tag_name || releaseData.tag_name,
    assetsCount: assetsToUpload.length,
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
