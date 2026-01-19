# 🚨 CRITICAL: Prisma Schema Fix Required

**Status:** ⚠️ BLOCKING - Must fix before CSRF can be tested

---

## Problem

The Prisma schema file (`packages/database/prisma/schema.prisma`) has encoding corruption in the File model section (lines 54-106).

**Error:**
```
Error validating: This line is invalid. It does not start with any known Prisma schema keyword.
  --> prisma\schema.prisma:54
```

---

## Solution

**Manual Fix Required:**

1. Open `packages/database/prisma/schema.prisma` in a text editor
2. Find line 52 (end of Invoice model)
3. Delete everything from line 54 to line 106
4. Replace with this clean code:

```prisma
// ============================================================================
// FILE UPLOADS (S3/R2)
// ============================================================================

model File {
  id        String   @id @default(uuid())
  key       String   @unique // S3/R2 object key
  fileName  String
  mimeType  String?
  size      Int      // Size in bytes
  uploadedBy String
  status    String   @default("UPLOADING") // UPLOADING, COMPLETED, FAILED
  metadata  Json?    // Additional metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation("FileUploader", fields: [uploadedBy], references: [id])

  @@index([uploadedBy])
  @@index([key])
  @@index([status])
  @@index([createdAt])
}
```

5. Save the file
6. Run: `cd packages/database && npx prisma format`
7. Verify: `cd packages/database && npx prisma generate`

---

## After Fix

Once the schema is fixed:
1. Run `pnpm install` to install all packages
2. Run `npx prisma generate` to generate Prisma client
3. Test CSRF protection
4. Run database migrations
5. Run seed script

---

**Priority:** CRITICAL - Blocks all database operations
