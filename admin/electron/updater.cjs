const { app, ipcMain } = require('electron')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const GITHUB_REPO = 'S3cur3CAt/GoldBlack_Lash'

/**
 * Compare two semantic version strings (e.g. "v1.0.1" and "v1.0.0")
 */
function isNewerVersion(latest, current) {
  if (!latest || !current) return false
  const cleanL = latest.replace(/^v/i, '').trim()
  const cleanC = current.replace(/^v/i, '').trim()

  const partsL = cleanL.split('.').map((n) => parseInt(n, 10) || 0)
  const partsC = cleanC.split('.').map((n) => parseInt(n, 10) || 0)

  for (let i = 0; i < Math.max(partsL.length, partsC.length); i++) {
    const l = partsL[i] || 0
    const c = partsC[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

/**
 * Perform HTTPS GET request with automatic redirects following
 */
function httpsGetWithRedirects(url, headers = {}, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Demasiadas redirecciones'))
    }

    const client = url.startsWith('https:') ? https : http
    const parsedUrl = new URL(url)

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'GoldBlack-Lash-Admin-Updater',
          Accept: 'application/vnd.github.v3+json, */*',
          ...headers,
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          const redirectUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, parsedUrl.origin).href
          return resolve(httpsGetWithRedirects(redirectUrl, headers, maxRedirects - 1))
        }

        resolve(res)
      }
    )

    req.on('error', reject)
  })
}

let lastEtag = null
let lastReleaseData = null

function getSavedToken() {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'github_token.json')
    if (fs.existsSync(tokenPath)) {
      const data = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
      if (data && data.token) return data.token.trim()
    }
  } catch (e) {}
  return null
}

function formatReleaseResult(release, available, currentVersion) {
  const tagName = release.tag_name || ''
  if (!available) {
    return { available: false, latestVersion: tagName, currentVersion }
  }

  // Find best asset for current platform
  const platform = process.platform
  let chosenAsset = null

  if (Array.isArray(release.assets) && release.assets.length > 0) {
    if (platform === 'win32') {
      chosenAsset =
        release.assets.find((a) => a.name.endsWith('.exe') && a.state === 'uploaded' && a.size > 1000000) ||
        release.assets.find((a) => a.name.endsWith('app.asar') && a.state === 'uploaded' && a.size > 1000000)
    } else if (platform === 'darwin') {
      chosenAsset =
        release.assets.find((a) => (a.name.endsWith('.zip') || a.name.endsWith('.dmg')) && a.state === 'uploaded' && a.size > 1000000) ||
        release.assets.find((a) => a.name.endsWith('app.asar') && a.state === 'uploaded' && a.size > 1000000)
    } else {
      chosenAsset = release.assets.find((a) => a.state === 'uploaded' && a.size > 1000000)
    }
  }

  // IMPORTANT: If executable asset is not fully uploaded yet, DO NOT show update notification!
  if (!chosenAsset || !chosenAsset.browser_download_url) {
    console.log(`[Updater] Release ${tagName} detectada pero el ejecutable aún no está completamente subido. Esperando...`)
    return {
      available: false,
      latestVersion: tagName,
      currentVersion,
      reason: 'executable_upload_in_progress',
    }
  }

  return {
    available: true,
    currentVersion,
    latestVersion: tagName,
    releaseName: release.name || tagName,
    notes: release.body || '',
    publishedAt: release.published_at,
    assetUrl: chosenAsset.browser_download_url,
    assetName: chosenAsset.name || `${tagName}-update.exe`,
    assetSize: chosenAsset.size || 0,
    htmlUrl: release.html_url,
  }
}

/**
 * Check GitHub for latest release with ETag caching
 */
async function checkGitHubRelease(currentVersion) {
  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    const headers = {}
    const token = getSavedToken()
    if (token) {
      headers.Authorization = `token ${token}`
    }
    if (lastEtag) {
      headers['If-None-Match'] = lastEtag
    }

    const res = await httpsGetWithRedirects(apiUrl, headers)

    if (res.statusCode === 304 && lastReleaseData) {
      const available = isNewerVersion(lastReleaseData.tag_name || '', currentVersion)
      return formatReleaseResult(lastReleaseData, available, currentVersion)
    }

    if (res.statusCode === 404) {
      return { available: false, reason: 'no_releases_found', currentVersion }
    }

    if (res.statusCode !== 200) {
      return { available: false, reason: `HTTP_${res.statusCode}`, currentVersion }
    }

    if (res.headers && res.headers.etag) {
      lastEtag = res.headers.etag
    }

    let data = ''
    for await (const chunk of res) {
      data += chunk
    }

    const release = JSON.parse(data)
    lastReleaseData = release

    const tagName = release.tag_name || ''
    const available = isNewerVersion(tagName, currentVersion)

    return formatReleaseResult(release, available, currentVersion)
  } catch (err) {
    console.warn('[Updater] Error comprobando releases en GitHub:', err.message)
    return { available: false, error: err.message, currentVersion }
  }
}

/**
 * Setup IPC handlers in Electron Main Process
 */
function setupUpdaterIPC(mainWindow) {
  let downloadedFilePath = null

  // 1. Check for updates
  ipcMain.handle('updater:check', async (event, currentVersion = '1.0.0') => {
    return await checkGitHubRelease(currentVersion)
  })

  // 2. Download update asset
  ipcMain.handle('updater:download', async (event, { url, assetName }) => {
    if (!url) {
      throw new Error('URL de descarga no especificada')
    }

    const updateDir = path.join(app.getPath('temp'), 'goldblack-update')
    if (!fs.existsSync(updateDir)) {
      fs.mkdirSync(updateDir, { recursive: true })
    }

    const fileName = assetName || 'update-package.exe'
    const targetPath = path.join(updateDir, fileName)
    downloadedFilePath = targetPath

    return new Promise(async (resolve, reject) => {
      try {
        const res = await httpsGetWithRedirects(url)
        if (res.statusCode !== 200) {
          return reject(new Error(`Fallo en descarga: HTTP ${res.statusCode}`))
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10)
        let receivedBytes = 0
        let lastReportTime = 0

        const fileStream = fs.createWriteStream(targetPath)

        res.on('data', (chunk) => {
          receivedBytes += chunk.length
          const now = Date.now()
          // Throttle progress updates to UI every 100ms
          if (now - lastReportTime > 100 || receivedBytes === totalBytes) {
            lastReportTime = now
            const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('updater:progress', {
                percent,
                receivedBytes,
                totalBytes,
              })
            }
          }
        })

        res.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('updater:progress', {
                percent: 100,
                receivedBytes: totalBytes || receivedBytes,
                totalBytes: totalBytes || receivedBytes,
              })
            }
            resolve({ success: true, filePath: targetPath })
          })
        })

        fileStream.on('error', (err) => {
          fs.unlink(targetPath, () => {})
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  })

  // 3. Install update and restart
  ipcMain.handle('updater:install', async (event, { filePath }) => {
    const fileToRun = filePath || downloadedFilePath
    if (!fileToRun || !fs.existsSync(fileToRun)) {
      throw new Error('El archivo de actualización no existe en disco')
    }

    console.log('[Updater] Ejecutando instalador y reiniciando:', fileToRun)

    if (process.platform === 'win32') {
      // Execute the installer asynchronously and detach
      const child = spawn(fileToRun, [], {
        detached: true,
        stdio: 'ignore',
      })
      child.unref()

      // Quit Electron so installer can replace files cleanly
      setTimeout(() => {
        app.quit()
      }, 500)

      return { success: true }
    } else if (process.platform === 'darwin') {
      const { shell } = require('electron')
      await shell.openPath(fileToRun)
      setTimeout(() => {
        app.quit()
      }, 500)
      return { success: true }
    }

    return { success: false, reason: 'unsupported_platform' }
  })
}

module.exports = {
  checkGitHubRelease,
  setupUpdaterIPC,
}
