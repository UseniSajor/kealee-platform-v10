#!/bin/bash
# scripts/get-auth-token.sh
# Helper script to get authentication token from API

set -e

API_URL=${API_URL:-"http://localhost:3001"}
EMAIL=${EMAIL:-"test@example.com"}
PASSWORD=${PASSWORD:-"test123456"}

echo "🔐 Getting authentication token..."
echo "   API URL: $API_URL"
echo "   Email: $EMAIL"
echo ""

# Login and get token
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$API_URL/auth/login" || echo "")

# Check if response contains session
if echo "$RESPONSE" | grep -q "session"; then
    # Extract access_token from session
    if command -v jq &> /dev/null; then
        ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.session.access_token // empty')
        if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
            echo "✅ Authentication successful!"
            echo ""
            echo "Access Token:"
            echo "$ACCESS_TOKEN"
            echo ""
            echo "To use this token:"
            echo "  export AUTH_TOKEN=\"$ACCESS_TOKEN\""
            echo ""
            echo "Or add to your test script:"
            echo "  AUTH_TOKEN=\"$ACCESS_TOKEN\" ./scripts/test-all-api-endpoints.sh"
        else
            echo "❌ Could not extract access token from response"
            echo "Response: $RESPONSE"
            exit 1
        fi
    else
        echo "✅ Authentication successful!"
        echo ""
        echo "Response: $RESPONSE"
        echo ""
        echo "⚠️  Install jq to automatically extract token:"
        echo "   brew install jq  # macOS"
        echo "   apt-get install jq  # Ubuntu"
        echo ""
        echo "Or manually extract access_token from the session object above."
    fi
else
    echo "❌ Authentication failed"
    echo "Response: $RESPONSE"
    exit 1
fi
