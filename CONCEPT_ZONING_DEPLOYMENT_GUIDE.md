# AI Concept & Zoning Services - Deployment Guide

## Overview

Successfully created AI-powered intake services for the Kealee Platform:
- **Concept Design Bot** - Generates design concepts with MEP systems and cost estimates
- **Zoning Analysis Bot** - Analyzes zoning requirements and compliance
- **Public Intake Routes** - RESTful endpoints for homeowner submissions
- **Database Models** - Prisma schema for persistence

## Files Created

### 1. Service Layer
- ✅ `services/os-dev/src/services/zoning-bot-service.ts` - Zoning analysis using Claude
- ✅ `services/os-dev/src/services/design-bot-service.ts` - Concept generation using Claude

### 2. Route Handlers
- ✅ `services/os-dev/src/routes/public-concept-intake.routes.ts` - Fastify routes for concept intake
- ✅ `services/os-dev/src/routes/public-zoning-intake.routes.ts` - Fastify routes for zoning intake

### 3. Validation & Schema
- ✅ `packages/core-rules/src/schemas/concept-zoning.schemas.ts` - Zod validation schemas

### 4. Database
- ✅ Updated `packages/database/prisma/schema.prisma` - Added 3 models:
  - `ConceptIntake` - Homeowner concept requests
  - `ConceptOutput` - AI-generated design outputs
  - `ZoningOutput` - Zoning analysis results

### 5. API Integration
- ✅ Updated `services/os-dev/src/index.ts` - Registered new routes

## Deployment Steps

### Step 1: Install Dependencies
```bash
cd /home/tim_chamberlain/kealee-platform-v10
yarn install
```

### Step 2: Database Migration
```bash
cd packages/database
npx prisma migrate dev --name add_concept_zoning_services
```

Expected output:
```
✔ Generated Prisma Client
✔ Created migration files

Let Prisma know about the migration that you applied manually by creating a migration file:
Your migration has been created at prisma/migrations/xxx_add_concept_zoning_services/migration.sql

Run this command to create and apply a migration:
npx prisma migrate dev
```

### Step 3: Generate Prisma Client
```bash
cd packages/database
npx prisma generate
```

### Step 4: Start the OS-Dev Service
```bash
# Option A: From root
yarn workspace os-dev dev

# Option B: Direct
cd services/os-dev
yarn dev
```

Expected output:
```
[os-dev] listening on port 3012
[os-dev] Registering concept intake routes...
[os-dev] Concept routes registered
[os-dev] Registering zoning intake routes...
[os-dev] Zoning routes registered
```

### Step 5: Verify Database Tables
```bash
# Check with Prisma Studio
npx prisma studio
```

Navigate to the following tables to verify:
- `concept_intakes` - Should be empty
- `concept_outputs` - Should be empty
- `zoning_outputs` - Should be empty

## Test Endpoints

### Test 1: Concept Intake
```bash
curl -X POST http://localhost:3012/api/concept/intake \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "garden",
    "scope": "Create a modern front yard landscape with native plants and irrigation",
    "budget": 15000,
    "location": "20745",
    "homeownerEmail": "homeowner@example.com"
  }'
```

Expected Response:
```json
{
  "success": true,
  "conceptId": "concept_1705123456789",
  "concept": {
    "mepSystem": {
      "irrigation": "Smart drip irrigation with soil moisture sensors",
      "lighting": "Low-voltage LED accent lights",
      "drainage": "French drain with gravel bed"
    },
    "billOfMaterials": [
      {"item": "Drip tubing", "quantity": 200, "unit": "ft", "estimatedCost": 150},
      {"item": "Native shrubs", "quantity": 12, "unit": "ea", "estimatedCost": 1800}
    ],
    "estimatedCost": 14200,
    "description": "Modern sustainable landscape design..."
  },
  "nextStep": "/estimate"
}
```

### Test 2: Concept Status
```bash
curl -X GET http://localhost:3012/api/concept/status/concept_1705123456789
```

Expected Response:
```json
{
  "id": "concept_1705123456789",
  "status": "received",
  "concept": null,
  "createdAt": "2025-01-13T10:30:00.000Z"
}
```

### Test 3: Zoning Intake
```bash
curl -X POST http://localhost:3012/api/zoning/intake \
  -H "Content-Type: application/json" \
  -d '{
    "location": "20745",
    "propertySize": 5000,
    "projectType": "garden",
    "email": "homeowner@example.com"
  }'
```

Expected Response:
```json
{
  "success": true,
  "zoningId": "zoning_1705123456789",
  "zoning": {
    "jurisdiction": "Prince George's County, MD",
    "zoning": "Suburban Residential",
    "setbacks": {"front": 25, "side": 5, "rear": 20},
    "far": 0.4,
    "permitType": ["Residential Improvement", "Landscape Modification"],
    "requirements": ["Setback compliance", "Environmental review", "Stormwater management"]
  },
  "nextStep": "/permits"
}
```

### Test 4: Zoning Status
```bash
curl -X GET http://localhost:3012/api/zoning/status/zoning_1705123456789
```

Expected Response:
```json
{
  "id": "zoning_1705123456789",
  "status": "received",
  "zoning": null,
  "createdAt": "2025-01-13T10:30:00.000Z"
}
```

## Verification Checklist

- [ ] All 5 TypeScript files created successfully
- [ ] Prisma schema updated with 3 new models
- [ ] Database migration completed
- [ ] Prisma client generated
- [ ] os-dev service starts without errors
- [ ] Routes registered successfully (check logs)
- [ ] POST concept intake returns 200 with conceptId
- [ ] POST zoning intake returns 200 with zoningId
- [ ] GET status endpoints accessible
- [ ] Database tables populated after test submissions
- [ ] Claude API responses parsed correctly
- [ ] No TypeScript compilation errors

## Environment Variables

Ensure these are set in `.env`:

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Service Configuration
PORT=3012

# Database
DATABASE_URL=postgresql://...
```

## Troubleshooting

### Issue: "Failed to process concept"
**Solution:**
1. Check `ANTHROPIC_API_KEY` is set correctly
2. Verify Claude API access with: `curl https://api.anthropic.com/` (should not 401)
3. Check Fastify logs for detailed error

### Issue: "Database migration fails"
**Solution:**
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` connection string
3. Run: `npx prisma db push` instead of migrate if applying existing schema

### Issue: Routes not registering
**Solution:**
1. Verify imports in `index.ts` are correct
2. Check for typos in function names
3. Restart service after file changes

### Issue: Type errors on build
**Solution:**
```bash
cd packages/database
npx prisma generate
cd /workspace/root
yarn build
```

## Next Steps

1. **Frontend Integration**
   - Create Next.js pages: `/concept/intake`, `/zoning/intake`
   - Add Stripe checkout integration
   - Implement session tracking

2. **Enhanced Features**
   - Store concepts in Redis for caching
   - Implement email notifications
   - Add stripe.webhook handlers for payment tracking
   - Create admin dashboard for submissions

3. **Testing**
   - Unit tests for bot services
   - E2E tests for intake routes
   - Load testing (handling concurrent submissions)

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Add metrics collection
   - Create usage dashboard

## Additional Resources

- [Claude API Documentation](https://docs.anthropic.com)
- [Fastify Route Registration](https://www.fastify.io/docs/latest/Guides/Getting-Started/)
- [Prisma Schema Documentation](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Zod Validation](https://zod.dev)

## Support

For issues or questions:
1. Check logs: `tail -f ~/.pm2/logs/os-dev-*`
2. Review deployment steps above
3. Verify all environment variables
4. Test endpoints individually

---

**Created:** January 13, 2025  
**Service:** Kealee Platform v10  
**Status:** Ready for Deployment
