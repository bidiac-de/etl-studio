#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUDIO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEFAULT_DB_PATH="${STUDIO_ROOT}/data/studio.sqlite3"
DB_PATH="${1:-${DEFAULT_DB_PATH}}"

mkdir -p "$(dirname "${DB_PATH}")"

echo "Studio setup SQLite path:"
echo "${DB_PATH}"

if [[ -e "${DB_PATH}" ]]; then
  echo "Note: file already exists."
  echo "Studio setup validator rejects existing files ('File already exists!')."
  echo "Use a new filename/path, or remove the existing file if you want to re-run setup."
else
  echo "Path is ready. Use this value in the setup wizard."
fi
