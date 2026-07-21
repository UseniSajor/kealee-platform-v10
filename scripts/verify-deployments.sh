#!/bin/bash

echo "🔍 Verifying deployments..."
echo ""

# Array of endpoints to check
declare -A endpoints=(
    ["Marketplace"]="https://kealee.com"
    ["Project Owner"]="https://app.kealee.com"
    ["Permits"]="https://permits.kealee.com"
    ["Ops Services"]="https://ops.kealee.com"
    ["Architect"]="https://architect.kealee.com"
    ["PM Workspace"]="https://pm.kealee.com"
    ["Admin"]="https://admin.kealee.com"
    ["API"]="https://api.kealee.com/health"
)

for name in "${!endpoints[@]}"; do
    url=${endpoints[$name]}
    
    echo -n "Checking $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    
    if [ $status -eq 200 ] || [ $status -eq 301 ] || [ $status -eq 302 ]; then
        echo "✅ ($status)"
    else
        echo "❌ ($status)"
    fi
done

echo ""
echo "Verification complete!"




