# Backend Integrations Guide

Complete guide for backend integrations and additional features.

## ✅ Implemented Integrations

### 1. Google Places API

**Location:** `apps/m-permits-inspections/lib/api/google-places.ts`

**Features:**
- Address autocomplete
- Place details retrieval
- Jurisdiction extraction

**Setup:**
```bash
# Add to .env.local
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Usage:**
```typescript
import { googlePlacesService } from '@/lib/api/google-places';

// Autocomplete
const suggestions = await googlePlacesService.autocomplete('123 Main');

// Get place details
const details = await googlePlacesService.getPlaceDetails(placeId);

// Extract jurisdiction
const jurisdiction = googlePlacesService.extractJurisdiction(details.address_components);
```

### 2. AI Document Review

**Location:** `apps/m-permits-inspections/lib/api/ai-review.ts`

**Features:**
- Document analysis
- Issue detection
- Approval score calculation
- Suggestions generation

**API Endpoint:** `/api/ai/review`

**Usage:**
```typescript
import { aiDocumentReviewService } from '@/lib/api/ai-review';

const result = await aiDocumentReviewService.reviewDocuments(
  files,
  jurisdiction,
  permitTypes
);
```

**TODO:** Integrate with actual AI service (OpenAI, Anthropic, etc.)

### 3. Stripe Payments

**Location:** `apps/m-ops-services/lib/api/stripe.ts`

**Features:**
- Checkout session creation
- Subscription management
- Payment processing

**Setup:**
```bash
# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Usage:**
```typescript
import { stripeService } from '@/lib/api/stripe';

// Create checkout session
const session = await stripeService.createCheckoutSession(
  packageId,
  email,
  name
);

// Redirect to Stripe Checkout
window.location.href = session.url;
```

### 4. S3 Document Upload

**Location:** `apps/m-permits-inspections/app/api/ai/review/route.ts`

**Features:**
- File upload to S3
- Secure file storage
- URL generation

**Setup:**
```bash
# Add to .env.local
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kealee-documents
```

**Usage:**
Files are automatically uploaded when submitting documents through the AI review API.

## ✅ Additional Features

### 1. Status Tracking Page

**Location:** `apps/m-permits-inspections/app/permits/status/[id]/page.tsx`

**Features:**
- Real-time status updates
- Progress tracking
- Document status
- Timeline visualization

**Route:** `/permits/status/[id]`

### 2. Inspection Scheduling

**Location:** `apps/m-permits-inspections/app/permits/schedule/page.tsx`

**Features:**
- Date/time selection
- Inspection type selection
- Special instructions
- Confirmation email

**Route:** `/permits/schedule`

### 3. Email Notifications

**Location:** `apps/m-permits-inspections/lib/services/email.ts`

**Features:**
- Permit confirmation emails
- Status update emails
- Inspection scheduled emails

**Templates:**
- `permit-confirmation`
- `status-update`
- `inspection-scheduled`

**Setup:**
```bash
# Add to .env.local
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@kealee.com
```

## ✅ Testing

### Unit Tests

**Location:** `apps/*/__tests__/components/`

**Run:**
```bash
npm test
```

**Coverage:**
- Component rendering
- User interactions
- Form validation
- Error handling

### Integration Tests

**Location:** `apps/*/__tests__/integration/`

**Run:**
```bash
npm run test:integration
```

**Coverage:**
- Full user flows
- API interactions
- Data validation

### E2E Tests

**Location:** `apps/*/__tests__/e2e/`

**Run:**
```bash
npm run test:e2e
```

**Coverage:**
- Complete user journeys
- Cross-browser testing
- Performance testing

## Next Steps

1. **AI Integration:**
   - Connect to OpenAI/Anthropic API
   - Implement document analysis
   - Add confidence scoring

2. **Stripe Integration:**
   - Complete checkout flow
   - Handle webhooks
   - Manage subscriptions

3. **Email Templates:**
   - Design HTML templates
   - Add branding
   - Test across email clients

4. **Testing:**
   - Increase coverage
   - Add performance tests
   - Set up CI/CD testing
