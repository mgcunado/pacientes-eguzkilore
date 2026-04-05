#!/bin/bash

# Ruta completa a deno (AJUSTA según el resultado de 'which deno')
DENO_PATH="/home/mikel/.deno/bin/deno"

# Cambiar al directorio del proyecto (ajusta la ruta según corresponda)
cd .

# Iniciar el servidor de Deno en una terminal visible
xfce4-terminal -e "bash -c '$DENO_PATH task dev'" &
# xfce4-terminal -e "bash -c '$DENO_PATH task dev; echo \"Presiona Enter para cerrar...\"; read'" &

# Esperar un momento para que el navegador se abra primero
sleep 5

# Abrir el navegador Brave en la URL del proyecto
brave --new-window http://localhost:5173/patients &
