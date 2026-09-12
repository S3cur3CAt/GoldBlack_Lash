#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Empaquetador de macOS con permisos POSIX UNIX reales, symlinks normalizados
y script de instalación guiado 'Instalar GoldBlack Lash.command'.
"""

import os
import sys
import stat
import zipfile
import shutil

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def is_mach_o_executable(rel_path, filename):
    norm = rel_path.replace('\\', '/')
    if '/Contents/MacOS/' in norm or norm.endswith('/Contents/MacOS/' + filename):
        return True
    if '/MacOS/' in norm:
        return True
    if filename.endswith('.dylib') or filename.endswith('.so'):
        return True
    if filename in (
        'Electron Framework',
        'chrome_crashpad_handler',
        'Squirrel',
        'Mantle',
        'ReactiveObjC',
        'GoldBlack-Lash-Admin',
        'GoldBlack Lash Admin',
        'GoldBlack Lash Admin Helper',
        'GoldBlack Lash Admin Helper (Renderer)',
        'GoldBlack Lash Admin Helper (Plugin)',
        'GoldBlack Lash Admin Helper (GPU)',
    ):
        return True
    return False

def package_mac_zip(source_app_dir, output_zip_path):
    source_app_dir = os.path.abspath(source_app_dir)
    output_zip_path = os.path.abspath(output_zip_path)

    if not os.path.exists(source_app_dir):
        raise FileNotFoundError(f"No existe el directorio de origen: {source_app_dir}")

    os.makedirs(os.path.dirname(output_zip_path), exist_ok=True)
    if os.path.exists(output_zip_path):
        os.remove(output_zip_path)

    app_name = os.path.basename(source_app_dir)
    parent_dir = os.path.dirname(source_app_dir)

    print(f"Empaquetando con permisos UNIX nativos:\n  Origen: {source_app_dir}\n  Destino: {output_zip_path}")

    with zipfile.ZipFile(output_zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        # 1. Script autoejecutable de instalación por primera vez para macOS
        installer_script = f"""#!/bin/bash
# Script de instalación automática de GoldBlack Lash Admin para macOS (Monterey 12.0+)
set -e

DIR="$( cd "$( dirname "${{BASH_SOURCE[0]}}" )" && pwd )"
APP_NAME="{app_name}"

echo "=================================================="
echo "    INSTALADOR OFICIAL GOLDBLACK LASH STUDIO      "
echo "=================================================="
echo ""

# 1. Si ya existe una versión previa en Aplicaciones, reemplazarla
if [ -d "/Applications/$APP_NAME" ]; then
  echo "• Actualizando versión existente en /Applications..."
  rm -rf "/Applications/$APP_NAME"
fi

# 2. Copiar el bundle de la aplicación a /Applications
echo "• Instalando GoldBlack Lash Admin en /Applications..."
cp -R "$DIR/$APP_NAME" "/Applications/"

# 3. Asignar permisos ejecutables a todos los binarios Mach-O
echo "• Configurando permisos ejecutables (+x)..."
chmod -R 755 "/Applications/$APP_NAME/Contents/MacOS"
chmod 755 "/Applications/$APP_NAME/Contents/Frameworks/Electron Framework.framework/Versions/Current/Electron Framework" 2>/dev/null || true
chmod 755 "/Applications/$APP_NAME/Contents/Frameworks/Electron Framework.framework/Versions/Current/Helpers/chrome_crashpad_handler" 2>/dev/null || true

# 4. Limpiar atributo de cuarentena de Gatekeeper para evitar error de apertura
echo "• Configurando seguridad de Gatekeeper (quarantine bypass)..."
xattr -cr "/Applications/$APP_NAME" 2>/dev/null || true

echo ""
echo "=================================================="
echo "  ✓ ¡INSTALACIÓN COMPLETADA CON ÉXITO!            "
echo "=================================================="
echo "• Abriendo GoldBlack Lash Admin..."
open "/Applications/$APP_NAME"

sleep 2
exit 0
"""
        cmd_info = zipfile.ZipInfo("Instalar GoldBlack Lash.command")
        cmd_info.create_system = 3  # UNIX
        cmd_info.external_attr = (stat.S_IFREG | 0o755) << 16
        zf.writestr(cmd_info, installer_script.encode('utf-8'))

        # 2. Recorrer árbol de archivos
        total_files = 0
        total_execs = 0
        total_links = 0

        # Para controlar carpetas ya añadidas al zip
        added_dirs = set()

        for root, dirs, files in os.walk(source_app_dir, followlinks=False):
            # Asegurar que los directorios tengan entrada con 0o755
            rel_dir = os.path.relpath(root, parent_dir).replace('\\', '/')
            if rel_dir not in added_dirs:
                d_info = zipfile.ZipInfo(f"{rel_dir}/")
                d_info.create_system = 3
                d_info.external_attr = (stat.S_IFDIR | 0o755) << 16
                zf.writestr(d_info, '')
                added_dirs.add(rel_dir)

            # Archivos y enlaces en esta carpeta
            for name in files:
                full_path = os.path.join(root, name)
                rel_path = os.path.relpath(full_path, parent_dir).replace('\\', '/')

                if os.path.islink(full_path):
                    target = os.readlink(full_path)
                    # Convertir separadores de Windows a UNIX
                    target_unix = target.replace('\\', '/')

                    l_info = zipfile.ZipInfo(rel_path)
                    l_info.create_system = 3
                    l_info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    zf.writestr(l_info, target_unix)
                    total_links += 1
                else:
                    is_exec = is_mach_o_executable(rel_path, name)
                    mode = 0o755 if is_exec else 0o644

                    f_info = zipfile.ZipInfo(rel_path)
                    f_info.create_system = 3
                    f_info.external_attr = (stat.S_IFREG | mode) << 16

                    with open(full_path, 'rb') as f:
                        zf.writestr(f_info, f.read())

                    total_files += 1
                    if is_exec:
                        total_execs += 1

            # Revisar si hay symlinks que apuntan a directorios
            for d in dirs:
                full_d = os.path.join(root, d)
                if os.path.islink(full_d):
                    rel_d = os.path.relpath(full_d, parent_dir).replace('\\', '/')
                    target = os.readlink(full_d).replace('\\', '/')

                    l_info = zipfile.ZipInfo(rel_d)
                    l_info.create_system = 3
                    l_info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    zf.writestr(l_info, target)
                    total_links += 1

    size_mb = os.path.getsize(output_zip_path) / (1024 * 1024)
    print(f"✓ Paquete empaquetado exitosamente:")
    print(f"  Archivos regulares: {total_files} ({total_execs} ejecutables con 0755)")
    print(f"  Enlaces simbólicos: {total_links} (normalizados con forward-slashes)")
    print(f"  Tamaño final: {size_mb:.1f} MB")

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        src = sys.argv[1]
        out = sys.argv[2]
    else:
        # Rutas por defecto
        admin_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        src = os.path.join(admin_root, 'dist-packages', 'GoldBlack Lash Admin-darwin-x64', 'GoldBlack Lash Admin.app')
        
        # Leer version de package.json
        import json
        with open(os.path.join(admin_root, 'package.json'), 'r', encoding='utf-8') as f:
            pkg = json.load(f)
        ver = pkg.get('version', '0.0.7')
        out = os.path.join(admin_root, 'dist-installers', f'GoldBlack-Lash-Admin-{ver}-macOS-Monterey.zip')

    package_mac_zip(src, out)
