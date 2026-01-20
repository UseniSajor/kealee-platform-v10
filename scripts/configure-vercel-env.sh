#!/bin/bash
# configure-vercel-env.sh
# Comprehensive Vercel environment variable configuration script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}⚙️  Configuring Vercel environment variables...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Install with: npm install -g vercel${NC}"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login...${NC}"
    vercel login
fi

# Check for VERCEL_TOKEN
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN not set. Some operations may require manual authentication.${NC}"
    echo -e "${YELLOW}   Set VERCEL_TOKEN environment variable for automated operations.${NC}"
fi

# Create backups directory
mkdir -p backups

# Create environment variable template
echo -e "${GREEN}📝 Creating environment variable template...${NC}"
cat > .env.template << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
DATABASE_URL_POOLER=postgresql://user:password@localhost:5432/database?pgbouncer=true
DATABASE_URL_PRODUCTION=postgresql://user:password@prod-host:5432/database
DATABASE_URL_STAGING=postgresql://user:password@staging-host:5432/database

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ACCOUNT_ID=acct_...

# API
API_URL=https://api.kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
NEXT_PUBLIC_APP_URL=https://marketplace.kealee.com

# Authentication
NEXTAUTH_URL=https://marketplace.kealee.com
NEXTAUTH_SECRET=your-nextauth-secret-here
JWT_SECRET=your-jwt-secret-here

# Storage
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=kealee-storage
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@kealee.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://your-public-sentry-dsn.ingest.sentry.io/...
LOGROCKET_ID=your-logrocket-id

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_FB_PIXEL_ID=...
NEXT_PUBLIC_HOTJAR_ID=...

# External Services
DOCUSIGN_INTEGRATION_KEY=your-docusign-key
DOCUSIGN_SECRET_KEY=your-docusign-secret
DOCUSIGN_ACCOUNT_ID=your-docusign-account
DOCUSIGN_USER_ID=your-docusign-user

# Feature Flags
FEATURE_SUBSCRIPTIONS_ENABLED=true
FEATURE_PAYMENTS_ENABLED=true
FEATURE_FILE_UPLOADS_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
EOF

echo -e "${GREEN}✅ Template created: .env.template${NC}"

# Apps to configure
APPS=(
  "m-marketplace"
  "os-admin"
  "os-pm"
  "m-ops-services"
  "m-project-owner"
  "m-architect"
  "m-permits-inspections"
)

ENVIRONMENTS=("production" "preview" "development")

# Function to prompt for missing variables
prompt_for_variable() {
  local var_name=$1
  local current_value=$2
  local description=$3
  
  if [ -z "$current_value" ]; then
    echo ""
    echo -e "${YELLOW}❓ $description${NC}"
    echo -e "${BLUE}Enter value for $var_name:${NC}"
    read -r value
    if [ -n "$value" ]; then
      echo "$var_name=$value" >> .env.local
      export $var_name="$value"
    fi
  fi
}

# Load existing .env file if exists
if [ -f .env.local ]; then
  echo -e "${GREEN}📂 Loading existing .env.local...${NC}"
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
else
  echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
  cp .env.template .env.local
  echo -e "${YELLOW}⚠️  Please edit .env.local with actual values before continuing.${NC}"
  read -p "Press Enter to continue after editing .env.local..."
fi

# Function to add env var to Vercel
add_env_var() {
  local app=$1
  local var_name=$2
  local var_value=$3
  local env_type=$4
    
  if [ -z "$var_value" ]; then
    echo -e "${YELLOW}  ⚠️  Skipping $var_name (empty value)${NC}"
    return
  fi
    
  echo -e "${BLUE}  Setting $var_name for $env_type...${NC}"
  
  if [ -n "$VERCEL_TOKEN" ]; then
    echo "$var_value" | vercel env add "$var_name" "$env_type" --scope="$VERCEL_ORG" --yes --token="$VERCEL_TOKEN" 2>/dev/null || {
      # Try to update if it exists
      echo "$var_value" | vercel env rm "$var_name" "$env_type" --scope="$VERCEL_ORG" --yes --token="$VERCEL_TOKEN" 2>/dev/null || true
      echo "$var_value" | vercel env add "$var_name" "$env_type" --scope="$VERCEL_ORG" --yes --token="$VERCEL_TOKEN" 2>/dev/null || {
        echo -e "${YELLOW}  ⚠️  Failed to set $var_name${NC}"
      }
    }
  else
    echo -e "${YELLOW}  ⚠️  VERCEL_TOKEN not set. Run manually:${NC}"
    echo -e "${BLUE}     vercel env add $var_name $env_type${NC}"
  fi
}

# Configure each app
for app in "${APPS[@]}"; do
  echo ""
  echo -e "${GREEN}📦 Configuring $app...${NC}"
  
  # Check if app exists in Vercel
  if [ -n "$VERCEL_TOKEN" ]; then
    if ! vercel projects ls "$app" --token="$VERCEL_TOKEN" 2>/dev/null | grep -q "$app"; then
      echo -e "${YELLOW}  Creating project $app...${NC}"
      vercel projects add "$app" --token="$VERCEL_TOKEN" || {
        echo -e "${YELLOW}  ⚠️  Failed to create project (may already exist)${NC}"
      }
    fi
  fi
  
  for env in "${ENVIRONMENTS[@]}"; do
    echo -e "${BLUE}  Environment: $env${NC}"
    
    # Set common environment variables
    COMMON_VARS=(
      "NODE_ENV=$env"
      "APP_NAME=$app"
      "APP_ENV=$env"
      "VERCEL_ENV=$env"
    )
    
    # Get git info if available
    if git rev-parse --git-dir > /dev/null 2>&1; then
      COMMON_VARS+=("VERCEL_GIT_COMMIT_REF=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')")
      COMMON_VARS+=("VERCEL_GIT_COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo 'unknown')")
    fi
    
    for var in "${COMMON_VARS[@]}"; do
      var_name="${var%=*}"
      var_value="${var#*=}"
      add_env_var "$app" "$var_name" "$var_value" "$env"
    done
    
    # Set app-specific variables
    case $app in
      "m-marketplace")
        MARKETPLACE_VARS=(
          "NEXT_PUBLIC_APP_URL=https://marketplace.kealee.com"
          "NEXT_PUBLIC_SITE_NAME=Kealee Marketplace"
        )
        [ -n "$NEXT_PUBLIC_GA_MEASUREMENT_ID" ] && MARKETPLACE_VARS+=("NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID")
        for var in "${MARKETPLACE_VARS[@]}"; do
          var_name="${var%=*}"
          var_value="${var#*=}"
          add_env_var "$app" "$var_name" "$var_value" "$env"
        done
        ;;
        
      "m-ops-services")
        OPS_VARS=()
        [ -n "$STRIPE_SECRET_KEY" ] && OPS_VARS+=("STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY")
        [ -n "$STRIPE_WEBHOOK_SECRET" ] && OPS_VARS+=("STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET")
        [ -n "$STRIPE_PUBLISHABLE_KEY" ] && OPS_VARS+=("STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY")
        for var in "${OPS_VARS[@]}"; do
          var_name="${var%=*}"
          var_value="${var#*=}"
          add_env_var "$app" "$var_name" "$var_value" "$env"
        done
        ;;
        
      "m-project-owner")
        PROJECT_VARS=()
        [ -n "$DOCUSIGN_INTEGRATION_KEY" ] && PROJECT_VARS+=("DOCUSIGN_INTEGRATION_KEY=$DOCUSIGN_INTEGRATION_KEY")
        [ -n "$DOCUSIGN_SECRET_KEY" ] && PROJECT_VARS+=("DOCUSIGN_SECRET_KEY=$DOCUSIGN_SECRET_KEY")
        [ -n "$DOCUSIGN_ACCOUNT_ID" ] && PROJECT_VARS+=("DOCUSIGN_ACCOUNT_ID=$DOCUSIGN_ACCOUNT_ID")
        for var in "${PROJECT_VARS[@]}"; do
          var_name="${var%=*}"
          var_value="${var#*=}"
          add_env_var "$app" "$var_name" "$var_value" "$env"
        done
        ;;
        
      "m-architect"|"m-permits-inspections")
        STORAGE_VARS=()
        [ -n "$S3_ACCESS_KEY_ID" ] && STORAGE_VARS+=("S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID")
        [ -n "$S3_SECRET_ACCESS_KEY" ] && STORAGE_VARS+=("S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY")
        [ -n "$S3_BUCKET_NAME" ] && STORAGE_VARS+=("S3_BUCKET_NAME=$S3_BUCKET_NAME")
        [ -n "$S3_REGION" ] && STORAGE_VARS+=("S3_REGION=$S3_REGION")
        for var in "${STORAGE_VARS[@]}"; do
          var_name="${var%=*}"
          var_value="${var#*=}"
          add_env_var "$app" "$var_name" "$var_value" "$env"
        done
        ;;
    esac
    
    # Set database URL
    if [ "$env" = "production" ] && [ -n "$DATABASE_URL_PRODUCTION" ]; then
      add_env_var "$app" "DATABASE_URL" "$DATABASE_URL_PRODUCTION" "$env"
    elif [ "$env" != "production" ] && [ -n "$DATABASE_URL_STAGING" ]; then
      add_env_var "$app" "DATABASE_URL" "$DATABASE_URL_STAGING" "$env"
    elif [ -n "$DATABASE_URL" ]; then
      add_env_var "$app" "DATABASE_URL" "$DATABASE_URL" "$env"
    fi
    
    # Set common API URL
    if [ -n "$NEXT_PUBLIC_API_URL" ]; then
      add_env_var "$app" "NEXT_PUBLIC_API_URL" "$NEXT_PUBLIC_API_URL" "$env"
    fi
    
  done
  
  echo -e "${GREEN}✅ $app configured${NC}"
done

# Create environment variable backup
echo ""
echo -e "${GREEN}💾 Creating environment variable backup...${NC}"
mkdir -p backups
for app in "${APPS[@]}"; do
  if [ -n "$VERCEL_TOKEN" ]; then
    vercel env ls "$app" --token="$VERCEL_TOKEN" > "backups/env-$app-$(date +%Y%m%d-%H%M%S).txt" 2>/dev/null || {
      echo -e "${YELLOW}  ⚠️  Failed to backup $app${NC}"
    }
  fi
done

echo ""
echo -e "${GREEN}✅ Environment variable configuration complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "   1. Verify variables in Vercel Dashboard → Projects → Settings → Environment Variables"
echo -e "   2. Test your applications"
echo -e "   3. Review backups in ./backups/ directory"
echo ""
