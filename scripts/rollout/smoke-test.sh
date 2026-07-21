#!/usr/bin/env bash
# =============================================================================
# scripts/rollout/smoke-test.sh
#
# Production smoke tests for the contractor acquisition automation engine.
# Run after deploying api and command-center to Railway.
#
# Usage:
#   API_BASE=https://api.kealee.com INTERNAL_API_KEY=xxx bash scripts/rollout/smoke-test.sh
#
# Exit code 0 = all tests passed
# Exit code 1 = one or more tests failed
# =============================================================================

set -euo pipefail

API_BASE="${API_BASE:-https://api.kealee.com}"
INTERNAL_KEY="${INTERNAL_API_KEY:-}"
PASS=0
FAIL=0
FAILURES=()

# ─── Colors ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅  PASS${NC}: $1"; ((PASS++)); }
fail() { echo -e "${RED}❌  FAIL${NC}: $1 — $2"; ((FAIL++)); FAILURES+=("$1"); }
warn() { echo -e "${YELLOW}⚠️   WARN${NC}: $1"; }
section() { echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n  $1\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; }

# ─── HTTP helpers ─────────────────────────────────────────────────────────────

get() {
  curl -sf \
    -H "x-internal-key: ${INTERNAL_KEY}" \
    -H "Content-Type: application/json" \
    -w "\n%{http_code}" \
    "${API_BASE}${1}" 2>/dev/null || echo -e "\n000"
}

post() {
  curl -sf \
    -X POST \
    -H "x-internal-key: ${INTERNAL_KEY}" \
    -H "Content-Type: application/json" \
    -d "${2}" \
    -w "\n%{http_code}" \
    "${API_BASE}${1}" 2>/dev/null || echo -e "\n000"
}

# Extract HTTP status code from response (last line)
status_of() { echo "$1" | tail -1; }
body_of()   { echo "$1" | head -n -1; }

# ─── TEST 1: API health ───────────────────────────────────────────────────────
section "TEST 1: API Health"

response=$(get "/health" 2>/dev/null || echo -e '{}\n000')
status=$(status_of "$response")
if [ "$status" = "200" ]; then
  pass "GET /health → 200"
else
  fail "GET /health" "Expected 200, got $status"
fi

# ─── TEST 2: Zoho status ─────────────────────────────────────────────────────
section "TEST 2: Zoho CRM Status"

response=$(get "/zoho/status")
status=$(status_of "$response")
body=$(body_of "$response")

if [ "$status" = "200" ]; then
  pass "GET /zoho/status → 200"
  if echo "$body" | grep -q '"configured":true'; then
    pass "Zoho configured: true"
  elif echo "$body" | grep -q '"configured":false'; then
    fail "Zoho configured" "configured=false — check ZOHO_* env vars"
  else
    warn "Zoho status response unexpected: $body"
  fi
else
  fail "GET /zoho/status" "Expected 200, got $status. Response: $body"
fi

# Expected response:
# {"configured":true,"domain":"com","stages":["Contacted","Interested",...]}

# ─── TEST 3: Zoho lead creation ───────────────────────────────────────────────
section "TEST 3: Zoho Lead Creation"

LEAD_PAYLOAD='{
  "firstName": "Smoke",
  "lastName": "Test",
  "email": "smoke-test-acq@kealee-test.invalid",
  "trade": "Framing",
  "geo": "Austin, TX",
  "campaignSource": "smoke_test"
}'

response=$(post "/zoho/leads" "$LEAD_PAYLOAD")
status=$(status_of "$response")
body=$(body_of "$response")

if [ "$status" = "201" ] || [ "$status" = "200" ]; then
  pass "POST /zoho/leads → $status"
  if echo "$body" | grep -q '"id"'; then
    LEAD_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    pass "Lead ID returned: ${LEAD_ID:-unknown}"
  else
    warn "No lead ID in response: $body"
  fi
else
  fail "POST /zoho/leads" "Expected 200/201, got $status. Response: $body"
fi

# ─── TEST 4: Zoho leads by stage ─────────────────────────────────────────────
section "TEST 4: Zoho Pipeline Query"

response=$(get "/zoho/leads/stage/Contacted")
status=$(status_of "$response")

if [ "$status" = "200" ]; then
  pass "GET /zoho/leads/stage/Contacted → 200"
else
  fail "GET /zoho/leads/stage/Contacted" "Expected 200, got $status"
fi

# ─── TEST 5: Webhook health endpoint ─────────────────────────────────────────
section "TEST 5: Zoho Webhook Health"

response=$(get "/zoho/webhook/health")
status=$(status_of "$response")

if [ "$status" = "200" ]; then
  pass "GET /zoho/webhook/health → 200"
else
  fail "GET /zoho/webhook/health" "Expected 200, got $status"
fi

# ─── TEST 6: Webhook token protection ────────────────────────────────────────
section "TEST 6: Webhook Token Protection"

# Without token should return 401 (or 200 if token not configured — just warn)
response=$(curl -sf -X POST \
  -H "Content-Type: application/json" \
  -d '{"module":"Leads","operation":"create","data":[]}' \
  -w "\n%{http_code}" \
  "${API_BASE}/zoho/webhook" 2>/dev/null || echo -e "{}\n000")
status=$(status_of "$response")

if [ "$status" = "401" ]; then
  pass "Webhook without token → 401 (protected)"
elif [ "$status" = "200" ]; then
  warn "Webhook accepted without token — set ZOHO_WEBHOOK_TOKEN to enable security"
else
  warn "Webhook without token → $status (check webhook route)"
fi

# ─── TEST 7: Synthetic acquisition event ─────────────────────────────────────
section "TEST 7: Synthetic Trade Shortage Event (command-center internal)"

# This calls an internal trigger endpoint if available
# or verifies the BullMQ queue receives the job

TRIGGER_PAYLOAD='{
  "type": "trade_shortage_test",
  "trade": "Framing",
  "shortageScore": 82,
  "geo": "Austin, TX",
  "dryRun": true
}'

response=$(post "/internal/acquisition/trigger" "$TRIGGER_PAYLOAD" 2>/dev/null || echo -e '{"note":"no internal trigger route"}\n404')
status=$(status_of "$response")

if [ "$status" = "200" ]; then
  pass "Synthetic acquisition trigger → 200"
else
  warn "Internal trigger endpoint not available (status $status) — test via Redis/BullMQ directly"
fi

# ─── TEST 8: Redis dedup key namespace ───────────────────────────────────────
section "TEST 8: Redis Dedup (advisory)"

echo "  To verify Redis dedup manually:"
echo '  redis-cli -u "$REDIS_URL" KEYS "acq:dedup:*"'
echo '  Expected: acq:dedup:outreach:*, acq:dedup:registration:*, etc.'
echo '  Keys should appear after first campaign fires.'
warn "Redis dedup must be verified manually — see Section J of rollout runbook"

# ─── RESULTS ─────────────────────────────────────────────────────────────────

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  SMOKE TEST RESULTS"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Passed: ${PASS}${NC}"
echo -e "  ${RED}Failed: ${FAIL}${NC}"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo -e "\n  Failed tests:"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}✗${NC} $f"
  done
  echo -e "\n❌  Smoke tests FAILED. Do not proceed with launch.\n"
  exit 1
else
  echo -e "\n✅  All smoke tests passed. Safe to launch.\n"
  exit 0
fi
