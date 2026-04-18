# 🤖 KeaBots Activation Guide

**Date:** April 5, 2026  
**Purpose:** How to activate, deploy, and verify the 13 specialized KeaBots  
**Scope:** Local development, staging, and production deployment

---

## 🎯 KeaBots Overview

The Kealee Platform includes **13 specialized AI bots** (KeaBots), each handling different construction/development domains:

| Bot | Domain | Purpose | Model |
|-----|--------|---------|-------|
| keabot-command | command | Routes user queries to appropriate domain bots | Claude Opus |
| keabot-permit | permit | Permit requirements, tracking, inspections | Claude Opus |
| keabot-estimate | estimate | RSMeans cost lookups, takeoffs, bid analysis | Claude Opus |
| keabot-design | design | Architecture, floor plans, design reviews | Claude Opus |
| keabot-developer | developer | Portfolio, entitlements, investor tracking | Claude Opus |
| keabot-feasibility | feasibility | Feasibility studies, proformas, scenario models | Claude Opus |
| keabot-finance | finance | Capital stack, draws, investor reporting | Claude Opus |
| keabot-gc | gc | Bid management, scheduling, compliance | Claude Opus |
| keabot-land | land | Land acquisition, zoning, development potential | Claude Opus |
| keabot-marketplace | marketplace | Contractor search, credential verification | Claude Opus |
| keabot-operations | operations | Warranty, maintenance, work orders | Claude Opus |
| keabot-owner | owner | Project status, dashboards, milestones | Claude Opus |
| keabot-payments | payments | Payment tracking, escrow, lien waivers | Claude Opus |

---

## 📁 KeaBot Architecture

Each KeaBot is a **standalone Node.js service** in the monorepo:

```
bots/
├── keabot-command/
│   ├── src/
│   │   ├── bot.ts          # KeaBotCommand class
│   │   ├── index.ts        # Bootstrap/startup
│   │   ├── *.prompts.ts   # System prompts
│   │   ├── *.types.ts     # TypeScript types
│   │   └── *.ts           # Domain logic
│   ├── package.json        # "dev": "tsx src/index.ts", "start": "node dist/index.js"
│   └── tsconfig.json       # TypeScript config
├── keabot-permit/
├── keabot-estimate/
├── ... (11 more bots)
└── keabot-payments/
```

**Key Properties:**
- Each bot extends `KeaBot` from `@kealee/core-bots`
- Each has a `BotConfig` (name, description, model, system prompt)
- Each implements `initialize()` to register tools (API methods)
- Run as independent processes that can be called via API

---

## 🚀 ACTIVATION STEP-BY-STEP

### Phase 1: Local Development (Your Machine)

**Prerequisite:** pnpm installed, monorepo set up

#### 1a. Start Individual Bot

```bash
# Start keabot-design in development mode
pnpm --filter keabot-design dev

# Output should show:
# [keabot-design] Ready with X tools
# [keabot-design] Tools: tool1, tool2, tool3, ...
```

#### 1b. Start All 13 Bots (Parallel)

```bash
# Start all bots at once in dev mode
pnpm --filter "./bots/*" dev

# Each bot will log its readiness status
# Total: 13 processes running in parallel
```

#### 1c. Start with Specific Group (Example: permit + estimate)

```bash
# Start only permit and estimate bots
pnpm --filter keabot-permit dev & \
pnpm --filter keabot-estimate dev

# Or use concurrently (if in package.json):
concurrently "pnpm --filter keabot-permit dev" "pnpm --filter keabot-estimate dev"
```

#### 1d. Verify Bots Are Running

```bash
# Check if node processes are running
ps aux | grep keabot

# Output example:
# tim   2345  0.2  0.5  156000  28000  pts/1    Sl   14:22   0:10 node /path/keabot-design/dist/index.js
# tim   2346  0.2  0.5  154000  27500  pts/2    Sl   14:22   0:09 node /path/keabot-permit/dist/index.js
```

---

### Phase 2: Build for Production

#### 2a. Build All Bots

```bash
# Build all bots from source
pnpm --filter "./bots/*" build

# Each bot will compile TypeScript to dist/
# Output: bots/keabot-{name}/dist/index.js
```

#### 2b. Build Specific Bot

```bash
cd bots/keabot-design
pnpm build

# Creates dist/bot.js, dist/index.js
```

#### 2c. Verify Build

```bash
# Check dist folder exists
ls -la bots/keabot-design/dist/

# Expected files:
# index.js (compiled bootstrap)
# bot.js (compiled Bot class)
```

---

### Phase 3: Production Deployment (Railway/Vercel)

#### 3a. Railway Deployment Strategy

**Option 1: Monolithic API with Embedded Bots** (Current)

Bots run as part of the main `arstic-kindness` API service:
- API server boots, starts all 13 bots
- Bots listen for API calls via Fastify routes
- Call: `POST /keabots/{domain}` routes to specific bot
- **Deployment:** No separate deploy, bots auto-start with API

**Option 2: Separate Microservices** (Advanced)

Deploy each bot as its own Railway service:
- Create separate Railway service for each bot
- Give each bot an HTTP endpoint (or keep internal)
- API calls route to bot services
- **Deployment:** 13 more Railway services (cost increase)

**Recommendation:** **Use Option 1** (current setup) — simpler, lower cost, all bots embedded in API.

#### 3b. Deploy to Railway (Current Setup)

```bash
# 1. Commit all bot code
git add bots/
git commit -m "feat: activate all 13 keabots"

# 2. Push to origin/main
git push origin main

# 3. Railway auto-deploys arstic-kindness service
# - Checks out latest code
# - Runs: pnpm install (includes all bots workspace)
# - Runs: pnpm build (compiles all bots)
# - Starts API with embedded bots

# 4. Verify deployment
# Check Railway > arstic-kindness > Logs for:
# "[keabot-command] Ready with X tools"
# "[keabot-permit] Ready with X tools"
# ... (all 13 bots should log ready status)
```

#### 3c. Railway Environment Variables for Bots

Bots need access to LLM keys and database. Ensure Railway has:

```bash
# LLM Configuration
ANTHROPIC_API_KEY=sk-ant-...           # Claude API key
ANTHROPIC_MODEL=claude-opus-4-6        # Model selection

# Database
DATABASE_URL=postgresql://...          # Prisma DB URL

# Optional: Bot-specific config
DESIGN_BOT_MODEL=claude-opus-4         # Override for specific bot
ESTIMATE_BOT_TIMEOUT=30000             # Timeout (ms)
PERMIT_BOT_LOOKUPS=rsmeans,local       # Cost database priorities
```

---

## 🔗 HOW TO CALL KEABOTS

### Via Fastify Routes (API Calls)

Each bot can be called via HTTP once running:

#### **Domain Bot Direct Call**

```bash
# Call keabot-permit directly
curl -X POST http://localhost:3000/keabots/permit \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What permits do I need for a kitchen remodel?",
    "projectId": "proj-123",
    "userId": "user-456",
    "context": {
      "jurisdiction": "fairfax-county",
      "projectType": "kitchen_remodel"
    }
  }'

# Response:
{
  "response": "Based on Fairfax County requirements for kitchen remodels...",
  "botName": "keabot-permit",
  "toolsCalled": ["check_requirements"],
  "tokensUsed": 450
}
```

#### **Command Bot Routing**

```bash
# Send to keabot-command, which routes to appropriate bot
curl -X POST http://localhost:3000/keabots/command \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of my project?",
    "projectId": "proj-123"
  }'

# Bot auto-determines: "This is a status query" → routes to keabot-owner
# Response from keabot-owner returned to user
{
  "response": "Your project is in Phase 2...",
  "routedTo": "keabot-owner",
  "projectStatus": { ... }
}
```

#### **Conversation with @kealee Mention**

```bash
# In conversation, @mention KeaBot to trigger it
curl -X POST http://localhost:3000/conversations/conv-123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-456",
    "content": "@kealee estimate the cost of a 500 sq ft kitchen remodel"
  }'

# System detects @kealee mention, routes to keabot-estimate
# Response:
{
  "userMessage": "@kealee estimate the cost...",
  "aiResponse": "Based on RSMeans data, a 500 sq ft kitchen remodel costs...",
  "botUsed": "keabot-estimate",
  "toolsCalled": ["lookup_costs", "create_estimate"],
  "estimateData": {
    "laborCost": 12500,
    "materialCost": 8500,
    "total": 21000
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

### **Local Development**

- [ ] All 13 bots start without errors (`pnpm --filter "./bots/*" dev`)
- [ ] Each bot logs: `[keabot-X] Ready with Y tools`
- [ ] Can call bot via localhost:3000/keabots/{domain}
- [ ] Each bot returns valid JSON response
- [ ] No TypeScript compilation errors
- [ ] All tool registrations logged

### **Production (Railway)**

- [ ] Code pushed to origin/main
- [ ] Railway deployment succeeded (green status)
- [ ] Logs show all 13 bots booted at startup
- [ ] No 500 errors in API logs
- [ ] Can call `/keabots/*` endpoints via deployed URL
- [ ] Bots can access database (queries log successfully)
- [ ] Bots can call Anthropic API (no auth errors)

### **Integration Test**

```bash
# Test all 13 bot endpoints
for bot in command permit estimate design developer feasibility finance gc land marketplace operations owner payments; do
  echo "Testing keabot-$bot..."
  curl -s -X POST https://arstic-kindness.up.railway.app/keabots/$bot \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello","projectId":"test"}' \
    | jq '.response' || echo "FAILED"
done

# Expected: 13 successful responses (no 500/404 errors)
```

---

## 🔧 TROUBLESHOOTING

### Issue: Bot fails to start locally

**Symptom:** Error like "Cannot find module '@kealee/core-bots'"

**Solution:**
```bash
# Reinstall dependencies in monorepo
pnpm install

# Rebuild all workspaces
pnpm build

# Try again
pnpm --filter keabot-design dev
```

---

### Issue: Bot starts but doesn't respond to messages

**Symptom:** API returns 200 but response.response is empty or null

**Causes:**
- ANTHROPIC_API_KEY not set
- Claude API is down
- Bot tools not initialized

**Solution:**
```bash
# Check environment variables
echo $ANTHROPIC_API_KEY

# If empty:
export ANTHROPIC_API_KEY=sk-ant-...

# Check bot logs for initialization errors
pnpm --filter keabot-design dev 2>&1 | grep -i error
```

---

### Issue: Bots running but not accessible via API

**Symptom:** `curl localhost:3000/keabots/permit` returns 404

**Causes:**
- API routes not registered
- Bots folder not in pnpm workspace
- Build didn't happen

**Solution:**
```bash
# Verify pnpm-workspace.yaml includes bots:
cat pnpm-workspace.yaml | grep bots

# Should show: "bots/*"

# Verify bots are installed as dependencies
cat package.json | grep "bots"

# Run build
pnpm build

# Restart API
```

---

### Issue: High latency for bot responses

**Symptom:** Bot calls take 10+ seconds

**Causes:**
- Claude API loading time
- Network latency to Anthropic servers
- Large context/conversation history

**Solution:**
```bash
# Monitor actual time
time curl -X POST http://localhost:3000/keabots/estimate \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","projectId":"test"}'

# If >5s consistently, check:
# 1. Network: ping api.anthropic.com
# 2. API key valid: Try direct Anthropic SDK call
# 3. Bot config: Check maxTokens, temperature settings
```

---

## 📊 DEPLOYMENT OPTIONS SUMMARY

| Deployment | Startup Command | Cost | Complexity | When to Use |
|------------|-----------------|------|------------|------------|
| **Local Dev** | `pnpm --filter "./bots/*" dev` | Free | Low | Development & testing |
| **Embedded in API** | Auto with `arstic-kindness` service | $7-15/mo | Low | Staging & Production (Current) |
| **Separate Services** | 13 Railway services | $100+/mo | High | Scale-out or custom SLAs |
| **Serverless** | AWS Lambda/GCP Cloud Functions | Per-invocation | Very High | Sporadic usage only |
| **Managed LLM API** | Azure OpenAI/Anthropic Hosted | Varies | Low | Simplify operations |

**Recommendation:** Stay with **Embedded in API** for now — lowest cost and complexity.

---

## 🚀 QUICK START COMMANDS

### For Developers

```bash
# Start all bots for development
pnpm --filter "./bots/*" dev

# Build all bots
pnpm build

# Test a single bot
curl -X POST http://localhost:3000/keabots/design \
  -H "Content-Type: application/json" \
  -d '{"message":"Design a modern kitchen","projectId":"test"}'
```

### For DevOps/Deployment

```bash
# Build for production
pnpm install
pnpm build

# Deploy to Railway (automatic on git push)
git add bots/
git commit -m "feat: activate keabots"
git push origin main

# Verify bots are running in production
curl https://arstic-kindness.up.railway.app/health

# Check logs
# Railway Dashboard → arstic-kindness → Logs
# Look for: "[keabot-X] Ready with Y tools"
```

---

## 📚 NEXT STEPS

1. **Verify all bots start locally:**
   ```bash
   pnpm --filter "./bots/*" dev
   ```

2. **Test bot functionality:**
   - Use [AGENT_TESTING_SUITE.md](AGENT_TESTING_SUITE.md) for comprehensive tests
   - Each bot should return valid responses

3. **Monitor bot performance:**
   - Track token usage per bot
   - Monitor response latency
   - Watch for Claude API errors

4. **Scale bots (if needed):**
   - Add bot-specific caching
   - Implement request queuing
   - Move to separate services (advanced)

---

**Status:** KeaBots are embedded in the API service and ready for activation. Start with `pnpm --filter "./bots/*" dev` to activate locally. 🤖✅
