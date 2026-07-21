# Bot Architecture & Consolidation Guide

## Overview

The Kealee platform has two complementary bot systems serving different purposes:

### 1. API Module Agents (`/services/api/src/modules/bots/`)
- **Purpose**: Lightweight orchestration & routing for API requests
- **Framework**: Custom agent implementations
- **Integration**: Directly integrated into FastifyAPI request handlers
- **Response Time**: Immediate (no external service calls)
- **Bots**: EstimateBot, PermitBot, ContractorMatchBot, LeadBot, ProjectMonitorBot, SupportBot
- **Usage**: POST /api/v1/agents/{agentType}/execute

### 2. Standalone KeaBots (`/bots/keabot-*`)
- **Purpose**: Full-featured conversational agents with multi-turn Claude AI
- **Framework**: @kealee/core-bots + Anthropic Claude SDK
- **Integration**: Separate microservices/processes with tool use loops
- **Response Time**: Async (multi-turn conversations with Claude)
- **Bots**: keabot-estimate, keabot-permit, keabot-contractor-match, keabot-owner, keabot-command, etc. (18 total)
- **Usage**: Deployed as Railway services or batch processors

## Architecture Decision Matrix

| Scenario | Use API Bot | Use KeaBot |
|----------|-----------|-----------|
| Synchronous API request needs immediate response | ✅ | ❌ |
| Routing intake to specific service tier | ✅ | ❌ |
| Multi-turn conversation with Claude AI | ❌ | ✅ |
| Long-running analysis or planning | ❌ | ✅ |
| Executing tool use loops (10+ iterations) | ❌ | ✅ |
| Human-in-the-loop workflow | ❌ | ✅ |
| Real-time API validation | ✅ | ❌ |

## Current Duplication Issues

### Estimate Service
- **API Bot** (`estimate.bot.ts`): Handles cost estimate routing, tier recommendation, complexity scoring
- **KeaBot** (`keabot-estimate`): Claude-powered multi-turn estimation conversations
- **Status**: NOT redundant — different purposes
  - API bot: Validates intake → recommends tier → returns scoring metadata
  - KeaBot: Generates detailed cost estimates via Claude + tool use

### Permit Service
- **API Bot** (`permit.bot.ts`): Jurisdiction lookup, permit requirement validation
- **KeaBot** (`keabot-permit`): Claude-powered permit strategy & document generation
- **Status**: NOT redundant — different purposes
  - API bot: Quick validation of permit requirements
  - KeaBot: Detailed permit planning & drafting

### Contractor Match
- **API Bot** (`contractor-match.bot.ts`): Lead scoring, tier routing
- **KeaBot** (`keabot-contractor-match`): Contractor matching via Claude + database queries
- **Status**: PARTIALLY REDUNDANT
  - Both do lead scoring — need consolidation
  - API bot scoring should be authoritative, KeaBot should use API bot's score

### Support & Project Monitor
- **API Bot**: Basic request classification
- **KeaBot**: Full conversation management
- **Status**: NOT redundant — complementary

## Consolidation Action Plan (Priority 4)

### Phase 1: Establish Clear Authority (IMMEDIATE)
- [ ] Move lead scoring logic to centralized SeedRegistry (currently in both)
- [ ] Create BotOrchestrator class that dispatches to correct system
- [ ] Document decision point: "Does this request need Claude multi-turn? If no → API Bot, If yes → KeaBot"

### Phase 2: Prevent Duplication (NEXT SPRINT)
- [ ] Add shared types package: `@kealee/bot-types`
- [ ] Define AgentInput/AgentOutput types used by both systems
- [ ] Create BotCapabilities enum to validate routing decisions
- [ ] Add pre-commit hook: Prevent new bot*.ts files in /services/api without approval

### Phase 3: Consolidate Scoring Logic (FUTURE)
- [ ] Move EstimateBot scoring to packages/core-estimation/scoring.ts
- [ ] Move ContractorMatchBot scoring to packages/core-contractor/scoring.ts
- [ ] KeaBots import these shared functions instead of reimplementing

### Phase 4: Unified Registry (FUTURE)
- [ ] Create @kealee/bot-registry with:
  - Canonical bot definitions
  - Capability declarations
  - Routing rules
  - Version tracking

## Implementation Notes

### Why Not Consolidate into Single System?

**Option A: All API Bots** ❌
- Con: Cannot support multi-turn Claude conversations
- Con: Less intelligent decision-making (no tool use loops)
- Impact: Loss of KeaBot capabilities

**Option B: All KeaBots** ❌
- Con: Every API request spins up Claude conversation (cost + latency)
- Con: Overkill for simple validations
- Impact: 10x API response time increase

**Option C: Hybrid (Current)** ✅
- Pro: API bots handle lightweight routing/validation
- Pro: KeaBots handle heavy lifting (Claude AI + tools)
- Pro: Clear separation of concerns
- Con: Requires careful orchestration to avoid duplication

## Usage Examples

### Scenario: User wants cost estimate
```
1. Frontend: POST /api/v1/agents/estimate/execute { projectData }
2. EstimateBot (API):
   - Validates input
   - Scores lead (0-100)
   - Recommends tier (cost_estimate | certified_estimate | bundle)
   - Returns: { score, recommendedTier, confidence, nextStep }
3. Frontend redirects to checkout
4. After payment: BullMQ queue triggers KeaBot
5. KeaBotEstimate (standalone):
   - Retrieves full project context
   - Runs multi-turn Claude conversation
   - Executes cost estimation tools
   - Generates PDF report
   - Updates ProjectOutput with resultJson
```

### Scenario: User support inquiry
```
1. Frontend: Chat interface → KeaBot API endpoint
2. KeaBotSupport (standalone):
   - Maintains conversation context
   - Tools: search FAQ, create tickets, escalate to human
   - Claude makes decisions in loop (up to 10 iterations)
   - Returns: { response, ticketCreated?, nextPromptIfNeeded? }
```

## Monitoring & Metrics

Track these metrics to identify actual duplication:
- **Duplicate Logic Calls**: If same scoring logic runs in both API bot and KeaBot
- **Inconsistent Results**: If API bot says "tier: cost_estimate" but KeaBot generates certified_estimate-level output
- **Unused Code Paths**: If EstimateBot scoring is never called (KeaBot reimplements instead)

Add to monitoring dashboard:
```typescript
// bots.metrics.ts
metrics.gauge('bot.dual_execution', 1, { estimateId, system: 'api_and_keabot' })
metrics.gauge('bot.routing_decision_time_ms', duration, { agentType })
metrics.increment('bot.ledger_consistency_check', { match: true/false })
```

## Related Files
- API bots: `/services/api/src/modules/bots/`
- KeaBots: `/bots/keabot-*/src/`
- Core bot framework: `/packages/core-bots/src/`
- Shared types: `/packages/shared/src/` (future)
- Routing logic: `/services/api/src/modules/agents/` (uses bots internally)

## Migration Checklist (When Ready)

- [ ] Test EstimateBot scoring against KeaBotEstimate scoring
- [ ] Test ContractorMatchBot lead scoring consistency
- [ ] Document any differences (should be none)
- [ ] Create shared scoring package
- [ ] Update imports in KeaBots
- [ ] Delete duplicate scoring code from API bots
- [ ] Add integration tests for routing decisions
- [ ] Monitor metrics for 1 week before marking complete
