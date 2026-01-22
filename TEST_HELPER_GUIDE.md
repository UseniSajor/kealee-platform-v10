# 🧪 Test Helper Module Guide

**Location:** `services/api/src/__tests__/helper.ts`

---

## 📋 Overview

The test helper module provides utilities for setting up Fastify test instances and common testing utilities.

---

## 🔧 Available Functions

### **`build(options?)`** - Main Test Builder

Creates a configured Fastify instance for testing.

```typescript
import { build } from '../helper';

const app = await build({
  logger: false,        // Disable logging (default: false)
  registerRoutes: false // Register common routes (default: false)
});
```

**Options:**
- `logger?: boolean` - Enable/disable Fastify logger (default: `false`)
- `registerRoutes?: boolean` - Register common API routes (default: `false`)

**Returns:** Configured `FastifyInstance` ready for testing

---

### **`buildMinimal()`** - Minimal Test Instance

Creates a minimal Fastify instance with no routes (just middleware).

```typescript
import { buildMinimal } from '../helper';

const app = await buildMinimal();
// Only has health check endpoint
```

**Use When:**
- Testing middleware
- Testing simple endpoints
- Unit tests

---

### **`buildFull()`** - Full Test Instance

Creates a complete Fastify instance with all common routes registered.

```typescript
import { buildFull } from '../helper';

const app = await buildFull();
// Has all routes: /auth, /orgs, /users, /api/projects
```

**Use When:**
- Integration tests
- End-to-end tests
- Testing route interactions

---

### **`createTestToken(userId?)`** - Mock Auth Token

Creates a mock authentication token for testing.

```typescript
import { createTestToken } from '../helper';

const token = createTestToken('user-123');
// Returns: "test-token-user-123"
```

**Note:** This is a mock token. For real tests, use actual Supabase auth tokens.

---

### **`createAuthHeaders(token?)`** - Auth Headers Helper

Creates request headers with authentication.

```typescript
import { createAuthHeaders } from '../helper';

const headers = createAuthHeaders('real-token-here');
// Returns: { authorization: 'Bearer real-token-here', 'content-type': 'application/json' }

// Or use default mock token
const headers = createAuthHeaders();
```

---

## 📝 Usage Examples

### **Example 1: Basic Route Test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../helper';

describe('Project Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 for unauthorized request', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects',
    });

    expect(response.statusCode).toBe(401);
  });
});
```

### **Example 2: Test with Authentication**

```typescript
import { build, createAuthHeaders } from '../helper';

describe('Authenticated Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build({ registerRoutes: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create project with auth', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: createAuthHeaders('real-token'),
      payload: {
        name: 'Test Project',
        location: '123 Main St',
        type: 'renovation',
        budget: '50000',
        startDate: '2024-01-01',
        endDate: '2024-06-01',
        contractorChoice: 'own',
      },
    });

    expect(response.statusCode).toBe(201);
  });
});
```

### **Example 3: Integration Test**

```typescript
import { buildFull } from '../helper';

describe('Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = await buildFull(); // Includes all routes
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle full workflow', async () => {
    // Test complete workflows across multiple routes
  });
});
```

---

## 🎯 What the Helper Provides

### **Middleware Included:**
- ✅ CORS (enabled for all origins in tests)
- ✅ Helmet (security headers)
- ✅ Error handler (standardized error responses)
- ✅ Not found handler (404 responses)

### **Endpoints Included:**
- ✅ `GET /health` - Health check endpoint

### **Optional Routes:**
- `/auth/*` - Authentication routes
- `/orgs/*` - Organization routes
- `/users/*` - User routes
- `/api/projects/*` - Project routes

---

## 🔍 Helper Module Structure

```
services/api/src/__tests__/
├── helper.ts              ← Test helper module (this file)
├── routes/
│   └── projects.test.ts   ← Example test using helper
└── integration.test.ts     ← Integration tests
```

---

## ⚠️ Important Notes

1. **Always close the app:** Use `afterAll` to close the Fastify instance
   ```typescript
   afterAll(async () => {
     await app.close();
   });
   ```

2. **Mock vs Real Tokens:** 
   - Use `createTestToken()` for quick mocks
   - Use real Supabase tokens for integration tests

3. **Database Setup:** 
   - Tests may require database connection
   - Use test database or mocks for unit tests

4. **Environment Variables:**
   - Tests may need `.env.test` file
   - Or set environment variables in test setup

---

## 🚀 Quick Start

```typescript
// 1. Import helper
import { build, createAuthHeaders } from '../helper';

// 2. Build app in beforeAll
const app = await build();

// 3. Use app.inject() for requests
const response = await app.inject({
  method: 'GET',
  url: '/api/projects',
  headers: createAuthHeaders(),
});

// 4. Close in afterAll
await app.close();
```

---

**Last Updated:** January 2026  
**Location:** `services/api/src/__tests__/helper.ts`




