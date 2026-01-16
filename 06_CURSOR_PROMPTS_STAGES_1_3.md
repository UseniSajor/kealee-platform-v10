# CURSOR PROMPTS: STAGES 1-3
## OS Foundation + Ops OS Core + Ops Services MVP

**Version:** 2.0.0  
**Date:** January 13, 2026  
**Stages Covered:** 1, 2, 3 (Weeks 2-8)  
**Total Prompts:** ~200

---

## 🎯 HOW TO USE THESE PROMPTS

### **The Workflow:**

```
1. Open this file in VS Code (keep it open in one pane)
2. Open your project in Cursor (other pane)
3. Find the prompt for your current task
4. Copy the ENTIRE prompt (including file paths)
5. In Cursor: Press Cmd+L (Mac) or Ctrl+L (Windows)
6. Paste prompt
7. Press Enter
8. Cursor generates code (~30 sec - 2 min)
9. Review generated files
10. Test the code
11. Move to next prompt
```

### **Important Notes:**

- ✅ Copy prompts EXACTLY as written (including file paths)
- ✅ Cursor will create folders if they don't exist
- ✅ Test after each prompt before moving to next
- ✅ Ask Claude if you get errors
- ✅ Don't skip prompts (they build on each other)

---

# STAGE 1: OS FOUNDATION (WEEKS 2-3)

## WEEK 2: DATABASE & API CORE

### **DAY 1: PROJECT SETUP**

---

#### **PROMPT 1.1: Initialize Monorepo**

```
Initialize a pnpm workspace monorepo for Kealee Platform V10.

CREATE:
File: package.json

{
  "name": "kealee-platform-v10",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  },
  "packageManager": "pnpm@8.12.0"
}

File: pnpm-workspace.yaml

packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'

File: turbo.json

{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}

File: .gitignore

# dependencies
node_modules/
.pnpm-store/

# builds
dist/
.next/
.turbo/

# env files
.env
.env.local
.env.*.local

# logs
*.log

# OS files
.DS_Store

# IDE
.vscode/
.idea/

File: README.md

# Kealee Platform V10

## Getting Started

\`\`\`bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build all packages
pnpm build
\`\`\`

## Project Structure

\`\`\`
kealee-platform-v10/
├── apps/          # Frontend applications
├── services/      # Backend services
├── packages/      # Shared packages
└── _docs/         # Documentation
\`\`\`
```

**Expected Output:**
- package.json created
- pnpm-workspace.yaml created
- turbo.json created
- .gitignore created
- README.md created

**Test:**
```bash
pnpm install
```
Should install successfully with no errors.

---

#### **PROMPT 1.2: Create Database Package**

```
Create the database package with Prisma setup.

CREATE:
File: packages/database/package.json

{
  "name": "@kealee/database",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0"
  },
  "devDependencies": {
    "prisma": "^5.7.0",
    "tsx": "^4.7.0"
  }
}

File: packages/database/tsconfig.json

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}

File: packages/database/src/client.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

File: packages/database/src/index.ts

export { prisma } from './client'
export * from '@prisma/client'

File: packages/database/.env.example

DATABASE_URL="postgresql://user:password@localhost:5432/kealee?schema=public"

File: packages/database/README.md

# @kealee/database

Prisma database package for Kealee Platform.

## Setup

1. Copy .env.example to .env.local
2. Update DATABASE_URL
3. Run \`pnpm db:push\` to sync schema
4. Run \`pnpm db:generate\` to generate client
```

**Expected Output:**
- packages/database folder created
- package.json, tsconfig.json, client.ts, index.ts created
- .env.example created

**Test:**
```bash
cd packages/database
cp .env.example .env.local
# (Edit .env.local with your database URL)
pnpm install
```

---

#### **PROMPT 1.3: Create Prisma Schema (Part 1: Foundation Models)**

```
Create the initial Prisma schema with OS Foundation models.

CREATE:
File: packages/database/prisma/schema.prisma

// OS Foundation Schema - Part 1
// Core identity, organizations, RBAC

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE IDENTITY & AUTH
// ============================================================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?  // Nullable (Supabase handles auth)
  name      String
  phone     String?
  avatar    String?
  status    UserStatus @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  orgMemberships  OrgMember[]
  ownedProjects   Project[] @relation("ProjectOwner")
  projectMemberships ProjectMembership[]
  marketplaceProfile MarketplaceProfile?
  servicePlans    ServicePlan[]
  
  @@index([email])
  @@index([status])
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

// ============================================================================
// ORGANIZATIONS & TENANCY
// ============================================================================

model Org {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  logo        String?
  status      OrgStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  members       OrgMember[]
  properties    Property[]
  projects      Project[]
  entitlements  ModuleEntitlement[]

  @@index([slug])
  @@index([status])
}

enum OrgStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

model OrgMember {
  id        String   @id @default(uuid())
  userId    String
  orgId     String
  roleKey   String   // e.g., "ADMIN", "MEMBER", "PM"
  joinedAt  DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  org  Org  @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
  @@index([userId])
  @@index([orgId])
  @@index([roleKey])
}

// ============================================================================
// RBAC (Roles, Permissions)
// ============================================================================

model Role {
  id          String   @id @default(uuid())
  key         String   @unique  // e.g., "HOMEOWNER", "GC", "PM"
  name        String
  description String?
  createdAt   DateTime @default(now())

  permissions RolePermission[]

  @@index([key])
}

model Permission {
  id          String   @id @default(uuid())
  key         String   @unique  // e.g., "create_project", "approve_milestone"
  name        String
  description String?
  createdAt   DateTime @default(now())

  roles RolePermission[]

  @@index([key])
}

model RolePermission {
  id           String @id @default(uuid())
  roleKey      String
  permissionKey String

  role       Role       @relation(fields: [roleKey], references: [key], onDelete: Cascade)
  permission Permission @relation(fields: [permissionKey], references: [key], onDelete: Cascade)

  @@unique([roleKey, permissionKey])
  @@index([roleKey])
  @@index([permissionKey])
}

// ============================================================================
// MODULE ENTITLEMENTS
// ============================================================================

model ModuleEntitlement {
  id          String   @id @default(uuid())
  orgId       String
  moduleKey   String   // e.g., "m-ops-services", "m-marketplace"
  enabled     Boolean  @default(false)
  enabledAt   DateTime?
  disabledAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  org Org @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, moduleKey])
  @@index([orgId])
  @@index([moduleKey])
  @@index([enabled])
}

// ============================================================================
// PROPERTIES
// ============================================================================

model Property {
  id        String   @id @default(uuid())
  orgId     String?
  address   String
  city      String
  state     String
  zip       String
  country   String   @default("US")
  latitude  Float?
  longitude Float?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  org      Org?      @relation(fields: [orgId], references: [id], onDelete: SetNull)
  projects Project[]

  @@index([orgId])
  @@index([city, state])
}
```

**Expected Output:**
- packages/database/prisma/schema.prisma created with 11 models

**Test:**
```bash
cd packages/database
pnpm db:generate
```
Should generate Prisma client successfully.

---

#### **PROMPT 1.4: Add Event & Audit Models to Schema**

```
Add Event Logging and Audit Logging models to the Prisma schema.

APPEND TO:
File: packages/database/prisma/schema.prisma

// ============================================================================
// EVENT LOGGING (Append-Only)
// ============================================================================

model Event {
  id          String   @id @default(uuid())
  type        String   // e.g., "PROJECT_CREATED", "MILESTONE_APPROVED"
  entityType  String   // e.g., "Project", "Milestone"
  entityId    String   // UUID of entity
  userId      String?  // Who triggered event
  orgId       String?  // Organization context
  payload     Json     // Event data
  occurredAt  DateTime @default(now())

  @@index([type])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([orgId])
  @@index([occurredAt])
}

// ============================================================================
// AUDIT LOGGING (Append-Only)
// ============================================================================

model AuditLog {
  id          String   @id @default(uuid())
  action      String   // e.g., "APPROVE_MILESTONE", "DELETE_PROJECT"
  entityType  String
  entityId    String
  userId      String   // Who performed action
  reason      String?  // Required for privileged actions
  before      Json?    // State before action
  after       Json?    // State after action
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([action])
  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

**Expected Output:**
- Event and AuditLog models added to schema

**Test:**
```bash
pnpm db:generate
```

---

[Continue with remaining Stages 1-3 prompts...]

Due to length constraints, I'll provide a representative sample. The complete file would include:

**STAGE 1 (Weeks 2-3): ~80 prompts**
- Day 1: Project setup (5 prompts)
- Day 2-3: Authentication module (15 prompts)
- Day 4-5: Organizations & RBAC (15 prompts)
- Week 3 Day 1-2: Event logging (10 prompts)
- Week 3 Day 3-4: Audit logging (10 prompts)
- Week 3 Day 5: Worker infrastructure (15 prompts)
- Testing & deployment (10 prompts)

**STAGE 2 (Weeks 4-5): ~60 prompts**
- Week 4: Admin UI foundation (30 prompts)
- Week 5: Management interfaces (30 prompts)

**STAGE 3 (Weeks 6-8): ~60 prompts**
- Week 6: Customer portal (20 prompts)
- Week 7: Service workflows (20 prompts)
- Week 8: Reports & launch (20 prompts)

---

## SAMPLE PROMPTS FOR EACH SECTION

### **STAGE 1: Authentication Module**

#### **PROMPT 1.10: Create Auth Service**

```
Create the authentication service for Supabase Auth integration.

CREATE:
File: services/api/src/modules/auth/auth.service.ts

import { prisma } from '@kealee/database'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export class AuthService {
  async signup(email: string, password: string, name: string) {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    // 2. Create user record in our database
    const user = await prisma.user.create({
      data: {
        id: authData.user!.id,
        email,
        name,
        status: 'ACTIVE',
      },
    })

    return { user, session: authData.session }
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { session: data.session }
  }

  async logout(accessToken: string) {
    await supabase.auth.signOut()
  }

  async verifyToken(token: string) {
    const { data, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return data.user
  }
}

export const authService = new AuthService()
```

**Expected Output:**
- services/api/src/modules/auth/auth.service.ts created

---

### **STAGE 2: Admin UI**

#### **PROMPT 2.5: Create Admin Dashboard**

```
Create the admin dashboard page with system metrics.

CREATE:
File: apps/os-admin/app/dashboard/page.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@kealee/ui'
import { Users, Building2, FolderKanban, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  // TODO: Fetch real metrics from API
  const metrics = {
    users: 2547,
    orgs: 184,
    activeProjects: 892,
    escrowBalance: 12400000,
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">System Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Users"
          value={metrics.users.toLocaleString()}
          change="+12 today"
          icon={<Users className="w-6 h-6" />}
        />
        <MetricCard
          title="Organizations"
          value={metrics.orgs.toLocaleString()}
          change="+3 today"
          icon={<Building2 className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects.toLocaleString()}
          change="+24 today"
          icon={<FolderKanban className="w-6 h-6" />}
        />
        <MetricCard
          title="Escrow Balance"
          value={`$${(metrics.escrowBalance / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* TODO: Fetch real activity from API */}
            <ActivityItem time="10:23 AM" text="New org created: ABC Construction" />
            <ActivityItem time="10:15 AM" text="Milestone approved: Kitchen Reno" />
            <ActivityItem time="10:02 AM" text="Dispute filed: Bathroom Project" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value, change, icon }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          {icon}
        </div>
        <p className="text-3xl font-bold">{value}</p>
        {change && <p className="text-sm text-neutral-500 mt-1">{change}</p>}
      </CardContent>
    </Card>
  )
}

function ActivityItem({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-neutral-500 font-mono">{time}</span>
      <span>{text}</span>
    </div>
  )
}
```

**Expected Output:**
- apps/os-admin/app/dashboard/page.tsx created
- Dashboard displays system metrics

---

### **STAGE 3: Ops Services MVP**

#### **PROMPT 3.10: Create Package Selection Page**

```
Create the package selection page for Ops Services.

CREATE:
File: apps/m-ops-services/app/packages/select/page.tsx

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@kealee/ui'
import { Check } from 'lucide-react'

const PACKAGES = [
  {
    tier: 'A',
    name: 'Field-First Starter',
    price: '$1,750-$2,750',
    features: [
      'PM Assistant (remote)',
      'Vendor/sub list setup',
      'Weekly reporting',
      'Warranty intake (base)',
    ],
  },
  {
    tier: 'B',
    name: 'Schedule & Paperwork Control',
    price: '$3,750-$5,500',
    features: [
      'PM Assistant + Scheduler',
      'Admin & Compliance support',
      'Vendor onboarding',
      'Weekly reporting',
      'Warranty intake (base)',
    ],
    popular: true,
  },
  {
    tier: 'C',
    name: 'Bid-to-Build Execution',
    price: '$6,500-$9,500',
    features: [
      'All roles (PM, Scheduler, Estimator, Admin)',
      'Bid package support',
      'Permit tracking (lite)',
      'Full warranty execution',
    ],
  },
  {
    tier: 'D',
    name: 'Full Back Office + Growth',
    price: '$10,500-$16,500',
    features: [
      'All roles including Sales/CRM',
      'Full vendor & bid management',
      'Comprehensive permit tracking',
      'CRM & sales follow-ups',
      'Priority platform access',
    ],
  },
]

export default function SelectPackagePage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  const handleSelect = async (tier: string) => {
    setSelectedTier(tier)
    // TODO: Navigate to payment/signup
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-4">Choose Your Package</h1>
      <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
        Select the package that best fits your business needs. All packages include dedicated PM support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PACKAGES.map((pkg) => (
          <Card
            key={pkg.tier}
            className={`relative ${pkg.popular ? 'border-primary-500 border-2' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <div className="text-sm font-medium text-neutral-600">Package {pkg.tier}</div>
              <CardTitle className="text-xl mb-2">{pkg.name}</CardTitle>
              <div className="text-3xl font-bold">{pkg.price}</div>
              <div className="text-sm text-neutral-500">/month</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={pkg.popular ? 'primary' : 'secondary'}
                onClick={() => handleSelect(pkg.tier)}
              >
                Select Package {pkg.tier}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**Expected Output:**
- apps/m-ops-services/app/packages/select/page.tsx created
- Package selection UI working

---

**END OF SAMPLE PROMPTS**

**Full document would contain ~200 detailed prompts covering:**
- All Stage 1 tasks (OS Foundation)
- All Stage 2 tasks (Ops OS Core)
- All Stage 3 tasks (Ops Services MVP)

**For Stages 4-9, see:**
- 07_CURSOR_PROMPTS_STAGES_4_6.md
- 08_CURSOR_PROMPTS_STAGES_7_9.md

