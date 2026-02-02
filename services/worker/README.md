# Worker Service Deployment Configuration

## Overview
Background job processor for Kealee automation agents (15 apps)

## Quick Deploy to Railway

### 1. Create New Service
```bash
# In Railway dashboard
1. Click "New Service"
2. Select "Empty Service"
3. Name: "kealee-worker"
```

### 2. Connect Repository
- Connect to: kealee-platform-v10
- Root directory: `services/worker`
- Branch: main

### 3. Environment Variables
```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from BullMQ)
REDIS_URL=${{Redis.REDIS_URL}}

# API
API_URL=https://api.kealee.com

# External Services (optional)
ANTHROPIC_API_KEY=your_claude_api_key
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 4. Build Configuration
- **Build Command:** `pnpm build`
- **Start Command:** `pnpm start`
- **Watch Paths:** `services/worker/**`

### 5. Deploy
Click "Deploy"

## Development
```bash
cd services/worker
pnpm dev
```

## Status
Ready for deployment once Redis and PostgreSQL services exist in Railway.
