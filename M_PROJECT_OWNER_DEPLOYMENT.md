# m-project-owner Deployment Guide - DocuSign & Payment Integration

## Overview

This guide covers completing DocuSign integration, payment processing, and testing end-to-end workflows in m-project-owner.

---

## Current Status

### Backend API
- ✅ DocuSign service: `services/api/src/modules/docusign/docusign.service.ts`
- ✅ DocuSign routes: `services/api/src/modules/docusign/docusign.routes.ts`
- ✅ Payment service: `services/api/src/modules/payments/payment.service.ts`
- ✅ Payment routes: `services/api/src/modules/payments/payment.routes.ts`

### Frontend (m-project-owner)
- ⚠️ Need to verify DocuSign components are connected
- ⚠️ Need to verify payment components are connected
- ⚠️ Need to test end-to-end workflows

---

## 1. DocuSign Integration

### Backend API Endpoints

#### Create Envelope
```bash
POST /docusign/envelopes
Authorization: Bearer <token>
Content-Type: application/json

{
  "templateId": "template-uuid",
  "documentContent": "<html>Contract terms...</html>",
  "documentName": "Project Contract",
  "recipientEmail": "contractor@example.com",
  "recipientName": "John Contractor",
  "emailSubject": "Please sign contract",
  "emailBlurb": "Please review and sign the contract",
  "embeddedSigning": true,
  "returnUrl": "https://app.kealee.com/contracts/signed",
  "contractId": "contract-uuid"
}
```

Response:
```json
{
  "envelopeId": "envelope-uuid",
  "recipientViewUrl": "https://demo.docusign.net/...",
  "status": "sent"
}
```

#### Get Envelope Status
```bash
GET /docusign/envelopes/:envelopeId/status
Authorization: Bearer <token>
```

#### Handle Callback
```bash
GET /docusign/callback?event=signing_complete&envelopeId=envelope-uuid
```

### Frontend Implementation

#### DocuSign Component

```typescript
// apps/m-project-owner/components/DocuSignIntegration.tsx
'use client';

import { useState } from 'react';

export function DocuSignIntegration({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);

  async function sendForSignature() {
    setLoading(true);
    try {
      const response = await fetch('/api/docusign/envelopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          recipientEmail: 'contractor@example.com',
          recipientName: 'John Contractor',
          embeddedSigning: true,
          returnUrl: `${window.location.origin}/contracts/${contractId}/signed`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create envelope');

      const data = await response.json();
      setEnvelopeId(data.envelopeId);

      // If embedded signing, redirect to signing URL
      if (data.recipientViewUrl) {
        window.location.href = data.recipientViewUrl;
      }
    } catch (error) {
      console.error('DocuSign error:', error);
      alert('Failed to send for signature');
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    if (!envelopeId) return;

    try {
      const response = await fetch(`/api/docusign/envelopes/${envelopeId}/status`);
      const data = await response.json();

      if (data.status === 'completed') {
        alert('Contract signed!');
        // Refresh contract data
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  }

  return (
    <div>
      <button onClick={sendForSignature} disabled={loading}>
        {loading ? 'Sending...' : 'Send for Signature'}
      </button>
      {envelopeId && (
        <div>
          <p>Envelope ID: {envelopeId}</p>
          <button onClick={checkStatus}>Check Status</button>
        </div>
      )}
    </div>
  );
}
```

#### Frontend API Route

```typescript
// apps/m-project-owner/app/api/docusign/envelopes/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookies = request.cookies;
  return cookies.get('sb-access-token')?.value || null;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/docusign/envelopes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'DocuSign error' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 2. Payment Processing Integration

### Backend API Endpoints

#### Create Payment Intent
```bash
POST /payments/intents
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 10000.00,
  "currency": "usd",
  "description": "Project payment - Milestone 1",
  "customerId": "cus_...",
  "paymentMethodId": "pm_...",
  "savePaymentMethod": true,
  "metadata": {
    "projectId": "project-uuid",
    "milestoneId": "milestone-uuid"
  }
}
```

#### Get Payment History
```bash
GET /payments?projectId=project-uuid&status=succeeded
Authorization: Bearer <token>
```

### Frontend Implementation

#### Payment Component

```typescript
// apps/m-project-owner/components/PaymentProcessing.tsx
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentProcessing({ projectId, amount }: { projectId: string; amount: number }) {
  const [loading, setLoading] = useState(false);

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm projectId={projectId} amount={amount} />
    </Elements>
  );
}

function PaymentForm({ projectId, amount }: { projectId: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Create payment method
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (pmError) throw pmError;

      // Create payment intent
      const response = await fetch('/api/payments/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'usd',
          description: `Project payment - ${projectId}`,
          paymentMethodId: paymentMethod.id,
          savePaymentMethod: true,
          metadata: { projectId },
        }),
      });

      if (!response.ok) throw new Error('Payment failed');

      const { clientSecret, requiresAction } = await response.json();

      if (requiresAction) {
        // Handle 3D Secure
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) throw confirmError;
      }

      alert('Payment successful!');
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
```

---

## 3. End-to-End Workflow Testing

### Workflow 1: Contract Signing & Payment

#### Step 1: Create Contract
```bash
POST /contracts
{
  "projectId": "project-uuid",
  "contractorId": "contractor-uuid",
  "terms": "Contract terms...",
  "amount": 50000.00
}
```

#### Step 2: Send for Signature
```bash
POST /docusign/envelopes
{
  "contractId": "contract-uuid",
  "recipientEmail": "contractor@example.com",
  "recipientName": "John Contractor"
}
```

#### Step 3: Verify Signature
- Check DocuSign callback received
- Verify contract status updated to "ACTIVE"
- Verify project status updated

#### Step 4: Process Payment
```bash
POST /payments/intents
{
  "amount": 50000.00,
  "currency": "usd",
  "description": "Contract payment",
  "metadata": {
    "contractId": "contract-uuid"
  }
}
```

#### Step 5: Verify Payment
- Check payment record created
- Verify payment status is "succeeded"
- Verify project payment status updated

### Workflow 2: Milestone Payment

#### Step 1: Create Milestone
```bash
POST /projects/:projectId/milestones
{
  "name": "Foundation Complete",
  "amount": 10000.00,
  "dueDate": "2024-02-01"
}
```

#### Step 2: Mark Milestone Complete
```bash
POST /projects/:projectId/milestones/:milestoneId/complete
{
  "completedAt": "2024-01-25T10:00:00Z"
}
```

#### Step 3: Process Payment
```bash
POST /payments/intents
{
  "amount": 10000.00,
  "metadata": {
    "milestoneId": "milestone-uuid"
  }
}
```

#### Step 4: Verify Payment
- Check milestone payment status
- Verify funds released
- Check payment history

---

## 4. Testing Checklist

### DocuSign Integration

- [ ] Create envelope
- [ ] Send for signature
- [ ] Receive callback
- [ ] Verify contract status updated
- [ ] Test embedded signing
- [ ] Test remote signing
- [ ] Handle signing errors
- [ ] Test envelope status check

### Payment Processing

- [ ] Create payment intent
- [ ] Process payment with card
- [ ] Handle 3D Secure
- [ ] Save payment method
- [ ] List payment methods
- [ ] Set default payment method
- [ ] Delete payment method
- [ ] Get payment history
- [ ] Handle payment errors

### End-to-End Workflows

- [ ] Contract creation → Signature → Payment
- [ ] Milestone completion → Payment
- [ ] Payment method management
- [ ] Payment history tracking
- [ ] Error handling and recovery

---

## 5. Deployment Checklist

### Pre-Deployment

- [ ] DocuSign credentials configured
- [ ] Stripe keys configured
- [ ] Environment variables set
- [ ] API routes created
- [ ] UI components connected
- [ ] Error handling implemented

### Deployment Steps

1. **Configure DocuSign**
   ```env
   DOCUSIGN_INTEGRATION_KEY=your_key
   DOCUSIGN_USER_ID=your_user_id
   DOCUSIGN_ACCOUNT_ID=your_account_id
   DOCUSIGN_RSA_PRIVATE_KEY=your_private_key
   DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
   ```

2. **Configure Stripe**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. **Deploy Backend API**
   ```bash
   cd services/api
   # Deploy to Railway/your platform
   ```

4. **Deploy Frontend**
   ```bash
   cd apps/m-project-owner
   npm run deploy:production
   ```

### Post-Deployment Testing

- [ ] Test DocuSign envelope creation
- [ ] Test contract signing flow
- [ ] Test payment processing
- [ ] Test end-to-end workflows
- [ ] Verify webhook callbacks
- [ ] Check error handling
- [ ] Monitor logs

---

## 6. Monitoring

### Key Metrics

1. **DocuSign Success Rate**
   - Monitor envelope creation
   - Track signing completion
   - Check callback processing

2. **Payment Success Rate**
   - Monitor payment intents
   - Track successful payments
   - Check failed payments

3. **Workflow Completion**
   - Track contract → payment flow
   - Monitor milestone payments
   - Check payment method usage

---

## 7. Troubleshooting

### Common Issues

1. **DocuSign Authentication Failed**
   - Check integration key
   - Verify RSA private key format
   - Check account ID

2. **Payment Processing Failed**
   - Verify Stripe keys
   - Check payment method validity
   - Review error logs

3. **Webhook Callbacks Not Received**
   - Check callback URL configuration
   - Verify webhook endpoint accessible
   - Check signature verification

---

## Next Steps

1. Complete DocuSign UI integration
2. Complete payment UI integration
3. Test contract signing flow
4. Test payment processing
5. Test end-to-end workflows
6. Deploy to staging
7. Perform comprehensive testing
8. Deploy to production
