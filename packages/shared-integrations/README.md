# @kealee/shared-integrations

Unified jurisdiction integration system supporting multiple integration tiers for permit management and status tracking.

## Overview

This package provides a comprehensive integration system for connecting with jurisdiction permit systems through three tiers:

- **Tier 1: API Integrations** - Direct REST API clients for providers like Accela, Tyler, and GovOS
- **Tier 2: Portal Automation** - Browser automation for jurisdictions without APIs using Puppeteer
- **Tier 3: Manual + OCR Fallback** - Manual entry interface and OCR processing for scanned documents

## Features

- ✅ Multi-tier integration with automatic fallback
- ✅ OAuth2 and API key authentication
- ✅ Rate limiting and retry logic with exponential backoff
- ✅ Health monitoring and metrics tracking
- ✅ Email parsing for status updates
- ✅ OCR document processing
- ✅ Portal automation with form auto-fill
- ✅ Comprehensive error handling and logging

## Installation

```bash
npm install @kealee/shared-integrations
```

## Usage

### Basic Setup

```typescript
import { IntegrationService } from '@kealee/shared-integrations';
import { IntegrationConfig } from '@kealee/shared-integrations';

const config: IntegrationConfig = {
  jurisdictionId: 'jurisdiction-123',
  provider: 'ACCELA',
  tier: 'API',
  isActive: true,
  apiUrl: 'https://api.accela.com',
  oauthConfig: {
    authorizationUrl: 'https://api.accela.com/oauth2/token',
    tokenUrl: 'https://api.accela.com/oauth2/token',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    scope: ['records'],
    grantType: 'client_credentials',
  },
  maxRetries: 3,
  retryDelay: 1000,
  fallbackTier: 'PORTAL',
};

const integrationService = new IntegrationService(config);
```

### Submit Permit

```typescript
const permitData: PermitSubmissionData = {
  permitId: 'permit-123',
  jurisdictionId: 'jurisdiction-123',
  permitType: 'BUILDING',
  formData: {
    address: '123 Main St',
    scope: 'New construction',
    valuation: 50000,
    applicantName: 'John Doe',
    applicantEmail: 'john@example.com',
    applicantPhone: '555-1234',
  },
  documents: [
    {
      type: 'PLANS',
      url: 'https://example.com/plans.pdf',
      name: 'plans.pdf',
    },
  ],
};

const result = await integrationService.submitPermit(permitData);

if (result.success) {
  console.log('Permit submitted:', result.data);
} else {
  console.error('Submission failed:', result.error);
}
```

### Check Status

```typescript
const statusResult = await integrationService.checkStatus('PERMIT-2024-001');

if (statusResult.success && statusResult.data) {
  console.log('Status:', statusResult.data.status);
  console.log('Last Updated:', statusResult.data.lastUpdated);
}
```

### Process Email

```typescript
const emailResult = await integrationService.processEmail(
  'Your permit PERMIT-2024-001 has been approved...',
  'Permit Status Update'
);

if (emailResult.success && emailResult.data) {
  console.log('Permit Number:', emailResult.data.permitNumber);
  console.log('Status:', emailResult.data.status);
}
```

### Process Document with OCR

```typescript
const ocrResult = await integrationService.processDocument(
  'https://example.com/scanned-permit.pdf'
);

if (ocrResult.success && ocrResult.data) {
  console.log('Extracted Text:', ocrResult.data.text);
  console.log('Confidence:', ocrResult.data.confidence);
  console.log('Fields:', ocrResult.data.fields);
}
```

### Health Monitoring

```typescript
const health = integrationService.getHealth();

console.log('Status:', health.status); // 'healthy' | 'degraded' | 'down'
console.log('Success Rate:', health.successRate);
console.log('Avg Response Time:', health.avgResponseTime);
console.log('Last Successful Sync:', health.lastSuccessfulSync);
```

### Cleanup

```typescript
// Clean up resources (browser instances, OCR workers, etc.)
await integrationService.cleanup();
```

## Configuration

### API Integration (Tier 1)

```typescript
const apiConfig: IntegrationConfig = {
  jurisdictionId: 'jurisdiction-123',
  provider: 'ACCELA', // or 'TYLER', 'GOVOS'
  tier: 'API',
  isActive: true,
  apiUrl: 'https://api.example.com',
  
  // OAuth2 Configuration
  oauthConfig: {
    authorizationUrl: 'https://api.example.com/oauth2/authorize',
    tokenUrl: 'https://api.example.com/oauth2/token',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    scope: ['read', 'write'],
    grantType: 'client_credentials',
  },
  
  // Or API Key
  apiKey: 'your-api-key',
  
  // Rate Limiting
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  
  // Retry Configuration
  maxRetries: 3,
  retryDelay: 1000,
  fallbackTier: 'PORTAL',
};
```

### Portal Automation (Tier 2)

```typescript
const portalConfig: IntegrationConfig = {
  jurisdictionId: 'jurisdiction-123',
  provider: 'CUSTOM',
  tier: 'PORTAL',
  isActive: true,
  portalUrl: 'https://portal.example.com',
  
  loginCredentials: {
    username: 'username',
    password: 'encrypted-password',
  },
  
  automationConfig: {
    headless: true,
    timeout: 30000,
    formSelectors: {
      address: 'input[name="address"]',
      scope: 'textarea[name="description"]',
      valuation: 'input[name="cost"]',
    },
    navigationSteps: [
      { action: 'click', selector: 'a:has-text("Apply")' },
      { action: 'wait', waitTime: 2000 },
    ],
  },
};
```

### Manual + OCR (Tier 3)

```typescript
const manualConfig: IntegrationConfig = {
  jurisdictionId: 'jurisdiction-123',
  provider: 'CUSTOM',
  tier: 'MANUAL',
  isActive: true,
  
  manualContactEmail: 'permits@jurisdiction.gov',
  manualContactPhone: '555-1234',
  
  ocrEnabled: true,
  ocrConfig: {
    language: 'eng',
    psm: 6, // Page segmentation mode
    confidenceThreshold: 0.7,
  },
};
```

## Integration Providers

### Supported Providers

- **Accela** - Accela Civic Platform
- **Tyler** - Tyler Technologies
- **GovOS** - GovOS platform
- **Custom** - Custom integrations
- **None** - No provider (manual only)

## Architecture

### Components

- **IntegrationService** - Main service orchestrating all integration tiers
- **BaseAPIClient** - Base class for API integrations
- **AccelaClient** - Accela-specific implementation
- **TylerClient** - Tyler-specific implementation
- **GovOSClient** - GovOS-specific implementation
- **PortalAutomator** - Browser automation for portals
- **ManualEntryService** - Manual entry interface
- **DocumentProcessor** - OCR document processing
- **EmailParser** - Email parsing for status updates

### Integration Flow

1. **Primary Tier Attempt** - Try the configured primary integration tier
2. **Retry Logic** - Retry with exponential backoff if failed
3. **Fallback Tier** - Attempt fallback tier if primary fails
4. **Logging** - Log all attempts and results
5. **Health Update** - Update health metrics

## Error Handling

The service includes comprehensive error handling:

- Automatic retries with exponential backoff
- Tier fallback on failure
- Detailed error logging
- Health status tracking

## Dependencies

- `axios` - HTTP client
- `puppeteer` - Browser automation
- `tesseract.js` - OCR processing
- `pdf-lib` - PDF manipulation
- `jsonwebtoken` - JWT handling
- `@prisma/client` - Database access (peer dependency)

## License

Proprietary - Kealee Platform
