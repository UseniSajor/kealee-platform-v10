#!/bin/bash

set -e

echo "🔷 Deploying Frontend Apps to Vercel..."

# Check if app name provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy-frontend.sh <app-name>"
    echo ""
    echo "Available apps:"
    echo "  • m-marketplace"
    echo "  • m-project-owner"
    echo "  • m-permits-inspections"
    echo "  • m-ops-services"
    echo "  • m-architect"
    echo "  • os-pm"
    echo "  • os-admin"
    echo "  • all (deploy all apps)"
    exit 1
fi

deploy_app() {
    local app=$1
    echo "Deploying $app..."
    
    cd apps/$app
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not installed"
        echo "Install: npm i -g vercel"
        exit 1
    fi
    
    # Deploy to preview (use --prod for production)
    if [ "$2" == "prod" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    echo "✅ $app deployed!"
    cd ../..
}

if [ "$1" == "all" ]; then
    apps=(
        "m-marketplace"
        "m-project-owner"
        "m-permits-inspections"
        "m-ops-services"
        "m-architect"
        "os-pm"
        "os-admin"
    )
    
    for app in "${apps[@]}"; do
        deploy_app $app $2
    done
else
    deploy_app $1 $2
fi

echo "🎉 Deployment complete!"

