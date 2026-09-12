import { spawnSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const toolRoot = join(__dirname, '..')
const projectRoot = join(toolRoot, '..', '..')
const adminRoot = join(projectRoot, 'admin')

const distInstallers = join(toolRoot, 'dist-installers')
const distPackages = join(toolRoot, 'dist-packages')

console.log('=== Compilando Instalador de Windows para GoldBlack Release Publisher ===')

if (!existsSync(distInstallers)) {
  mkdirSync(distInstallers, { recursive: true })
}

// 1. Packager
console.log('\n[1/3] Empaquetando runtime de escritorio Windows 11 (x64, Electron 11.5.0)...')
const require = createRequire(import.meta.url)
const packager = require(join(adminRoot, 'node_modules', 'electron-packager'))

const appPaths = await packager({
  dir: toolRoot,
  name: 'GoldBlack Release Publisher',
  executableName: 'GoldBlack-Release-Publisher',
  platform: 'win32',
  arch: 'x64',
  electronVersion: '11.5.0',
  icon: join(toolRoot, 'icon.ico'),
  out: distPackages,
  overwrite: true,
  asar: true,
  prune: false,
  ignore: [
    /^\/scripts/,
    /^\/dist-installers/,
    /^\/dist-packages/,
    /\.git/,
  ],
  appVersion: '1.0.0',
  appCopyright: 'Copyright © 2026 GoldBlack Lash Studio',
  win32metadata: {
    CompanyName: 'GoldBlack Lash Studio',
    FileDescription: 'GoldBlack Lash — Gestor de Actualizaciones (Release Publisher)',
    OriginalFilename: 'GoldBlack-Release-Publisher.exe',
    ProductName: 'GoldBlack Release Publisher',
    InternalName: 'GoldBlackReleasePublisher',
  },
})

const winAppDir = appPaths[0]
console.log(`✓ Aplicación empaquetada en: ${winAppDir}`)

// 2. Locate makensis
console.log('\n[2/3] Preparando script de instalación NSIS para Windows...')
const makensisCandidates = [
  'C:\\Users\\antonio\\AppData\\Local\\electron-builder\\Cache\\nsis-3.0.4.1\\nsis-3.0.4.1-1mx3n\\Bin\\makensis.exe',
  'makensis',
]

let makensisPath = null
for (const cand of makensisCandidates) {
  if (existsSync(cand)) {
    makensisPath = cand
    break
  }
}

if (!makensisPath) {
  try {
    const res = spawnSync('where', ['makensis'], { encoding: 'utf8' })
    if (res.status === 0 && res.stdout.trim()) {
      makensisPath = res.stdout.trim().split('\n')[0].trim()
    }
  } catch (e) {}
}

const installerExeName = 'GoldBlack-Release-Publisher-Setup-1.0.0.exe'
const finalInstallerPath = join(distInstallers, installerExeName)

if (makensisPath) {
  console.log(`✓ Compilador NSIS encontrado: ${makensisPath}`)
  const iconPathWin = join(toolRoot, 'icon.ico').replace(/\\/g, '\\\\')

  const nsiScript = `
!include "MUI2.nsh"

Name "GoldBlack Release Publisher"
OutFile "${finalInstallerPath.replace(/\\/g, '\\\\')}"
InstallDir "$LOCALAPPDATA\\Programs\\GoldBlack Release Publisher"
InstallDirRegKey HKCU "Software\\GoldBlack Release Publisher" "InstallDir"
RequestExecutionLevel user

!define MUI_ICON "${iconPathWin}"
!define MUI_UNICON "${iconPathWin}"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Instalador de GoldBlack Release Publisher"
!define MUI_WELCOMEPAGE_TEXT "Herramienta oficial para publicar actualizaciones y nuevas versiones en GitHub para GoldBlack Lash Studio.\\n\\nPresiona Siguiente para continuar."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

Section "Instalar Archivos" SecApp
  SetOutPath "$INSTDIR"
  File /r "${winAppDir.replace(/\\/g, '\\\\')}\\*.*"
  File "${iconPathWin}"

  ; Crear desinstalador
  WriteUninstaller "$INSTDIR\\Uninstall.exe"

  ; Acceso directo en Menú Inicio
  CreateDirectory "$SMPROGRAMS\\GoldBlack Lash"
  CreateShortcut "$SMPROGRAMS\\GoldBlack Lash\\GoldBlack Release Publisher.lnk" "$INSTDIR\\GoldBlack-Release-Publisher.exe" "" "$INSTDIR\\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\\GoldBlack Lash\\Desinstalar Publisher.lnk" "$INSTDIR\\Uninstall.exe" "" "$INSTDIR\\icon.ico" 0

  ; Acceso directo en Escritorio
  CreateShortcut "$DESKTOP\\GoldBlack Release Publisher.lnk" "$INSTDIR\\GoldBlack-Release-Publisher.exe" "" "$INSTDIR\\icon.ico" 0

  ; Registro en Panel de Control
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher" "DisplayName" "GoldBlack Release Publisher"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher" "UninstallString" "$INSTDIR\\Uninstall.exe"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher" "DisplayIcon" "$INSTDIR\\icon.ico,0"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher" "Publisher" "GoldBlack Lash Studio"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$SMPROGRAMS\\GoldBlack Lash\\GoldBlack Release Publisher.lnk"
  Delete "$SMPROGRAMS\\GoldBlack Lash\\Desinstalar Publisher.lnk"
  Delete "$DESKTOP\\GoldBlack Release Publisher.lnk"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackReleasePublisher"
  DeleteRegKey HKCU "Software\\GoldBlack Release Publisher"
SectionEnd
`

  const nsiFilePath = join(toolRoot, 'installer.nsi')
  writeFileSync(nsiFilePath, nsiScript, 'utf8')

  console.log('\n[3/3] Generando instalador ejecutable .exe con NSIS...')
  const makensisResult = spawnSync(makensisPath, [nsiFilePath], {
    stdio: 'inherit',
    encoding: 'utf8',
  })

  if (makensisResult.status !== 0) {
    console.error('Error al compilar el instalador con makensis')
    process.exit(1)
  }

  try {
    rmSync(nsiFilePath)
  } catch (e) {}

  console.log(`\n🎉 INSTALADOR DE WINDOWS CREADO CON ÉXITO:`)
  console.log(`👉 ${finalInstallerPath}`)
} else {
  console.error('Error: No se encontró makensis para generar el instalador .exe')
  process.exit(1)
}
