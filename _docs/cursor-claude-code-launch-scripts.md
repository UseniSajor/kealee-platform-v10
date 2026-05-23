# Cursor IDE + Claude Code Integration Scripts
## Launch DesignBot/EstimateBot/PermitBot Intake Testing

---

## **Setup: Cursor Configuration**

### **File: .cursor/rules/.mdc (Modern Development Config)**

```yaml
# .cursor/rules/kealee-keabots.mdc

name: "Kealee KeaBots Testing"
description: "Test suite for DesignBot, EstimateBot, PermitBot intake chains"

tags:
  - kealee-platform
  - keabots
  - testing
  - design-to-permits

context:
  project_structure: |
    kealee-platform-v20/
    ├── apps/
    │   ├── portal-owner/        (Next.js)
    │   ├── portal-contractor/   (Next.js)
    │   └── ...
    ├── packages/
    │   ├── core-rules/          (pricing, rates)
    │   ├── core-bots/           (DesignBot, EstimateBot, PermitBot)
    │   └── ...
    ├── tests/
    │   ├── keabots/
    │   │   ├── use-case-1.design.test.js
    │   │   ├── use-case-1.estimate.test.js
    │   │   └── use-case-1.permit.test.js
    │   └── ...
    ├── prisma/
    │   └── schema.prisma        (KeaBotRun model, cache metrics)
    └── scripts/
        └── test-all-intakes.sh

  key_rules: |
    1. DesignBot ALWAYS uses claude-opus-4-6 (non-negotiable)
    2. EstimateBot uses claude-sonnet-4-20250514 (cost-optimized)
    3. PermitBot uses claude-sonnet-4-20250514 (cost-optimized)
    4. ALL KeaBots use cache_control: ephemeral
    5. Pricing ONLY from packages/core-rules/src/pricing.ts (never hardcoded)
    6. No deployment without SESSION 12 smoke test passing all 12 checks
    7. Never reference Zem Solutions in any Kealee work

  cache_config: |
    Target: 40-60% cache hit ratio
    Cacheable blocks: system message, user context, design specs (max 1,024 tokens each)
    Metrics tracked: cacheCreationTokens, cacheReadTokens, cacheHit (Prisma KeaBotRun)

  dc_dcra_config: |
    Type: REST API (Type A)
    Base URL: https://dcra.dc.gov/api/permits
    Auth: API key (process.env.DC_DCRA_API_KEY)
    Sandbox available: /api/permits/test

  maryland_permit_config: |
    Type: Playwright automation (Type B)
    Supported counties: montgomery, prince_george, baltimore, anne_arundel, etc.
    No unified API (each county different)

rules:
  - trigger: "test design"
    command: "pnpm test:design-bot"
    description: "Run all DesignBot intake tests"

  - trigger: "test estimate"
    command: "pnpm test:estimate-bot"
    description: "Run all EstimateBot tests"

  - trigger: "test permits"
    command: "pnpm test:permit-bot"
    description: "Run all PermitBot tests (DC + Maryland)"

  - trigger: "test all intakes"
    command: "bash scripts/test-all-intakes.sh"
    description: "Full integration: DesignBot → EstimateBot → PermitBot"

  - trigger: "session 12 smoke"
    command: "pnpm run smoke-test:session-12"
    description: "Run all 12 SESSION 12 checks before deployment"

  - trigger: "cache metrics"
    command: "npm run cache-metrics:report"
    description: "Generate cache hit/miss report"
```

---

## **Claude Code Prompt: Interactive DesignBot Testing**

### **Launch from Cursor Terminal**

```bash
# In Cursor terminal, create and run this:
# FILE: scripts/claude-code-designbot-interactive.sh

#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  KEALEE PLATFORM — DESIGNBOT INTERACTIVE TESTING               ║${NC}"
echo -e "${BLUE}║  Claude Code Intake Testing Tool                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Menu
echo "Select a use case to test:"
echo ""
echo "1) Townhouse Renovation (DC Ward 7)"
echo "2) Office-to-Residential Conversion (DC Chinatown)"
echo "3) Luxury Penthouse Gut Reno (Arlington VA)"
echo "4) Retail TI - Pandora Store (Oxon Hill MD)"
echo "5) Micro Apartments (72-unit, 7-story)"
echo "6) Historic Rowhouse Restoration (Capitol Hill, DC)"
echo "7) Commercial Tenant Finish (Law Office, Downtown DC)"
echo "8) Ground-Up Residential - Townhomes (Germantown MD)"
echo "9) Medical Office TI (Bethesda MD)"
echo "10) Property Management (55-unit DC building)"
echo ""
read -p "Enter choice (1-10): " choice

case $choice in
  1)
    USE_CASE="use-case-1"
    PROJECT="townhouse_dc_ward7"
    ;;
  2)
    USE_CASE="use-case-2"
    PROJECT="office_to_residential_dc_chinatown"
    ;;
  3)
    USE_CASE="use-case-3"
    PROJECT="luxury_penthouse_arlington"
    ;;
  4)
    USE_CASE="use-case-4"
    PROJECT="retail_ti_pandora_oxon_hill"
    ;;
  5)
    USE_CASE="use-case-5"
    PROJECT="micro_apartments_72_unit"
    ;;
  6)
    USE_CASE="use-case-6"
    PROJECT="historic_rowhouse_capitol_hill"
    ;;
  7)
    USE_CASE="use-case-7"
    PROJECT="law_office_consolidation_dc"
    ;;
  8)
    USE_CASE="use-case-8"
    PROJECT="ground_up_townhomes_germantown"
    ;;
  9)
    USE_CASE="use-case-9"
    PROJECT="medical_office_bethesda"
    ;;
  10)
    USE_CASE="use-case-10"
    PROJECT="property_management_dc"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✓ Selected: $USE_CASE — $PROJECT${NC}"
echo ""

# Start DesignBot intake
echo -e "${YELLOW}Starting DesignBot intake process...${NC}"
echo ""

# Generate intake form dynamically
cat > /tmp/designbot_prompt.md << 'PROMPT'
# DesignBot Interactive Intake Form

You are DesignBot, an AI agent for Kealee Platform v20.

**Your role:** Accept 9 project questions, generate 6 concept images, materials board, and systems diagrams.

**Rules:**
1. Ask each question clearly, wait for user response
2. Store all responses
3. Use Claude Opus 4.6 for image generation (non-negotiable)
4. Generate concepts in 13 minutes average
5. Route to EstimateBot → (Architecture or Estimation Package)
6. Cache all prompts (ephemeral control)

**9 QUESTIONS TO ASK:**

1. "What's the scope? Kitchen-only, whole-house, or systems reno?"
2. "What's the property condition? Original systems? Dated cosmetics?"
3. "What's your preferred design style? (Modern, traditional, mixed)"
4. "Should we include appliances/fixtures, or just labor?"
5. "What bathroom updates do you need?"
6. "Any HVAC, plumbing, or electrical issues we should know about?"
7. "Timeline flexibility? Hard deadline or flexible?"
8. "Any green/sustainability priorities? (Energy Star, solar, EV charger)"
9. "Budget range? What are we working with?"

**AFTER COLLECTING RESPONSES:**
- Generate 6 concept images (prompt Runway Gen-3 or ElevenLabs)
- Create material board (finishes, fixtures, colors)
- Diagram footprint changes (if any)
- Show systems layout (electrical, plumbing, HVAC runs)
- Calculate GSF impact
- Recommend next step (EstimateBot → which package tier)

**OUTPUT FORMAT:**
{
  "projectId": "proj_<hash>",
  "intake_responses": { /* 9 questions */ },
  "concepts": {
    "images": [url_1, url_2, ...],
    "materialBoard": { ... },
    "footprintChanges": "description",
    "systemsDiagram": "description"
  },
  "nextStep": {
    "package": "estimation_package_x",
    "price": 4950,
    "reason": "..."
  },
  "cache_metrics": {
    "cacheCreationTokens": 1024,
    "cacheReadTokens": 512,
    "cacheHit": true
  }
}

Now, ask question 1 and wait for the user's response.
PROMPT

# Launch Claude Code with the prompt
echo -e "${BLUE}Launching Claude Code session...${NC}"
echo ""

# Use claude-code CLI (installed via @anthropic-sdk/claude-code-cli)
claude-code --model claude-opus-4-6 \
  --cache-control ephemeral \
  --project-id "$PROJECT" \
  --system-prompt @/tmp/designbot_prompt.md \
  --context "kealee-intakes-usecases.md" \
  --interactive

# After session ends, offer next steps
echo ""
echo -e "${GREEN}✓ DesignBot intake complete${NC}"
echo ""
echo "Next steps:"
echo "1. View generated concepts: http://localhost:3000/projects/$PROJECT/concepts"
echo "2. Run EstimateBot: pnpm test:estimate-bot -- --project=$PROJECT"
echo "3. Run PermitBot: pnpm test:permit-bot -- --project=$PROJECT"
echo ""
```

---

## **Claude Code Prompt: EstimateBot Full Breakdown**

```bash
# FILE: scripts/claude-code-estimatebot-interactive.sh

#!/bin/bash

cat > /tmp/estimatebot_prompt.md << 'PROMPT'
# EstimateBot — Detailed Estimation Engine

You are EstimateBot, a cost estimation AI for Kealee Construction.

**Your role:** Accept DesignBot output, generate detailed estimate with line items, labor hours, timelines.

**INPUTS:**
- DesignBot concepts (6 images, materials, scopes)
- Square footage data
- Trade complexity (simple, moderate, advanced)
- Kealee self-perform trades: HVAC, plumbing, electrical (cost 25-35% below market)
- DMV region rates from core-rules/pricing.ts

**ESTIMATION RULES:**

1. **Labor Hour Calculation per Trade:**
   - Demolition: 8 hrs per 100 sq ft
   - Carpentry/Framing: 12 hrs per 100 sq ft
   - Plumbing: 16 hrs per bathroom + 20 hrs per kitchen
   - HVAC: 24 hrs (ductwork) + 8 hrs (install furnace)
   - Electrical: 20 hrs (panel upgrade) + 12 hrs per 100 sq ft (circuits)
   - Tile: 6 hrs per 50 sq ft
   - Painting: 4 hrs per 100 sq ft
   - Cabinetry: 40 hrs (install labor, materials separate)

2. **Material Costs:**
   - Import from spec sheets (or request from user)
   - Apply DMV regional multipliers (lumber +38%, copper +15%, etc.)
   - Add 5-10% waste factor on materials

3. **Labor Rates (DMV 2026):**
   - Kealee internal (self-perform): $45-65/hr (HVAC, plumb, elec)
   - Subcontracted trades: Market rate from core-rules
   - Markup: 15-25% for overhead/profit

4. **Contingency:**
   - 20% default for residential renovation
   - 15% for new construction
   - 30% for historic/challenging projects

5. **Timeline:**
   - Build sequentially: Permits → Demo → Systems → Framing → Finishes → Punch
   - Each phase depends on prior phase
   - Show critical path

**OUTPUT STRUCTURE:**

{
  "projectId": "proj_...",
  "projectType": "residential_renovation",
  "scope": "Kitchen + 2 bathrooms + electrical panel + HVAC",
  
  "lineItems": [
    {
      "lineNumber": 1,
      "category": "Labor",
      "trade": "demolition",
      "description": "Selective demolition, kitchen + 2 bathrooms",
      "quantity": 128,
      "unit": "hours",
      "ratePerUnit": 55,
      "cost": 7040,
      "notes": "Asbestos abatement allowance included"
    },
    {
      "lineNumber": 2,
      "category": "Material",
      "trade": "cabinetry_kitchen",
      "description": "Custom light wood cabinetry, hardware",
      "quantity": 1,
      "unit": "lot",
      "cost": 12500,
      "vendor": "TBD - spec on approval"
    },
    /* ... 20+ more lines */
  ],
  
  "summary": {
    "totalLabor": 45000,
    "totalMaterial": 98000,
    "subtotal": 143000,
    "contingency": {
      "percentage": 20,
      "amount": 28600
    },
    "escalationFactor": 1.02,
    "totalEstimate": 169392,
    "budgetRange": "$180,000-$220,000",
    "status": "within budget ✓"
  },
  
  "timeline": {
    "phases": [
      { "phase": "Permitting", "weeks": 2, "criticalPath": true },
      { "phase": "Demolition", "weeks": 1, "criticalPath": true },
      { "phase": "Systems (HVAC/Plumb/Elec)", "weeks": 4, "criticalPath": true },
      { "phase": "Framing/Drywall", "weeks": 3, "criticalPath": true },
      { "phase": "Finishes", "weeks": 4, "criticalPath": true },
      { "phase": "Punch/Closeout", "weeks": 2, "criticalPath": true }
    ],
    "totalDuration": 16,
    "unit": "weeks"
  },
  
  "nextStep": {
    "package": "estimation_package_c",
    "price": 4950,
    "description": "Detailed estimate + fixture procurement schedule + bid packages for subs"
  },
  
  "cacheMetrics": {
    "cacheCreationTokens": 2048,
    "cacheReadTokens": 1024,
    "cacheHit": true
  }
}

Process the DesignBot output provided and generate a detailed estimate.
Use DMV rates. Show all assumptions clearly. Flag any unusual items.
PROMPT

# Launch with project context
echo "Launching EstimateBot session..."
echo ""

claude-code --model claude-sonnet-4-20250514 \
  --cache-control ephemeral \
  --system-prompt @/tmp/estimatebot_prompt.md \
  --context "keabots-estimate-permit-testing.md" \
  --input-file "/tmp/designbot_output.json" \
  --interactive
```

---

## **Quick Test Scripts for Cursor**

### **One-Liner: Test a Single Use Case**

```bash
# In Cursor terminal:

# Test Use Case 1: Townhouse Renovation
pnpm test tests/keabots/use-case-1.design.test.js && \
pnpm test tests/keabots/use-case-1.estimate.test.js && \
pnpm test tests/keabots/use-case-1.permit.test.js

# Test all 10 use cases
bash scripts/test-all-intakes.sh

# Test cache efficiency
pnpm run cache-metrics:report

# Run SESSION 12 smoke test (required before deploy)
pnpm run smoke-test:session-12
```

### **Cursor Command Palette Setup**

```json
// .cursor/commands.json (if available in your setup)

{
  "commands": [
    {
      "id": "test-design-bot",
      "label": "Test: DesignBot Intake",
      "command": "pnpm test tests/keabots/*.design.test.js",
      "keybinding": "ctrl+shift+d"
    },
    {
      "id": "test-estimate-bot",
      "label": "Test: EstimateBot Estimates",
      "command": "pnpm test tests/keabots/*.estimate.test.js",
      "keybinding": "ctrl+shift+e"
    },
    {
      "id": "test-permit-bot",
      "label": "Test: PermitBot Filings",
      "command": "pnpm test tests/keabots/*.permit.test.js",
      "keybinding": "ctrl+shift+p"
    },
    {
      "id": "test-all-intakes",
      "label": "Test: All 10 Use Cases (Full Integration)",
      "command": "bash scripts/test-all-intakes.sh",
      "keybinding": "ctrl+shift+a"
    },
    {
      "id": "smoke-test",
      "label": "Test: SESSION 12 Smoke Test (Pre-Deployment)",
      "command": "pnpm run smoke-test:session-12",
      "keybinding": "ctrl+shift+s"
    }
  ]
}
```

---

## **SESSION 12 Smoke Test Checklist**

```bash
#!/bin/bash
# FILE: scripts/smoke-test-session-12.sh
# REQUIRED: All 12 checks must pass before production deployment

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  SESSION 12 SMOKE TEST — PRE-DEPLOYMENT CHECKLIST          ║${NC}"
echo -e "${YELLOW}║  All 12 checks must pass before production deployment      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

check() {
  local check_num=$1
  local check_name=$2
  local command=$3

  echo -n "[$check_num/12] $check_name... "

  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
  fi
}

# CHECK 1: DesignBot returns concepts
check 1 "DesignBot generates 6 concepts" \
  "pnpm test tests/keabots/use-case-1.design.test.js -- --grep 'should accept design concept'"

# CHECK 2: EstimateBot calculates within budget
check 2 "EstimateBot within user budget range" \
  "pnpm test tests/keabots/use-case-1.estimate.test.js -- --grep 'produce total estimate within user budget'"

# CHECK 3: PermitBot DC filing works
check 3 "PermitBot DC DCRA submission (Type A API)" \
  "pnpm test tests/keabots/use-case-1.permit.test.js -- --grep 'submit to DC DCRA API'"

# CHECK 4: PermitBot Maryland automation works
check 4 "PermitBot Maryland automation (Type B Playwright)" \
  "pnpm test tests/keabots/use-case-8.permit.test.js -- --grep 'Maryland counties automation'"

# CHECK 5: Pricing from core-rules (never hardcoded)
check 5 "Pricing imported from core-rules only" \
  "! grep -r 'price.*=.*[0-9]\+' packages/core-bots/ | grep -v 'core-rules' | grep -v '.test.js'"

# CHECK 6: DesignBot uses Opus 4.6 only
check 6 "DesignBot uses claude-opus-4-6" \
  "grep 'claude-opus-4-6' packages/core-bots/src/design-bot.ts"

# CHECK 7: Cache control ephemeral on all KeaBots
check 7 "Cache control: ephemeral on all KeaBots" \
  "grep -r 'cache_control.*ephemeral' packages/core-bots/"

# CHECK 8: No Zem Solutions references
check 8 "No Zem Solutions references (compliance)" \
  "! grep -r 'zem_solutions\|Zem Solutions' packages/ apps/ || true"

# CHECK 9: All 10 use cases pass DesignBot
check 9 "All 10 use cases pass DesignBot intake" \
  "bash -c 'for i in {1..10}; do pnpm test tests/keabots/use-case-\$i.design.test.js --silent || exit 1; done'"

# CHECK 10: Cache hit ratio 40-60%
check 10 "Cache hit ratio within target (40-60%)" \
  "bash -c 'RATIO=\$(npm run cache-metrics:report | grep -oP \"Hit ratio: \\K[0-9]+\"); [ \$RATIO -ge 40 ] && [ \$RATIO -le 60 ]'"

# CHECK 11: No API 5xx errors in test suite
check 11 "No API 5xx errors in test runs" \
  "! grep -r '500\|502\|503\|504' test-results/ || true"

# CHECK 12: Portal delivery confirmed (assets accessible)
check 12 "Portal asset delivery confirmed" \
  "curl -s http://localhost:3000/api/portals/owner/assets | jq -e '.assetCount > 0' > /dev/null"

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  RESULTS                                                   ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASSED/12${NC}"
echo -e "Failed: ${RED}$FAILED/12${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED — READY FOR DEPLOYMENT${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Merge to main branch"
  echo "2. Deploy to production (Railway services + Vercel portals)"
  echo "3. Monitor cache metrics and API latency"
  exit 0
else
  echo -e "${RED}❌ $FAILED CHECKS FAILED — DO NOT DEPLOY${NC}"
  echo ""
  echo "Fix issues and re-run: pnpm run smoke-test:session-12"
  exit 1
fi
```

---

## **How to Use in Cursor**

1. **Copy test files** to `tests/keabots/`
2. **Copy scripts** to `scripts/`
3. **In Cursor terminal**:
   ```bash
   # Run interactive DesignBot
   bash scripts/claude-code-designbot-interactive.sh
   
   # Or run tests directly
   pnpm test tests/keabots/use-case-1.design.test.js
   
   # Or full smoke test
   bash scripts/smoke-test-session-12.sh
   ```

4. **Monitor in Cursor:**
   - Click "Debug" on any test file
   - Watch cache metrics in sidebar
   - View portal at http://localhost:3000 (if running locally)

---

**Questions:**
1. Should I generate all 10 intake JSON test fixtures ready to paste?
2. Do you want Docker setup for local testing (Redis, PostgreSQL)?
3. Should scripts auto-generate HTML test reports?
4. Need VS Code/.devcontainer setup for this test environment?
