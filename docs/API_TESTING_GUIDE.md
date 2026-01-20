# API Testing Guide

This guide explains how to test all API endpoints in the Kealee Platform.

## Quick Start

### Run API Tests

```bash
# Unix/Linux/macOS
./scripts/test-all-api-endpoints.sh

# Windows PowerShell
.\scripts\test-all-api-endpoints.ps1
```

### With Custom Configuration

```bash
# Set base URL
BASE_URL="https://api.kealee.com" ./scripts/test-all-api-endpoints.sh

# Set authentication token
AUTH_TOKEN="your_token_here" ./scripts/test-all-api-endpoints.sh

# Both
BASE_URL="https://api.kealee.com" \
AUTH_TOKEN="your_token_here" \
./scripts/test-all-api-endpoints.sh
```

## Prerequisites

### 1. API Server Running

Ensure the API server is running:

```bash
# Start API server
cd services/api
pnpm dev
```

### 2. Authentication Token (Optional)

For authenticated endpoints, get a token:

```bash
# Login and get token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Export token
export AUTH_TOKEN="your_token_here"
```

### 3. Required Tools

- **curl** (Unix/Linux/macOS) or **Invoke-WebRequest** (PowerShell)
- **jq** (optional, for JSON parsing and better reports)

## Test Coverage

The script tests the following endpoint categories:

### Authentication
- `/auth/signup` - User registration
- `/auth/login` - User login
- `/auth/me` - Get current user
- `/auth/verify` - Verify token
- `/auth/logout` - User logout

### Users
- `GET /users` - List users
- `GET /users/{id}` - Get user by ID
- `PUT /users/{id}` - Update user
- `GET /users/{id}/orgs` - Get user organizations

### Organizations
- `GET /orgs` - List organizations
- `POST /orgs` - Create organization
- `GET /orgs/{id}` - Get organization
- `PUT /orgs/{id}` - Update organization
- `POST /orgs/{id}/members` - Add member
- `DELETE /orgs/{id}/members/{userId}` - Remove member
- `GET /orgs/my` - Get user's organizations

### RBAC
- `GET /rbac/roles` - List roles
- `POST /rbac/roles` - Create role
- `GET /rbac/roles/{id}` - Get role
- `GET /rbac/permissions` - List permissions
- `POST /rbac/permissions` - Create permission
- `POST /rbac/check` - Check permission

### Entitlements
- `GET /entitlements/orgs/{orgId}` - Get org entitlements
- `POST /entitlements/orgs/{orgId}/modules/{moduleKey}/enable` - Enable module
- `POST /entitlements/check` - Check module access

### Events & Audit
- `GET /events` - List events
- `POST /events` - Create event
- `GET /audit` - List audit logs
- `POST /audit` - Create audit log

### Billing
- `GET /billing/plans` - List plans
- `POST /billing/stripe/checkout-session` - Create checkout session
- `GET /billing/subscriptions` - List subscriptions
- `GET /billing/subscriptions/me` - Get my subscription

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project
- `PATCH /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Properties
- `GET /properties` - List properties
- `POST /properties` - Create property
- `GET /properties/{id}` - Get property

### Webhooks
- `GET /api/v1/webhooks/status` - Get webhook status
- `POST /api/v1/webhooks/test` - Trigger test webhook
- `POST /billing/stripe/webhook` - Stripe webhook endpoint

### PM (Project Management)
- `GET /pm/tasks` - List tasks
- `POST /pm/tasks` - Create task

### Marketplace
- `GET /marketplace/profiles` - List profiles
- `GET /marketplace/leads` - List leads
- `POST /marketplace/leads` - Create lead

### Permits
- `GET /permits/jurisdictions` - List jurisdictions
- `GET /permits/applications` - List applications
- `POST /permits/applications` - Create application

### Files
- `GET /files` - List files
- `POST /files/upload` - Upload file

## Test Results

### JSON Report

Detailed results are saved in JSON format:

```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "base_url": "http://localhost:3001",
  "tests": [
    {
      "name": "GET /health",
      "status": "passed",
      "duration_ms": 45,
      "http_code": 200,
      "url": "http://localhost:3001/health",
      "response_body": "{\"status\":\"ok\"}",
      "timestamp": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### Markdown Summary

A human-readable summary is generated:

```markdown
# API Test Report

## Executive Summary
- Total Tests: 50
- Passed: 45
- Failed: 2
- Skipped: 3
- Success Rate: 90%
```

## Test Statuses

### Passed
- HTTP status code 200-399
- Endpoint is working correctly

### Failed
- HTTP status code 400, 500-599
- Endpoint has errors

### Auth Required
- HTTP status code 401, 403
- Endpoint requires authentication
- Set `AUTH_TOKEN` environment variable

### Not Found
- HTTP status code 404
- Endpoint doesn't exist or path is incorrect

### Rate Limited
- HTTP status code 429
- Too many requests
- Wait and retry

## Performance Analysis

The script tracks response times for each endpoint:

- **Fast**: < 100ms
- **Good**: 100-500ms
- **Acceptable**: 500-1000ms
- **Slow**: > 1000ms (flagged in report)

## Customization

### Test Specific Endpoints

Edit the script to add or remove endpoints:

```bash
# Add custom endpoint
run_test "/custom/endpoint" "GET" false

# Remove endpoint
# Comment out or delete the run_test line
```

### Change Test Data

Modify the test data for POST/PATCH requests:

```bash
run_test "/users" "POST" true '{"name":"Custom Name","email":"custom@example.com"}'
```

### Adjust Rate Limiting

Change the delay between requests:

```bash
# In the script, change:
sleep 0.1  # 100ms delay
# To:
sleep 0.5  # 500ms delay
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: |
          cd services/api
          pnpm dev &
          sleep 5
          cd ../..
          chmod +x scripts/test-all-api-endpoints.sh
          ./scripts/test-all-api-endpoints.sh
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Troubleshooting

### All Tests Fail

1. **Check API server is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verify base URL:**
   ```bash
   BASE_URL="http://localhost:3001" ./scripts/test-all-api-endpoints.sh
   ```

3. **Check network connectivity:**
   ```bash
   ping api.kealee.com
   ```

### Authentication Errors

1. **Get valid token:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

2. **Set token:**
   ```bash
   export AUTH_TOKEN="your_token_here"
   ```

### Rate Limiting

If you see many 429 responses:

1. **Increase delay between requests:**
   ```bash
   # Edit script: change sleep 0.1 to sleep 1.0
   ```

2. **Run tests in smaller batches:**
   ```bash
   # Test only specific categories
   ```

### Slow Response Times

If endpoints are slow:

1. **Check database performance**
2. **Review query optimization**
3. **Check network latency**
4. **Monitor server resources**

## Best Practices

1. **Run tests regularly** - Include in CI/CD pipeline
2. **Test in staging first** - Before production
3. **Monitor trends** - Track performance over time
4. **Fix failures quickly** - Don't let failures accumulate
5. **Document changes** - Update test script when adding endpoints

## Advanced Usage

### Test Specific Categories

Create custom test scripts for specific categories:

```bash
#!/bin/bash
# test-auth-endpoints.sh

BASE_URL="http://localhost:3001"
source scripts/test-all-api-endpoints.sh

# Only test auth endpoints
run_test "/auth/signup" "POST" false '{"email":"test@example.com","password":"test123456","name":"Test User"}'
run_test "/auth/login" "POST" false '{"email":"test@example.com","password":"test123456"}'
run_test "/auth/me" "GET" true
```

### Load Testing

Combine with load testing tools:

```bash
# Run endpoint tests first
./scripts/test-all-api-endpoints.sh

# Then run load tests on passing endpoints
ab -n 1000 -c 10 http://localhost:3001/health
```

## Support

For API testing issues:
1. Check API server logs
2. Review test results JSON
3. Verify endpoint documentation
4. Check authentication setup
5. Contact DevOps team if needed
