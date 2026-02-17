#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUDIO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STUDIO_HOST="${STUDIO_HOST:-127.0.0.1}"
STUDIO_PORT="${STUDIO_PORT:-8080}"

if ! command -v php >/dev/null 2>&1; then
  echo "php command not found. Install PHP 8+ first (for example: brew install php)." >&2
  exit 1
fi

mkdir -p "${STUDIO_ROOT}/data"

echo "Starting ETL Studio at http://${STUDIO_HOST}:${STUDIO_PORT}"
cd "${STUDIO_ROOT}"
php -S "${STUDIO_HOST}:${STUDIO_PORT}"
