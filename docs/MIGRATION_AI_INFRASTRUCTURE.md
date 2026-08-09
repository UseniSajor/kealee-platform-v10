# Migration Guide: Core AI Packages → @kealee/ai-infrastructure

**Status:** Phase 1 Consolidation (Q3 2026)
**Backward Compatible:** Yes - old imports still work
**Timeline:** Soft deprecation starting now, removal planned Q4 2026

## Overview

Four previously separate packages have been consolidated into a single unified package:

```
OLD STRUCTURE (4 packages)          NEW STRUCTURE (1 package)
├── @kealee/core-llm          →    @kealee/ai-infrastructure
├── @kealee/core-agents       →    ├── /llm (from core-llm)
├── @kealee/core-ai-gateway   →    ├── /agents (from core-agents)
└── @kealee/core-tools        →    ├── /gateway (from core-ai-gateway)
                                   └── /tools (from core-tools)
```

## Why Consolidate?

✅ **Reduces complexity:** 4 packages → 1 unified namespace
✅ **Clearer dependencies:** Related code lives together
✅ **Easier maintenance:** Fewer separate release cycles
✅ **Better tree-shaking:** Unused domains excluded from bundles
✅ **Simpler onboarding:** New devs understand AI stack faster

## Migration Path

### Option 1: Lazy Migration (Recommended)
No changes required immediately. Old imports still work:

```typescript
// This still works (via re-export)
import { LLMRouter } from '@kealee/core-llm'
import { Agent } from '@kealee/core-agents'
import { AIGateway } from '@kealee/core-ai-gateway'
import { ToolRegistry } from '@kealee/core-tools'
```

### Option 2: Immediate Migration
Update to new imports when you refactor:

```typescript
// NEW: All from unified package
import {
  LLMRouter,
  Agent,
  AIGateway,
  ToolRegistry,
} from '@kealee/ai-infrastructure'

// OR: Import from specific domains
import { LLMRouter } from '@kealee/ai-infrastructure/llm'
import { Agent } from '@kealee/ai-infrastructure/agents'
import { AIGateway } from '@kealee/ai-infrastructure/gateway'
import { ToolRegistry } from '@kealee/ai-infrastructure/tools'
```

## Backward Compatibility

All legacy packages now re-export from `@kealee/ai-infrastructure`:

```
@kealee/core-llm
  ↓
  export * from '@kealee/ai-infrastructure/llm'
  ↓
  works with existing imports
```

**Zero breaking changes** in this phase. Existing code continues to work.

## Timeline

### Phase 1 (Q3 2026 - NOW)
- ✅ Create @kealee/ai-infrastructure with consolidated code
- ✅ Set up re-exports in legacy packages
- ✅ Mark legacy packages as deprecated
- ✅ Update new code to use new package

**What to do:** Start using `@kealee/ai-infrastructure` in new code

### Phase 2 (Q4 2026)
- Update high-level consumers (web-main, services/api, portals)
- Add migration tests
- Generate codemods for automated updates

**What to do:** Migrate your service/app when making related changes

### Phase 3 (2027)
- Remove legacy package.json files
- Clean up node_modules

**What to do:** All code should be on new package by now

## Checking Your Code

### Find imports that need updating
```bash
grep -r "from '@kealee/core-llm" .
grep -r "from '@kealee/core-agents" .
grep -r "from '@kealee/core-ai-gateway" .
grep -r "from '@kealee/core-tools" .
```

### Update single file
```bash
# Before
import { LLMRouter } from '@kealee/core-llm'
import { Agent } from '@kealee/core-agents'

# After
import { LLMRouter, Agent } from '@kealee/ai-infrastructure'
```

## API Reference

All exports remain the same. Only the import path changes:

| Export | Old Import | New Import |
|--------|-----------|-----------|
| LLMRouter | `@kealee/core-llm` | `@kealee/ai-infrastructure` or `@kealee/ai-infrastructure/llm` |
| LLMProvider | `@kealee/core-llm` | `@kealee/ai-infrastructure` or `@kealee/ai-infrastructure/llm` |
| Agent | `@kealee/core-agents` | `@kealee/ai-infrastructure` or `@kealee/ai-infrastructure/agents` |
| AIGateway | `@kealee/core-ai-gateway` | `@kealee/ai-infrastructure` or `@kealee/ai-infrastructure/gateway` |
| ToolRegistry | `@kealee/core-tools` | `@kealee/ai-infrastructure` or `@kealee/ai-infrastructure/tools` |

## Questions?

- **Why re-exports?** Ensures zero breaking changes during migration
- **Can I ignore this?** Yes, until Q4 2026. Old imports will work
- **Do I need to update all at once?** No, gradual migration is fine
- **What if I find a bug in re-exports?** Report it; re-exports are just `export *` passthrough

## Next Consolidation Targets

Future phases will consolidate:
- **Phase 2:** Platform Services (core-bots, core-events, core-notifications, core-integrations)
- **Phase 3:** Data Layer (core-search, core-documents, core-rules)
- **Phase 4:** Metadata (core-config, core-ddts, core-bim)
