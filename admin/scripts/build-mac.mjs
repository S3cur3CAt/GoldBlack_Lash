import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const adminRoot = join(__dirname, '..')
const distInstallers = join(adminRoot, 'dist-installers')
const distPackages = join(adminRoot, 'dist-packages')

const pkg = JSON.parse(readFileSync(join(adminRoot, 'package.json'), 'utf8'))
const appVersion = pkg.version || '0.0.1'

console.log('=== Compilando GoldBlack Lash Admin para macOS Monterey (macOS 12.0+) ===')

// 1. Ensure dist-installers exists
if (!existsSync(distInstallers)) {
  mkdirSync(distInstallers, { recursive: true })
}

// 2. Build Frontend
console.log('\n[1/3] Compilando frontend React con Vite...')
execSync('pnpm run build', { cwd: adminRoot, stdio: 'inherit' })

// 3. Package macOS with electron-packager
console.log('\n[2/3] Empaquetando runtime de macOS Monterey (darwin-x64, Electron 11.5.0)...')
const packager = (await import('electron-packager')).default

const appPaths = await packager({
  dir: adminRoot,
  name: 'GoldBlack Lash Admin',
  executableName: 'GoldBlack-Lash-Admin',
  platform: 'darwin',
  arch: 'x64',
  electronVersion: '11.5.0',
  icon: join(adminRoot, 'build', 'icon.icns'),
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
  appBundleId: 'com.goldblacklash.admin',
  appCategoryType: 'public.app-category.business',
  appVersion,
  appCopyright: 'Copyright © 2026 GoldBlack Lash Studio',
})

const macAppDir = appPaths[0]
console.log(`✓ Bundle de macOS creado en: ${macAppDir}`)

// Ensure ICNS is copied to Resources as electron.icns and app icon
const resourcesDir = join(macAppDir, 'GoldBlack Lash Admin.app', 'Contents', 'Resources')
const sourceIcns = join(adminRoot, 'build', 'icon.icns')
if (existsSync(resourcesDir) && existsSync(sourceIcns)) {
  try {
    const { copyFileSync } = await import('node:fs')
    copyFileSync(sourceIcns, join(resourcesDir, 'electron.icns'))
    copyFileSync(sourceIcns, join(resourcesDir, 'GoldBlack Lash Admin.icns'))
    console.log('✓ Icono ICNS copiado al bundle de macOS Contents/Resources.')
  } catch (e) {
    console.warn('Advertencia al copiar icono:', e.message)
  }
}

// 4. Validate & Adjust Info.plist for macOS 12.0 Monterey
console.log('\n[3/3] Configurando Info.plist con LSMinimumSystemVersion = 12.0.0...')
const plistPath = join(macAppDir, 'GoldBlack Lash Admin.app', 'Contents', 'Info.plist')
if (existsSync(plistPath)) {
  let plistContent = readFileSync(plistPath, 'utf8')

  // Ensure LSMinimumSystemVersion is set to 12.0.0 for Monterey
  if (plistContent.includes('<key>LSMinimumSystemVersion</key>')) {
    plistContent = plistContent.replace(
      /<key>LSMinimumSystemVersion<\/key>\s*<string>[^<]*<\/string>/,
      '<key>LSMinimumSystemVersion</key>\n    <string>12.0.0</string>'
    )
  } else {
    plistContent = plistContent.replace(
      '</dict>',
      '  <key>LSMinimumSystemVersion</key>\n    <string>12.0.0</string>\n  </dict>'
    )
  }

  writeFileSync(plistPath, plistContent, 'utf8')
  console.log('✓ Info.plist verificado para compatibilidad con macOS 12.0 Monterey.')
}

// 5. Compress into final distributable zip with native UNIX POSIX permissions and 1-click installer
const finalMacZip = join(distInstallers, `GoldBlack-Lash-Admin-${appVersion}-macOS-Monterey.zip`)
console.log(`\nGenerando paquete distribuible de macOS con permisos POSIX nativos y script instalador: ${finalMacZip}...`)

const packagerPy = join(__dirname, 'package-mac-zip.py')
const appDir = join(macAppDir, 'GoldBlack Lash Admin.app')
execSync(`python "${packagerPy}" "${appDir}" "${finalMacZip}"`, { stdio: 'inherit' })

console.log(`\n🎉 PAQUETE DE MACOS MONTEREY CREADO CON ÉXITO:`)
console.log(`👉 ${finalMacZip}`)
