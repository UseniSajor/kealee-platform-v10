# 🚀 Growth Metrics & Enterprise Bots - Setup Guide

Complete setup instructions for growth tracking and enterprise bot infrastructure.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Anthropic API key (`ANTHROPIC_API_KEY`)
- Environment configured

## Step 1: Database Setup

### 1.1 Run Prisma Migration

The migration file is located at:
```
packages/database/prisma/migrations/add_growth_metrics_schema/migration.sql
```

**Option A: Using Prisma CLI (recommended)**
```bash
cd packages/database

# Run migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**Option B: Direct SQL**
```bash
psql -h localhost -U postgres -d kealee_platform < packages/database/prisma/migrations/add_growth_metrics_schema/migration.sql
```

### 1.2 Verify Tables Created

```sql
-- Check growth metrics tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'growth_%';
```

Expected tables:
- ✅ `growth_user_acquisitions`
- ✅ `growth_conversion_events`
- ✅ `growth_funnel_metrics`
- ✅ `growth_channel_metrics`
- ✅ `growth_cohort_analysis`
- ✅ `growth_daily_metrics`
- ✅ `growth_partnership_metrics`

---

## Step 2: API Integration

### 2.1 Mount Bot Router

In your main API router (e.g., `apps/api/src/index.ts`):

```typescript
import botsRouter from './routes/bots';

// Mount bot endpoints
app.use('/api/bots', botsRouter);

// Growth metrics endpoints
app.use('/api/growth', growthRouter);
```

### 2.2 Bot Endpoints

Available endpoints:

```
POST   /api/bots/design        - Generate design concepts
POST   /api/bots/estimate      - Generate cost estimates
POST   /api/bots/permit        - Generate permit requirements
POST   /api/bots/floorplan     - Generate floorplans

GET    /api/bots/health        - Check bot health
GET    /api/bots/metrics       - Get aggregated metrics
GET    /api/bots/status        - Get real-time status

GET    /api/growth/summary     - Executive summary
GET    /api/growth/trend       - Growth trend data
GET    /api/growth/channels    - Channel metrics
```

### 2.3 Growth Tracker Integration

In your signup/conversion endpoints:

```typescript
import { GrowthTracker } from '@kealee/core-llm/analytics/growth-tracker';

// Track signup
router.post('/signup', async (req, res) => {
  // ... create user ...
  
  await GrowthTracker.trackUserAcquisition(
    userId,
    'GOOGLE_ADS',
    {
      utmCampaign: req.query.utm_campaign,
      gclid: req.query.gclid,
    }
  );
});

// Track conversion (project creation)
router.post('/projects', async (req, res) => {
  // ... create project ...
  
  await GrowthTracker.trackConversionEvent(
    userId,
    'FIRST_PROJECT',
    projectId,
    projectValue
  );
});
```

---

## Step 3: Frontend Integration

### 3.1 Track Acquisitions

Use the growth tracking hook in signup flow:

```typescript
import { useTrackAcquisition } from '@kealee/core-llm/hooks/useGrowthTracking';

function SignupPage() {
  const trackAcquisition = useTrackAcquisition();

  const handleSignup = async (email: string, password: string) => {
    // Create user
    const user = await createUser(email, password);
    
    // Track acquisition
    await trackAcquisition(user.id, 'GOOGLE_ADS');
    
    // Redirect
    navigate('/dashboard');
  };

  return (
    // signup form...
  );
}
```

### 3.2 Track Conversions

Track project creation:

```typescript
import { useTrackConversion } from '@kealee/core-llm/hooks/useGrowthTracking';

function ProjectCreation() {
  const trackConversion = useTrackConversion();

  const handleCreateProject = async (data: ProjectData) => {
    const project = await createProject(data);
    
    // Track conversion
    await trackConversion(
      userId,
      'FIRST_PROJECT',
      project.id,
      data.budget // project value
    );
  };
}
```

---

## Step 4: Dashboard Access

### 4.1 Navigate to Dashboard

**URL:** `http://localhost:3000/growth-metrics`

**Features:**
- Real-time KPI cards
- Growth charts (30 days)
- Channel performance table
- Acquisition breakdown
- Unit economics
- Auto-refresh every minute

### 4.2 Dashboard Data

Dashboard pulls from three API endpoints:

```typescript
// Executive summary
GET /api/growth/summary
→ Returns: { currentOwners, dailyUserGrowth, averageCAC, estimatedLTV, churnRate, ... }

// Growth trend
GET /api/growth/trend?days=30
→ Returns: { date, owners, contractors, newOwners, cac }[]

// Channel metrics
GET /api/growth/channels
→ Returns: { channel, users, spend, cac, roi, conversionRate, retentionRate }[]
```

---

## Step 5: Bot Testing

### 5.1 Test Design Bot

```bash
curl -X POST http://localhost:3000/api/bots/design \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "projectType": "kitchen",
    "squareFeet": 200,
    "budget": 50000,
    "stylePreferences": ["modern", "open"],
    "accessibility": false,
    "timeline": 90,
    "formData": {}
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "projectId": "proj-123",
    "conceptCount": 3,
    "concepts": [
      {
        "id": "concept-1",
        "name": "Modern Minimalist",
        "description": "...",
        "styleMatch": 95,
        "estimatedCost": 45000,
        ...
      }
    ]
  },
  "metrics": {
    "executionTime": 45000,
    "tokensUsed": 2145,
    "costUSD": 0.082,
    "qualityScore": 87
  }
}
```

### 5.2 Test Estimate Bot

```bash
curl -X POST http://localhost:3000/api/bots/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "projectType": "kitchen",
    "squareFeet": 200,
    "scope": ["flooring", "cabinets", "counters"],
    "location": { "state": "CA", "zipCode": "94105" },
    "timeline": 60,
    "quality": "standard",
    "materials": ["oak", "quartz"]
  }'
```

### 5.3 Bot Health Check

```bash
curl http://localhost:3000/api/bots/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-03T10:30:00Z",
  "bots": [
    {
      "botType": "DesignBot",
      "totalExecutions": 5,
      "successCount": 5,
      "failureCount": 0,
      "averageQuality": 87
    }
  ],
  "summary": {
    "totalBots": 4,
    "activeBots": 4,
    "errorRate": 0
  }
}
```

---

## Step 6: Analytics Queries

### 6.1 Get Daily Metrics

```typescript
import { GrowthAnalytics } from '@kealee/core-llm/analytics/growth-queries';

const metrics = await GrowthAnalytics.getDailyMetrics(new Date());
console.log(metrics);
// Output: { date, newUsers, activeUsers, conversions, revenue, cacAvg, ltvEstimate, churnRate }
```

### 6.2 Get Channel Performance

```typescript
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const endDate = new Date();

const channels = await GrowthAnalytics.getChannelMetrics(startDate, endDate);
console.log(channels);
// Output: [ { channel, users, spend, cac, ltv, roi, ... } ]
```

### 6.3 Get Funnel Breakdown

```typescript
const funnel = await GrowthAnalytics.getFunnelBreakdown('google_ads', new Date());
console.log(funnel);
// Output: { signups, intakeComplete, projectCreated, paid, completionRate }
```

### 6.4 Get Cohort Retention

```typescript
const cohort = await GrowthAnalytics.getCohortRetention(new Date());
console.log(cohort);
// Output: { cohortDate, d0, d1, d7, d30, d60, d90 }
```

### 6.5 Executive Summary

```typescript
const summary = await GrowthAnalytics.getExecutiveSummary();
console.log(summary);
// Output: { 
//   currentOwners, dailyUserGrowth, averageCAC, 
//   cacTrend, monthlyAcquisitions, estimatedLTV, 
//   churnRate, conversionRate 
// }
```

---

## Step 7: Monitoring

### 7.1 Daily Metrics Cron Job

Set up a cron job to aggregate daily metrics (recommended: 12:01 AM UTC):

```typescript
// In your scheduler (Bull, node-cron, etc.)
import { GrowthTracker } from '@kealee/core-llm/analytics/growth-tracker';

// Every day at 12:01 AM UTC
schedule('1 0 * * *', async () => {
  console.log('Aggregating daily metrics...');
  
  // This is triggered automatically by trackUserAcquisition/trackConversionEvent
  // But you can manually trigger it for backfill:
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // GrowthTracker.updateDailyMetrics() is called internally
  console.log('Daily metrics aggregated');
});
```

### 7.2 Bot Metrics Dashboard

Access bot metrics at:
- **URL:** `http://localhost:3000/api/bots/status`
- **Refresh:** Every minute
- **Tracks:** Executions, success rate, quality score per bot

### 7.3 Growth Metrics Dashboard

Access growth dashboard at:
- **URL:** `http://localhost:3000/growth-metrics`
- **Auto-refresh:** Every minute
- **Shows:** 10+ KPIs in real-time

---

## Step 8: Configuration

### Environment Variables

```bash
# .env or .env.local
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:password@localhost:5432/kealee_platform
```

### Bot Configuration

Default configurations are in each bot class:

```typescript
// DesignBot
{
  name: 'DesignBot',
  model: 'claude-opus-4-8',
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 60000,
  retries: 3,
  cacheTTL: 3600
}
```

To customize, modify in the bot constructor (e.g., `design-bot-enterprise.ts`).

---

## Troubleshooting

### Issue: "Missing database tables"

**Solution:**
```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

### Issue: "Bot execution timeout"

**Solution:**
- Increase `timeout` in bot config (currently 60s)
- Check Claude API rate limits
- Verify `ANTHROPIC_API_KEY` is valid

### Issue: "API returns 500 on bot endpoint"

**Solution:**
```bash
# Check error logs
tail -f logs/api.log

# Test bot health
curl http://localhost:3000/api/bots/health

# Verify database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Issue: "Dashboard shows no data"

**Solution:**
1. Verify `/api/growth/*` endpoints return data:
   ```bash
   curl http://localhost:3000/api/growth/summary
   ```
2. Check browser console for JavaScript errors
3. Verify `ANTHROPIC_API_KEY` is set
4. Create test data:
   ```typescript
   const result = await DesignBotEnterprise().execute({...});
   ```

---

## Performance Tips

### 1. Optimize Cache Usage

- Design concepts cached for 1 hour
- Permits cached for 24 hours
- Hit rate target: 40-60%

### 2. Monitor Token Usage

Each bot tracks token usage:

```bash
curl http://localhost:3000/api/bots/metrics
→ Shows totalTokens, tokenUsage per bot, cost breakdown
```

### 3. Rate Limiting

Default: 10 requests/second, 5 concurrent max
- Adjust in `enterprise-bot-base.ts` if needed

---

## Next Steps

1. ✅ Run database migration
2. ✅ Mount bot routers in API
3. ✅ Test bot endpoints
4. ✅ Verify dashboard loads
5. ✅ Set up daily metrics cron
6. ✅ Monitor bot performance
7. ⏳ Implement tracking in signup/conversion flows

---

## Support

- 📖 Documentation: See inline comments in each file
- 🐛 Bugs: Check logs in `logs/api.log`
- 💬 Questions: Review the comprehensive code comments

---

**Status:** Ready for production  
**Last Updated:** June 3, 2026  
**Version:** 1.0.0
