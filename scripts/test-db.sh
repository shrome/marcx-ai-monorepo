#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.test.yml"
ENV_FILE="$SCRIPT_DIR/../.env.test"

start() {
  echo "🐳 Starting test database..."
  docker compose -f "$COMPOSE_FILE" up -d

  echo "⏳ Waiting for Postgres to be healthy..."
  until docker compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U test -d marcx_test > /dev/null 2>&1; do
    sleep 1
  done
  echo "✅ Postgres is ready"
}

migrate() {
  echo "🔄 Running migrations..."
  set -a; source "$ENV_FILE"; set +a
  node -e "
const { migrations } = require('$SCRIPT_DIR/../packages/drizzle/dist/index.cjs');
migrations().then(() => { console.log('✅ Migrations complete'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
"
}

stop() {
  echo "🛑 Stopping test database..."
  docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
  echo "✅ Test database stopped"
}

case "${1:-start}" in
  start)   start ;;
  migrate) migrate ;;
  stop)    stop ;;
  reset)   stop; start; migrate ;;
  *)
    echo "Usage: $0 {start|stop|migrate|reset}"
    exit 1
    ;;
esac
