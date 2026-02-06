# API Testing Workflow

Complete guide for testing the Kealee Platform API.

## Quick Start

### Automated Workflow (Recommended)

```bash
# Unix/Linux/macOS - Complete workflow
./scripts/run-api-tests.sh

# Windows PowerShell
.\scripts\run-api-tests.ps1
```

This script will:
1. ✅ Start the API server (if not running)
2. ✅ Get authentication token
3. ✅ Run all API endpoint tests
4. ✅ Generate test reports
5. ✅ Display summary

### Manual Steps

#### 1. Start API Server

```bash
cd services/api
pnpm dev
```

The API will start on `http://localhost:3001` by default.

#### 2. Get Authentication Token

```bash
# Unix/Linux/macOS
./scripts/get-auth-token.sh

# Windows PowerShell
.\scripts\get-auth-token.ps1

# With custom credentials
EMAIL="user@example.com" PASSWORD="password" ./scripts/get-auth-token.sh
```

The script will output the token. Export it:

```bash
export AUTH_TOKEN="your_token_here"
```

#### 3. Run API Tests

```bash
# Unix/Linux/macOS
./scripts/test-all-api-endpoints.sh

# Windows PowerShell
.\scripts\test-all-api-endpoints.ps1

# With custom base URL
BASE_URL="https://api.kealee.com" ./scripts/test-all-api-endpoints.sh
```

#### 4. Review Results

Test results are saved in `test-results/`:
- **JSON Report**: `api-test-report-<timestamp>.json` - Detailed results
- **Markdown Summary**: `summary-<timestamp>.md` - Human-readable summary

## Workflow Options

### Skip API Server Start

If the API is already running:

```bash
SKIP_START=true ./scripts/run-api-tests.sh
```

### Skip Authentication

If you already have a token:

```bash
SKIP_AUTH=true AUTH_TOKEN="your_token" ./scripts/run-api-tests.sh
```

### Custom Configuration

```bash
API_URL="http://localhost:3001" \
TEST_EMAIL="test@example.com" \
TEST_PASSWORD="password123" \
./scripts/run-api-tests.sh
```

## Test Results

### Understanding Results

- **✅ Passed**: Endpoint returned 200-399 status code
- **❌ Failed**: Endpoint returned 400, 500-599 status code
- **⚠️ Auth Required**: Endpoint returned 401/403 (needs token)
- **⏭️ Not Found**: Endpoint returned 404
- **⏭️ Rate Limited**: Endpoint returned 429

### Performance Metrics

Response times are tracked:
- **Fast**: < 100ms
- **Good**: 100-500ms
- **Acceptable**: 500-1000ms
- **Slow**: > 1000ms (flagged in report)

## Troubleshooting

### API Server Won't Start

1. Check if port 3001 is in use:
   ```bash
   lsof -i :3001  # macOS/Linux
   netstat -ano | findstr :3001  # Windows
   ```

2. Check environment variables:
   ```bash
   cd services/api
   cat .env.local
   ```

3. Check logs:
   ```bash
   tail -f /tmp/api-server.log  # If using run-api-tests.sh
   ```

### Authentication Fails

1. Verify credentials:
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

2. Check Supabase configuration:
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
   - Check Supabase dashboard for user

3. Create test user:
   ```bash
   curl -X POST http://localhost:3001/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123456","name":"Test User"}'
   ```

### Tests Fail

1. Check API is running:
   ```bash
   curl http://localhost:3001/health
   ```

2. Verify base URL:
   ```bash
   BASE_URL="http://localhost:3001" ./scripts/test-all-api-endpoints.sh
   ```

3. Check test report for specific errors:
   ```bash
   cat test-results/api-test-report-*.json | jq '.tests[] | select(.status == "failed")'
   ```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: API Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: pnpm install
      
      - name: Start API server
        run: |
          cd services/api
          pnpm dev &
          sleep 10
      
      - name: Run API tests
        run: |
          chmod +x scripts/run-api-tests.sh
          SKIP_START=true ./scripts/run-api-tests.sh
        env:
          API_URL: http://localhost:3001
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Best Practices

1. **Run tests before committing**
2. **Fix failing tests immediately**
3. **Monitor test performance trends**
4. **Keep test data up to date**
5. **Document any skipped tests**
6. **Review reports regularly**

## Related Documentation

- [API Testing Guide](./API_TESTING_GUIDE.md) - Detailed testing documentation
- [Deployment Procedures](./deployment/procedures.md) - Deployment workflows
- [Staging Testing Guide](./STAGING_TESTING_GUIDE.md) - Staging environment testing
- [Payment Testing Guide](./PAYMENT_TESTING_GUIDE.md) - Payment flow testing

## Support

For testing issues:
1. Check API server logs
2. Review test reports
3. Verify environment setup
4. Check related documentation
5. Contact DevOps team
