// GoldBlack Lash - Release Publisher Renderer Logic

let localVersion = '0.0.1'
let latestGitHubTag = ''
let currentInstallers = []
let lastPublishedUrl = ''

const el = (id) => document.getElementById(id)

// Window Controls
el('btnMinimize')?.addEventListener('click', () => window.publisherAPI?.minimize())
el('btnMaximize')?.addEventListener('click', () => window.publisherAPI?.maximize())
el('btnClose')?.addEventListener('click', () => window.publisherAPI?.close())

// Open Token Help
el('btnOpenTokenHelp')?.addEventListener('click', () => {
  window.publisherAPI?.openExternal('https://github.com/settings/tokens/new?description=GoldBlack%20Lash%20Release%20Publisher&scopes=repo')
})

// Toggle Token Visibility
let tokenVisible = false
el('btnToggleToken')?.addEventListener('click', () => {
  tokenVisible = !tokenVisible
  el('inputToken').type = tokenVisible ? 'text' : 'password'
  el('btnToggleToken').textContent = tokenVisible ? 'Ocultar' : 'Ver'
})

// Save Token
el('btnSaveToken')?.addEventListener('click', async () => {
  const token = el('inputToken').value.trim()
  await window.publisherAPI?.saveToken(token)
  setTokenMsg('✓ Token guardado localmente', 'text-emerald-400')
  checkGitHubStatus()
})

// Verify Token
el('btnVerifyToken')?.addEventListener('click', () => {
  checkGitHubStatus(true)
})

function setTokenMsg(msg, colorClass = 'text-gray-400') {
  const c = el('tokenStatusMsg')
  if (!c) return
  c.className = `text-[11px] ${colorClass} min-h-[16px]`
  c.textContent = msg
}

// Check GitHub Releases
async function checkGitHubStatus(userTriggered = false) {
  const token = el('inputToken').value.trim()
  el('txtGitHubVersion').textContent = 'Consultando...'

  if (userTriggered) {
    setTokenMsg('Verificando acceso a GitHub...', 'text-gold-400')
  }

  const res = await window.publisherAPI?.checkGitHub(token)
  if (res && res.ok) {
    if (res.count > 0 && res.latest) {
      latestGitHubTag = res.latest.tag_name || ''
      el('txtGitHubVersion').textContent = latestGitHubTag
      el('txtGitHubVersion').className = 'text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30'
    } else {
      latestGitHubTag = ''
      el('txtGitHubVersion').textContent = 'Sin releases (0)'
      el('txtGitHubVersion').className = 'text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30'
    }
    if (userTriggered) {
      setTokenMsg('✓ Conexión exitosa con el repositorio S3cur3CAt/GoldBlack_Lash', 'text-emerald-400')
    }
  } else {
    el('txtGitHubVersion').textContent = 'Error'
    el('txtGitHubVersion').className = 'text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30'
    if (userTriggered) {
      setTokenMsg(`✗ ${res?.error || 'No se pudo conectar con GitHub'}`, 'text-red-400')
    }
  }
}

el('btnRefreshStatus')?.addEventListener('click', () => {
  loadAdminVersion()
  checkGitHubStatus(true)
  refreshInstallers()
})

// Load Admin App Local Version
async function loadAdminVersion() {
  const res = await window.publisherAPI?.getAdminVersion()
  if (res && res.version) {
    localVersion = res.version
    el('txtLocalVersion').textContent = `v${localVersion}`
    suggestNextVersion(localVersion)
  }
}

function suggestNextVersion(baseVer) {
  const clean = baseVer.replace(/^v/, '')
  const parts = clean.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  // Default suggestion: patch + 1
  parts[2] = parts[2] + 1
  const next = parts.join('.')
  el('inputVersion').value = next
  el('inputTitle').value = `GoldBlack Lash Admin v${next}`
}

// Version Bump Helpers
el('btnBumpPatch')?.addEventListener('click', async () => {
  const current = el('inputVersion').value.trim().replace(/^v/, '')
  const parts = current.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] = parts[2] + 1
  const v = parts.join('.')
  el('inputVersion').value = v
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
  const res = await window.publisherAPI?.setVersion(v)
  if (res && res.ok) {
    localVersion = res.version
    el('txtLocalVersion').textContent = `v${localVersion}`
  }
})

el('btnBumpMinor')?.addEventListener('click', async () => {
  const current = el('inputVersion').value.trim().replace(/^v/, '')
  const parts = current.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[1] = parts[1] + 1
  parts[2] = 0
  const v = parts.join('.')
  el('inputVersion').value = v
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
  const res = await window.publisherAPI?.setVersion(v)
  if (res && res.ok) {
    localVersion = res.version
    el('txtLocalVersion').textContent = `v${localVersion}`
  }
})

// Auto-sync title when version is typed and auto-save on change
el('inputVersion')?.addEventListener('input', () => {
  const v = el('inputVersion').value.trim().replace(/^v/, '')
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
})

el('inputVersion')?.addEventListener('change', async () => {
  const v = el('inputVersion').value.trim()
  if (v) {
    const res = await window.publisherAPI?.setVersion(v)
    if (res && res.ok) {
      localVersion = res.version
      el('txtLocalVersion').textContent = `v${localVersion}`
    }
  }
})

// Save version directly to package.json
el('btnSaveVersionNow')?.addEventListener('click', async () => {
  const version = el('inputVersion').value.trim()
  if (!version) return
  const res = await window.publisherAPI?.setVersion(version)
  if (res && res.ok) {
    localVersion = res.version
    el('txtLocalVersion').textContent = `v${localVersion}`
    alert(`✓ Versión v${res.version} guardada con éxito en los package.json y archivos del proyecto:\n• ${res.modifiedFiles.join('\n• ')}`)
  }
})

// Templates for Notes
el('btnTemplateFixes')?.addEventListener('click', () => {
  const prev = el('inputNotes').value
  el('inputNotes').value = `${prev}\n- ✨ Corrección de errores y mejoras en la estabilidad del sistema.`
})

el('btnTemplateFeatures')?.addEventListener('click', () => {
  const prev = el('inputNotes').value
  el('inputNotes').value = `${prev}\n- 🚀 Nuevas opciones de gestión en el catálogo de servicios y tarifas.`
})

// Find & Populate Installers
async function refreshInstallers() {
  const installers = await window.publisherAPI?.findInstallers()
  currentInstallers = installers || []
  const select = el('selectInstaller')
  select.innerHTML = ''

  if (currentInstallers.length === 0) {
    const opt = document.createElement('option')
    opt.value = ''
    opt.textContent = 'No se encontró ningún instalador en admin/dist-installers. Pulsa "Compilar Instalador".'
    select.appendChild(opt)
    el('selectedInstallerInfo').textContent = ''
    return
  }

  currentInstallers.forEach((inst, index) => {
    const opt = document.createElement('option')
    opt.value = inst.fullPath
    opt.textContent = `${inst.name} (${inst.sizeFormatted})`
    if (index === 0) opt.selected = true
    select.appendChild(opt)
  })

  updateSelectedInstallerInfo()
}

function updateSelectedInstallerInfo() {
  const select = el('selectInstaller')
  const found = currentInstallers.find((i) => i.fullPath === select.value)
  if (found) {
    el('selectedInstallerInfo').textContent = `Ruta: ${found.fullPath} • Tamaño: ${found.sizeFormatted}`
  } else {
    el('selectedInstallerInfo').textContent = ''
  }
}

el('selectInstaller')?.addEventListener('change', updateSelectedInstallerInfo)

// Browse installer file manually
el('btnBrowseInstaller')?.addEventListener('click', async () => {
  const chosen = await window.publisherAPI?.selectInstallerFile()
  if (chosen) {
    currentInstallers = [chosen, ...currentInstallers.filter((i) => i.fullPath !== chosen.fullPath)]
    const select = el('selectInstaller')
    select.innerHTML = ''
    currentInstallers.forEach((inst, idx) => {
      const opt = document.createElement('option')
      opt.value = inst.fullPath
      opt.textContent = `${inst.name} (${inst.sizeFormatted})`
      if (idx === 0) opt.selected = true
      select.appendChild(opt)
    })
    updateSelectedInstallerInfo()
  }
})

// Build Installer On-Demand
let isBuilding = false
el('btnBuildInstaller')?.addEventListener('click', async () => {
  if (isBuilding) return

  const version = el('inputVersion').value.trim()
  if (!version) {
    alert('Por favor especifica un número de versión antes de compilar.')
    el('inputVersion').focus()
    return
  }

  // Sincronizar versión con los package.json y archivos del proyecto
  const syncRes = await window.publisherAPI?.setVersion(version)
  if (syncRes && syncRes.ok) {
    localVersion = syncRes.version
    el('txtLocalVersion').textContent = `v${localVersion}`
  }

  isBuilding = true

  const container = el('buildOutputContainer')
  const logText = el('buildLogText')
  const badge = el('buildStatusBadge')
  const btn = el('btnBuildInstaller')

  container.classList.remove('hidden')
  logText.textContent = `[GoldBlack Publisher] Versión v${version.replace(/^v/, '')} aplicada a package.json y updater.ts.\nIniciando proceso de compilación de Windows con NSIS...\n`
  badge.textContent = 'Compilando...'
  badge.className = 'text-[10px] text-amber-400 animate-pulse'
  btn.disabled = true
  btn.classList.add('opacity-50', 'cursor-not-allowed')

  const unsubscribe = window.publisherAPI?.onBuildLog((line) => {
    logText.textContent += line
    logText.scrollTop = logText.scrollHeight
  })

  try {
    const res = await window.publisherAPI?.buildInstaller({ version })
    badge.textContent = '✓ Compilado con éxito'
    badge.className = 'text-[10px] text-emerald-400 font-bold'
    await loadAdminVersion()
    await refreshInstallers()
  } catch (err) {
    badge.textContent = '✗ Error en compilación'
    badge.className = 'text-[10px] text-red-400 font-bold'
    logText.textContent += `\nError: ${err.message}`
  } finally {
    unsubscribe?.()
    isBuilding = false
    btn.disabled = false
    btn.classList.remove('opacity-50', 'cursor-not-allowed')
  }
})

// Publish Release to GitHub
let isPublishing = false
el('btnPublishRelease')?.addEventListener('click', async () => {
  if (isPublishing) return

  const token = el('inputToken').value.trim()
  if (!token) {
    alert('Por favor introduce tu GitHub Personal Access Token antes de publicar.')
    el('inputToken').focus()
    return
  }

  const version = el('inputVersion').value.trim()
  if (!version) {
    alert('Por favor especifica un número de versión.')
    el('inputVersion').focus()
    return
  }

  const autoBuild = el('checkAutoBuild')?.checked ?? true
  const installerPath = el('selectInstaller').value
  if (!installerPath && !autoBuild) {
    alert('No hay un instalador de Windows seleccionado. Por favor marca la casilla de compilar automáticamente o compila uno primero.')
    return
  }

  const title = el('inputTitle').value.trim()
  const notes = el('inputNotes').value.trim()

  const conf = confirm(
    `¿Confirmas la publicación de la versión v${version.replace(/^v/, '')} en GitHub?\n\n` +
    `• Repositorio: S3cur3CAt/GoldBlack_Lash\n` +
    `• Se actualizará automáticamente a v${version.replace(/^v/, '')} en:\n` +
    `    - admin/package.json\n` +
    `    - admin/src/services/updater.ts\n` +
    `    - package.json\n` +
    (autoBuild ? `• Se compilará automáticamente el nuevo instalador de Windows (GoldBlack-Lash-Admin-Setup-${version.replace(/^v/, '')}.exe)\n` : '') +
    `\nUna vez publicada, la aplicación de administración detectará la actualización automáticamente.`
  )
  if (!conf) return

  isPublishing = true
  const btn = el('btnPublishRelease')
  btn.disabled = true
  btn.classList.add('opacity-50', 'cursor-not-allowed')

  const progressContainer = el('uploadProgressContainer')
  const progressBar = el('uploadProgressBar')
  const progressPercent = el('uploadPercentText')
  const progressBytes = el('uploadBytesText')
  const statusText = el('uploadStatusText')
  const successBox = el('successBox')

  progressContainer.classList.remove('hidden')
  successBox.classList.add('hidden')
  progressBar.style.width = '0%'
  progressPercent.textContent = '0%'
  progressBytes.textContent = 'Iniciando proceso de publicación...'

  const unsubscribeProgress = window.publisherAPI?.onUploadProgress((data) => {
    if (data.step === 'compiling') {
      statusText.textContent = data.message || '🔨 Compilando nuevo instalador de Windows...'
      progressBar.style.width = '30%'
      progressPercent.textContent = 'Compilando...'
      progressBytes.textContent = 'Generando instalador con Vite + NSIS...'
      return
    }
    const percent = data.percent || 0
    progressBar.style.width = `${percent}%`
    progressPercent.textContent = `${percent}%`
    const upMb = ((data.uploadedBytes || 0) / (1024 * 1024)).toFixed(1)
    const totMb = ((data.totalBytes || 0) / (1024 * 1024)).toFixed(1)
    progressBytes.textContent = `${upMb} MB / ${totMb} MB subidos`
  })

  try {
    statusText.textContent = '1/3 Aplicando versión a packages.json y preparando release...'
    const result = await window.publisherAPI?.publishRelease({
      token,
      version,
      title,
      notes,
      autoBuild,
      installerPath,
    })

    if (result && result.success) {
      lastPublishedUrl = result.releaseUrl
      progressBar.style.width = '100%'
      progressPercent.textContent = '100%'
      statusText.textContent = '✓ Subida completada'

      successBox.classList.remove('hidden')
      el('successTitleText').textContent = `¡Release ${result.tagName} publicada con éxito en GitHub!`

      // Refresh local version and installer list
      await loadAdminVersion()
      await refreshInstallers()

      // Update header
      el('txtGitHubVersion').textContent = result.tagName
      el('txtGitHubVersion').className = 'text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30'
    }
  } catch (err) {
    alert(`Error publicando en GitHub: ${err.message}`)
    progressContainer.classList.add('hidden')
  } finally {
    unsubscribeProgress?.()
    isPublishing = false
    btn.disabled = false
    btn.classList.remove('opacity-50', 'cursor-not-allowed')
  }
})

// Open Published Release in Browser
el('btnOpenReleaseInBrowser')?.addEventListener('click', () => {
  if (lastPublishedUrl) {
    window.publisherAPI?.openExternal(lastPublishedUrl)
  }
})

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
  const savedToken = await window.publisherAPI?.loadToken()
  if (savedToken) {
    el('inputToken').value = savedToken
  }
  await loadAdminVersion()
  await refreshInstallers()
  await checkGitHubStatus(false)
})
