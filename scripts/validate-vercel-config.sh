#!/bin/bash
# Validate all vercel.json files for schema compliance

echo "🔍 Validating all vercel.json files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0
APPS=("m-marketplace" "m-project-owner" "m-permits-inspections" "m-ops-services" "m-architect" "os-pm" "os-admin")

for app in "${APPS[@]}"; do
  echo ""
  echo "📦 Checking: $app"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  VERCEL_JSON="apps/$app/vercel.json"
  
  if [ ! -f "$VERCEL_JSON" ]; then
    echo "❌ vercel.json not found: $VERCEL_JSON"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  
  # Check for _comment property
  if grep -q '"_comment"' "$VERCEL_JSON" || grep -q "'_comment'" "$VERCEL_JSON"; then
    echo "❌ ERROR: Found '_comment' property in $VERCEL_JSON"
    echo "   Line(s) with _comment:"
    grep -n "_comment" "$VERCEL_JSON" || true
    ERRORS=$((ERRORS + 1))
  fi
  
  # Validate JSON syntax
  if ! python3 -m json.tool "$VERCEL_JSON" > /dev/null 2>&1; then
    echo "❌ ERROR: Invalid JSON syntax in $VERCEL_JSON"
    python3 -m json.tool "$VERCEL_JSON" 2>&1 | head -n 10 || true
    ERRORS=$((ERRORS + 1))
  else
    echo "✅ Valid JSON syntax"
  fi
  
  # Check for common invalid properties
  INVALID_PROPS=("_comment" "_notes" "_description" "comment" "notes")
  for prop in "${INVALID_PROPS[@]}"; do
    if grep -qi "\"$prop\"" "$VERCEL_JSON" || grep -qi "'$prop'" "$VERCEL_JSON"; then
      echo "⚠️  WARNING: Found potentially invalid property: $prop"
      grep -n -i "$prop" "$VERCEL_JSON" || true
    fi
  done
  
  echo "✅ $app: vercel.json is valid"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "✅ All vercel.json files are valid!"
  exit 0
else
  echo "❌ Found $ERRORS error(s) in vercel.json files"
  echo ""
  echo "💡 Fix Steps:"
  echo "  1. Remove '_comment' or other invalid properties from vercel.json"
  echo "  2. Only use properties from Vercel's official schema:"
  echo "     - buildCommand, installCommand, framework"
  echo "     - rewrites, headers, routes"
  echo "     - env, regions, github, public"
  echo "  3. Re-run this script to verify"
  exit 1
fi

