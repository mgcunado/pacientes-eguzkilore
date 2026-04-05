#!/bin/bash

# Cargar variables desde .env (si existe)
if [ -f "$(dirname "$0")/.env" ]; then
    set -a # Exportar automáticamente todas las variables
    source "$(dirname "$0")/.env"
    set +a
fi

DENO_PATH="${DENO_PATH}"
PROJECT_DIR="${PROJECT_DIR:-$(dirname "$0")}"

cd "$PROJECT_DIR" || exit 1
xfce4-terminal -e "bash -c '$DENO_PATH task dev'" &
sleep 2

brave --new-window http://localhost:5173/patients &
