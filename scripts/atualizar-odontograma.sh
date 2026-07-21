#!/usr/bin/env bash
# Recompila o OdontogramShell (vendor/odontogram-modul) e publica o artefato em
# src/lib/odontogramShell/ — ver vendor/odontogram-modul/PATCHES-NEOSAUDE.md.
set -euo pipefail
cd "$(dirname "$0")/.."

cd vendor/odontogram-modul
npm install
npx vite build --config vite.lib.config.ts

DESTINO=../../src/lib/odontogramShell
mkdir -p "$DESTINO"
cp dist-lib/odontogram-shell.js "$DESTINO/"

# Escopa as regras GLOBAIS do CSS deles (body/:root/*) para .odontogram-root:
# CSS importado no Vite vale para o app inteiro — sem isto, o gradiente claro
# do body deles vaza para as nossas páginas (ex.: tema escuro com fundo claro).
sed -e 's/html,body{height:100%}//' \
    -e 's/\.dark body{/.dark .odontogram-root{/g' \
    -e 's/body{/.odontogram-root{/g' \
    -e 's/\*{box-sizing:border-box}/.odontogram-root *{box-sizing:border-box}/' \
    -e 's/:root{/.odontogram-root{/' \
    dist-lib/odontogram-shell.css > "$DESTINO/odontogram-shell.css"

echo "OK: artefatos atualizados em src/lib/odontogramShell/"
