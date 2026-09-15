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

      const currentInput = el('inputVersion').value.trim().replace(/^v/, '')
      const ghVer = latestGitHubTag.replace(/^v/, '')
      if (!currentInput || currentInput === ghVer) {
        suggestNextVersion(ghVer)
      }
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
  loadAdminVersion(false)
  checkGitHubStatus(true)
  refreshInstallers()
})

// Load Admin App Local Version
async function loadAdminVersion(shouldSuggest = false) {
  const res = await window.publisherAPI?.getAdminVersion()
  if (res && res.version) {
    localVersion = res.version
    el('txtLocalVersion').textContent = `v${localVersion}`
    // Only suggest next version on initial empty load, never overwrite user input
    if (shouldSuggest && !el('inputVersion').value.trim()) {
      suggestNextVersion(localVersion)
    }
  }
}

function suggestNextVersion(baseVer) {
  const clean = baseVer.replace(/^v/, '')
  const parts = clean.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] = parts[2] + 1
  const next = parts.join('.')
  el('inputVersion').value = next
  el('inputTitle').value = `GoldBlack Lash Admin v${next}`
}

// Version Bump Helpers (only update input UI without saving until build/publish)
el('btnBumpPatch')?.addEventListener('click', () => {
  const current = el('inputVersion').value.trim().replace(/^v/, '') || localVersion
  const parts = current.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] = parts[2] + 1
  const v = parts.join('.')
  el('inputVersion').value = v
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
})

el('btnBumpMinor')?.addEventListener('click', () => {
  const current = el('inputVersion').value.trim().replace(/^v/, '') || localVersion
  const parts = current.split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[1] = parts[1] + 1
  parts[2] = 0
  const v = parts.join('.')
  el('inputVersion').value = v
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
})

// Auto-sync title when version is typed
el('inputVersion')?.addEventListener('input', () => {
  const v = el('inputVersion').value.trim().replace(/^v/, '')
  el('inputTitle').value = `GoldBlack Lash Admin v${v}`
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
    el('inputVersion').focus()
    el('inputVersion').classList.add('border-red-500/50', 'ring-1', 'ring-red-500/20')
    setTimeout(() => el('inputVersion').classList.remove('border-red-500/50', 'ring-1', 'ring-red-500/20'), 2000)
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
  const footer = el('buildTerminalFooter')
  const btn = el('btnBuildInstaller')

  const setBadge = (mode) => {
    if (!badge) return
    if (mode === 'compiling') {
      badge.className = 'ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-300 border border-amber-500/25'
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Compilando'
    } else if (mode === 'success') {
      badge.className = 'ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ✓ Completado'
    } else if (mode === 'error') {
      badge.className = 'ml-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-500/15 text-red-300 border border-red-500/25'
      badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> ✗ Error'
    }
  }

  container.classList.remove('hidden')
  // Mensaje inicial con estilo moderno + timestamp
  const ts = new Date().toLocaleTimeString()
  logText.textContent = `› [${ts}] GoldBlack Publisher • v${version.replace(/^v/, '')} sincronizada\n› Iniciando compilación multiplataforma — Windows NSIS + macOS Monterey\n› ─────────────────────────────────────────────\n`
  setBadge('compiling')
  if (footer) footer.textContent = 'Compilando instaladores…'
  btn.disabled = true
  btn.classList.add('opacity-50', 'cursor-not-allowed')

  const unsubscribe = window.publisherAPI?.onBuildLog((line) => {
    logText.textContent += line
    logText.scrollTop = logText.scrollHeight
    if (footer) {
      const lines = logText.textContent.split('\n').length
      footer.textContent = `${lines} líneas • streaming…`
    }
  })

  try {
    const res = await window.publisherAPI?.buildInstaller({ version })
    setBadge('success')
    if (footer) footer.textContent = '✓ Compilación finalizada con éxito'
    logText.textContent += `\n› ─────────────────────────────────────────────\n› ✓ Build completado — instaladores listos en dist-installers\n`
    logText.scrollTop = logText.scrollHeight
    await loadAdminVersion(false)
    await refreshInstallers()
  } catch (err) {
    setBadge('error')
    if (footer) footer.textContent = '✗ Error en compilación'
    logText.textContent += `\n› ✗ Error: ${err.message}\n`
    logText.scrollTop = logText.scrollHeight
  } finally {
    unsubscribe?.()
    isBuilding = false
    btn.disabled = false
    btn.classList.remove('opacity-50', 'cursor-not-allowed')
  }
})

// Controles del terminal moderno — copiar / limpiar / cerrar
el('btnCopyBuildLog')?.addEventListener('click', async () => {
  const txt = el('buildLogText')?.textContent || ''
  try {
    await navigator.clipboard.writeText(txt)
    const b = el('btnCopyBuildLog')
    const orig = b.innerHTML
    b.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>'
    b.classList.add('text-emerald-400', 'border-emerald-500/30')
    setTimeout(() => { b.innerHTML = orig; b.classList.remove('text-emerald-400', 'border-emerald-500/30') }, 1200)
  } catch {}
})
el('btnClearBuildLog')?.addEventListener('click', () => {
  const l = el('buildLogText')
  if (l) { l.textContent = '› Terminal limpiada\n'; const f = el('buildTerminalFooter'); if (f) f.textContent = 'Terminal vacía • listo' }
})
el('btnCloseBuildTerminal')?.addEventListener('click', () => {
  el('buildOutputContainer')?.classList.add('hidden')
})

// Publish Release to GitHub
let isPublishing = false
el('btnPublishRelease')?.addEventListener('click', async () => {
  if (isPublishing) return

  const token = el('inputToken').value.trim()
  if (!token) {
    setTokenMsg('✗ Introduce tu GitHub PAT antes de publicar.', 'text-red-400')
    el('inputToken').focus()
    el('inputToken').classList.add('border-red-500/50', 'ring-1', 'ring-red-500/20')
    setTimeout(() => el('inputToken').classList.remove('border-red-500/50', 'ring-1', 'ring-red-500/20'), 2000)
    return
  }

  const version = el('inputVersion').value.trim()
  if (!version) {
    el('inputVersion').focus()
    el('inputVersion').classList.add('border-red-500/50', 'ring-1', 'ring-red-500/20')
    setTimeout(() => el('inputVersion').classList.remove('border-red-500/50', 'ring-1', 'ring-red-500/20'), 2000)
    return
  }

  const autoBuild = el('checkAutoBuild')?.checked ?? true
  const installerPath = el('selectInstaller').value
  if (!installerPath && !autoBuild) {
    const info = el('selectedInstallerInfo')
    if (info) {
      info.textContent = '✗ No hay instaladores seleccionados. Marca compilar automáticamente o compila primero.'
      info.className = 'text-[10.5px] font-semibold text-red-400'
      setTimeout(() => { info.textContent = ''; info.className = 'text-[10.5px] text-gray-500 font-mono truncate' }, 3000)
    }
    return
  }

  const title = el('inputTitle').value.trim()
  const notes = el('inputNotes').value.trim()

  // Publicación directa sin ventana emergente de confirmación (flujo ágil solicitado)

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
      statusText.textContent = data.message || '🔨 Compilando instaladores (Windows y macOS)...'
      progressBar.style.width = '25%'
      progressPercent.textContent = 'Compilando...'
      progressBytes.textContent = 'Generando instaladores para Windows y Mac...'
      return
    }
    const percent = data.percent || 0
    progressBar.style.width = `${percent}%`
    progressPercent.textContent = `${percent}%`
    const upMb = ((data.uploadedBytes || 0) / (1024 * 1024)).toFixed(1)
    const totMb = ((data.totalBytes || 0) / (1024 * 1024)).toFixed(1)
    if (data.message) {
      statusText.textContent = data.message
    }
    progressBytes.textContent = `${upMb} MB / ${totMb} MB subidos`
  })

  try {
    statusText.textContent = '1/3 Aplicando versión a packages.json y creando release en borrador...'
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
      statusText.textContent = '✓ Subida y publicación completadas'

      successBox.classList.remove('hidden')
      el('successTitleText').textContent = `¡Release ${result.tagName} publicada con éxito en GitHub!`

      // Refresh local version and installer list
      await loadAdminVersion(false)
      await refreshInstallers()

      // Update header
      el('txtGitHubVersion').textContent = result.tagName
      el('txtGitHubVersion').className = 'text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30'
    }
  } catch (err) {
    statusText.textContent = `✗ Error: ${err.message}`
    statusText.className = 'text-red-300 font-semibold flex items-center gap-2 text-[11px]'
    progressBytes.textContent = err.message || 'Error publicando'
    progressBar.style.width = '0%'
    progressBar.className = 'h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-200'
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

// Cerrar terminal con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') el('buildOutputContainer')?.classList.add('hidden')
})

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
  const savedToken = await window.publisherAPI?.loadToken()
  if (savedToken) {
    el('inputToken').value = savedToken
  }
  await loadAdminVersion(true)
  await refreshInstallers()
  await checkGitHubStatus(false)
})
