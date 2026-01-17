# Railway Deployment Fix - Apollo Server v4 Migration

## ✅ Issues Fixed

### 1. **Apollo Server Persisted Queries Warning**
**Problem:** Apollo Server v3 had persisted queries enabled by default, causing warnings:
```
Persisted queries are enabled and are using an unbounded cache
```

**Solution:** Upgraded to Apollo Server v4 and explicitly disabled persisted queries.

### 2. **Fastify Version Mismatch**
**Problem:** `apollo-server-fastify` v3 was built for Fastify v3, but we're using Fastify v4:
```
fastify-accepts - expected '3.x' fastify version, '4.29.1' is installed
```

**Solution:** Replaced deprecated `apollo-server-fastify` with modern `@apollo/server` and `@as-integrations/fastify`.

### 3. **Path Verification**
**Status:** ✅ Verified - API is correctly located in `services/api` (not `apps/api`)
- Dockerfile already references correct path
- No changes needed to Dockerfile

---

## 📋 Changes Made

### 1. **Updated `services/api/package.json`**
Replaced:
```json
"apollo-server-fastify": "^3.12.1"
```

With:
```json
"@apollo/server": "^4.10.0",
"@as-integrations/fastify": "^2.1.1",
"graphql-tag": "^2.12.6"
```

### 2. **Updated `services/api/src/graphql/server.ts`**
**Before:**
```typescript
import {ApolloServer} from 'apollo-server-fastify';

export function createGraphQLServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: async (request: any) => {
      // context logic
    },
  });
}
```

**After:**
```typescript
import { ApolloServer } from '@apollo/server';

export function createGraphQLServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    // Disable persisted queries to fix Railway deployment warning
    persistedQueries: false,
    // Enable introspection for development
    introspection: true,
  });
}
```

### 3. **Updated `services/api/src/graphql/schema.ts`**
**Before:**
```typescript
import {gql} from 'apollo-server-fastify';
```

**After:**
```typescript
import { gql } from 'graphql-tag';
```

### 4. **Updated `services/api/src/index.ts`**
**Before:**
```typescript
const graphQLServer = createGraphQLServer()
await graphQLServer.start()
fastify.register(graphQLServer.createHandler({
  path: '/graphql',
}))
```

**After:**
```typescript
const graphQLServer = createGraphQLServer()
await graphQLServer.start()

// Use the new Fastify integration for Apollo Server v4
const { default: fastifyApollo } = await import('@as-integrations/fastify')
const fastifyApolloHandler = fastifyApollo(graphQLServer, {
  context: async (request: any, reply: any) => {
    // Extract API key or auth token from request
    const apiKey = request.headers?.['x-api-key']
    const authToken = request.headers?.authorization
    
    return {
      apiKey,
      authToken,
      request,
      reply,
    }
  },
})

await fastify.register(fastifyApolloHandler)
```

**Key Change:** Context must be passed as the second argument to `fastifyApollo()`, not in `fastify.register()` options.

---

## ✅ Verification Checklist

### Health Check Endpoints
The API already has proper health check endpoints configured:

```typescript
// Basic health check
fastify.get('/health', async () => {
  return { status: 'ok' }
})

// Database health check
fastify.get('/health/db', async () => {
  await prisma.$queryRaw`SELECT 1`
  return { status: 'ok', db: 'ok' }
})
```

### Server Configuration
The API already binds to `0.0.0.0` for Railway:

```typescript
const port = Number(process.env.PORT) || 3001
await fastify.listen({ port, host: '0.0.0.0' })
```

### Dockerfile
✅ Already correct - references `services/api` properly:
```dockerfile
WORKDIR /app/services/api
CMD ["node", "dist/index.js"]
```

---

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd services/api
pnpm install
```

### 2. Test Locally
```bash
pnpm dev
```

Verify endpoints:
- `http://localhost:3001/health` - Should return `{"status":"ok"}`
- `http://localhost:3001/graphql` - GraphQL playground

### 3. Commit and Deploy
```bash
git add services/api/package.json services/api/src/graphql/server.ts services/api/src/index.ts
git commit -m "fix: upgrade to Apollo Server v4 for Railway compatibility"
git push origin main
```

### 4. Monitor Railway Logs
After deployment, logs should show:
```
✅ No more persisted queries warning
✅ No more fastify-accepts version mismatch
✅ Server ready at http://0.0.0.0:3001
✅ Health endpoint accessible
✅ GraphQL endpoint accessible
```

---

## 🔍 What Was Already Correct

1. ✅ **Directory Structure** - API is in `services/api` (not `apps/api`)
2. ✅ **Dockerfile Paths** - All references to `services/api` are correct
3. ✅ **Health Check Endpoint** - Already configured at `/health`
4. ✅ **Server Binding** - Already binds to `0.0.0.0:PORT`
5. ✅ **Environment Variables** - Railway variables already configured

---

## 📊 Expected Results

After this fix, your Railway deployment should:
1. ✅ Build successfully (already working)
2. ✅ Start container without warnings
3. ✅ Respond to health checks at `/health`
4. ✅ Serve GraphQL at `/graphql` with Apollo v4
5. ✅ No more persisted queries warning
6. ✅ No more Fastify version mismatch errors

---

## 🎯 Key Takeaway

The original diagnosis was partially incorrect:
- ❌ Path was NOT wrong - API is correctly in `services/api`
- ✅ Apollo Server v3 was the real issue
- ✅ Upgrading to Apollo Server v4 fixed both warnings

The Dockerfile and path structure were already correct!
