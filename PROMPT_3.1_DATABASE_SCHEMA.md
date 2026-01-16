# Prompt 3.1: Database Schema Updates

## Overview

Added database models to support the unified API platform features implemented in Prompt 3.1.

## ✅ New Models Added

### 1. ApiKey
- **Purpose**: API key management
- **Key Fields**:
  - `keyHash`: SHA-256 hash of the actual API key (unique)
  - `name`: Human-readable name
  - `scopes`: Array of permission scopes (e.g., ["read", "write", "admin"])
  - `rateLimit`: Requests per minute (default: 100)
  - `active`: Whether the key is active
  - `expiresAt`: Optional expiration date
  - `lastUsedAt`: Last usage timestamp

### 2. ApiKeyUsage
- **Purpose**: Track individual API key usage
- **Key Fields**:
  - `apiKeyId`: Foreign key to ApiKey
  - `endpoint`: API endpoint called
  - `method`: HTTP method (GET, POST, etc.)
  - `statusCode`: HTTP response status
  - `responseTime`: Response time in milliseconds
  - `timestamp`: When the request occurred

### 3. Webhook
- **Purpose**: Webhook configuration
- **Key Fields**:
  - `url`: Webhook endpoint URL
  - `secret`: HMAC secret for signing payloads
  - `events`: Array of event types to subscribe to
  - `active`: Whether the webhook is active

### 4. WebhookDelivery
- **Purpose**: Track webhook delivery attempts
- **Key Fields**:
  - `webhookId`: Foreign key to Webhook
  - `event`: Event type that triggered the webhook
  - `payload`: JSON payload sent
  - `status`: PENDING, SUCCESS, or FAILED
  - `attempts`: Number of delivery attempts
  - `nextRetryAt`: When to retry (exponential backoff)
  - `responseCode`: HTTP response code from webhook endpoint
  - `responseBody`: Truncated response body

### 5. ApiUsage
- **Purpose**: Consolidated API usage analytics
- **Key Fields**:
  - `apiKeyId`, `userId`, `organizationId`, `jurisdictionId`: Context
  - `endpoint`: API endpoint called
  - `method`: HTTP method
  - `statusCode`: HTTP response status
  - `responseTime`: Response time in milliseconds

### 6. SecurityAuditLog
- **Purpose**: Comprehensive security audit logging
- **Key Fields**:
  - `eventType`: API_ACCESS, AUTHENTICATION, AUTHORIZATION, DATA_ACCESS, CONFIG_CHANGE
  - `severity`: LOW, MEDIUM, HIGH, CRITICAL
  - `userId`, `apiKeyId`: Actor identification
  - `ipAddress`, `userAgent`: Request context
  - `endpoint`, `method`, `statusCode`: Action details
  - `requestBody`, `responseBody`: Data accessed (JSON)
  - `metadata`: Additional context (JSON)

## New Enums

- **WebhookDeliveryStatus**: PENDING, SUCCESS, FAILED
- **SecurityEventType**: API_ACCESS, AUTHENTICATION, AUTHORIZATION, DATA_ACCESS, CONFIG_CHANGE
- **SecuritySeverity**: LOW, MEDIUM, HIGH, CRITICAL

## Indexes Created

All models include appropriate indexes for:
- Foreign keys
- Timestamp fields (for time-based queries)
- Status fields (for filtering)
- Endpoint/method (for analytics)

## Next Steps

1. **Run Migration**: 
   ```bash
   cd packages/database
   pnpm prisma migrate dev --name add_api_platform_models
   ```

2. **Fix Pre-existing Schema Issues**: The User model has missing relation fields that need to be added (this is a pre-existing issue, not related to API platform models).

3. **Generate Prisma Client**:
   ```bash
   pnpm prisma generate
   ```

## Files Modified

- `packages/database/prisma/schema.prisma` - Added API platform models at the end

---

**Status**: ✅ Database schema updated with API platform models. Ready for migration after fixing pre-existing User model relation issues.
