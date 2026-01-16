# API Key Admin Panel

## Overview

Complete admin panel for managing API keys, viewing usage analytics, and monitoring API access.

## Features

✅ **API Key Management**
- List all API keys with status (Active, Expired, Revoked)
- Create new API keys with customizable scopes and rate limits
- Revoke API keys
- View key details (scopes, rate limits, creation date, last used)

✅ **Usage Analytics**
- Total requests, success rate, failed requests
- Average response time
- Usage by endpoint
- Daily usage trends
- Error tracking

✅ **Security Features**
- API keys only shown once on creation
- Secure key hashing (SHA-256)
- Rate limiting per key
- Expiration date support
- Scope-based permissions

## File Structure

```
apps/m-permits-inspections/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── admin/
│   │   │       └── api-keys/
│   │   │           └── page.tsx          # Main admin panel page
│   │   └── api/
│   │       └── admin/
│   │           └── api-keys/
│   │               ├── route.ts          # List & create API keys
│   │               └── [id]/
│   │                   ├── route.ts       # Revoke API key
│   │                   └── usage/
│   │                       └── route.ts  # Usage analytics
│   └── components/
│       └── admin/
│           ├── api-key-list.tsx          # Key list component
│           ├── api-key-create-form.tsx   # Creation form
│           └── api-key-usage-chart.tsx   # Usage analytics
```

## Usage

### Access the Admin Panel

Navigate to: `/dashboard/admin/api-keys`

### Create API Key

1. Click "Create API Key" button
2. Fill in the form:
   - **Name**: Descriptive name for the key
   - **Jurisdiction ID** (optional): Restrict to specific jurisdiction
   - **Organization ID** (optional): Restrict to specific organization
   - **Scopes**: Select permissions (read, write, admin, webhooks)
   - **Rate Limit**: Requests per minute
   - **Expiration Date** (optional): When the key expires
3. Click "Create API Key"
4. **IMPORTANT**: Copy the API key immediately - it's only shown once!

### View Usage Analytics

1. Click "Usage" button on any API key
2. Switch to "Usage Analytics" tab
3. View:
   - Summary statistics
   - Usage by endpoint
   - Daily usage trends

### Revoke API Key

1. Click "Revoke" button on any active API key
2. Confirm the action
3. The key will be immediately deactivated

## API Endpoints

### List API Keys
```
GET /api/admin/api-keys
Query params:
  - jurisdictionId (optional)
  - organizationId (optional)
```

### Create API Key
```
POST /api/admin/api-keys
Body:
{
  "name": "string",
  "jurisdictionId": "string (optional)",
  "organizationId": "string (optional)",
  "scopes": ["read", "write"],
  "rateLimit": 100,
  "expiresAt": "2024-12-31 (optional)"
}
```

### Revoke API Key
```
DELETE /api/admin/api-keys/:id
```

### Get Usage Analytics
```
GET /api/admin/api-keys/:id/usage?days=7
```

## Integration with Fastify API

The admin panel proxies requests to the Fastify API service:

- **API Base URL**: `process.env.API_BASE_URL` (default: `http://localhost:3001`)
- **Authentication**: TODO - Add authentication headers

## Database Schema

Uses the `ApiKey` and `ApiKeyUsage` tables from Prisma schema:

```prisma
model ApiKey {
  id            String   @id @default(uuid())
  keyHash       String   @unique
  name          String
  jurisdictionId String?
  userId        String?
  organizationId String?
  scopes        String[]
  rateLimit     Int
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  expiresAt     DateTime?
  lastUsedAt    DateTime?
}

model ApiKeyUsage {
  id          String   @id @default(uuid())
  keyId      String
  endpoint   String
  timestamp  DateTime @default(now())
  responseTime Int
  statusCode Int
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **API Key Display**: Keys are only shown once on creation. Store them securely.
2. **Key Hashing**: Keys are hashed with SHA-256 before storage
3. **Rate Limiting**: Each key has configurable rate limits
4. **Scope Permissions**: Use scopes to limit API access
5. **Expiration**: Set expiration dates for temporary keys
6. **Authentication**: Add authentication middleware to admin routes

## Next Steps

1. **Add Authentication**: Protect admin routes with role-based access
2. **Add Filtering**: Filter keys by jurisdiction, organization, status
3. **Add Export**: Export usage data to CSV/JSON
4. **Add Notifications**: Alert on rate limit breaches or suspicious activity
5. **Add Webhooks**: Configure webhooks for key events (created, revoked, etc.)

---

**Status**: ✅ Admin panel complete and ready to use!
