# Core Package Consolidation Plan

**Status:** Proposal for future refactoring
**Impact:** Reduce cognitive load, improve maintainability
**Risk:** Medium (requires coordinated updates across 30+ packages)

## Current State: 19 Core-* Packages

```
core-ai-gateway      → AI model routing
core-agents          → Agent orchestration framework
core-auth            → ❌ DELETED (use @kealee/auth instead)
core-bim             → Building Information Model
core-bots            → Bot base class & registry
core-config          → Environment configuration
core-ddts            → Digital Development Twin System
core-documents       → Document management
core-events          → Event bus & pub/sub
core-hooks           → React hooks library
core-integrations    → Third-party service integrations
core-llm             → LLM provider abstraction
core-notifications   → Notification delivery
core-rules           → Business rules engine
core-search          → PostgreSQL search (tsvector)
core-tools           → Utility functions for agents
core-tools           → (duplicate naming risk!)
core-auth            → (superseded by auth package)
```

## Proposed Consolidation: 5 Logical Domains

### Domain 1: **Core AI Stack** (`@kealee/ai-infrastructure`)
**Consolidates:** core-llm, core-agents, core-ai-gateway, core-tools
**Purpose:** All LLM-related abstractions and agent orchestration
**Current files affected:** 4 packages
**Migration effort:** High (31 dependents)

```
packages/ai-infrastructure/
├── src/
│   ├── llm/          ← from core-llm
│   ├── agents/       ← from core-agents  
│   ├── gateway/      ← from core-ai-gateway
│   └── tools/        ← from core-tools
└── package.json
```

### Domain 2: **Core Platform Services** (`@kealee/platform-services`)
**Consolidates:** core-bots, core-events, core-notifications, core-integrations
**Purpose:** Platform infrastructure and service integrations
**Current files affected:** 4 packages
**Migration effort:** High (42 dependents)

```
packages/platform-services/
├── src/
│   ├── bots/             ← from core-bots
│   ├── events/           ← from core-events
│   ├── notifications/    ← from core-notifications
│   └── integrations/     ← from core-integrations
└── package.json
```

### Domain 3: **Core Data & Search** (`@kealee/data-layer`)
**Consolidates:** core-search, core-documents, core-rules
**Purpose:** Data access, search, and business logic
**Current files affected:** 3 packages
**Migration effort:** Medium (22 dependents)

```
packages/data-layer/
├── src/
│   ├── search/     ← from core-search
│   ├── documents/  ← from core-documents
│   └── rules/      ← from core-rules
└── package.json
```

### Domain 4: **Core Metadata** (`@kealee/metadata`)
**Consolidates:** core-config, core-ddts, core-bim
**Purpose:** Domain models and configuration
**Current files affected:** 3 packages
**Migration effort:** Low (minimal dependents)

```
packages/metadata/
├── src/
│   ├── config/  ← from core-config
│   ├── ddts/    ← from core-ddts
│   └── bim/     ← from core-bim
└── package.json
```

### Domain 5: **Core UI & Hooks** (`@kealee/ui-core`)
**Consolidates:** core-hooks (standalone, low priority)
**Note:** core-hooks is small and used only by UI layer
**Migration effort:** Low

## Migration Path

### Phase 1: Preparation (Non-blocking)
- [ ] Create new consolidated packages with new structure
- [ ] Export all symbols from legacy packages (re-exports)
- [ ] Document migration path for consumers

### Phase 2: Gradual Migration
- [ ] Update high-level apps (portals, dashboards) to use new packages
- [ ] Update services (API, command-center) 
- [ ] Update internal packages

### Phase 3: Cleanup
- [ ] Mark legacy packages as deprecated
- [ ] Remove legacy packages (30-day deprecation period)
- [ ] Update documentation

## Risk Mitigation

1. **Parallel exports:** Legacy packages continue to work via re-exports
2. **Gradual rollout:** Don't force all consumers at once
3. **Automated tests:** CI validates all imports still work
4. **Clear naming:** New packages have distinct names

## Benefits

✅ **Reduced Cognitive Load:** 19 packages → 5 logical domains
✅ **Easier Onboarding:** New developers understand architecture faster
✅ **Better Maintainability:** Related code lives together
✅ **Clearer Dependencies:** Explicit service boundaries
✅ **Smaller bundle impact:** Better tree-shaking for unused domains

## Alternative: Keep Current Structure

**Pros:**
- No migration effort
- Fine-grained package control
- Easy to remove unused code

**Cons:**
- Harder to understand system architecture
- More files to maintain
- Longer build times
- More dependency management overhead

## Recommendation

**Timeline:** Q3 2026 (after current features ship)
**Owner:** Architecture/Platform team
**Effort:** 80 developer-hours across 4 sprints
