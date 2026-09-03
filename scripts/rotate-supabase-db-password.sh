#!/usr/bin/env bash
#
# Rolls a new Supabase database password across every Railway service that
# holds a connection string for it.
#
# ── Why a script ───────────────────────────────────────────────────────────
#
# Resetting the password in Supabase invalidates the old one immediately, so
# every service is broken from that moment until its variables are updated.
# Doing eleven variables by hand across nine services makes that window
# minutes long. This makes it one pass.
#
# The password is read from the environment, never passed as an argument and
# never echoed — an argument is visible in `ps` and in shell history.
#
# ── Use ────────────────────────────────────────────────────────────────────
#
#   1. Supabase → Project Settings → Database → Reset database password.
#   2. read -rs SUPABASE_DB_PASSWORD && export SUPABASE_DB_PASSWORD
#      (paste, press enter — `-s` keeps it off the screen)
#   3. ./scripts/rotate-supabase-db-password.sh --dry-run
#   4. ./scripts/rotate-supabase-db-password.sh
#   5. unset SUPABASE_DB_PASSWORD
#
# Requires the Railway CLI, logged in and linked to the project.

set -euo pipefail

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "SUPABASE_DB_PASSWORD is not set." >&2
  echo "  read -rs SUPABASE_DB_PASSWORD && export SUPABASE_DB_PASSWORD" >&2
  exit 1
fi

# The Supabase project this rotation applies to. Any connection string that
# does NOT carry this user is left alone — marketing-cron, engineering-worker
# and the Railway Postgres addon point at a different database, and writing
# this password into them would break three working services.
REF="postgres.rkreqfpkxavqpsqexbfs"

echo "Discovering services with a connection string for ${REF} ..."
SERVICES=$(railway status --json 2>/dev/null | python3 -c "
import json,sys
d = json.load(sys.stdin)
for s in d.get('services', {}).get('edges', []):
    print(s['node']['name'])
")

TOTAL=0
for svc in $SERVICES; do
  # Retry, then fail loudly. Swallowing a CLI error here silently skips a
  # service — and a service skipped during a rotation is one left holding a
  # password that no longer works. A dry run caught exactly that: a transient
  # failure dropped command-center from the list with no indication.
  vars_json=""
  for attempt in 1 2 3; do
    if vars_json=$(railway variables --service "$svc" --json 2>/dev/null) \
       && printf '%s' "$vars_json" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
      break
    fi
    vars_json=""
    sleep 3
  done
  if [ -z "$vars_json" ]; then
    echo "FAILED to read variables for '$svc' after 3 attempts. Aborting rather than" >&2
    echo "leaving it behind on a password that is about to stop working." >&2
    exit 1
  fi

  keys=$(printf '%s' "$vars_json" | REF="$REF" python3 -c "
import json, sys, os
ref = os.environ['REF']
d = json.load(sys.stdin)
print(' '.join(sorted(k for k, v in d.items() if isinstance(v, str) and ref in v)))
")
  [ -z "$keys" ] && continue

  for key in $keys; do
    cur=$(printf '%s' "$vars_json" | KEY="$key" python3 -c "
import json, sys, os
print(json.load(sys.stdin)[os.environ['KEY']])
")
    # Substitute ONLY the password component. Host, user, port, database and
    # query string are left byte-identical — this is a credential rotation, not
    # a connection-string rewrite.
    new=$(printf '%s' "$cur" | python3 -c "
import sys, os, re, urllib.parse
u = sys.stdin.read().strip()
pw = urllib.parse.quote(os.environ['SUPABASE_DB_PASSWORD'], safe='')
out = re.sub(r'^(\w+://[^:/@]+:)[^@]*(@)', lambda m: m.group(1) + pw + m.group(2), u, count=1)
assert out != u, 'password substitution did not apply'
sys.stdout.write(out)
")
    # Print the shape, never the secret.
    printf '%s' "$new" | SVC="$svc" KEY="$key" python3 -c "
import sys, os, re
u = sys.stdin.read()
m = re.match(r'^(\w+)://([^:]+):([^@]*)@(.*)$', u)
print(f\"  {os.environ['SVC']:<22} {os.environ['KEY']:<14} \"
      f\"{m.group(1)}://{m.group(2)}:<PW len={len(m.group(3))}>@{m.group(4)}\")
"
    if [ "$DRY_RUN" -eq 0 ]; then
      printf '%s' "$new" | railway variables --service "$svc" --set-from-stdin "$key" >/dev/null
    fi
    TOTAL=$((TOTAL + 1))
  done
done

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run: ${TOTAL} variable(s) would be updated. Re-run without --dry-run to apply."
else
  echo "Updated ${TOTAL} variable(s). Each service redeploys on its own."
  echo "Watch for Prisma auth failures:  railway logs --service worker --deployment"
fi
