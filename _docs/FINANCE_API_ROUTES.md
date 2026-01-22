# Finance & Trust Hub API Routes

Complete documentation for all Finance & Trust Hub (Stage 5) API endpoints.

**Last Updated:** 2026-01-22

---

## 📊 Analytics API (6 Endpoints)

**Base Path:** `/api/analytics`  
**Authentication:** Required (ADMIN or FINANCE roles)

### 1. Revenue Forecasting
```
GET /api/analytics/revenue-forecast
```

**Description:** AI-powered revenue forecasting with historical analysis and predictions.

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2026-01",
      "totalRevenue": 125000,
      "platformFees": 87500,
      "processingFees": 37500,
      "growthRate": 15.5,
      "forecast": {
        "next30Days": 135000,
        "next60Days": 145000,
        "next90Days": 155000,
        "confidence": "HIGH"
      }
    }
  ],
  "meta": {
    "generated": "2026-01-22T10:00:00Z",
    "period": {
      "startDate": "2025-12-01",
      "endDate": "2026-01-22"
    }
  }
}
```

**Use Cases:**
- Monthly financial planning
- Investor reporting
- Capacity planning
- Budget forecasting

---

### 2. Churn Prediction
```
GET /api/analytics/churn-prediction
```

**Description:** Predict contractor churn and identify at-risk users using ML models.

**Query Parameters:**
- `period` (required): Format `YYYY-MM`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2026-01",
    "totalContractors": 450,
    "activeContractors": 425,
    "churnedContractors": 25,
    "churnRate": 0.0556,
    "atRiskContractors": [
      {
        "contractorId": "user-123",
        "riskScore": 0.85,
        "riskFactors": [
          "Declining activity",
          "No recent contracts",
          "Failed payout last month"
        ],
        "lastActivity": "2025-12-15T10:00:00Z"
      }
    ]
  },
  "insights": {
    "churnRate": "5.56%",
    "atRiskCount": 12,
    "recommendation": "Churn rate is healthy."
  }
}
```

**Use Cases:**
- Retention campaigns
- Proactive support outreach
- Product improvement insights

---

### 3. Fraud Detection
```
POST /api/analytics/fraud-detection
```

**Description:** Real-time fraud detection for transactions using anomaly detection.

**Request Body:**
```json
{
  "transactionId": "txn-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-abc123",
    "userId": "user-456",
    "amount": 50000,
    "riskScore": 0.75,
    "riskLevel": "HIGH",
    "anomalies": [
      "Unusual transaction amount",
      "High transaction velocity",
      "Unusual time of day"
    ],
    "recommendation": "REVIEW",
    "detectedAt": "2026-01-22T10:30:00Z"
  },
  "action": {
    "required": true,
    "message": "Transaction requires manual review"
  }
}
```

**Risk Levels:**
- `LOW` (0-0.3): Auto-approve
- `MEDIUM` (0.3-0.6): Review
- `HIGH` (0.6-0.8): Review
- `CRITICAL` (0.8-1.0): Block

---

### 4. Cash Flow Projection
```
GET /api/analytics/cash-flow-projection
```

**Description:** Project future cash flow based on scheduled payments and historical patterns.

**Query Parameters:**
- `days` (optional): Number of days to project (1-365, default: 90)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-23",
      "projectedInflow": 25000,
      "projectedOutflow": 18000,
      "netCashFlow": 7000,
      "runningBalance": 150000,
      "confidence": 0.8
    }
  ],
  "insights": {
    "negativeDaysCount": 0,
    "lowestProjectedBalance": 142000,
    "alert": "Cash flow is healthy"
  }
}
```

---

### 5. ROI by Channel
```
GET /api/analytics/roi-by-channel
```

**Description:** Calculate marketing ROI by acquisition channel.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "channel": "PAID_SEARCH",
      "customerCount": 120,
      "acquisitionCost": 416.67,
      "lifetimeValue": 2500,
      "roi": 500,
      "paybackPeriod": 2.4
    }
  ],
  "summary": {
    "totalCustomers": 450,
    "totalAcquisitionCost": 175000,
    "totalLTV": 1125000,
    "overallROI": "542.86%",
    "bestChannel": "PAID_SEARCH"
  }
}
```

---

### 6. Dashboard Summary
```
GET /api/analytics/dashboard-summary
```

**Description:** Quick metrics for admin dashboard (real-time).

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMonthRevenue": 125000,
    "projectedNextMonthRevenue": 135000,
    "revenueGrowthRate": 15.5,
    "cashFlowHealth": "HEALTHY",
    "projectedCashBalance": 155000
  },
  "generated": "2026-01-22T10:00:00Z"
}
```

---

## 🛡️ Compliance API (7 Endpoints)

**Base Path:** `/api/compliance`  
**Authentication:** Required (varies by endpoint)

### 1. Get State Compliance Rules
```
GET /api/compliance/rules/:state
```

**Description:** Retrieve state-specific escrow and licensing compliance rules.

**Path Parameters:**
- `state` (required): 2-letter state code (e.g., "CA", "TX", "NY")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rule-CA-0",
      "ruleType": "STATE_ESCROW",
      "jurisdiction": "CA",
      "ruleDescription": "California requires CSLB license for contractors",
      "requirements": {
        "licenseType": "CSLB",
        "minimumBond": 25000,
        "insuranceRequired": true,
        "minimumInsurance": 1000000
      },
      "effectiveDate": "2026-01-01T00:00:00Z",
      "isActive": true,
      "severity": "CRITICAL"
    }
  ],
  "state": "CA"
}
```

---

### 2. Run Compliance Check
```
POST /api/compliance/check
```

**Description:** Run comprehensive compliance check for a user.

**Roles:** ADMIN, COMPLIANCE

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "check-license-user-123",
      "userId": "user-123",
      "ruleId": "rule-license-001",
      "checkType": "LICENSE_VALIDATION",
      "checkStatus": "PASS",
      "checkDate": "2026-01-22T10:00:00Z",
      "performedBy": "SYSTEM"
    },
    {
      "id": "check-insurance-user-123",
      "userId": "user-123",
      "ruleId": "rule-insurance-001",
      "checkType": "INSURANCE_VALIDATION",
      "checkStatus": "FAIL",
      "checkDate": "2026-01-22T10:00:00Z",
      "failureReason": "No valid insurance with minimum $1M coverage",
      "performedBy": "SYSTEM"
    }
  ],
  "summary": {
    "total": 4,
    "passed": 3,
    "failed": 1,
    "pending": 0
  },
  "overallStatus": "NON_COMPLIANT"
}
```

---

### 3. Validate License
```
POST /api/compliance/validate-license
```

**Description:** Validate contractor license with state licensing board.

**Request Body:**
```json
{
  "userId": "user-123",
  "licenseNumber": "CA-12345",
  "state": "CA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "licenseType": "CA_CONTRACTOR",
    "licenseNumber": "CA-12345",
    "issuingAuthority": "California Contractors State License Board",
    "state": "CA",
    "status": "ACTIVE",
    "issueDate": "2020-01-01T00:00:00Z",
    "expirationDate": "2026-12-31T00:00:00Z",
    "verifiedAt": "2026-01-22T10:00:00Z",
    "verificationSource": "STATE_API"
  },
  "isValid": true
}
```

---

### 4. Validate Insurance
```
POST /api/compliance/validate-insurance
```

**Description:** Validate insurance certificate.

**Request Body:**
```json
{
  "userId": "user-123",
  "policyNumber": "POL-123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "insuranceType": "GENERAL_LIABILITY",
    "carrier": "State Farm",
    "policyNumber": "POL-123456",
    "coverageAmount": 2000000,
    "effectiveDate": "2026-01-01T00:00:00Z",
    "expirationDate": "2026-12-31T00:00:00Z",
    "status": "ACTIVE",
    "verifiedAt": "2026-01-22T10:00:00Z"
  },
  "isValid": true
}
```

---

### 5. Check Bond Requirements
```
POST /api/compliance/check-bond-requirements
```

**Description:** Check if contractor bond meets contract requirements.

**Request Body:**
```json
{
  "contractId": "contract-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "required": true,
    "minimumAmount": 100000,
    "currentAmount": 50000,
    "isSufficient": false
  },
  "alert": "Bond amount insufficient. Required: $100000, Current: $50000"
}
```

---

### 6. Get Active Alerts
```
GET /api/compliance/alerts
```

**Description:** Retrieve active compliance alerts.

**Roles:** ADMIN, COMPLIANCE

**Query Parameters:**
- `userId` (optional): Filter by user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-license-CA-12345",
      "alertType": "LICENSE_EXPIRING",
      "severity": "CRITICAL",
      "userId": "user-123",
      "message": "License CA-12345 expires in 15 days",
      "dueDate": "2026-02-06T00:00:00Z",
      "status": "OPEN",
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ],
  "summary": {
    "total": 67,
    "critical": 5,
    "high": 18,
    "medium": 32,
    "low": 12
  }
}
```

---

### 7. Generate Compliance Report
```
GET /api/compliance/report
```

**Description:** Generate comprehensive compliance report for auditors.

**Roles:** ADMIN, COMPLIANCE

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-31T00:00:00Z"
    },
    "summary": {
      "totalChecks": 1250,
      "passedChecks": 1180,
      "failedChecks": 45,
      "pendingChecks": 25,
      "complianceRate": 94.4
    },
    "alerts": {
      "total": 67,
      "bySeverity": {
        "CRITICAL": 5,
        "HIGH": 18,
        "MEDIUM": 32,
        "LOW": 12
      },
      "byType": {
        "LICENSE_EXPIRING": 23,
        "INSURANCE_LAPSING": 15,
        "BOND_INSUFFICIENT": 8,
        "DOCUMENT_REQUIRED": 21
      }
    },
    "recommendations": [
      "Implement automated license renewal reminders 90 days before expiration",
      "Require insurance certificate uploads at contract signing"
    ]
  },
  "generated": "2026-01-22T10:00:00Z"
}
```

---

## 📝 Audit API (9 Endpoints)

**Base Path:** `/api/audit`  
**Authentication:** Required (varies by endpoint)

### 1. Create Audit Log
```
POST /api/audit/log
```

**Description:** Create immutable audit log entry.

**Roles:** ADMIN, SYSTEM

**Request Body:**
```json
{
  "userId": "user-123",
  "action": "UPDATE",
  "entityType": "CONTRACT",
  "entityId": "contract-456",
  "changes": {
    "status": {"from": "DRAFT", "to": "ACTIVE"}
  },
  "metadata": {
    "reason": "Contract signed by both parties"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "audit-1234567890",
    "userId": "user-123",
    "action": "UPDATE",
    "entityType": "CONTRACT",
    "entityId": "contract-456",
    "changes": {
      "status": {"from": "DRAFT", "to": "ACTIVE"}
    },
    "metadata": {
      "reason": "Contract signed by both parties"
    },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2026-01-22T10:00:00Z"
  },
  "message": "Audit log created"
}
```

---

### 2. Log User Activity
```
POST /api/audit/activity
```

**Description:** Log user activity event.

**Request Body:**
```json
{
  "userId": "user-123",
  "activityType": "CONTRACT_VIEWED",
  "description": "Viewed contract CNT-001",
  "metadata": {
    "contractId": "CNT-001"
  }
}
```

---

### 3. Track Field Change
```
POST /api/audit/track-change
```

**Description:** Track field-level changes for detailed audit trail.

**Roles:** ADMIN, SYSTEM

**Request Body:**
```json
{
  "entityType": "CONTRACT",
  "entityId": "contract-123",
  "field": "totalAmount",
  "oldValue": 50000,
  "newValue": 55000,
  "changedBy": "user-456",
  "reason": "Change order approved"
}
```

---

### 4. Get Audit Trail
```
GET /api/audit/trail/:entityType/:entityId
```

**Description:** Get complete audit trail for an entity.

**Path Parameters:**
- `entityType`: Entity type (e.g., "CONTRACT", "ESCROW")
- `entityId`: Entity ID

---

### 5. Get User Activity
```
GET /api/audit/activity/:userId
```

**Description:** Get user activity history.

**Query Parameters:**
- `activityType` (optional): Filter by activity type
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Max results (1-100, default: 50)

---

### 6. Get Change History
```
GET /api/audit/changes/:entityType/:entityId
```

**Description:** Get field-level change history for an entity.

---

### 7. Search Audit Logs
```
GET /api/audit/search
```

**Description:** Search audit logs with filters.

**Roles:** ADMIN, COMPLIANCE

**Query Parameters:**
- `userId` (optional)
- `action` (optional)
- `entityType` (optional)
- `entityId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `limit` (optional): 1-100, default: 50
- `offset` (optional): Default: 0

---

### 8. Generate Audit Report
```
GET /api/audit/report
```

**Description:** Generate comprehensive audit report.

**Roles:** ADMIN, COMPLIANCE

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string

---

### 9. Verify Log Integrity
```
GET /api/audit/verify/:logId
```

**Description:** Verify audit log hasn't been tampered with (cryptographic verification).

**Roles:** ADMIN, COMPLIANCE

**Path Parameters:**
- `logId`: Audit log ID

---

## 📊 Summary

### Total API Routes Created: 22

- **Analytics:** 6 endpoints
- **Compliance:** 7 endpoints
- **Audit:** 9 endpoints

### Authentication & Authorization

All endpoints require authentication. Role-based access control:

- **Public:** None
- **Authenticated Users:** Activity logging, trail viewing (own data)
- **FINANCE Role:** All analytics endpoints
- **COMPLIANCE Role:** Compliance checks and reports
- **ADMIN Role:** Full access to all endpoints
- **SYSTEM Role:** Internal service calls (audit logging)

### Rate Limiting

All endpoints are subject to global rate limiting:
- **Standard:** 100 requests/15 minutes
- **Admin:** 500 requests/15 minutes

### Error Responses

Standard error format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad request / validation error
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error

---

## 🚀 Testing

### Postman Collection

Import the Postman collection for testing:
```bash
# Collection available at:
/_docs/postman/Finance_API_Routes.postman_collection.json
```

### Sample cURL Commands

**Revenue Forecast:**
```bash
curl -X GET "http://localhost:5000/api/analytics/revenue-forecast?startDate=2026-01-01&endDate=2026-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Compliance Check:**
```bash
curl -X POST "http://localhost:5000/api/compliance/check" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

**Audit Log:**
```bash
curl -X POST "http://localhost:5000/api/audit/log" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "action": "CREATE",
    "entityType": "CONTRACT",
    "entityId": "contract-456"
  }'
```

---

## 📚 Related Documentation

- [Double-Entry Accounting System](./_docs/DOUBLE_ENTRY_ACCOUNTING.md)
- [Escrow System Documentation](./_docs/ESCROW_SYSTEM.md)
- [Event-Driven Architecture](./_docs/EVENT_DRIVEN_ARCHITECTURE.md)
- [Atomic Transactions](./_docs/ATOMIC_TRANSACTIONS_UPGRADE.md)

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Review:** 2026-01-22

