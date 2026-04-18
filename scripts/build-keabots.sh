#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Building all KeaBots..."

BOTS=(
  keabot-marketing keabot-owner keabot-permit keabot-estimate keabot-gc
  keabot-construction keabot-marketplace keabot-land keabot-operations
  keabot-command keabot-finance keabot-payments keabot-feasibility
  keabot-developer keabot-design keabot-contractor-match
  keabot-project-monitor keabot-support
)

FAILED=()

for bot in "${BOTS[@]}"; do
  dir="bots/$bot"
  if [ ! -d "$dir" ]; then
    echo "  ⚠️  $bot — directory not found, skipping"
    continue
  fi
  echo "  🔨 Building $bot..."
  if (cd "$dir" && pnpm run build 2>&1); then
    echo "  ✅ $bot"
  else
    echo "  ❌ $bot — build failed"
    FAILED+=("$bot")
  fi
done

echo ""
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "✅ All KeaBots built successfully"
else
  echo "❌ Failed: ${FAILED[*]}"
  exit 1
fi

echo "🔨 Building keabots-service..."
(cd services/keabots && pnpm run build)
echo "✅ keabots-service built"
