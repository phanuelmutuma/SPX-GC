#!/bin/bash
# SPX Graphics Controller — macOS app launcher
# Starts the packaged server next to this script's Resources/app folder
# and opens the controller UI once it is listening.

set -e

PORT="${SPX_PORT:-5656}"
APP_ROOT="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
LOG_DIR="${HOME}/Library/Logs"
LOG_FILE="${LOG_DIR}/SPX-GC.log"
SERVER_BIN="${APP_ROOT}/SPX"

mkdir -p "${LOG_DIR}"

if [ ! -x "${SERVER_BIN}" ]; then
  osascript -e 'display alert "SPX Graphics Controller" message "The SPX server binary is missing. Reinstall the app." as critical'
  exit 1
fi

already_running() {
  curl -s -o /dev/null --connect-timeout 1 "http://127.0.0.1:${PORT}/" 2>/dev/null
}

open_ui() {
  open "http://localhost:${PORT}/"
}

if already_running; then
  open_ui
  exit 0
fi

cd "${APP_ROOT}"
export SPX_LAUNCHER=1
"${SERVER_BIN}" >> "${LOG_FILE}" 2>&1 &
SPX_PID=$!

cleanup() {
  if kill -0 "${SPX_PID}" 2>/dev/null; then
    kill "${SPX_PID}" 2>/dev/null || true
    wait "${SPX_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

tries=0
while [ "${tries}" -lt 40 ]; do
  if already_running; then
    open_ui
    wait "${SPX_PID}"
    exit $?
  fi
  if ! kill -0 "${SPX_PID}" 2>/dev/null; then
    wait "${SPX_PID}" || true
    osascript -e "display alert \"SPX Graphics Controller\" message \"SPX failed to start. Check ${LOG_FILE} for details.\" as critical"
    exit 1
  fi
  tries=$((tries + 1))
  sleep 0.25
done

osascript -e "display alert \"SPX Graphics Controller\" message \"SPX did not become ready on port ${PORT}. Check ${LOG_FILE}.\" as critical"
exit 1
