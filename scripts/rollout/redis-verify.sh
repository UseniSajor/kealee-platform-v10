#!/usr/bin/env bash
# =============================================================================
# scripts/rollout/redis-verify.sh
#
# Redis dedup verification for contractor acquisition workflow.
# Verifies acq:dedup:* keys are present and have correct TTLs.
#
# Usage:
#   REDIS_URL=redis://... bash scripts/rollout/redis-verify.sh
#   REDIS_URL=redis://... bash scripts/rollout/redis-verify.sh --inject-test
# =============================================================================

set -euo pipefail

REDIS_URL="${REDIS_URL:-}"
REDIS_CLI="redis-cli"

if [ -z "$REDIS_URL" ]; then
  echo "❌ REDIS_URL not set"
  exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅  PASS${NC}: $1"; }
fail() { echo -e "${RED}❌  FAIL${NC}: $1"; }
warn() { echo -e "${YELLOW}⚠️   WARN${NC}: $1"; }
info() { echo -e "    $1"; }

rcli() { $REDIS_CLI -u "$REDIS_URL" "$@" 2>/dev/null; }

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  REDIS DEDUP VERIFICATION"
echo -e "  Contractor Acquisition Engine"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# ─── TEST: Redis connectivity ─────────────────────────────────────────────────
echo "1. Testing Redis connectivity..."
PONG=$(rcli PING 2>/dev/null || echo "ERROR")
if [ "$PONG" = "PONG" ]; then
  pass "Redis connected"
else
  fail "Redis connection failed: $PONG"
  exit 1
fi

# ─── SHOW: All dedup keys ─────────────────────────────────────────────────────
echo -e "\n2. Scanning acq:dedup:* keys..."
KEYS=$(rcli KEYS "acq:dedup:*" 2>/dev/null || echo "")

if [ -z "$KEYS" ]; then
  warn "No acq:dedup:* keys found. Keys appear after first campaign fires."
  echo "  Expected key patterns:"
  echo "    acq:dedup:outreach:{trade}:{email}       TTL: 604800s (7 days)"
  echo "    acq:dedup:registration:{userId}           TTL: 172800s (2 days)"
  echo "    acq:dedup:documents:{userId}              TTL: 259200s (3 days)"
  echo "    acq:dedup:verified:{userId}               TTL: 2592000s (30 days)"
  echo "    acq:dedup:reengagement:{profileId}        TTL: 1209600s (14 days)"
else
  pass "Found dedup keys"
  echo ""

  # Count by step type
  declare -A step_counts
  while IFS= read -r key; do
    step=$(echo "$key" | cut -d: -f3)
    step_counts["$step"]=$((${step_counts["$step"]:-0} + 1))
  done <<< "$KEYS"

  for step in "${!step_counts[@]}"; do
    info "  acq:dedup:${step}: ${step_counts[$step]} key(s)"
  done

  # Verify TTLs on sample keys
  echo -e "\n3. Verifying TTLs on sample keys..."

  # Expected TTLs per step
  declare -A expected_ttl
  expected_ttl[outreach]=604800
  expected_ttl[registration]=172800
  expected_ttl[documents]=259200
  expected_ttl[verified]=2592000
  expected_ttl[reengagement]=1209600

  SAMPLE_COUNT=0
  while IFS= read -r key; do
    step=$(echo "$key" | cut -d: -f3)
    ttl=$(rcli TTL "$key" 2>/dev/null || echo "-2")
    expected=${expected_ttl[$step]:-0}

    if [ "$ttl" = "-1" ]; then
      fail "Key $key has no TTL (will never expire!)"
    elif [ "$ttl" = "-2" ]; then
      warn "Key $key does not exist"
    elif [ "$expected" -gt 0 ]; then
      # Allow up to 10% elapsed (key was set recently)
      min_ttl=$(( expected * 9 / 10 ))
      if [ "$ttl" -ge "$min_ttl" ]; then
        pass "Key $key TTL: ${ttl}s (expected ~${expected}s)"
      else
        warn "Key $key TTL: ${ttl}s lower than expected ${expected}s (may have been set earlier)"
      fi
    fi

    ((SAMPLE_COUNT++))
    [ $SAMPLE_COUNT -ge 10 ] && break  # Only check first 10
  done <<< "$KEYS"
fi

# ─── INJECT TEST: simulate dedup ─────────────────────────────────────────────
if [[ "${1:-}" == "--inject-test" ]]; then
  echo -e "\n4. Injecting test dedup key to verify NX behavior..."

  TEST_KEY="acq:dedup:outreach:Framing:dedup-test@kealee-test.invalid"

  # First SET NX — should succeed
  result1=$(rcli SET "$TEST_KEY" "1" EX 60 NX)
  if [ "$result1" = "OK" ]; then
    pass "First SET NX succeeded (key did not exist)"
  else
    fail "First SET NX failed: $result1"
  fi

  # Second SET NX — should return null (key exists)
  result2=$(rcli SET "$TEST_KEY" "1" EX 60 NX)
  if [ -z "$result2" ]; then
    pass "Second SET NX returned null (dedup working correctly)"
  else
    fail "Second SET NX returned $result2 (expected null — dedup broken!)"
  fi

  # Cleanup
  rcli DEL "$TEST_KEY" > /dev/null
  pass "Test key cleaned up"
fi

# ─── SHOW: Growth bot dedup keys ─────────────────────────────────────────────
echo -e "\n5. Checking GrowthBot workflow dedup keys..."
GROWTH_KEYS=$(rcli KEYS "growth-exec:*" 2>/dev/null || echo "")
if [ -z "$GROWTH_KEYS" ]; then
  info "No growth-exec:* keys yet (appear after first recommendation executes)"
else
  COUNT=$(echo "$GROWTH_KEYS" | wc -l)
  pass "Found $COUNT growth-exec:* key(s)"
fi

# ─── SHOW: BullMQ queue health ────────────────────────────────────────────────
echo -e "\n6. BullMQ kealee-growth-bot queue status..."
WAITING=$(rcli LLEN "bull:kealee-growth-bot:wait" 2>/dev/null || echo "N/A")
ACTIVE=$(rcli LLEN "bull:kealee-growth-bot:active" 2>/dev/null || echo "N/A")
DELAYED=$(rcli ZCARD "bull:kealee-growth-bot:delayed" 2>/dev/null || echo "N/A")
FAILED=$(rcli LLEN "bull:kealee-growth-bot:failed" 2>/dev/null || echo "N/A")

echo "  Queue: kealee-growth-bot"
echo "    Waiting:  $WAITING"
echo "    Active:   $ACTIVE"
echo "    Delayed:  $DELAYED"
echo "    Failed:   $FAILED"

if [ "$FAILED" != "N/A" ] && [ "$FAILED" -gt 0 ]; then
  warn "$FAILED failed jobs in kealee-growth-bot queue — investigate!"
else
  pass "No failed jobs"
fi

# ─── Check delayed email jobs ─────────────────────────────────────────────────
echo -e "\n7. Checking recruitment email delayed jobs..."
DELAYED_JOBS=$(rcli ZRANGE "bull:kealee-growth-bot:delayed" 0 -1 2>/dev/null || echo "")
EMAIL2_COUNT=$(echo "$DELAYED_JOBS" | grep -c "recruitment-email-2" 2>/dev/null || echo "0")
EMAIL3_COUNT=$(echo "$DELAYED_JOBS" | grep -c "recruitment-email-3" 2>/dev/null || echo "0")

info "  Delayed email-2 jobs: $EMAIL2_COUNT"
info "  Delayed email-3 jobs: $EMAIL3_COUNT"

if [ "$EMAIL2_COUNT" -gt 0 ] && [ "$EMAIL3_COUNT" -gt 0 ]; then
  pass "Recruitment sequence delayed jobs enqueued"
else
  info "  (No delayed email jobs yet — fire a test shortage to populate)"
fi

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Redis dedup verification complete."
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
