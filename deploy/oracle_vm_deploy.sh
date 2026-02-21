#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <git_repo_url> [branch]"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"
APP_DIR="$HOME/ai_md_community"

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Edit .env before production use."
fi

docker compose up -d --build

echo "Deployment completed."
docker compose ps
