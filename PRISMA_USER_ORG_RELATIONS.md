# Prisma User-Organization Relations Guide

## Correct Relation Names

Based on the Prisma schema, here's how to correctly query user organizations:

### ❌ INCORRECT (This will fail):
```typescript
await prisma.user.findUnique({
  where: { id: userId },
  include: {
    organization: true, // ❌ This relation doesn't exist
  },
});
```

### ✅ CORRECT (Use orgMemberships):
```typescript
// Get user with their organization memberships
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    orgMemberships: {
      include: {
        org: true, // Access the organization through the membership
      },
    },
  },
});

// Extract organizations from memberships
const organizations = user?.orgMemberships.map(membership => ({
  ...membership.org,
  role: membership.roleKey,
  joinedAt: membership.joinedAt,
})) || [];
```

### Alternative: Query OrgMember directly
```typescript
// Get user's organizations via OrgMember join table
const memberships = await prisma.orgMember.findMany({
  where: { userId },
  include: {
    org: {
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    },
  },
});

const organizations = memberships.map(m => ({
  ...m.org,
  role: m.roleKey,
  joinedAt: m.joinedAt,
}));
```

## Schema Structure

The relationship is:
- `User` → `orgMemberships` (OrgMember[]) → `org` (Org)

**User Model:**
```prisma
model User {
  id String @id @default(uuid())
  orgMemberships OrgMember[] // ✅ This is the correct relation name
  // ... other fields
}
```

**OrgMember Model (Join Table):**
```prisma
model OrgMember {
  id       String   @id @default(uuid())
  userId   String
  orgId    String
  roleKey  String
  joinedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  org  Org  @relation(fields: [orgId], references: [id], onDelete: Cascade)
}
```

**Org Model:**
```prisma
model Org {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  logo        String?
  status      OrgStatus @default(ACTIVE)
  members     OrgMember[] // ✅ This is the correct relation name
  // ... other fields
}
```

## Common Patterns

### Get user's primary organization (first one):
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    orgMemberships: {
      include: { org: true },
      take: 1,
      orderBy: { joinedAt: 'asc' },
    },
  },
});

const primaryOrg = user?.orgMemberships[0]?.org;
```

### Check if user belongs to a specific organization:
```typescript
const membership = await prisma.orgMember.findFirst({
  where: {
    userId,
    orgId: targetOrgId,
  },
});

const hasAccess = !!membership;
```

### Get user's role in an organization:
```typescript
const membership = await prisma.orgMember.findUnique({
  where: {
    userId_orgId: {
      userId,
      orgId,
    },
  },
});

const role = membership?.roleKey; // e.g., 'ADMIN', 'MEMBER', etc.
```

