# KEALEE PLATFORM v30 - COMPLETE IMPLEMENTATION GUIDE
## Days 1-7 Compressed | Production-Ready | Ready to Build

---

## QUICK START

This spec contains **everything needed** to build v30. Start here:

1. **Review architecture** (Part 1 of master spec)
2. **Run Prisma migration** (15 new models)
3. **Create os-intake service** (intake API)
4. **Create os-ai-orch service** (bot orchestration)
5. **Enhance os-pay** (dynamic pricing)
6. **Add web-main intake form** (UI)
7. **Build admin portal** (management)
8. **Upgrade KeaBot v3.0** (10 bots)
9. **Launch with feature flag** (gradual rollout)

---

## THE 15 NEW PRISMA MODELS AT A GLANCE

```
INTAKE & ANALYSIS (3)
├─ IntakeResponse (9-question answers + AI analysis)
├─ CustomPackage (mix & match features + dynamic pricing)
└─ [Existing integration with Project]

BOT EXECUTION (2)
├─ BotExecution (track each bot run)
└─ BotResult (store bot output)

PROJECT MANAGEMENT (1)
└─ ProjectWorkspace (lifecycle management)

ADMIN & OPS (4)
├─ BotConfiguration (editable system prompts)
├─ PricingFormula (AI-determined pricing)
├─ AdminAuditLog (track all changes)
└─ WhiteLabelConfig (multi-tenant support)

ANALYTICS (3)
├─ BotMetrics (daily bot performance)
├─ ProjectMetrics (project profitability)
└─ ConversionFunnel (user journey tracking)

UPDATES TO EXISTING (2)
├─ Project (add v30 fields + relationships)
└─ User (add RBAC + subscription + profile)

TOTAL: 15 new + 2 enhanced = 17 changes
```

---

## THE 5 NEW SERVICES AT A GLANCE

```
os-intake (NEW)
└─ POST /api/v30/intake (submit form, IntakeBot analyzes)
└─ GET /api/v30/intake/:id (get analysis)
└─ PUT /api/v30/intake/:id (update answers)
└─ DELETE /api/v30/intake/:id (before payment)

os-ai-orch (NEW)
└─ POST /api/v30/project/:id/generate (trigger 10 bots in parallel)
└─ GET /api/v30/project/:id/status (real-time progress)
└─ GET /api/v30/project/:id/results (assemble all results)

os-pay (ENHANCE)
└─ POST /api/v30/checkout/create-session (dynamic Stripe pricing)
└─ (All existing routes unchanged)

os-admin (NEW)
└─ Full admin dashboard + bot config + pricing management

os-analytics (NEW)
└─ Dashboard + metrics + conversion funnel

ALSO:
├─ os-white-label (NEW) - multi-tenant support
└─ os-dev (ENHANCE) - v30 routes main entry point
```

---

## THE 4 NEW PORTAL APPS AT A GLANCE

```
web-main (ENHANCE)
└─ Add /get-concept page with IntakeForm (BEFORE payment is critical!)
└─ Show price estimate
└─ Route to checkout

portal-admin (NEW)
└─ Metrics dashboard
└─ Bot configuration editor (live edit system prompts)
└─ Pricing formula builder
└─ Analytics visualizations

portal-projects (NEW)
└─ Project workspace (full lifecycle management)
└─ State machine visualization
└─ Concepts + estimates + permits + team collaboration

portal-white-label (NEW)
└─ Partner dashboard
└─ Branding configuration
└─ Team management
└─ Custom domain setup

portal-analytics (NEW)
└─ Executive dashboard
└─ ROI tracking
└─ Cost breakdown by bot
└─ Conversion funnel visualization
```

---

## THE 10 BOTS AT A GLANCE

```
1. DESIGNBOT (Claude Opus 4.6)
   Input: Intake answers
   Output: 3 concepts + images + materials
   Time: ~45 seconds
   Cost: ~$0.15 per call (with cache)

2. ESTIMATEBOT (Claude Sonnet 4.6)
   Input: Design concept
   Output: Cost breakdown (preliminary or detailed)
   Time: ~30 seconds
   Cost: ~$0.05 per call (with cache)

3. ZONINGBOT (Claude Sonnet 4.6)
   Input: Scope + location
   Output: Permit requirements + forms + timeline
   Time: ~20 seconds
   Cost: ~$0.03 per call

4. FLOORPLANBOT (Claude Sonnet 4.6)
   Input: Design concept
   Output: SVG coordinate data
   Time: ~15 seconds
   Cost: ~$0.02 per call

5. PERMITBOT (Claude Sonnet 4.6)
   Input: Design + zoning analysis
   Output: Permit-ready plan specifications
   Time: ~30 seconds
   Cost: ~$0.04 per call

6. VIDEOBOT (Claude Sonnet 4.6)
   Input: Concept
   Output: Runway Gen-3 prompts
   Time: ~10 seconds (+ 30 min generation)
   Cost: ~$0.01 + ~$5-10 (video generation)

7. CONTRACTORBOT (Claude Sonnet 4.6)
   Input: Scope + location + budget
   Output: Top 3 contractor recommendations
   Time: ~15 seconds
   Cost: ~$0.02 per call

8. SALESBOT (Claude Sonnet 4.6)
   Input: Customer objection
   Output: Helpful response with data
   Time: ~10 seconds
   Cost: ~$0.01 per call

9. SUPPORTBOT (Claude Sonnet 4.6)
   Input: Customer question
   Output: Answer + next steps
   Time: ~5 seconds
   Cost: ~$0.01 per call

10. PROJECTBOT (Claude Sonnet 4.6)
    Input: Project state
    Output: Workflow updates + next actions
    Time: ~5 seconds
    Cost: ~$0.01 per call

TOTAL PER PROJECT:
- Design: ~$0.3 (1 bot)
- Standard: ~$0.5 (DesignBot + EstimateBot + ZoningBot)
- Premium: ~$1.0 (all 7 core bots)
- With video: +$5-10
```

---

## CRITICAL CHANGES FROM v20

### 1. INTAKE POSITION (BIGGEST CHANGE)

**v20 (Old):**
```
Customer sees price ($599/$999/$2,499) → Pays → Fills intake form → Gets results
```

**v30 (New):**
```
Customer fills intake form (9 questions) → AI suggests package + price → Reviews price → Pays custom amount → Gets results
```

**Why:** Lets customers see estimate BEFORE paying. Increases conversion.

### 2. PRICING MODEL

**v20 (Old):**
```
3 fixed tiers hardcoded in code
- Tier 1: $599
- Tier 2: $999
- Tier 3: $2,499
```

**v30 (New):**
```
AI-determined dynamic pricing:
- Base: $99 + (sqft × $0.05) + complexity_fee + feature_costs + urgency_multiplier + location_multiplier
- Example: 2000 sqft, moderate complexity, ASAP = $1,700 (not $999 or $2,499)
- Customer can customize further
```

**Why:** Captures more value for complex projects, less for simple projects.

### 3. BOTS

**v20:** 3 bots in sequence
```
DesignBot → EstimateBot → PermitBot
(Sequential, waits for each)
```

**v30:** 10 bots in parallel
```
All run simultaneously:
├─ DesignBot
├─ FloorplanBot
├─ EstimateBot
├─ ZoningBot
├─ PermitBot
├─ VideoBot
├─ ContractorBot
├─ SalesBot
├─ SupportBot
└─ ProjectBot

(Parallel, all at once)
```

**Why:** Faster results, better UX.

### 4. USER TYPES

**v20:** Just homeowners (B2C)

**v30:** 4 types
```
- B2C: Homeowners (pay per project)
- B2B: Contractors (monthly subscription)
- Internal: Kealee staff (operational tool)
- Partners: White-label (licensed platform)
```

**Why:** Expand revenue, create new markets.

### 5. ADMIN CONTROL

**v20:** Basic (pricing only)

**v30:** Full AI system management
```
- Edit system prompts live
- Change AI models per bot
- Adjust pricing formulas
- Monitor costs real-time
- A/B test prompts
- View detailed analytics
```

**Why:** Kealee can optimize without code changes.

---

## INTEGRATION: ZERO BREAKING CHANGES

### What Stays Exactly the Same

- ✅ All 368 existing Prisma models
- ✅ All existing Fastify services
- ✅ All existing Next.js portals
- ✅ Stripe integration (enhanced, not replaced)
- ✅ Auth system (upgraded, not replaced)
- ✅ KeaBot 3 core bots (enhanced, not replaced)
- ✅ Deployment (Railway + Vercel)
- ✅ Database (Supabase)

### What Gets Added

- ✅ 15 new Prisma models
- ✅ 5 new Fastify services
- ✅ 4 new Next.js portal apps
- ✅ 7 new bots to KeaBot
- ✅ RBAC to auth system
- ✅ Dynamic pricing to Stripe

### What Gets Enhanced

- ✅ Project model (+7 fields)
- ✅ User model (+6 fields)
- ✅ os-dev service (+v30 routes)
- ✅ os-pay service (+dynamic pricing)
- ✅ web-main portal (+intake form)
- ✅ portal-owner portal (+workspace)
- ✅ KeaBot Orgo (parallel execution)
- ✅ KeaBot Hermes (multi-model support)

### Migration Path

**Option A: Feature Flag (Recommended)**
```
1. Deploy all v30 code with feature flag v30_enabled = false
2. Test internally for 2 weeks
3. Enable flag for new customers only
4. Monitor, optimize, fix issues
5. Enable for all customers
6. Gradually migrate existing customers
7. Sunset v20 after 6 months
```

**Option B: Big Bang**
```
1. Deploy v30 live
2. All customers move to v30 immediately
3. Provide v20 support for 3 months
4. High risk but faster
```

**Recommended:** Option A (feature flag)

---

## NEXT IMMEDIATE STEPS

### Day 1 (Today)
```
☐ Review this spec
☐ Confirm architecture
☐ Confirm timeline
☐ Identify blockers
```

### Day 2-3 (Database Setup)
```
☐ Run: pnpm prisma migrate dev --name add_v30_models
☐ Verify: All 15 models created
☐ Verify: Project + User updated
☐ Test: DB queries work
```

### Day 4-5 (Services)
```
☐ Create: os-intake service structure
☐ Implement: POST /api/v30/intake route
☐ Create: os-ai-orch service structure
☐ Implement: POST /api/v30/project/:id/generate route
☐ Test: End-to-end intake → bot execution
```

### Day 6-7 (UI)
```
☐ Add: Intake form to web-main
☐ Add: Dynamic checkout to os-pay
☐ Create: Portal workspace
☐ Create: Admin dashboard
```

### Day 8-10 (Bots)
```
☐ Implement: 10 bot system prompts
☐ Integrate: Into Orgo v3.0
☐ Test: Each bot individually
☐ Test: All 10 in parallel
```

### Day 11-14 (Integration)
```
☐ Test: Full intake → generation → workspace flow
☐ Test: Admin dashboard functionality
☐ Test: White-label isolation
☐ Test: Analytics tracking
```

### Day 15 (Launch Prep)
```
☐ Deploy: With feature flag OFF
☐ Internal testing: Full scenario
☐ QA: All edge cases
☐ Monitoring: Alert setup
```

---

## FILES PROVIDED

1. **KEALEE-v30-COMPLETE-MASTER-SPEC.md** (this document's predecessor)
   - Full architecture
   - All 15 Prisma models
   - All API endpoints
   - 10 bot system prompts
   - 20+ Cursor implementation prompts

2. **KEALEE-v30-INTEGRATION-STRATEGY.md**
   - Migration options
   - Code integration checklist
   - Gradual rollout plan

3. **This file** (KEALEE-v30-IMPLEMENTATION-GUIDE.md)
   - Quick reference
   - Start here
   - Next steps

---

## SUCCESS CRITERIA

When complete, v30 should:

✅ **Intake BEFORE payment** - Customers see price estimate before paying
✅ **Dynamic pricing** - Price varies by complexity, size, urgency
✅ **10 bots in parallel** - All run simultaneously, deliver in 5-60 minutes
✅ **Project workspace** - Full lifecycle management (intake → construction)
✅ **Admin control** - Edit prompts, pricing, features without deploying
✅ **B2B subscription** - Contractors can subscribe monthly
✅ **White-label ready** - Partners can rebrand and resell
✅ **Zero breaking changes** - Existing v20 features unchanged
✅ **Gradual rollout** - Can test with 10% of users before going live
✅ **Better margins** - AI-determined pricing captures more value

---

## ESTIMATED EFFORT

**Database:** 2-3 days (schema + migration)
**Services:** 5-7 days (intake + orchestration + enhance existing)
**Portals:** 4-6 days (intake form + workspace + admin)
**Bots:** 3-5 days (prompts + testing)
**Integration:** 3-4 days (end-to-end testing)
**Launch:** 2-3 days (monitoring + rollout)

**Total:** 19-28 days (3-4 weeks) for full v30 with feature flag ready

---

## RISK MITIGATION

**Risk:** Bot failures cause customer issues
**Mitigation:** Fallback to manual review + support escalation

**Risk:** Dynamic pricing is too high/low
**Mitigation:** Use feature flag to test with 10% first

**Risk:** Performance degradation with 10 bots
**Mitigation:** Async execution, queuing, monitoring alerts

**Risk:** Database migration fails
**Mitigation:** Test migration on copy of prod DB first

**Risk:** Customers confused by new intake flow
**Mitigation:** A/B test old vs new, gather feedback

---

## SUCCESS CHECKLIST

Before launching v30 to production:

- [ ] All 15 Prisma models created + tested
- [ ] Database migration successful
- [ ] All new services deployed
- [ ] os-intake working end-to-end
- [ ] os-ai-orch executing bots in parallel
- [ ] Dynamic Stripe pricing working
- [ ] Admin dashboard accessible
- [ ] All 10 bots implemented + tested
- [ ] Web-main intake form live
- [ ] Portal workspace functional
- [ ] Feature flag implemented
- [ ] Feature flag set to OFF (testing only)
- [ ] Internal testing completed
- [ ] No v20 regressions
- [ ] Monitoring alerts configured
- [ ] Rollout plan documented
- [ ] Team trained on new features
- [ ] Customer documentation ready
- [ ] Support team briefed

**Once all checked: Ready for gradual rollout**

---

## SUMMARY

You're building **Kealee Platform v30**, an AI-powered transformation that:

1. **Moves intake before payment** (critical UX change)
2. **Introduces AI-determined dynamic pricing** (captures more value)
3. **Adds 7 new bots** (10 total, running in parallel)
4. **Expands to B2B, internal, white-label** (new revenue streams)
5. **Gives full AI control to admins** (no code changes needed)
6. **Integrates seamlessly with v20** (zero breaking changes)
7. **Rolls out gradually** (feature flag for safety)

**This spec includes everything.** Start with the Prisma migration and os-intake service. You have a clear path. Execute it.

---

**Ready to build. Start with Day 2-3. Good luck.**
