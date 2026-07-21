# Kealee Agent Execution System: Complete Index

**Status**: Ready for implementation  
**Updated**: 2026-05-22  
**Total Lines**: ~2,850 TypeScript + ~2,000 markdown  

---

## Kealee Platform v30 (new)

**Folder:** [Kealee Platform Agents/INDEX.md](../Kealee%20Platform%20Agents/INDEX.md)  
**Runnable package:** `@kealee/kealee-agent-stack` → `src/v30/`  
**API:** `POST /v30/intake`, `POST /v30/project/:id/generate` (flag: `KEALEE_V30_ENABLED`)

| Doc | Path |
|-----|------|
| Start here | `Kealee Platform Agents/v30/README-START-HERE.md` |
| Implementation guide | `Kealee Platform Agents/v30/KEALEE-v30-IMPLEMENTATION-GUIDE.md` |
| Master spec | `Kealee Platform Agents/v30/KEALEE-v30-COMPLETE-MASTER-SPEC.md` |
| Integration strategy | `Kealee Platform Agents/v30/KEALEE-v30-INTEGRATION-STRATEGY.md` |

---

## 📋 File Navigation

### 🚀 Start Here
- **QUICK-START.md** ← Begin here (5-minute setup)
  - Copy & paste installation
  - "Hello DesignBot" example
  - Cost comparison
  - Troubleshooting quick answers

### 📚 Complete Reference
- **KEALEE-AGENT-IMPLEMENTATION-GUIDE.md** ← Full documentation
  - Architecture deep dive
  - All 6 usage patterns
  - Approval workflows
  - Prompt caching details
  - Testing & smoke tests
  - Deployment checklist

### 🏗️ Implementation Files (Copy to your project)

#### Layer 1: Orgo (Organizational Structure)
- **orgo-agent-structure.ts** (~450 lines)
  - `KeaBotRoot`: Entry point executor
  - `Gateway`: Intent classifier
  - `KeaBotChain`: Immutable routing logic
  - `KeaBotExecutor`: Action runner for each KeaBot
  - `ExecutionContext`: Shared state between stages
  - Classes: `AgentRole`, `ChainStage`, enums

#### Layer 2: Hermes (Function Routing & Execution)
- **hermes-function-routing.ts** (~500 lines)
  - `ClaudeCachedClient`: Anthropic SDK wrapper with cache_control
  - `CacheMetricsLogger`: Track cache hits, cost savings
  - `FunctionRouter`: Route function calls to handlers
  - `KheaEventEmitter`: Event system (KheaEvent enum)
  - Helper: `createCacheableContext()` for reusable contexts
  - Interfaces: `CacheMetricsSnapshot`, `ClaudeCallResult`

#### Layer 3: Obsidian (Knowledge Base)
- **obsidian-knowledge-base.ts** (~600 lines)
  - `ObsidianKnowledgeBase`: Main class with 4 operation groups:
    - **Concept Operations**: Store, retrieve, approve concepts, update images
    - **Pricing Operations**: Load 2026 DMV rates from core-rules
    - **Permit Blueprints**: DC DCRA (REST) + Maryland (Playwright)
    - **Approval Workflows**: Define gates for each stage
    - **Audit Log**: Record all agent actions
  - Records: ConceptRecord, PricingRulesRecord, PermitBlueprintRecord, etc.
  - Singleton: `getObsidianKnowledgeBase()`

### 🔗 Integration & Usage

- **kealee-integration-example.ts** (~400 lines)
  - `KealeeAgentSystem`: Main class ready to use
  - Methods: `executeAIConcept()`, `executeEstimate()`, `executePermitFiling()`
  - Event system setup with 5 standard handlers
  - Includes working example with `main()` function

- **kealee-integration-points.ts** (~500 lines)
  - 9 integration patterns:
    1. Stripe webhook → KeaBot trigger
    2. Portal intake form → DesignBot launch
    3. Concept approval → EstimateBot launch
    4. Estimate approval → PermitBot launch
    5. Real-time portal updates via WebSocket
    6. Cache metrics → Analytics dashboard
    7. Marketplace lead → Auto-project creation
    8. Next.js API route examples
    9. ClaudeCachedClient replaces direct SDK calls
  - Complete next.js examples (copy & paste ready)
  - Deployment checklist

---

## 🏛️ Three-Layer Architecture

```
┌──────────────────────────────────────────────────┐
│ ORGO: Organizational Structure                    │
│ • KeaBotRoot (entry point)                       │
│ • Gateway (intent → chain stages)                │
│ • KeaBotChain (immutable design→estimate→permit) │
│ • KeaBotExecutor (calls Claude models)           │
└──────────────────────────────────────────────────┘
                        ↕
┌──────────────────────────────────────────────────┐
│ OBSIDIAN: Knowledge Base                          │
│ • ConceptRecord (design output + images)         │
│ • PricingRulesRecord (2026 DMV rates)           │
│ • PermitBlueprintRecord (DC + Maryland)          │
│ • ApprovalWorkflowRecord (gates)                 │
│ • AuditEntry (all actions)                       │
└──────────────────────────────────────────────────┘
                        ↕
┌──────────────────────────────────────────────────┐
│ HERMES: Function Routing & Execution             │
│ • ClaudeCachedClient (Anthropic wrapper)         │
│ • CacheMetricsLogger (40-60% cost savings)      │
│ • FunctionRouter (function dispatch)             │
│ • KheaEventEmitter (state change broadcast)      │
└──────────────────────────────────────────────────┘
```

---

## 🎯 Key Concepts

### Immutable Chain
```
DesignBot (Opus) → EstimateBot (Sonnet) → PermitBot (Sonnet)
   (9 Q&A)            (cost breakdown)      (permit filing)
    Chain-gated: Each stage requires prior completion
    No stage executes without prior output
```

### Prompt Caching (40-60% cost savings)
```
Four cacheable blocks (<1,024 tokens each):
1. System prompt (role definition)
2. Pricing rules (from core-rules package)
3. Construction Task Catalog (2026 DMV units)
4. Execution constraints (model locks, approval gates)

First call:  All blocks sent → Cache created (~2,500 tokens)
Next calls:  Blocks reused → 90% input token savings
Result: 40-60% total API cost reduction per portfolio
```

### Approval Workflows
```
CONCEPT: 
  ├─ Approver: CLIENT
  ├─ Auto-approve: No
  └─ Timeout: 48h

ESTIMATE:
  ├─ Approvers: CLIENT + FINANCE
  ├─ Auto-approve: No
  └─ Timeout: 72h

PERMIT:
  ├─ Approvers: PE + COMPLIANCE
  ├─ Auto-approve: Yes (after approvals)
  └─ Timeout: 24h
```

### Event System
```
KheaEvent (enums):
  ├─ DESIGN_COMPLETE → DesignBot done
  ├─ ESTIMATE_COMPLETE → EstimateBot done
  ├─ PERMIT_FILED → PermitBot filed
  ├─ APPROVAL_REQUIRED → Workflow blocked
  ├─ ERROR → Any stage failed
  └─ CACHE_HIT → Cache savings achieved

→ WebSocket → Real-time portal updates
```

---

## 💾 Pricing Rules (CRITICAL)

**Single source of truth**: `packages/core-rules/src/pricing.ts`

**NEVER hardcode prices in agents.** Always import:
```typescript
const rules = await obsidian.getPricingRules("DMV", 2026);
// Returns:
// {
//   baselineMultiplier: 1.28,  // +28% DMV adjustment
//   materialAdjustments: { lumber: 1.38, steel: 1.15, ... },
//   hourlyRates: { HVAC: {base: 95, regional: 121.6, overhead: 1.35}, ... },
//   equipmentDailyRates: { CRANE: {min: 1200, max: 1800}, ... },
//   contingencyRate: 0.15,
//   builderRiskRate: 0.012
// }
```

---

## 📊 Metrics & Performance

### Cache Metrics
```typescript
const metrics = await cacheLogger.getAggregateMetrics();
// Returns:
// {
//   totalRequests: 15,
//   cacheHitRate: 0.73,  // 73% hit rate (target: 40-60%)
//   avgCostSavingsPercent: 42.5,
//   totalTokensSaved: 18750
// }
```

### Cost at Scale
```
1,000 projects/month:
  Without cache: 1000 × $0.021 = $21,000
  With cache: 1000 × $0.012 = $12,000
  Monthly savings: $9,000 💰
  
Annual savings: $108,000
```

---

## 🧪 Testing & Smoke Tests

**All 12 must pass before deployment:**

```typescript
// tests/smoke-12-keabot.test.ts
✓ DesignBot produces valid JSON output
✓ EstimateBot chains after concept
✓ PermitBot chains after estimate
✓ Obsidian stores concept correctly
✓ Pricing rules load from core-rules
✓ Cache metrics recorded
✓ Approval workflow blocks estimate
✓ Events emit on completion
✓ DC DCRA permit blueprint correct
✓ Maryland Playwright fields correct
✓ No Zem Solutions references
✓ Cache hit rate >= 40%
```

---

## 🚀 Deployment Path

### Phase 1: Setup (10 min)
1. Copy 6 TypeScript files to `packages/core-bots/src/`
2. Set `ANTHROPIC_API_KEY` env var
3. Run smoke tests (all 12 pass)

### Phase 2: Integration (1-2 hours)
1. Add Stripe webhook handler
2. Create Next.js API routes
3. Setup WebSocket event listeners
4. Integrate with portal apps

### Phase 3: Deployment (30 min)
1. Deploy services to Railway
2. Deploy portal apps to Vercel
3. Enable Stripe webhook for production
4. Monitor first 24h metrics

### Phase 4: Monitoring (Ongoing)
1. Track cache hit rate (target: ≥40%)
2. Monitor API error rate
3. Log cost savings to analytics
4. Setup alerts for failures

---

## 📖 Usage Pattern Quick Reference

### Pattern 1: DesignBot Only (AI Concept)
```typescript
const result = await system.executeAIConcept(
  projectId, userId, intakeAnswers
);
// Returns: concept with 3 designs × 6 images
```

### Pattern 2: Full Chain (Design → Estimate → Permit)
```typescript
const result = await system.executeAIConcept(...);     // Stage 1
const result = await system.executeEstimate(...);      // Stage 2
const result = await system.executePermitFiling(...);  // Stage 3
```

### Pattern 3: Event Listeners
```typescript
system.onEvent(KheaEvent.DESIGN_COMPLETE, (projectId, data) => {
  console.log(`Design ready: ${data.conceptId}`);
});
```

### Pattern 4: Approval Gates
```typescript
const approved = await obsidian.canProceedToNextStage(conceptId, "CONCEPT");
if (approved) {
  await system.executeEstimate(...);
}
```

---

## 🔒 Rules & Constraints

### Model Lock (Cannot change without SESSION 12 smoke test)
- DesignBot: Always Claude Opus 4.6
- EstimateBot: Always Claude Sonnet
- PermitBot: Always Claude Sonnet

### Chain Immutability
- DesignBot must complete before EstimateBot
- EstimateBot must complete before PermitBot
- No shortcuts or branch paths allowed
- No deployment without smoke test pass

### Pricing
- Never hardcode prices
- Always import from packages/core-rules/src/pricing.ts
- Update pricing centrally, everywhere syncs automatically

### No Zem Solutions
- Never mention or reference Zem Solutions in any context
- Check all prompts with smoke test #11

---

## 🛠️ Cursor IDE Configuration

Add to `.mdc`:
```markdown
# Kealee KeaBot Rules

## Import always from these locations
- Pricing: packages/core-rules/src/pricing.ts
- Models: DesignBot (Opus), EstimateBot (Sonnet), PermitBot (Sonnet)

## Chain rules
- Immutable: Design → Estimate → Permit
- No shortcuts between stages
- All cache_control: ephemeral on final system block

## Integration points
- Stripe webhook
- Next.js API routes
- WebSocket portal updates
- Obsidian knowledge base
```

---

## 📞 Support & Troubleshooting

### Issue: Cache miss on repeated calls
**Solution**: Reuse CacheableContext across multiple calls on same project

### Issue: EstimateBot can't find pricing
**Solution**: Verify obsidian.getPricingRules() returns data

### Issue: PermitBot files unapproved estimate
**Solution**: Add approval gate check before launching PermitBot

See **QUICK-START.md** "Troubleshooting" section for more.

---

## 📑 File Structure (After Implementation)

```
kealee-platform-v10/
├── packages/
│   └── core-bots/
│       └── src/
│           ├── orgo/
│           │   └── orgo-agent-structure.ts
│           ├── hermes/
│           │   └── hermes-function-routing.ts
│           ├── obsidian/
│           │   └── obsidian-knowledge-base.ts
│           └── integration/
│               ├── kealee-integration-example.ts
│               └── kealee-integration-points.ts
├── docs/
│   ├── QUICK-START.md
│   └── KEALEE-AGENT-IMPLEMENTATION-GUIDE.md
└── tests/
    └── smoke-12-keabot.test.ts
```

---

## ✨ You're Ready!

All files are production-ready. Copy, integrate, test, deploy.

**Next steps:**
1. Read QUICK-START.md (5 min)
2. Copy files to your project
3. Run smoke tests
4. Deploy and monitor

**Questions?** Check KEALEE-AGENT-IMPLEMENTATION-GUIDE.md for detailed answers.

---

**Last Updated**: 2026-05-16  
**Status**: ✅ Ready for Implementation  
**Session**: Orgo + Obsidian + Hermes Architecture Complete
