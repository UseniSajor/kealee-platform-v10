# KEALEE COMMAND CENTER - TRAINING MANUAL
## Quick Start Guide for All 14 Mini-Apps

**Base URL:** `http://localhost:3001/api/v1`

---

## SETUP (One-Time)

### Step 1: Start Redis
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Step 2: Configure Environment
```bash
cd services/command-center
cp .env.example .env
# Edit .env with your API keys
```

### Step 3: Install Dependencies
```bash
pnpm install
```

### Step 4: Start Gateway
```bash
pnpm run dev
```

### Step 5: Start Workers (Separate Terminal)
```bash
pnpm run dev:workers
```

---

## APP-01: CONTRACTOR BID ENGINE
*Automates bid requests, contractor matching, and bid analysis*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Create bid request | `POST /bids` with project details |
| 2 | Get matched contractors | `GET /bids/{id}/matches` |
| 3 | Send invitations | `POST /bids/{id}/invite` |
| 4 | Review received bids | `GET /bids/{id}/submissions` |
| 5 | Award contract | `POST /bids/{id}/award` |

**Example - Create Bid Request:**
```bash
curl -X POST http://localhost:3001/api/v1/bids \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","tradeType":"ELECTRICAL","scope":"Complete electrical rough-in"}'
```

---

## APP-02: SITE VISIT SCHEDULER
*Calendar management with route optimization and weather-aware scheduling*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get PM availability | `GET /visits/availability/{pmId}` |
| 2 | Schedule visit | `POST /visits` with date and project |
| 3 | Check weather impact | `POST /visits/{id}/weather-check` |
| 4 | Optimize route | `POST /visits/optimize-route` |
| 5 | Confirm visit | `POST /visits/{id}/confirm` |

**Example - Schedule Visit:**
```bash
curl -X POST http://localhost:3001/api/v1/visits \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","date":"2026-02-15","purpose":"Foundation inspection"}'
```

---

## APP-03: CHANGE ORDER PROCESSOR
*AI-powered impact analysis and approval workflows*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Submit change order | `POST /change-orders` |
| 2 | Review AI impact analysis | `GET /change-orders/{id}/analysis` |
| 3 | Route for approval | `POST /change-orders/{id}/submit-approval` |
| 4 | Check approval status | `GET /change-orders/{id}/status` |
| 5 | Execute approved CO | `POST /change-orders/{id}/execute` |

**Example - Submit Change Order:**
```bash
curl -X POST http://localhost:3001/api/v1/change-orders \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","description":"Add 4 outlets","amount":2500}'
```

---

## APP-04: REPORT GENERATOR
*Daily, weekly, and monthly reports with AI narratives*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Generate daily report | `POST /reports/daily` |
| 2 | Generate weekly summary | `POST /reports/weekly` |
| 3 | Get report with AI narrative | `GET /reports/{id}` |
| 4 | Schedule recurring reports | `POST /reports/schedule` |
| 5 | Distribute report | `POST /reports/{id}/send` |

**Example - Generate Daily Report:**
```bash
curl -X POST http://localhost:3001/api/v1/reports/daily \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","date":"2026-01-27"}'
```

---

## APP-05: PERMIT TRACKER
*Automated permit tracking and renewal management*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Create permit record | `POST /permits` |
| 2 | Submit application | `POST /permits/{id}/submit` |
| 3 | Check status | `POST /permits/{id}/check-status` |
| 4 | View timeline | `GET /permits/{id}/timeline` |
| 5 | Get expiring permits | `GET /permits/expiring?days=30` |

**Example - Create Permit:**
```bash
curl -X POST http://localhost:3001/api/v1/permits \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","type":"BUILDING","jurisdiction":"LOS_ANGELES"}'
```

---

## APP-06: INSPECTION COORDINATOR
*Scheduling, checklists, and preparation tracking*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get checklist template | `GET /inspections/templates/checklist/{type}` |
| 2 | Schedule inspection | `POST /inspections` |
| 3 | Check readiness | `GET /inspections/{id}/readiness` |
| 4 | Record result | `POST /inspections/{id}/result` |
| 5 | View inspection sequence | `GET /inspections/templates/sequence/{projectType}` |

**Example - Get Checklist:**
```bash
curl http://localhost:3001/api/v1/inspections/templates/checklist/FRAMING
```

---

## APP-07: BUDGET TRACKER
*Variance detection, alerts, and cash flow projections*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get budget summary | `GET /budget/projects/{projectId}` |
| 2 | View by category | `GET /budget/projects/{projectId}/categories` |
| 3 | Check cash flow | `GET /budget/projects/{projectId}/cash-flow` |
| 4 | View alerts | `GET /budget/projects/{projectId}/alerts` |
| 5 | Create snapshot | `POST /budget/projects/{projectId}/snapshot` |

**Example - Get Budget:**
```bash
curl http://localhost:3001/api/v1/budget/projects/proj-123
```

---

## APP-08: COMMUNICATION HUB
*Centralized email, SMS, and notification management*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Send message | `POST /communications/send` |
| 2 | Use template | `POST /communications/send-templated` |
| 3 | Broadcast to group | `POST /communications/broadcast` |
| 4 | View notifications | `GET /communications/notifications/{userId}` |
| 5 | Update preferences | `PUT /communications/preferences/{userId}` |

**Example - Send Message:**
```bash
curl -X POST http://localhost:3001/api/v1/communications/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","recipientEmail":"pm@example.com","subject":"Update","body":"Project update..."}'
```

---

## APP-09: TASK QUEUE MANAGER
*Priority scoring, auto-assignment, and escalation*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get PM queue | `GET /tasks/pm/{pmId}` |
| 2 | Create task | `POST /tasks` |
| 3 | Assign task | `POST /tasks/{id}/assign` |
| 4 | Complete task | `POST /tasks/{id}/complete` |
| 5 | View dashboard | `GET /tasks/dashboard/metrics` |

**Example - Create Task:**
```bash
curl -X POST http://localhost:3001/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","title":"Review submittals","priority":"high"}'
```

---

## APP-10: DOCUMENT GENERATOR
*Contracts, punch lists, meeting minutes, and reports*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Generate punch list | `POST /documents/punch-list` |
| 2 | Generate daily report | `POST /documents/daily-report` |
| 3 | Generate meeting minutes | `POST /documents/meeting-minutes` |
| 4 | Approve document | `POST /documents/{id}/approve` |
| 5 | Send document | `POST /documents/{id}/send` |

**Example - Generate Punch List:**
```bash
curl -X POST http://localhost:3001/api/v1/documents/punch-list \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","items":[{"location":"Kitchen","description":"Touch up paint","trade":"Painting","priority":"low"}]}'
```

---

## APP-11: PREDICTIVE ENGINE (AI)
*Delay, cost overrun, and quality risk predictions*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get all predictions | `GET /ai/predictions/projects/{projectId}` |
| 2 | Run delay prediction | `POST /ai/predictions/projects/{projectId}/predict/delay` |
| 3 | Run cost prediction | `POST /ai/predictions/projects/{projectId}/predict/cost` |
| 4 | Run quality prediction | `POST /ai/predictions/projects/{projectId}/predict/quality` |
| 5 | View risk summary | `GET /ai/predictions/projects/{projectId}/risk-summary` |

**Example - Predict Delays:**
```bash
curl -X POST http://localhost:3001/api/v1/ai/predictions/projects/proj-123/predict/delay
```

---

## APP-12: SMART SCHEDULER (AI)
*AI schedule optimization and conflict resolution*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Analyze schedule | `GET /scheduler/projects/{projectId}/analyze` |
| 2 | Optimize schedule | `POST /scheduler/projects/{projectId}/optimize` |
| 3 | Check weather impact | `POST /scheduler/projects/{projectId}/weather-impact` |
| 4 | Detect conflicts | `GET /scheduler/projects/{projectId}/conflicts` |
| 5 | Get lookahead | `GET /scheduler/projects/{projectId}/lookahead?weeks=3` |

**Example - Analyze Schedule:**
```bash
curl http://localhost:3001/api/v1/scheduler/projects/proj-123/analyze
```

---

## APP-13: QA INSPECTOR (AI)
*Photo analysis, checklist automation, quality trends*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get QA checklist | `GET /qa/templates/checklist/{trade}` |
| 2 | Create inspection | `POST /qa` |
| 3 | Add photo for analysis | `POST /qa/{id}/photos` |
| 4 | Run AI inspection | `POST /qa/{id}/run` |
| 5 | View quality trends | `GET /qa/projects/{projectId}/trends` |

**Example - Get QA Checklist:**
```bash
curl http://localhost:3001/api/v1/qa/templates/checklist/ELECTRICAL
```

---

## APP-14: DECISION SUPPORT (AI)
*AI recommendations, project health scoring, insights*

| Step | Action | Endpoint |
|------|--------|----------|
| 1 | Get decision types | `GET /decisions/types` |
| 2 | Request decision support | `POST /decisions` |
| 3 | View AI options | `GET /decisions/{id}` |
| 4 | Accept recommendation | `POST /decisions/{id}/accept` |
| 5 | Get project dashboard | `GET /decisions/projects/{projectId}/dashboard` |

**Example - Get Decision Types:**
```bash
curl http://localhost:3001/api/v1/decisions/types
```

---

## DASHBOARD & MONITORING

### Health Check
```bash
curl http://localhost:3001/health
```

### Queue Metrics
```bash
curl http://localhost:3001/metrics/queues
```

### Platform Dashboard
```bash
curl http://localhost:3001/api/v1/decisions/platform/dashboard
```

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Redis connection error | Ensure Redis is running on port 6379 |
| Prisma error | Run `pnpm prisma generate` in packages/database |
| Port in use | Change PORT in .env file |
| API key missing | Add required keys to .env file |

---

## REQUIRED API KEYS

| Service | Environment Variable | Get Key At |
|---------|---------------------|------------|
| Claude AI | `ANTHROPIC_API_KEY` | console.anthropic.com |
| SendGrid | `SENDGRID_API_KEY` | sendgrid.com |
| Twilio | `TWILIO_*` | twilio.com |
| Google Maps | `GOOGLE_MAPS_API_KEY` | console.cloud.google.com |
| OpenWeather | `OPENWEATHER_API_KEY` | openweathermap.org |

---

*Kealee Command Center v1.0.0 - Training Manual*
