#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT"
if command -v curl >/dev/null 2>&1 && curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
LOGDIR=/tmp
if [ ! -d "$LOGDIR" ] || [ ! -w "$LOGDIR" ]; then
  LOGDIR="$ROOT"
fi
npm run dev >>"$LOGDIR/app-startup.log" 2>&1 &
