#!/bin/bash
# Copy authentication pages to all client-facing apps

set -e

APPS=(
  "apps/m-ops-services"
  "apps/m-architect"
  "apps/m-permits-inspections"
)

SOURCE_APP="apps/m-project-owner"

echo "📋 Copying authentication pages to all apps..."
echo ""

for app in "${APPS[@]}"; do
  if [ ! -d "$app" ]; then
    echo "⚠️  Skipping $app (not found)"
    continue
  fi

  echo "📦 Copying to $app..."

  # Create directories
  mkdir -p "$app/app/login"
  mkdir -p "$app/app/signup"
  mkdir -p "$app/app/auth/verify-email"
  mkdir -p "$app/app/auth/forgot-password"
  mkdir -p "$app/app/auth/reset-password"

  # Copy files
  cp "$SOURCE_APP/app/login/page.tsx" "$app/app/login/page.tsx"
  cp "$SOURCE_APP/app/signup/page.tsx" "$app/app/signup/page.tsx"
  cp "$SOURCE_APP/app/auth/verify-email/page.tsx" "$app/app/auth/verify-email/page.tsx"
  cp "$SOURCE_APP/app/auth/forgot-password/page.tsx" "$app/app/auth/forgot-password/page.tsx"
  cp "$SOURCE_APP/app/auth/reset-password/page.tsx" "$app/app/auth/reset-password/page.tsx"
  cp "$SOURCE_APP/middleware.ts" "$app/middleware.ts"

  echo "✅ Copied auth pages to $app"
done

echo ""
echo "✅ All authentication pages copied!"
echo ""
echo "Next steps:"
echo "  1. Update package.json files to include @kealee/auth"
echo "  2. Set environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)"
echo "  3. Test authentication flows"
