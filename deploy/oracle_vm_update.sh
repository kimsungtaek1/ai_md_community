#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/ai_md_community"
BRANCH="${1:-main}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "App directory not found: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

docker compose up -d --build

echo "Updated to latest ${BRANCH}."
docker compose ps
