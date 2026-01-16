# Kealee Platform Worker Service

BullMQ-based worker service for background job processing.

## Features

- ✅ Redis connection management
- ✅ Base queue infrastructure
- ✅ Job retry logic
- ✅ Queue metrics
- ✅ **Email queue with SendGrid integration** (Task 17)
- ✅ **Webhook queue with HTTP delivery** (Task 18)
- ✅ **ML processing queue with Claude API** (Task 19)
- ✅ **Report generation queue with PDF** (Task 20)
- 🔄 Scheduled jobs/cron (Task 21)

## Getting Started

### Prerequisites

- Node.js 20+
- Redis server (local or Upstash)
- pnpm 8+
- SendGrid account (for email queue)
- Anthropic API key (for ML queue)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Redis URL and SendGrid API key
```

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# Or for Upstash:
# REDIS_URL=rediss://default:password@host:port

# SendGrid Configuration (for email queue)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@kealee.com
SENDGRID_FROM_NAME=Kealee Platform

# Optional: Disable test email in development
TEST_EMAIL=false

# Webhook Configuration (optional)
WEBHOOK_SECRET=your_webhook_secret
TEST_WEBHOOK_URL=https://httpbin.org/post
TEST_WEBHOOK=false

# Anthropic Claude API Configuration (for ML queue)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: Disable test ML job in development
TEST_ML=false

# Database (if needed)
DATABASE_URL=postgresql://user:password@localhost:5432/kealee?schema=public
```

### Development

```bash
# Start worker service
pnpm dev

# Build for production
pnpm build

# Start production worker
pnpm start
```

## Queue Infrastructure

### Base Queue

All queues extend `BaseQueue` which provides:
- Automatic retry logic (3 attempts with exponential backoff)
- Job cleanup (completed jobs kept for 24h, failed for 7 days)
- Queue metrics
- Event logging

### Email Queue

The email queue uses SendGrid to send emails asynchronously.

#### Usage

```typescript
import { emailQueue } from '@kealee/worker'

// Send a simple email
await emailQueue.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome</h1><p>Thanks for joining!</p>',
  text: 'Welcome! Thanks for joining!',
})

// Send a templated email
await emailQueue.sendTemplatedEmail(
  'user@example.com',
  'welcome',
  { name: 'John Doe' }
)

// Send email with attachments
await emailQueue.sendEmail({
  to: 'user@example.com',
  subject: 'Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      content: Buffer.from('invoice content').toString('base64'),
      filename: 'invoice.pdf',
      type: 'application/pdf',
    },
  ],
})

// Send email with metadata
await emailQueue.sendEmail({
  to: 'user@example.com',
  subject: 'Project Update',
  html: '<p>Your project has been updated.</p>',
  metadata: {
    userId: 'user-123',
    orgId: 'org-456',
    eventType: 'project.updated',
  },
})
```

#### Available Templates

- `welcome` - Welcome email for new users
- `passwordReset` - Password reset email
- `projectCreated` - Project creation notification

#### Email Queue Configuration

- **Retry attempts:** 5 (more than base queue)
- **Backoff:** Exponential, starting at 5 seconds
- **Concurrency:** 10 emails processed simultaneously
- **Rate limit:** 100 emails per minute
- **Completed jobs:** Kept for 7 days
- **Failed jobs:** Kept for 30 days

### Webhook Queue

The webhook queue delivers HTTP requests to external endpoints asynchronously with automatic retry logic.

#### Usage

```typescript
import { webhookQueue } from '@kealee/worker'

// Send a simple webhook
await webhookQueue.deliverWebhook({
  url: 'https://example.com/webhook',
  method: 'POST',
  body: {
    event: 'user.created',
    userId: 'user-123',
    data: { name: 'John Doe' },
  },
  headers: {
    'X-Custom-Header': 'value',
  },
})

// Send webhook with custom retries
await webhookQueue.deliverWebhookWithRetries(
  'https://example.com/webhook',
  { event: 'project.updated' },
  {
    retries: 10,
    timeout: 60000, // 60 seconds
  }
)

// Send webhook with metadata
await webhookQueue.deliverWebhook({
  url: 'https://example.com/webhook',
  method: 'POST',
  body: { event: 'milestone.approved' },
  metadata: {
    userId: 'user-123',
    orgId: 'org-456',
    eventType: 'milestone.approved',
    webhookId: 'webhook-789',
  },
})
```

#### Webhook Queue Configuration

- **Retry attempts:** 5 (configurable per job)
- **Backoff:** Exponential, starting at 5 seconds
- **Concurrency:** 20 webhooks processed simultaneously
- **Rate limit:** 1000 webhooks per minute
- **Timeout:** 30 seconds (configurable per job)
- **Success criteria:** HTTP status 200-399
- **Completed jobs:** Kept for 7 days
- **Failed jobs:** Kept for 30 days

#### Supported HTTP Methods

- GET
- POST
- PUT
- PATCH
- DELETE

### ML Processing Queue

The ML queue processes jobs using Anthropic's Claude API for AI-powered analysis, recommendations, and insights.

#### Usage

```typescript
import { mlQueue } from '@kealee/worker'

// Process a custom ML job
await mlQueue.processMLJob({
  type: 'analyze_text',
  prompt: 'Analyze this project proposal and provide insights.',
  systemPrompt: 'You are a helpful assistant that analyzes construction projects.',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.7,
  metadata: {
    projectId: 'project-123',
    eventType: 'project.analyze',
  },
})

// Text analysis (convenience method)
await mlQueue.analyzeText(
  'This is a sample text to analyze',
  'sentiment analysis'
)

// Generate recommendations (convenience method)
await mlQueue.generateRecommendation(
  'Project is behind schedule and over budget',
  'cost optimization'
)
```

#### ML Queue Configuration

- **Retry attempts:** 3 (fewer than other queues - ML is expensive)
- **Backoff:** Exponential, starting at 10 seconds
- **Concurrency:** 5 ML jobs processed simultaneously
- **Rate limit:** 50 ML jobs per minute
- **Default model:** claude-3-5-sonnet-20241022
- **Default max tokens:** 4096
- **Default temperature:** 0.7
- **Completed jobs:** Kept for 30 days
- **Failed jobs:** Kept for 7 days

#### Supported ML Job Types

- `analyze_text` - Analyze and provide insights on text
- `generate_recommendation` - Generate actionable recommendations
- `classify_content` - Classify content into categories
- `extract_insights` - Extract insights from data
- `summarize` - Create summaries
- `custom` - Custom ML processing

### Report Generation Queue

The reports queue generates PDF reports asynchronously using PDFKit.

#### Usage

```typescript
import { reportsQueue } from '@kealee/worker'

// Generate a custom report
await reportsQueue.generateReport({
  type: 'weekly_summary',
  title: 'Weekly Summary Report',
  data: {
    summary: 'This week we completed 5 projects.',
    metrics: {
      'Projects Active': 5,
      'Tasks Completed': 23,
      'Revenue': '$12,450',
    },
  },
  format: 'pdf',
  options: {
    pageSize: 'A4',
    orientation: 'portrait',
    includeCharts: true,
    includeTables: true,
  },
  metadata: {
    projectId: 'project-123',
    generatedAt: new Date(),
  },
})

// Generate weekly summary (convenience method)
await reportsQueue.generateWeeklySummary({
  summary: 'Weekly summary text',
  metrics: { active: 5, completed: 23 },
})

// Generate project status (convenience method)
await reportsQueue.generateProjectStatus({
  status: 'In Progress',
  progress: 75,
  milestones: ['Milestone 1', 'Milestone 2'],
})
```

#### Reports Queue Configuration

- **Retry attempts:** 3
- **Backoff:** Exponential, starting at 5 seconds
- **Concurrency:** 3 reports processed simultaneously (CPU intensive)
- **Rate limit:** 100 reports per minute
- **Default format:** PDF
- **Default page size:** A4
- **Default orientation:** Portrait
- **Completed jobs:** Kept for 90 days
- **Failed jobs:** Kept for 7 days

#### Supported Report Types

- `weekly_summary` - Weekly summary reports
- `project_status` - Project status reports
- `financial_summary` - Financial summary reports
- `performance_report` - Performance reports
- `custom` - Custom reports

#### Report Storage

Reports are stored in the `./reports` directory (configurable via `REPORTS_DIR` environment variable). Each report is saved with a timestamped filename.

### Queue Metrics

```typescript
const metrics = await emailQueue.getMetrics()
console.log(metrics)
// { waiting: 5, active: 2, completed: 100, failed: 1, ... }
```

## Project Structure

```
services/worker/
├── src/
│   ├── config/
│   │   └── redis.config.ts    # Redis connection
│   ├── types/
│   │   └── email.types.ts      # Email types and templates
│   ├── queues/
│   │   ├── base.queue.ts       # Base queue class
│   │   ├── email.queue.ts      # Email queue (Task 17)
│   │   ├── webhook.queue.ts    # Webhook queue (Task 18)
│   │   ├── ml.queue.ts         # ML queue (Task 19)
│   │   ├── reports.queue.ts    # Reports queue (Task 20)
│   │   └── index.ts            # Queue exports
│   ├── processors/
│   │   ├── email.processor.ts  # Email worker processor
│   │   ├── webhook.processor.ts # Webhook worker processor
│   │   ├── ml.processor.ts      # ML worker processor
│   │   └── reports.processor.ts # Reports worker processor
│   ├── __tests__/
│   │   ├── queue.test.ts       # Base queue tests
│   │   ├── email.test.ts       # Email queue tests
│   │   ├── webhook.test.ts     # Webhook queue tests
│   │   ├── ml.test.ts          # ML queue tests
│   │   └── reports.test.ts     # Reports queue tests
│   └── index.ts                # Worker entry point
├── package.json
└── tsconfig.json
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Development Mode

When `SENDGRID_API_KEY` is not set, the worker will log emails instead of sending them:

```
📧 [DEV MODE] Email would be sent: {
  to: ['user@example.com'],
  subject: 'Welcome!',
  from: 'Kealee Platform <noreply@kealee.com>'
}
```

This allows you to develop and test without a SendGrid account.

## Next Steps

- Task 21: Create scheduled jobs (cron)
- Task 21: Create scheduled jobs (cron)
