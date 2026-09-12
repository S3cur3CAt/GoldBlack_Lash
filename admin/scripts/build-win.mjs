import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const adminRoot = join(__dirname, '..')
const distInstallers = join(adminRoot, 'dist-installers')
const distPackages = join(adminRoot, 'dist-packages')

console.log('=== Compilando GoldBlack Lash Admin para Windows 11 ===')

// 1. Ensure dist-installers exists
if (!existsSync(distInstallers)) {
  mkdirSync(distInstallers, { recursive: true })
}

// 2. Build Frontend
console.log('\n[1/4] Compilando frontend React con Vite...')
execSync('pnpm run build', { cwd: adminRoot, stdio: 'inherit' })

// 3. Package Windows with electron-packager
console.log('\n[2/4] Empaquetando runtime de escritorio Windows 11 (x64, Electron 11.5.0)...')
const packager = (await import('electron-packager')).default

const appPaths = await packager({
  dir: adminRoot,
  name: 'GoldBlack Lash Admin',
  executableName: 'GoldBlack-Lash-Admin',
  platform: 'win32',
  arch: 'x64',
  electronVersion: '11.5.0',
  icon: join(adminRoot, 'build', 'icon.ico'),
  out: distPackages,
  overwrite: true,
  asar: true,
  prune: false,
  ignore: [
    /\/node_modules/,
    /^\/src/,
    /^\/scripts/,
    /^\/dist-installers/,
    /^\/dist-packages/,
    /\.git/,
    /tsconfig/,
    /vite\.config/,
    /tailwind\.config/,
    /postcss\.config/,
  ],
  appVersion: '1.0.0',
  appCopyright: 'Copyright © 2026 GoldBlack Lash Studio',
  win32metadata: {
    CompanyName: 'GoldBlack Lash Studio',
    FileDescription: 'GoldBlack Lash — Panel de Gestión y Administración',
    OriginalFilename: 'GoldBlack-Lash-Admin.exe',
    ProductName: 'GoldBlack Lash Admin',
    InternalName: 'GoldBlackLashAdmin',
  },
})

const winAppDir = appPaths[0]
console.log(`✓ Aplicación empaquetada en: ${winAppDir}`)

// 4. Locate makensis.exe
console.log('\n[3/4] Preparando script de instalación NSIS para Windows 11...')
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

const installerExeName = 'GoldBlack-Lash-Admin-Setup-1.0.0.exe'
const finalInstallerPath = join(distInstallers, installerExeName)

if (makensisPath) {
  console.log(`✓ Compilador NSIS encontrado: ${makensisPath}`)

  const iconPathWin = join(adminRoot, 'build', 'icon.ico').replace(/\\/g, '\\\\')

  const nsiScript = `
!include "MUI2.nsh"

Name "GoldBlack Lash Admin"
OutFile "${finalInstallerPath.replace(/\\/g, '\\\\')}"
InstallDir "$LOCALAPPDATA\\Programs\\GoldBlack Lash Admin"
InstallDirRegKey HKCU "Software\\GoldBlack Lash Admin" "InstallDir"
RequestExecutionLevel user

!define MUI_ICON "${iconPathWin}"
!define MUI_UNICON "${iconPathWin}"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Instalador de GoldBlack Lash Admin"
!define MUI_WELCOMEPAGE_TEXT "Bienvenida a la instalación del panel de administración y gestión para GoldBlack Lash Studio.\\n\\nPresiona Siguiente para continuar."

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
  CreateShortcut "$SMPROGRAMS\\GoldBlack Lash\\GoldBlack Lash Admin.lnk" "$INSTDIR\\GoldBlack-Lash-Admin.exe" "" "$INSTDIR\\icon.ico" 0
  CreateShortcut "$SMPROGRAMS\\GoldBlack Lash\\Desinstalar.lnk" "$INSTDIR\\Uninstall.exe" "" "$INSTDIR\\icon.ico" 0

  ; Acceso directo en Escritorio
  CreateShortcut "$DESKTOP\\GoldBlack Lash Admin.lnk" "$INSTDIR\\GoldBlack-Lash-Admin.exe" "" "$INSTDIR\\icon.ico" 0

  ; Registro de desinstalación en Panel de Control de Windows
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin" "DisplayName" "GoldBlack Lash Admin"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin" "UninstallString" "$INSTDIR\\Uninstall.exe"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin" "DisplayIcon" "$INSTDIR\\icon.ico,0"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin" "Publisher" "GoldBlack Lash Studio"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$SMPROGRAMS\\GoldBlack Lash\\*.*"
  RMDir "$SMPROGRAMS\\GoldBlack Lash"
  Delete "$DESKTOP\\GoldBlack Lash Admin.lnk"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\GoldBlackLashAdmin"
  DeleteRegKey HKCU "Software\\GoldBlack Lash Admin"
SectionEnd
`

  const nsiFilePath = join(adminRoot, 'installer.nsi')
  writeFileSync(nsiFilePath, nsiScript, 'utf8')

  console.log('[4/4] Generando instalador ejecutable .exe...')
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

  console.log(`\n🎉 INSTALADOR DE WINDOWS 11 CREADO CON ÉXITO:`)
  console.log(`👉 ${finalInstallerPath}`)
} else {
  console.warn('makensis no encontrado, empaquetando como zip portable...')
  const portableZip = join(distInstallers, 'GoldBlack-Lash-Admin-1.0.0-win-portable.zip')
  execSync(`powershell Compress-Archive -Path "${winAppDir}\\*" -DestinationPath "${portableZip}" -Force`)
  console.log(`✓ Paquete portable creado en: ${portableZip}`)
}
