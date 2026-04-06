# 🤖 KeaBots Quick Activation Reference

**TL;DR** — How to activate the 13 AI bots (KeaBots) in Kealee Platform

---

## ⚡ QUICK START (Choose One)

### Development (Your Machine)
```bash
# Start all 13 botslocally
cd kealee-platform-v10
pnpm --filter "./bots/*" dev

# Expected output per bot:
# [keabot-design] Ready with 4 tools
# [keabot-permit] Ready with 6 tools
# ... (13 total)
```

### Production (Railway - Automatic)
```bash
# 1. Code is ready (all bots already in repo)
# 2. Just push to git:
git add .
git commit -m "activate keabots"
git push origin main

# 3. Railway auto-deploys arstic-kindness service
# 4. All 13 bots boot automatically with API
# 5. Logs show: "[keabot-X] Ready with Y tools"
```

---

## 📋 THE 13 KEABOTS

```
✅ keabot-command      → Routes queries to right bot
✅ keabot-permit       → Permit requirements & tracking
✅ keabot-estimate     → RSMeans costs & estimates
✅ keabot-design       → Floor plans & concepts
✅ keabot-developer    → Portfolio & entitlements
✅ keabot-feasibility  → Feasibility & proforma
✅ keabot-finance      → Capital stack & funding
✅ keabot-gc           → Bid management & scheduling
✅ keabot-land         → Land & zoning analysis
✅ keabot-marketplace  → Contractor search & vetting
✅ keabot-operations   → Warranty & maintenance
✅ keabot-owner        → Project status & dashboards
✅ keabot-payments     → Payment tracking & escrow
```

---

## 🚀 ACTIVATION STATUS

| Component | Status | Details |
|-----------|--------|---------|
| **Code** | ✅ Ready | All bots in bots/ folder |
| **Config** | ✅ Ready | BotConfig set per bot |
| **Tools** | ✅ Ready | Registered on initialize() |
| **API Routes** | ✅ Ready | POST /keabots/{domain} endpoints |
| **Database** | ✅ Ready | PostgreSQL online in Railway |
| **LLM Access** | ✅ Ready | ANTHROPIC_API_KEY in Railway |
| **Startup** | ✅ Ready | Bootstrap in bots/keabot-*/src/index.ts |

---

## ✅ VERIFICATION

```bash
# Test one bot
curl -X POST http://localhost:3000/keabots/permit \
  -H "Content-Type: application/json" \
  -d '{"message":"What permits do I need?","projectId":"test"}'

# Should return:
# { "response": "Based on your needs...", "botName": "keabot-permit", ... }
```

---

## 🎯 HOW USERS TRIGGER BOTS

1. **Form Submission** → AI Concept Generated
   ```
   User submits kitchen remodel intake form
   → keabot-design generates concept
   → Returns layout, cost band, permit scope
   ```

2. **Chat Message with @kealee**
   ```
   User: "@kealee estimate my kitchen cost"
   → System detects @kealee mention
   → Routes to keabot-estimate
   → Returns itemized cost estimate
   ```

3. **Workflow Automation**
   ```
   After intake submitted
   → Command Center job queue triggers keabot-design
   → Continues to keabot-estimate
   → Passes results to keabot-permit
   ```

4. **Direct API Call** (For agents/bots)
   ```
   POST /keabots/permit with message
   → keabot-permit processes
   → Returns structured response
   ```

---

## 🔧 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Bot won't start | `pnpm install && pnpm build` |
| Bot returns 500 | Check `ANTHROPIC_API_KEY` env var |
| Bot returns empty response | Claude API down or rate limited |
| Can't call bot API | Verify `/keabots/{domain}` route registered |
| High latency (>10s) | Normal for first call; Claude startup time |

---

## 📊 CURRENT STATUS (April 5, 2026)

✅ **Code:** All 13 bots written and ready  
✅ **Testing:** Comprehensive test suite created  
✅ **Docs:** Activation guide complete  
✅ **Deployment:** Code pushed to git  
🟡 **Stripe Config:** Awaiting manual variable setup (blocking production checkout)  
⏳ **Full Testing:** Can begin once Stripe variables added to Railway

---

## 🚀 NEXT STEPS

1. **Add Stripe variables to Railway** (from DEPLOYMENT_NEXT_STEPS.md)
2. **Start bots locally:** `pnpm --filter "./bots/*" dev`
3. **Test bots:** Follow [AGENT_TESTING_SUITE.md](AGENT_TESTING_SUITE.md)
4. **Review logs:** Look for "[keabot-X] Ready with Y tools"
5. **Call bots:** Use `/keabots/{domain}` endpoints
6. **Monitor:** Token usage, latency, error rates

---

## 📚 FULL DOCUMENTATION

- [KEABOTS_ACTIVATION_GUIDE.md](KEABOTS_ACTIVATION_GUIDE.md) — Complete activation guide (497 lines)
- [AGENT_TESTING_SUITE.md](AGENT_TESTING_SUITE.md) — Autonomous testing (1007 lines)
- [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md) — Manual testing (371 lines)

---

**TL;DR:**
```bash
# Activate KeaBots in development:
pnpm --filter "./bots/*" dev

# Activate in production:
git push origin main
# (Railway auto-deploys)

# Test a bot:
curl -X POST http://localhost:3000/keabots/permit \
  -d '{"message":"Hello","projectId":"test"}'
```

**Status:** ✅ Ready to activate. All 13 bots embedded in arstic-kindness API service.
