#!/usr/bin/env bash
# init_postgres.sh — PostgreSQL 스키마 초기화 스크립트
#
# 사용법:
#   DATABASE_URL="postgres://user:pass@host:5432/dbname" bash scripts/init_postgres.sh
#
# 또는 개별 변수:
#   PGHOST=localhost PGPORT=5432 PGUSER=ai_md PGPASSWORD=ai_md_password PGDATABASE=ai_md_community \
#     bash scripts/init_postgres.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../db/postgres_schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "ERROR: Schema file not found: $SCHEMA_FILE"
  exit 1
fi

echo "Applying PostgreSQL schema from $SCHEMA_FILE ..."

if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -f "$SCHEMA_FILE"
else
  psql -f "$SCHEMA_FILE"
fi

echo "Schema applied successfully."
