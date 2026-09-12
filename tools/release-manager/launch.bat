@echo off
title GoldBlack Lash — Gestor de Actualizaciones
cd /d "%~dp0"
echo Iniciando GoldBlack Lash - Gestor de Actualizaciones...
call ..\..\node_modules\.bin\electron.cmd main.cjs
