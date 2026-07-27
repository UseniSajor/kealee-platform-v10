# Measurements Database Schema

Add these models to `packages/database/prisma/schema.prisma` for the mobile measurement capture tool.

## Schema Models

Add to your Prisma schema:

```prisma
// Measurement session tracking
model MeasurementSession {
  id            String   @id @default(cuid())
  userId        String?
  projectId     String?
  intakeId      String?
  
  deviceModel   String   // e.g., "iPhone 14 Pro", "Pixel 7"
  capabilities  Json     // { hasLiDAR: true, hasTof: false }
  
  startedAt     DateTime @default(now())
  endedAt       DateTime?
  
  measurements  Measurement[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
  @@index([projectId])
  @@index([intakeId])
}

// Individual measurements
model Measurement {
  id              String   @id @default(cuid())
  
  sessionId       String
  session         MeasurementSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Measurement data
  distance        Float
  unit            String   // 'mm' | 'cm' | 'inches' | 'feet' | 'meters'
  method          String   // 'lidar_direct' | 'tof_sensor' | 'reference_object' | 'ai_detection' | 'perspective_estimation'
  accuracy        String   // 'high' | 'medium' | 'low'
  confidence      Int      // 0-100
  
  // Context
  projectId       String?
  intakeId        String?
  userId          String?
  
  // Metadata
  metadata        Json?    // { deviceModel, calibrationObject, perspectiveCorrection }
  
  // Timestamps
  recordedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sessionId])
  @@index([projectId])
  @@index([intakeId])
  @@index([userId])
  @@index([method])
  @@index([confidence])
}

// Reference object calibrations
model CalibrationObject {
  id              String   @id @default(cuid())
  
  sessionId       String
  session         MeasurementSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Object being used as reference
  objectType      String   // 'credit_card' | 'ruler' | 'door' | 'coin'
  knownDimension  Float    // Real-world size (mm)
  
  // Calibration result
  pixelSize       Float    // Detected size in pixels
  calibrationScore Float  // 0-1 confidence
  
  createdAt       DateTime @default(now())
  
  @@index([sessionId])
}
```

## Prisma Enums (Optional)

For type safety, add these enums to your schema:

```prisma
enum MeasurementMethod {
  LIDAR_DIRECT
  TOF_SENSOR
  REFERENCE_OBJECT
  AI_DETECTION
  PERSPECTIVE_ESTIMATION
}

enum MeasurementAccuracy {
  HIGH
  MEDIUM
  LOW
}

enum CalibrationObjectType {
  CREDIT_CARD
  RULER
  DOOR
  COIN
}

enum DistanceUnit {
  MM
  CM
  INCHES
  FEET
  METERS
}
```

Then update the Measurement model:

```prisma
model Measurement {
  id              String    @id @default(cuid())
  
  sessionId       String
  session         MeasurementSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Measurement data
  distance        Float
  unit            DistanceUnit
  method          MeasurementMethod
  accuracy        MeasurementAccuracy
  confidence      Int       // 0-100
  
  // Context
  projectId       String?
  intakeId        String?
  userId          String?
  
  // Metadata
  metadata        Json?
  
  // Timestamps
  recordedAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sessionId])
  @@index([projectId])
  @@index([intakeId])
  @@index([userId])
  @@index([method])
  @@index([confidence])
}
```

## Apply Schema

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Create and run migration (development)
npx prisma migrate dev --name add_measurements

# Or on production (dry-run first)
npx prisma migrate deploy --skip-generate
```

## Update API Endpoint

Once schema is applied, update the measurements route to use Prisma:

**File**: `apps/web-main/app/api/intake/measurements/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { MeasurementMethod, MeasurementAccuracy } from '@kealee/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Create or get session
    let session = await prisma.measurementSession.findFirst({
      where: {
        userId: session?.user?.id,
        projectId: body.projectId,
        endedAt: null, // Active session
      },
    })
    
    if (!session) {
      session = await prisma.measurementSession.create({
        data: {
          userId: session?.user?.id,
          projectId: body.projectId,
          deviceModel: body.metadata?.deviceModel || 'Unknown',
          capabilities: {},
        },
      })
    }
    
    // Record measurement
    const measurement = await prisma.measurement.create({
      data: {
        sessionId: session.id,
        distance: body.distance,
        unit: body.unit,
        method: body.method as MeasurementMethod,
        accuracy: body.accuracy as MeasurementAccuracy,
        confidence: body.confidence,
        projectId: body.projectId,
        intakeId: body.intakeId,
        userId: session.userId,
        metadata: body.metadata,
      },
    })
    
    return NextResponse.json({
      success: true,
      measurementId: measurement.id,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('[Measurements API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record measurement' },
      { status: 500 }
    )
  }
}
```

## Query Examples

```typescript
import { prisma } from '@/lib/prisma'

// Get all measurements for a project
const projectMeasurements = await prisma.measurement.findMany({
  where: { projectId: 'proj-123' },
  include: { session: true },
  orderBy: { recordedAt: 'desc' },
})

// Get average confidence by method
const avgByMethod = await prisma.measurement.groupBy({
  by: ['method'],
  _avg: { confidence: true },
  _count: true,
})

// Get recent high-confidence measurements
const highConfidence = await prisma.measurement.findMany({
  where: {
    confidence: { gte: 85 },
    recordedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
  orderBy: { confidence: 'desc' },
  take: 10,
})

// Get measurement session summary
const sessionStats = await prisma.measurementSession.findUnique({
  where: { id: 'session-123' },
  include: {
    measurements: {
      select: {
        distance: true,
        unit: true,
        method: true,
        confidence: true,
      },
    },
  },
})

// Find best calibration objects
const calibrations = await prisma.calibrationObject.findMany({
  where: { calibrationScore: { gte: 0.8 } },
  orderBy: { calibrationScore: 'desc' },
})
```

## Analytics Queries

```typescript
// Measurement accuracy by method (last 30 days)
const methodStats = await prisma.measurement.groupBy({
  by: ['method'],
  where: {
    recordedAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  },
  _avg: { confidence: true },
  _count: true,
})

// Device distribution
const devices = await prisma.measurementSession.groupBy({
  by: ['deviceModel'],
  _count: true,
})

// Intake conversion with measurements
const withMeasurements = await prisma.measurement.groupBy({
  by: ['intakeId'],
  _count: true,
})
```

## Migrations

### Initial Migration

```bash
npx prisma migrate dev --name add_measurements
```

This creates:
- `MeasurementSession` table
- `Measurement` table
- `CalibrationObject` table
- Indexes on frequent query columns

### Future Migrations

```bash
# Add measurement history aggregation
npx prisma migrate dev --name add_measurement_stats

# Add confidence thresholds
npx prisma migrate dev --name add_confidence_tracking
```

## Retention Policy

Consider adding data retention:

```typescript
// Archive old measurements (dev only)
await prisma.measurement.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
})
```

Or keep all data and use date-based queries for analytics.

## Performance Notes

- Measurements can be ~100KB+ per session (images embedded in metadata)
- Index on `projectId` and `userId` for common queries
- Use `take()` and pagination for large result sets
- Archive old sessions to separate table if needed
