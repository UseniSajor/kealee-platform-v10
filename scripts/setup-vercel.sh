#!/bin/bash

set -e

echo "🔷 Setting up Vercel for all apps..."

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Login to Vercel
echo "Please login to Vercel:"
vercel login

# Apps configuration
declare -A apps=(
    ["m-marketplace"]="kealee.com"
    ["m-project-owner"]="app.kealee.com"
    ["m-permits-inspections"]="permits.kealee.com"
    ["m-ops-services"]="ops.kealee.com"
    ["m-architect"]="architect.kealee.com"
    ["os-pm"]="pm.kealee.com"
    ["os-admin"]="admin.kealee.com"
)

for app in "${!apps[@]}"; do
    domain=${apps[$app]}
    
    echo ""
    echo "Setting up $app → $domain"
    echo "================================"
    
    cd apps/$app
    
    # Link to Vercel project (creates if doesn't exist)
    vercel link --yes || echo "Project already linked or setup needed"
    
    # Add domain
    echo ""
    echo "Add domain $domain in Vercel dashboard:"
    echo "vercel.com → Project → Settings → Domains"
    echo ""
    read -p "Press enter when domain is added (or skip)..."
    
    cd ../..
done

echo ""
echo "✅ Vercel setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS records in NameBright"
echo "2. Add environment variables in each Vercel project"
echo "3. Run ./scripts/deploy-frontend.sh all"




