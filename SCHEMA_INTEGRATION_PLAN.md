# 🔗 SCHEMA & LOGIC INTEGRATION PLAN

**Objective:** Integrate growth timeline, competitive analysis, and platform logic  
**Date:** June 2026  
**Scope:** Schema extensions, business logic, analytics layer

---

## 📊 CURRENT STATE ANALYSIS

### Existing Models for Growth
```
✅ User model
   - Tracks: email, role, status, organization membership
   - Missing: user type (homeowner vs contractor), acquisition channel

✅ Org model
   - Tracks: organization metadata, members, projects
   - Missing: org type (contractor vs homeowner), growth metrics

✅ V30BotMetrics, V30ProjectMetrics
   - Tracks: bot performance, project metrics
   - Missing: acquisition funnel, timeline tracking

✅ UserAction, AnalyticsSnapshot
   - Tracks: user behavior, analytics
   - Missing: growth cohort analysis, competitive positioning
```

### Gap Analysis
```
❌ Growth Funnel Tracking
❌ Contractor/Owner Acquisition Channels
❌ Competitive Positioning Metrics
❌ Timeline Milestone Tracking
❌ Regional Growth Metrics
❌ Cohort Analysis
❌ Retention/Churn Metrics
❌ Network Effect Tracking
```

---

## 🎯 SCHEMA EXTENSIONS

### 1. USER TYPE & ACQUISITION TRACKING

```prisma
// Add to User model
enum UserType {
  HOMEOWNER
  CONTRACTOR
  ARCHITECT
  INSPECTOR
  ADMIN
  STAFF
}

enum AcquisitionChannel {
  ORGANIC
  GOOGLE_ADS
  META_SOCIAL
  TIKTOK
  PARTNERSHIP        // Home Depot, Lowe's, etc.
  REFERRAL
  DIRECT_SALES
  CONTENT_MARKETING
  INFLUENCER
  OTHER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  CHURNED
  SUSPENDED
  INVITED
  ONBOARDING
}

// Add to User model fields:
model User {
  // ... existing fields ...
  
  // Growth tracking
  userType              UserType            @default(HOMEOWNER)
  acquisitionChannel    AcquisitionChannel?
  acquisitionDate       DateTime            @default(now())
  lifecycleStage        String?             // PROSPECT, ONBOARDING, ACTIVE, RETAINED, CHURNED
  
  // Regional tracking
  homeLatitude          Float?
  homeLongitude         Float?
  region                String?             // State/region for growth analysis
  
  // Engagement tracking
  lastActiveAt          DateTime?
  daysActive            Int?
  projectCount          Int?                @default(0)
  
  // Growth cohort
  cohortMonthYear       String?             // "2026-06" for cohort analysis
  
  // Contractor specific
  verificationStatus    String?             // UNVERIFIED, PENDING, VERIFIED, REJECTED
  licenseNumber         String?             @unique
  licenseExpiry         DateTime?
  specialties           String[]            // ["renovation", "roofing", etc.]
  
  // Metrics relations
  growthMetrics         UserGrowthMetrics?
  conversionEvents      ConversionEvent[]
  acquisitionEvents     AcquisitionEvent[]
  retentionEvents       RetentionEvent[]
  
  // ... rest of existing relations ...
}
```

### 2. ORG GROWTH METRICS

```prisma
enum OrgType {
  HOMEOWNER
  CONTRACTOR
  CONTRACTOR_FIRM
  ARCHITECTURE_FIRM
  INSPECTOR_OFFICE
  GOVERNMENT_OFFICE
}

// Add to Org model fields:
model Org {
  // ... existing fields ...
  
  // Growth tracking
  orgType               OrgType?
  acquisitionChannel    AcquisitionChannel?
  acquisitionDate       DateTime            @default(now())
  
  // Regional expansion
  operatingRegions      String[]            // ["CA", "TX", "FL"]
  targetRegions         String[]
  
  // Size tracking
  memberCount           Int?
  projectCount          Int?
  projectRevenue        Decimal?            @db.Decimal(14, 2)
  
  // Metrics
  metrics               OrgGrowthMetrics?
  
  // ... rest of existing relations ...
}
```

### 3. GROWTH FUNNEL MODELS

```prisma
// Daily conversion funnel tracking
model GrowthFunnel {
  id                    String    @id @default(uuid())
  date                  DateTime  @db.Date @unique
  
  // Homeowner funnel
  homeownerVisits       Int       @default(0)     // Page views
  homeownerSignups      Int       @default(0)     // Account creation
  homeownerIntakeStart  Int       @default(0)     // Begin intake
  homeownerIntakeComplete Int     @default(0)     // Complete intake
  homeownerCheckout     Int       @default(0)     // View pricing
  homeownerPayment      Int       @default(0)     // Complete payment
  homeownerProject      Int       @default(0)     // Create project
  
  // Contractor funnel
  contractorVisits      Int       @default(0)
  contractorSignups     Int       @default(0)
  contractorVerification Int      @default(0)
  contractorOnboarding  Int       @default(0)
  contractorActive      Int       @default(0)
  contractorFirstProject Int      @default(0)
  
  // Calculate rates
  homeownerConversion   Float?    // signup / visits
  homeownerActivation   Float?    // payment / signup
  contractorActivation  Float?    // active / signup
  
  createdAt             DateTime  @default(now())
  
  @@index([date])
}

// Track each acquisition event
model AcquisitionEvent {
  id                String              @id @default(uuid())
  userId            String
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  userType          UserType
  channel           AcquisitionChannel
  region            String?
  date              DateTime            @default(now())
  source            String?             // Ad campaign, referrer, etc.
  cohortMonthYear   String
  
  // Conversion tracking
  signupDate        DateTime?
  intakeStartDate   DateTime?
  intakeCompleteDate DateTime?
  firstProjectDate  DateTime?
  conversionCost    Decimal?            @db.Decimal(10, 2)
  
  createdAt         DateTime            @default(now())
  
  @@index([userId])
  @@index([channel])
  @@index([date])
  @@index([cohortMonthYear])
}

// Track retention & churn
model RetentionEvent {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  eventType         String   // ACTIVE, INACTIVE, CHURNED, REACTIVATED
  date              DateTime @default(now())
  daysSinceSignup   Int
  daysSinceLastActive Int?
  projectCount      Int
  lifetime          Decimal? @db.Decimal(10, 2)
  
  createdAt         DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([date])
}

// Track conversion events throughout lifecycle
model ConversionEvent {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  eventType         String   // INTAKE_START, INTAKE_COMPLETE, CHECKOUT_VIEW, PAYMENT, PROJECT_START, etc.
  conversionFunnel  String   // Which funnel this belongs to
  date              DateTime @default(now())
  daysFromSignup    Int
  
  createdAt         DateTime @default(now())
  
  @@index([userId])
  @@index([eventType])
  @@index([date])
}
```

### 4. METRICS TRACKING MODELS

```prisma
// User-level growth metrics
model UserGrowthMetrics {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Acquisition
  acquisitionDate   DateTime
  acquisitionChannel AcquisitionChannel?
  acquisitionCost   Decimal?  @db.Decimal(10, 2)
  
  // Engagement
  totalProjects     Int       @default(0)
  totalRevenue      Decimal?  @db.Decimal(14, 2)
  totalSpend        Decimal?  @db.Decimal(14, 2)
  lifetime          Decimal?  @db.Decimal(14, 2)     // LTV
  
  // Retention
  lastActiveDate    DateTime?
  churnDate         DateTime?
  isChurned         Boolean   @default(false)
  daysSinceSignup   Int?
  daysSinceActive   Int?
  
  // Engagement metrics
  loginCount        Int       @default(0)
  dayActive         Int       @default(0)            // days user logged in
  engagementScore   Float?
  npsScore          Int?
  
  // Cohort
  cohortMonthYear   String
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([cohortMonthYear])
  @@index([isChurned])
}

// Org-level growth metrics
model OrgGrowthMetrics {
  id                String    @id @default(uuid())
  orgId             String    @unique
  org               Org       @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  // Growth
  acquisitionDate   DateTime
  acquisitionChannel AcquisitionChannel?
  
  // Size
  memberCount       Int       @default(0)
  projectCount      Int       @default(0)
  totalRevenue      Decimal?  @db.Decimal(14, 2)
  
  // Retention
  isActive          Boolean   @default(true)
  churnDate         DateTime?
  
  // Network effects
  contractorCount   Int?      // For homeowner orgs
  homeownerCount    Int?      // For contractor orgs
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([orgId])
}

// Regional growth tracking
model RegionalMetrics {
  id                String    @id @default(uuid())
  date              DateTime  @db.Date
  region            String    // State or region code
  
  // Users
  totalHomeowners   Int
  totalContractors  Int
  newHomeowners     Int
  newContractors    Int
  
  // Projects
  totalProjects     Int
  newProjects       Int
  activeProjects    Int
  
  // Revenue
  revenue           Decimal?  @db.Decimal(14, 2)
  avgProjectValue   Decimal?  @db.Decimal(10, 2)
  
  // Engagement
  avgProjects       Float?
  contractorAvgProjects Float?
  
  createdAt         DateTime  @default(now())
  
  @@unique([date, region])
  @@index([region])
  @@index([date])
}

// Partnership tracking
model PartnershipMetrics {
  id                String    @id @default(uuid())
  date              DateTime  @db.Date
  partnerName       String    // "Home Depot", "Lowes", etc.
  
  // Attribution
  usersAcquired     Int       @default(0)
  projectsGenerated Int       @default(0)
  revenue           Decimal?  @db.Decimal(14, 2)
  
  // Efficiency
  cac               Decimal?  @db.Decimal(10, 2)    // Cost per acquisition
  roi               Decimal?  @db.Decimal(10, 2)
  
  createdAt         DateTime  @default(now())
  
  @@unique([date, partnerName])
  @@index([partnerName])
}

// Cohort analysis table
model CohortMetrics {
  id                String    @id @default(uuid())
  cohort            String    // "2026-06" (month-year)
  monthOffset       Int       // 0 (first month), 1 (second month), etc.
  
  // Retention rate at this month offset
  retentionRate     Float
  churnCount        Int
  activeCount       Int
  
  // Revenue at this offset
  revenue           Decimal?  @db.Decimal(14, 2)
  avgLifetime       Decimal?  @db.Decimal(14, 2)
  
  userType          UserType
  acquisitionChannel AcquisitionChannel?
  
  createdAt         DateTime  @default(now())
  
  @@unique([cohort, monthOffset, userType, acquisitionChannel])
  @@index([cohort])
  @@index([userType])
}

// Timeline milestone tracking
model TimelineMilestone {
  id                String    @id @default(uuid())
  milestone         String    // "1M_owners", "10K_contractors", "Series_A", etc.
  targetDate        DateTime
  actualDate        DateTime?
  
  metricType        String    // "owners", "contractors", "revenue", "arr"
  targetValue       Int?
  actualValue       Int?
  
  status            String    // "NOT_STARTED", "ON_TRACK", "AT_RISK", "ACHIEVED", "MISSED"
  notes             String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([status])
}

// Competitive positioning tracking
model CompetitiveMetrics {
  id                String    @id @default(uuid())
  date              DateTime  @db.Date
  
  // Kealee metrics
  kealeHomeowners   Int
  kealeContractors  Int
  kealeProjectCount Int
  kealeARR          Decimal?  @db.Decimal(14, 2)
  
  // Competitor metrics
  competitorName    String    // "Houzz", "Chief", etc.
  competitorUserCount Int?
  competitorMarket  String?
  
  // Positioning
  kealeAdvantage    String[]  // ["Design+permits", "AI", "Direct homeowner"]
  weaknesses        String[]  // ["Brand", "User base", "Capital"]
  
  createdAt         DateTime  @default(now())
  
  @@unique([date, competitorName])
}
```

---

## 🏗️ BUSINESS LOGIC INTEGRATION

### 1. USER REGISTRATION & ACQUISITION

```typescript
// src/lib/growth/acquisition.ts

interface AcquisitionData {
  userType: UserType;
  channel: AcquisitionChannel;
  region?: string;
  source?: string;
}

export async function trackUserAcquisition(
  userId: string,
  data: AcquisitionData
): Promise<void> {
  const cohortMonthYear = getCurrentCohort(); // "2026-06"
  
  // Update user
  await db.user.update({
    where: { id: userId },
    data: {
      userType: data.userType,
      acquisitionChannel: data.channel,
      region: data.region,
      cohortMonthYear,
    },
  });
  
  // Create acquisition event
  await db.acquisitionEvent.create({
    data: {
      userId,
      userType: data.userType,
      channel: data.channel,
      region: data.region,
      source: data.source,
      cohortMonthYear,
      date: new Date(),
    },
  });
  
  // Update regional metrics
  if (data.region) {
    await updateRegionalMetrics(data.region, data.userType, 1);
  }
  
  // Create growth metrics record
  await db.userGrowthMetrics.create({
    data: {
      userId,
      acquisitionDate: new Date(),
      acquisitionChannel: data.channel,
      cohortMonthYear,
    },
  });
}
```

### 2. CONVERSION FUNNEL TRACKING

```typescript
// src/lib/growth/funnel.ts

export async function trackConversionEvent(
  userId: string,
  eventType: string
): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  // Record event
  await db.conversionEvent.create({
    data: {
      userId,
      eventType,
      conversionFunnel: user?.userType === UserType.HOMEOWNER ? 'homeowner' : 'contractor',
      date: new Date(),
      daysFromSignup: calculateDaysFromSignup(user?.acquisitionDate),
    },
  });
  
  // Update daily funnel
  await updateFunnelMetrics();
}

// Calculate daily conversion rates
export async function updateFunnelMetrics(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const homeownerVisits = await db.conversionEvent.count({
    where: { date: { gte: today }, conversionFunnel: 'homeowner' },
  });
  
  const homeownerSignups = await db.conversionEvent.count({
    where: { eventType: 'SIGNUP', conversionFunnel: 'homeowner', date: { gte: today } },
  });
  
  // Update or create funnel record
  await db.growthFunnel.upsert({
    where: { date: today },
    update: {
      homeownerVisits,
      homeownerSignups,
      // ... more fields
    },
    create: {
      date: new Date(today),
      homeownerVisits,
      homeownerSignups,
      // ... more fields
    },
  });
}
```

### 3. COHORT ANALYSIS

```typescript
// src/lib/growth/cohort.ts

export async function calculateCohortMetrics(): Promise<void> {
  const cohorts = await db.user.groupBy({
    by: ['cohortMonthYear'],
  });
  
  for (const { cohortMonthYear } of cohorts) {
    const cohortDate = parseYearMonth(cohortMonthYear);
    
    for (let monthOffset = 0; monthOffset <= 36; monthOffset++) {
      const checkDate = addMonths(cohortDate, monthOffset);
      
      // Count active users at this month offset
      const activeCount = await db.user.count({
        where: {
          cohortMonthYear,
          lastActiveAt: {
            gte: startOfMonth(checkDate),
            lt: endOfMonth(checkDate),
          },
        },
      });
      
      // Get original cohort size
      const cohortSize = await db.user.count({
        where: { cohortMonthYear },
      });
      
      const retentionRate = (activeCount / cohortSize) * 100;
      
      // Store metrics
      await db.cohortMetrics.upsert({
        where: {
          cohort_monthOffset_userType_acquisitionChannel: {
            cohort: cohortMonthYear,
            monthOffset,
            userType: UserType.HOMEOWNER,
            acquisitionChannel: null,
          },
        },
        update: {
          retentionRate,
          activeCount,
        },
        create: {
          cohort: cohortMonthYear,
          monthOffset,
          retentionRate,
          churnCount: cohortSize - activeCount,
          activeCount,
          userType: UserType.HOMEOWNER,
        },
      });
    }
  }
}
```

### 4. GROWTH GOAL TRACKING

```typescript
// src/lib/growth/milestones.ts

export async function updateMilestoneProgress(): Promise<void> {
  const milestones = await db.timelineMilestone.findMany({
    where: { status: { in: ['NOT_STARTED', 'ON_TRACK'] } },
  });
  
  for (const milestone of milestones) {
    const actualValue = await getMetricValue(milestone.metricType);
    
    const percentage = (actualValue / milestone.targetValue!) * 100;
    const daysRemaining = differenceInDays(milestone.targetDate, new Date());
    const onTrack = percentage >= (daysRemaining / 365) * 100;
    
    await db.timelineMilestone.update({
      where: { id: milestone.id },
      data: {
        actualValue,
        status: actualValue >= milestone.targetValue! 
          ? 'ACHIEVED' 
          : onTrack 
          ? 'ON_TRACK' 
          : 'AT_RISK',
      },
    });
  }
}

async function getMetricValue(metricType: string): Promise<number> {
  switch (metricType) {
    case 'owners':
      return await db.user.count({
        where: { userType: UserType.HOMEOWNER },
      });
    case 'contractors':
      return await db.user.count({
        where: { userType: UserType.CONTRACTOR },
      });
    case 'projects':
      return await db.project.count();
    default:
      return 0;
  }
}
```

---

## 📊 ANALYTICS LAYER

### Growth Dashboard Queries

```typescript
// src/lib/analytics/growth-dashboard.ts

export interface GrowthDashboard {
  overview: {
    totalOwners: number;
    totalContractors: number;
    monthlyOwnerGrowth: number;
    monthlyContractorGrowth: number;
    totalProjects: number;
    arr: Decimal;
  };
  
  funnel: {
    ownerConversionRate: number;
    contractorActivationRate: number;
    paymentConversionRate: number;
  };
  
  channels: {
    organic: number;
    paid: number;
    partnerships: number;
    referral: number;
  };
  
  retention: {
    ownerRetention30d: number;
    ownerRetention90d: number;
    contractorRetention30d: number;
    contractorRetention90d: number;
  };
  
  milestones: {
    achieved: number;
    onTrack: number;
    atRisk: number;
    missed: number;
  };
}

export async function getGrowthDashboard(): Promise<GrowthDashboard> {
  // Implement queries
}
```

---

## 🔌 API ENDPOINTS

### Add to `apps/api/src/routes/`

```typescript
// growth.ts
GET /api/growth/dashboard
GET /api/growth/funnel
GET /api/growth/cohorts
GET /api/growth/regional
GET /api/growth/partnerships
GET /api/growth/milestones
POST /api/growth/events
```

---

## 📈 PRIORITY IMPLEMENTATION ORDER

### Phase 1 (Week 1-2): Core Schema
1. ✅ Add user type, acquisition channel to User/Org models
2. ✅ Create acquisition event tracking
3. ✅ Create growth funnel table
4. ✅ Create basic metrics models

### Phase 2 (Week 3-4): Business Logic
1. ✅ Implement acquisition tracking
2. ✅ Implement conversion funnel
3. ✅ Implement cohort analysis
4. ✅ Create daily metric aggregation

### Phase 3 (Week 5-6): Analytics
1. ✅ Build growth dashboard
2. ✅ Create regional metrics
3. ✅ Create partnership attribution
4. ✅ Build milestone tracking

### Phase 4 (Week 7-8): Dashboards
1. ✅ Create admin growth dashboard
2. ✅ Create regional growth dashboards
3. ✅ Create partnership dashboards
4. ✅ Create milestone tracker UI

---

## 🚀 USAGE EXAMPLES

### Track User Signup

```typescript
// In signup endpoint
await trackUserAcquisition(newUser.id, {
  userType: 'HOMEOWNER',
  channel: 'GOOGLE_ADS',
  region: 'CA',
  source: 'home_renovation_query',
});
```

### Track Conversion

```typescript
// In intake completion endpoint
await trackConversionEvent(userId, 'INTAKE_COMPLETE');
```

### Monitor Goals

```typescript
// Daily cron job
await updateMilestoneProgress();
await updateFunnelMetrics();
await calculateCohortMetrics();
```

### Query Dashboard

```typescript
const dashboard = await getGrowthDashboard();
// Returns overview, funnel, channels, retention, milestones
```

---

## 📌 BENEFITS

✅ **Unified Data**: Single source of truth for growth metrics  
✅ **Actionable**: Track progress against timeline milestones  
✅ **Competitive**: Monitor positioning vs Houzz/others  
✅ **Regional**: Track growth by geography  
✅ **Automated**: Daily aggregations and alerts  
✅ **Cohort-based**: Understand acquisition quality over time  
✅ **Attribution**: Know which channels drive real value  

---

## 🎯 NEXT STEPS

1. **Run migration**: Add schema extensions
2. **Implement business logic**: Integrate acquisition tracking
3. **Build dashboards**: Create admin UI
4. **Run backfill**: Populate historical data from existing records
5. **Set milestones**: Configure timeline goals
6. **Monitor daily**: Aggregate metrics and track progress

