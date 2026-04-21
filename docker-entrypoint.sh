#!/bin/sh
set -eu

STORAGE_PATH="${STORAGE_DIR:-/app/.storage}"

mkdir -p "$STORAGE_PATH"
chown -R nextjs:nodejs "$STORAGE_PATH"

if [ "$#" -eq 0 ]; then
  set -- node server.js
fi

case "$1" in
  node|npx|npm|tsx)
    exec su-exec nextjs:nodejs "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
