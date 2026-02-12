# Kealee Platform v10 — Revised Build Plan

## Pull Forward: Tier 2 & 3 Elements That Belong at Launch

---

## Why the "Wait" Advice Was Wrong

The typical startup playbook says "launch MVP, iterate later." That logic applies when:
- You're guessing at what customers want
- You have no industry expertise
- You're testing product-market fit
- You can't afford to build more

None of those apply here. You have:
- 20+ years of construction expertise
- Clear knowledge of what breaks in project management
- A specific market (DC-Baltimore corridor)
- A platform that's 98% built

**The real question isn't "can I build this later?" — it's "does waiting cost me clients, reputation, or competitive position?"**

If a client's first experience with Kealee feels like a half-built tool, they won't come back when you add the good stuff. First impression is everything.

---

## What Genuinely Requires Time (Can't Build Now)

These MUST wait because they depend on data you don't have yet:

| Element | Why It Must Wait | When It's Possible |
|---|---|---|
| Fine-tuned ML models (3.5) | Need 10,000+ labeled data points from real projects | After 6-12 months of operation |
| Custom cost prediction model (3.5) | Need hundreds of estimate-vs-actual comparisons | After 12+ months |
| Custom contractor reliability score (3.5) | Need performance data across many projects | After 6-12 months |
| Marketplace network effects (3.8) | Need critical mass of users on both sides | After 50+ active projects |
| Data licensing revenue (3.8) | Need aggregated dataset large enough to sell | After 2+ years |
| White-label licensing (2.6) | Need proven platform before others will license it | After 1+ year of successful operations |
| Smart contract escrow (3.6) | Blockchain adds complexity that slows launch; Stripe works fine initially | Year 2-3, after proving demand |

**Everything else? Build it now.** Here's how.

---

## Revised Prompts 34–45: Tier 2 & 3 Elements for Launch

---

## PROMPT 34 — Observability & Distributed Tracing

**Why now:** When your first paying client says "I never got my report" or "my payment didn't go through," you need to trace it in 30 seconds, not spend 2 hours digging through logs. This is not a scale problem — it's a day-one professionalism problem.

```
Implement distributed tracing and structured observability across the entire Kealee Platform using OpenTelemetry.

═══ PART A: TRACE ID PROPAGATION ═══

FILE: packages/observability/src/tracing.ts

  import { trace, SpanStatusCode, context, propagation } from '@opentelemetry/api';
  import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
  import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
  import { Resource } from '@opentelemetry/resources';

  Initialize OpenTelemetry with:
  - Service name from env (e.g., 'kealee-api', 'kealee-workers')
  - OTLP exporter pointing to process.env.OTEL_ENDPOINT
    (Use Axiom, Grafana Cloud, or self-hosted Jaeger — all have free tiers)
  - BatchSpanProcessor for efficient export
  - Auto-instrumentation for: HTTP, Fastify, Prisma, Redis (ioredis), BullMQ

  EXPORTS:

  export function createSpan(name: string, attributes?: Record<string, string>)
    - Create child span under current context
    - Auto-attach: appId, projectId, userId if available

  export function getTraceId(): string
    - Extract current trace ID from context
    - Used to link logs, events, and jobs

  export function withTracing<T>(name: string, fn: () => Promise<T>, attributes?: Record<string, string>): Promise<T>
    - Wrapper that creates span, runs function, handles errors, ends span
    - Use this to wrap every service method

═══ PART B: INJECT TRACE ID INTO EVERYTHING ═══

FILE: packages/automation/src/infrastructure/queues.ts (UPDATE)

  When creating a BullMQ job, attach traceId to job data:
    queue.add(name, { ...data, _traceId: getTraceId() })

  When processing a job, restore trace context:
    const traceId = job.data._traceId;
    // Create child span linked to original trace

  This means: API request → event → queue job → worker → external API call
  ALL appear as connected spans in ONE trace.

FILE: packages/automation/src/infrastructure/event-bus.ts (UPDATE)

  When publishing an event, attach traceId:
    publish(event, { ...payload, _traceId: getTraceId() })

  When handling an event, restore trace context.

FILE: apps/api/src/middleware/tracing.ts

  Fastify onRequest hook:
  1. Generate or extract traceId from X-Trace-Id header
  2. Attach to request context
  3. Add to all response headers: X-Trace-Id
  4. Create root span for the request

═══ PART C: STRUCTURED LOGGING ═══

FILE: packages/observability/src/logger.ts

  import pino from 'pino';

  Create structured logger that ALWAYS includes:
  - timestamp (ISO 8601)
  - level (debug, info, warn, error, fatal)
  - traceId (from current OpenTelemetry context)
  - service (from env: api, workers, admin, etc.)
  - appId (which Command Center app, if applicable)
  - projectId (if applicable)
  - userId (if applicable)
  - duration (for timed operations)
  - message

  EXPORTS:
  export const logger = createLogger();
  export function createChildLogger(context: { appId?: string; projectId?: string; userId?: string })

  Example output:
  {
    "timestamp": "2026-02-07T14:32:01.234Z",
    "level": "info",
    "traceId": "abc123def456",
    "service": "kealee-workers",
    "appId": "APP-07",
    "projectId": "proj_xyz",
    "message": "Receipt OCR completed",
    "duration": 2340,
    "result": { "vendor": "Home Depot", "amount": 342.50 }
  }

  REPLACE all console.log/console.error in the codebase with logger calls.

═══ PART D: METRICS COLLECTION ═══

FILE: packages/observability/src/metrics.ts

  import { metrics } from '@opentelemetry/api';

  Create meters and instruments:

  COUNTERS:
  - requests_total (by route, method, status)
  - jobs_processed_total (by queue, status: success/failed)
  - events_published_total (by event type)
  - emails_sent_total (by template)
  - sms_sent_total
  - ai_calls_total (by agent: predict, schedule, inspect, decide)

  HISTOGRAMS:
  - request_duration_ms (by route)
  - job_duration_ms (by queue)
  - ai_response_time_ms (by agent)
  - stripe_api_duration_ms
  - db_query_duration_ms

  GAUGES:
  - queue_depth (by queue name) — checked every 30s
  - active_workers (by service)
  - active_projects_total
  - escrow_balance_total
  - circuit_breaker_state (0=closed, 1=open, 2=half-open)

  Export metrics to same OTEL endpoint (Axiom/Grafana handles both traces + metrics).

═══ PART E: HEALTH CHECK ENDPOINT ═══

FILE: apps/api/src/routes/health.ts

  GET /health (public, no auth)
  Returns:
  {
    status: "healthy" | "degraded" | "unhealthy",
    version: "10.0.0",
    uptime: 84623,
    checks: {
      database: { status: "up", latency: 12 },
      redis: { status: "up", latency: 3 },
      stripe: { status: "up", circuit: "closed" },
      anthropic: { status: "up", circuit: "closed" },
      resend: { status: "up", circuit: "closed" },
      twilio: { status: "up", circuit: "closed" },
      queues: {
        "bid-engine": { depth: 2, processing: 1 },
        "communication": { depth: 0, processing: 0 },
        // ... all 14 queues
      }
    }
  }

  GET /health/ready (for Railway/K8s readiness probe)
  GET /health/live (for Railway/K8s liveness probe)

COST: Free tier of Axiom or Grafana Cloud handles this easily for first year.
Axiom: 500GB/month free. Grafana Cloud: 50GB logs + 10K metrics free.
```

---

## PROMPT 35 — Real-Time WebSockets & Live Updates

**Why now:** Clients checking their project status shouldn't have to refresh the page. Contractors shouldn't wait for an email to know their bid was accepted. PMs shouldn't poll dashboards. Real-time is the difference between "feels like a modern app" and "feels like a 2015 portal."

```
Implement real-time communication layer using Supabase Realtime for instant updates across all user dashboards.

═══ PART A: SUPABASE REALTIME CHANNELS ═══

FILE: packages/realtime/src/channels.ts

  Define channel naming conventions:

  USER CHANNELS (private, per user):
    channel: `user:${userId}`
    Events:
    - notification.new → badge update + toast
    - decision.new → decision card appears on PM dashboard
    - bid.received → counter updates on client dashboard
    - payment.received → amount flashes on contractor dashboard
    - message.new → chat bubble + sound

  PROJECT CHANNELS (shared, all project members):
    channel: `project:${projectId}`
    Events:
    - task.updated → task board reflects change instantly
    - milestone.completed → progress bar animates
    - photo.uploaded → photo appears in gallery live
    - budget.updated → budget numbers update live
    - report.generated → report appears in feed
    - schedule.changed → calendar/timeline updates

  ADMIN CHANNELS:
    channel: `admin:command-center`
    Events:
    - alert.new → alert badge + sound
    - health.updated → dashboard metrics refresh
    - dead-letter.new → dead letter count updates
    - queue.depth.changed → queue visualizations update

═══ PART B: SERVER-SIDE BROADCAST ═══

FILE: packages/realtime/src/broadcast.ts

  import { createClient } from '@supabase/supabase-js';

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  export async function broadcastToUser(userId: string, event: string, payload: any)
    supabase.channel(`user:${userId}`).send({
      type: 'broadcast', event, payload
    });

  export async function broadcastToProject(projectId: string, event: string, payload: any)
    // Get all project member userIds
    // Broadcast to project channel
    supabase.channel(`project:${projectId}`).send({
      type: 'broadcast', event, payload
    });

  export async function broadcastToAdmin(event: string, payload: any)
    supabase.channel('admin:command-center').send({
      type: 'broadcast', event, payload
    });

  INTEGRATE INTO EVENT BUS:
  Update packages/automation/src/infrastructure/event-bus.ts to also broadcast
  relevant events via Supabase Realtime whenever an event fires.

  Map Command Center events to realtime broadcasts:
  - 'bid.submitted' → broadcastToUser(clientId, 'bid.received', bidSummary)
  - 'bid.accepted' → broadcastToUser(contractorId, 'bid.accepted', projectInfo)
  - 'milestone.completed' → broadcastToProject(projectId, 'milestone.completed', milestone)
  - 'payment.released' → broadcastToUser(contractorId, 'payment.received', amount)
  - 'site_photo.uploaded' → broadcastToProject(projectId, 'photo.uploaded', photo)
  - 'budget.updated' → broadcastToProject(projectId, 'budget.updated', snapshot)
  - 'report.generated' → broadcastToProject(projectId, 'report.generated', reportLink)
  - 'task.status_changed' → broadcastToProject(projectId, 'task.updated', task)
  - 'alert.created' → broadcastToAdmin('alert.new', alert)

═══ PART C: CLIENT-SIDE HOOKS ═══

FILE: packages/ui/src/hooks/use-realtime.ts

  export function useRealtimeUser(userId: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
      const channel = supabase.channel(`user:${userId}`)
        .on('broadcast', { event: 'notification.new' }, (payload) => {
          setNotifications(prev => [payload, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Show toast notification
          toast({ title: payload.title, description: payload.body });
        })
        .on('broadcast', { event: 'decision.new' }, (payload) => {
          // Add to decision queue in state
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [userId]);

    return { notifications, unreadCount };
  }

  export function useRealtimeProject(projectId: string) {
    // Subscribe to project channel
    // Return live-updating: tasks, budget, photos, timeline
    // Every dashboard component that shows project data uses this hook
  }

  export function useRealtimeAdmin() {
    // Subscribe to admin channel
    // Return live-updating: alerts, queue depths, health metrics
  }

FILE: packages/ui/src/components/notification-bell.tsx
  - Shows unread count badge (red circle)
  - Dropdown with recent notifications
  - Instant update via WebSocket (no polling)
  - Click notification → navigate to relevant page
  - "Mark all read" button

FILE: packages/ui/src/components/live-indicator.tsx
  - Small pulsing green dot that shows "Live"
  - Placed on dashboards to indicate real-time data
  - If WebSocket disconnects → yellow dot + "Reconnecting..."
  - Reassures client that data is current

FILE: packages/ui/src/components/toast-notification.tsx
  - Slide-in toast when real-time event arrives
  - Different styles by type: success (green), info (blue), warning (yellow), urgent (red)
  - Auto-dismiss after 5s (non-urgent) or persist until clicked (urgent)
  - Sound for urgent notifications (payment received, QA issue, decision needed)

═══ PART D: LIVE PROJECT DASHBOARD UPDATES ═══

UPDATE: apps/m-project-owner/app/(dashboard)/projects/[id]/page.tsx

  Instead of static data loaded on page load:
  - Use useRealtimeProject(projectId)
  - Budget numbers update live as receipts are processed
  - Task progress bars animate as tasks complete
  - Photo gallery adds new photos as they're uploaded
  - Timeline shifts as schedule changes happen
  - Activity feed shows new items appearing in real-time

  The client NEVER needs to refresh the page.
  They can leave the dashboard open and watch their project progress live.

UPDATE: apps/os-pm/app/(workspace)/dashboard/page.tsx
  - Decision cards appear in real-time as APP-14 generates them
  - Alert badges update instantly
  - Task counts update as contractors complete work
  - Live queue of what needs attention RIGHT NOW

UPDATE: apps/os-admin/app/(dashboard)/command-center/page.tsx
  - All 15 app health indicators update in real-time
  - Queue depth bars animate
  - Alert toasts pop for CRITICAL/ERROR
  - Dead letter count updates

COST: Included in Supabase plan. Free tier supports 200 concurrent connections.
Pro ($25/mo) supports 500. More than enough for launch.
```

---

## PROMPT 36 — Self-Healing Workers & Auto-Scaling

**Why now:** You're a small team. You can't babysit servers. If a worker crashes on Saturday night, it should fix itself before Monday. This isn't a scale feature — it's a "Tim shouldn't need to wake up at 3am" feature.

```
Implement self-healing patterns, graceful degradation, and auto-recovery for all Command Center workers.

═══ PART A: PROCESS MANAGEMENT ═══

FILE: apps/workers/src/process-manager.ts

  The master worker entry point (Prompt 24) should be enhanced:

  CLASS: ProcessManager

  For each worker:
  1. Track health: last successful job, last heartbeat, error count
  2. If worker hasn't processed a job in expected interval:
     - Bid Engine: 5 minutes (leads come in regularly)
     - Communication: 2 minutes (always sending)
     - Budget Tracker: 15 minutes (receipt-dependent)
     - Predictive Engine: 6 hours (runs daily)
     - etc.
  3. If exceeded → log warning
  4. If exceeded by 3x → attempt worker restart
  5. If restart fails → alert admin, continue other workers

  HEARTBEAT SYSTEM:
  Every worker pings Redis every 30 seconds:
    SET worker:{appId}:heartbeat {timestamp} EX 90

  ProcessManager checks heartbeats every 60 seconds:
    If heartbeat missing → worker may be dead → attempt restart

  GRACEFUL SHUTDOWN:
  On SIGTERM/SIGINT:
  1. Stop accepting new jobs on all queues
  2. Wait for in-progress jobs to complete (max 30s timeout)
  3. Flush all pending logs and metrics
  4. Close database connections
  5. Close Redis connections
  6. Exit cleanly

  On UNCAUGHT EXCEPTION:
  1. Log the error with full stack trace
  2. Attempt to finish current job (5s timeout)
  3. Restart the crashed worker (not the whole process)
  4. Alert admin

═══ PART B: GRACEFUL DEGRADATION ═══

FILE: packages/automation/src/infrastructure/degradation.ts

  CLASS: DegradationManager

  Track which external services are available:
  - Claude API: UP/DOWN
  - Stripe: UP/DOWN
  - Resend (email): UP/DOWN
  - Twilio (SMS): UP/DOWN
  - Supabase Storage: UP/DOWN

  FALLBACK STRATEGIES:

  IF Claude API is down:
    APP-11 Predictive Engine:
      → SKIP daily predictions
      → Use last successful prediction set
      → Log: "Predictions skipped — using last results from [date]"
      → Resume automatically when API recovers

    APP-12 Smart Scheduler:
      → Use simple FIFO scheduling (no AI optimization)
      → Log: "Schedule optimization running in simple mode"

    APP-13 QA Inspector:
      → QUEUE photos for later analysis (don't discard)
      → Add to 'qa-pending-ai' queue
      → When API recovers → process backlog
      → Log: "QA photos queued for analysis — AI temporarily unavailable"

    APP-14 Decision Support:
      → Present decision cards WITHOUT AI recommendation
      → Show: "AI recommendation unavailable — manual review required"
      → PM still has all the data, just not the AI summary

    APP-01 Bid Engine:
      → Score bids using weighted formula ONLY (no AI narrative)
      → Still works, just less detailed recommendation

    APP-04 Report Generator:
      → Generate report with data tables but skip AI summary paragraph
      → Note: "AI summary will be added when available"

    Receipt OCR (APP-07):
      → Queue receipts for later OCR
      → PM can manually enter receipt data in the meantime
      → Process backlog when API recovers

  IF Stripe is down:
    → Queue all payment operations (fund, release, refund)
    → Show users: "Payment processing — will complete shortly"
    → Process queue when Stripe recovers
    → Do NOT block project progress for payment issues
    → Alert admin immediately

  IF Email (Resend) is down:
    → Fall back to SMS for critical messages (payment, decisions, QA issues)
    → Queue non-critical emails for retry
    → In-app notifications still work (direct database)

  IF SMS (Twilio) is down:
    → Fall back to email for critical messages
    → Queue SMS for retry
    → In-app notifications still work

  IF Supabase Storage is down:
    → Queue file uploads to local temp storage
    → Process upload queue when storage recovers
    → Show user: "File saved — syncing to cloud"

  DEGRADATION STATE EXPOSED:
  Add to /health endpoint:
    degradation: {
      claude: "normal",    // normal | degraded | offline
      stripe: "normal",
      email: "normal",
      sms: "normal",
      storage: "normal"
    }

  Add to admin dashboard:
    Visual indicator per service: green/yellow/red
    If any service degraded → yellow banner:
    "Platform operating in degraded mode. [Service] temporarily unavailable. All operations queued for retry."

═══ PART C: AUTO-RECOVERY ═══

FILE: packages/automation/src/infrastructure/recovery.ts

  CLASS: RecoveryManager

  METHOD: async processBacklog(service: string)
    Called when a circuit breaker transitions from OPEN → CLOSED (service recovered).

    1. Check for pending items:
       - Claude recovery → process 'qa-pending-ai' queue, regenerate skipped predictions
       - Stripe recovery → process payment queue
       - Email recovery → flush email queue
       - SMS recovery → flush SMS queue
       - Storage recovery → upload queued files

    2. Process in order (oldest first)
    3. Rate limit to avoid overwhelming recovered service
    4. Log: "Processing [N] backlog items for [service]. Estimated time: [X] minutes."
    5. Alert admin when backlog is cleared

  METHOD: async runRecoveryCheck()
    Called every 5 minutes:
    1. For each circuit breaker in OPEN state:
       - Attempt one test call
       - If success → transition to HALF_OPEN → try more
       - If still failing → stay OPEN, update degradation state
    2. For each service in degraded state:
       - If recovered → trigger processBacklog
       - Send recovery notification: "[Service] has recovered. Processing [N] queued items."

═══ PART D: RAILWAY AUTO-RESTART CONFIGURATION ═══

FILE: apps/workers/railway.toml (UPDATE)

  [deploy]
    numReplicas = 1              # Start with 1, increase later
    restartPolicyType = "always" # Auto-restart on crash
    healthcheckPath = "/health"
    healthcheckTimeout = 30

  Railway automatically restarts crashed containers.
  Combined with the ProcessManager, individual workers restart within the process.
  Double layer of protection.

  Future: When queue depth consistently > threshold for 10+ minutes,
  Railway API can be called to scale replicas. For now, single replica
  with internal process management is sufficient for launch.
```

---

## PROMPT 37 — Natural Language Interface (AI Chat)

**Why now:** This is the #1 thing that makes clients say "wow, this is different." Every other construction platform has forms and dashboards. Kealee has a conversation. A homeowner texts "how's my kitchen going?" and gets a real answer. That's not a nice-to-have — that's the product experience that wins word-of-mouth.

```
Implement a natural language chat interface where every user type can interact with the Kealee Platform through conversation.

═══ PART A: CHAT API ═══

FILE: apps/api/src/routes/chat/index.ts

  POST /api/v1/chat
  Auth: requireAuth
  Body: { message: string; projectId?: string; }

  PROCESS:
  1. Get user context:
     - User role, name, organization
     - Active projects (with current status, budget, timeline)
     - Recent activity (last 5 events per project)
     - Pending decisions (from DecisionQueue)
     - Upcoming events (visits, inspections, milestones)

  2. Build system prompt based on user role:

     FOR HOMEOWNER/PROJECT OWNER:
     """
     You are a friendly, professional construction project assistant for Kealee.
     You're speaking with {{firstName}}, a {{role}} who has {{projectCount}} active project(s).

     THEIR PROJECTS:
     {{#each projects}}
     - {{name}}: {{status}}, {{percentComplete}}% complete, ${{spent}} of ${{budget}} spent,
       current phase: {{currentPhase}}, next milestone: {{nextMilestone}} (due {{nextMilestoneDate}})
       Contractor: {{contractorName}}, PM: {{pmName}}
     {{/each}}

     PENDING ACTIONS:
     {{#each pendingDecisions}}
     - {{type}}: {{title}} — waiting for their response
     {{/each}}

     RECENT ACTIVITY:
     {{#each recentActivity}}
     - {{date}}: {{description}}
     {{/each}}

     RULES:
     - Answer questions about their project status, budget, timeline, and next steps
     - Be warm and reassuring — construction is stressful for homeowners
     - If they ask about something you don't have data for, say so honestly
     - If they want to take an action (approve payment, accept bid), provide a direct link
     - Keep answers concise: 2-4 sentences for simple questions, more for complex ones
     - Never reveal internal platform mechanics (app IDs, queue names, etc.)
     - If they express frustration, acknowledge it and offer concrete next steps
     - Use plain English, no construction jargon unless they use it first
     """

     FOR CONTRACTOR:
     """
     You are a professional business assistant for Kealee.
     You're speaking with {{firstName}} from {{companyName}}, a {{trades}} contractor.

     THEIR ACTIVE PROJECTS:
     {{projects with tasks, upcoming deadlines, payment status}}

     AVAILABLE LEADS:
     {{matched leads they haven't bid on yet}}

     PAYMENT STATUS:
     {{pending payouts, recent payments}}

     RULES:
     - Help them manage their workload, bids, and payments
     - Be direct and business-like — contractors value efficiency
     - If they ask about a lead, give them the key details and suggested bid range
     - If they ask about payment, give exact amounts and expected dates
     - If they need to upload something (photos, receipts), remind them and provide link
     """

     FOR PM:
     """
     You are an AI assistant for a Kealee Project Manager.
     You're speaking with {{firstName}}, managing {{projectCount}} active projects.

     PROJECTS OVERVIEW:
     {{all projects with status, risks, upcoming milestones, overdue tasks}}

     TODAY'S PRIORITIES:
     {{decisions pending, visits scheduled, overdue items}}

     AI INSIGHTS:
     {{latest predictions from APP-11, QA flags from APP-13}}

     RULES:
     - Help them manage their workload efficiently
     - Proactively surface the most important items
     - If they want to take an action (approve, schedule, reassign), confirm and execute
     - Be concise and action-oriented
     """

  3. Call Claude API with:
     - System prompt (role-specific context above)
     - User message
     - Conversation history (last 10 messages from this chat session)

  4. Parse response for any ACTION INTENTS:
     If AI response contains [ACTION: approve_payment, milestoneId: X]:
       → Return actionable button in response
     If AI response contains [ACTION: view_report, reportId: X]:
       → Return link to report
     If AI response contains [ACTION: schedule_visit, projectId: X]:
       → Return scheduling widget

  5. Save message + response to ChatHistory table
  6. Return: { response: string, actions?: ActionButton[], suggestions?: string[] }

  ADD Prisma model:
  model ChatMessage {
    id        String   @id @default(uuid())
    userId    String
    role      String   // 'user' or 'assistant'
    content   String   @db.Text
    projectId String?
    actions   Json?    // any action buttons included
    createdAt DateTime @default(now())
    @@index([userId, createdAt])
  }

═══ PART B: CHAT UI ═══

FILE: packages/ui/src/components/chat-widget.tsx

  Floating chat button (bottom-right corner of all dashboards):
  - Circular button with chat icon
  - Unread indicator if there are pending actions
  - Click to expand chat panel (slide-up on mobile, side panel on desktop)

  Chat panel:
  - Conversation history (scrollable)
  - Message input with send button
  - Suggested quick questions based on user state:
    Homeowner: "How's my project going?" | "When is the next milestone?" | "What do I need to approve?"
    Contractor: "Any new leads?" | "When will I get paid?" | "What's due today?"
    PM: "What needs my attention?" | "Show me today's schedule" | "Any risks I should know about?"
  - Action buttons inline with AI responses (deep links to approve, view, schedule)
  - Typing indicator while AI responds
  - Markdown rendering for formatted responses

  DESIGN:
  - Clean, minimal, Intercom/Crisp style
  - Messages styled differently: user (right, blue) vs AI (left, gray)
  - Action buttons styled as primary buttons within messages
  - Timestamp on hover
  - "Clear conversation" option
  - Works on mobile (full-screen slide-up)

FILE: packages/ui/src/components/chat-widget.tsx
  Available on EVERY dashboard page:
  - apps/m-project-owner (homeowner/developer dashboard)
  - apps/os-pm (PM workspace)
  - apps/marketplace (contractor dashboard)

═══ PART C: PROACTIVE AI MESSAGES ═══

The chat isn't just reactive — it reaches out when something matters.

FILE: packages/automation/src/apps/chat-assistant/proactive.ts

  Triggered by events, sends proactive chat messages to users:

  EVENT: 'milestone.completed'
  → To client: "Great news! {{milestoneName}} is complete. The inspection is scheduled
    for {{date}}. Once it passes, I'll send you the payment approval."

  EVENT: 'payment.released'
  → To contractor: "Payment of ${{amount}} for {{milestoneName}} has been released.
    You should see it in your account within 2-3 business days."

  EVENT: 'qa.issue_detected' (HIGH severity)
  → To PM: "Heads up — I found a potential issue on {{projectName}}: {{description}}.
    Confidence: {{confidence}}%. Want me to create a correction task?"

  EVENT: 'prediction.high_risk'
  → To PM: "Risk alert for {{projectName}}: {{prediction}}. I've prepared
    3 mitigation options. Want to review them?"

  EVENT: 'bid.evaluation_complete'
  → To client: "You've received {{count}} bids for your project. The top-rated
    bid is from {{contractorName}} at ${{amount}}. Ready to review?"

  EVENT: No activity on project for 5 days
  → To client: "Just checking in — your {{projectName}} hasn't had any updates
    in 5 days. This is normal during [reason if available, e.g. permit waiting].
    Want me to check with your PM?"

  These proactive messages appear in the chat widget with the same UI as responses.
  They also trigger push notifications (via Supabase Realtime).
```

---

## PROMPT 38 — AR-Assisted Site Documentation (Mobile Camera)

**Why now:** Contractors hate taking site photos because it feels like busywork. If you make the camera experience smart — overlaying where they should take photos, auto-tagging rooms, suggesting what to capture — they'll actually do it. Better photos = better QA = better reports = happier clients.

```
Implement a smart mobile camera experience for site photo documentation that guides contractors and PMs to capture the right content.

═══ PART A: SMART CAMERA VIEW ═══

FILE: packages/ui/src/components/smart-camera.tsx (React component for mobile web)

  This is a mobile-first camera interface that opens when contractor/PM taps "Add Site Photos."

  FEATURES:

  1. GUIDED CAPTURE CHECKLIST:
     Based on current project phase and milestone, show a checklist of required photos:

     Example for "Rough Plumbing" phase:
     □ Supply lines (hot and cold)
     □ Drain lines
     □ Vent pipes
     □ Valve locations
     □ Water heater connections
     □ Pressure test gauge reading

     As each photo is taken, match it to a checklist item (via AI or manual tag).
     Items turn green as photos are captured.

  2. LOCATION TAGGING:
     - Auto-detect which room/area via GPS + floor plan overlay (if floor plan uploaded)
     - Or simple selector: "Kitchen" | "Bathroom" | "Exterior" | "Basement" | etc.
     - Each photo tagged with room/location automatically

  3. BEFORE/AFTER OVERLAY:
     - If previous visit photos exist for this room/area:
       → Show semi-transparent overlay of previous photo
       → Contractor can align current view to match angle
       → Creates perfect before/after comparison

  4. AUTO-TAGGING:
     On capture, send photo to Claude Vision for instant tagging:
     - Trade category (plumbing, electrical, framing, etc.)
     - Work stage (demo, rough, finish)
     - Any visible issues (flagged for APP-13 QA)
     - Description: "Hot and cold supply lines installed in kitchen wall"

  5. BATCH UPLOAD:
     - All photos captured in session uploaded together
     - Progress bar during upload
     - Retry failed uploads automatically
     - Works offline: saves to device, uploads when connection restores

  TECHNICAL:
  - Use navigator.mediaDevices.getUserMedia for camera access
  - Canvas overlay for guides and checklists
  - Web Workers for background upload
  - IndexedDB for offline photo queue
  - GPS from navigator.geolocation

═══ PART B: PHASE-BASED PHOTO REQUIREMENTS ═══

FILE: packages/automation/src/data/photo-requirements.ts

  export const PHOTO_REQUIREMENTS: Record<string, PhotoChecklist> = {
    demolition: {
      required: [
        { id: 'demo-before', label: 'Before demolition (each room)', min: 2 },
        { id: 'demo-progress', label: 'Demolition in progress', min: 1 },
        { id: 'demo-complete', label: 'After demolition (each room)', min: 2 },
        { id: 'demo-dumpster', label: 'Dumpster / debris removal', min: 1 },
      ],
      optional: [
        { id: 'demo-found', label: 'Unexpected conditions found', min: 0 },
      ]
    },
    rough_plumbing: {
      required: [
        { id: 'plumb-supply', label: 'Supply lines installed', min: 2 },
        { id: 'plumb-drain', label: 'Drain lines installed', min: 2 },
        { id: 'plumb-vent', label: 'Vent pipes', min: 1 },
        { id: 'plumb-valves', label: 'Shut-off valve locations', min: 1 },
        { id: 'plumb-test', label: 'Pressure test gauge reading', min: 1 },
      ]
    },
    rough_electrical: {
      required: [
        { id: 'elec-panel', label: 'Electrical panel', min: 1 },
        { id: 'elec-wiring', label: 'Wiring in walls (before close-up)', min: 3 },
        { id: 'elec-boxes', label: 'Outlet/switch box locations', min: 2 },
        { id: 'elec-labels', label: 'Wire labels / circuit identification', min: 1 },
      ]
    },
    framing: {
      required: [
        { id: 'frame-walls', label: 'Wall framing', min: 2 },
        { id: 'frame-headers', label: 'Headers over openings', min: 1 },
        { id: 'frame-connections', label: 'Connection details', min: 1 },
        { id: 'frame-overall', label: 'Overall room views', min: 2 },
      ]
    },
    insulation: { ... },
    drywall: { ... },
    tile: { ... },
    cabinets: { ... },
    countertops: { ... },
    painting: { ... },
    flooring: { ... },
    trim_finish: { ... },
    final_cleanup: { ... },
    // ... all construction phases
  };

  These checklists drive:
  1. The smart camera UI (what to capture)
  2. Completeness scoring (did contractor provide enough photos?)
  3. APP-13 QA analysis (knows what to look for in each phase)
  4. Weekly reports (auto-selects best photos per phase)

═══ PART C: PROGRESS TRACKING BY PHOTO ═══

FILE: packages/automation/src/apps/qa-inspector/progress-comparison.ts

  METHOD: async compareProgress(projectId: string, areaId: string)

  1. Get all photos for this area, sorted by date
  2. Group by visit date
  3. For each consecutive pair of visit photo sets:
     → Send to Claude Vision:
     "Compare these two sets of construction photos taken on [date1] and [date2]
      for the same area. Identify:
      1. What work was completed between visits
      2. Estimated percentage of progress
      3. Any quality concerns visible
      4. Is progress consistent with the schedule?"
  4. Store progress assessment
  5. Feed into APP-04 weekly reports:
     "Kitchen: 15% progress this week. Cabinets installed, countertop template scheduled."

  This creates an automated visual progress timeline that clients love —
  they can see their project evolving photo by photo.
```

---

## PROMPT 39 — Audit Trail & Compliance Foundation

**Why now:** You're pursuing government contracts (SHA, Baltimore County). They will ask: "Can you show us who did what, when, and what changed?" If you add the audit trail later, you'll have gaps in your history that make compliance impossible. Start logging from day one.

```
Implement comprehensive audit logging for every data change, access event, and user action across the platform.

═══ PART A: AUDIT LOG MODEL ═══

FILE: packages/database/prisma/schema.prisma (ADD)

  model AuditLog {
    id            String   @id @default(uuid())
    timestamp     DateTime @default(now())

    // Who
    userId        String?             // null for system actions
    userEmail     String?
    userRole      String?
    ipAddress     String?
    userAgent     String?

    // What
    action        String              // CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, EXPORT
    resource      String              // table/entity name: "Project", "Payment", "Decision"
    resourceId    String?
    
    // Details
    previousValue Json?               // snapshot of data BEFORE change
    newValue      Json?               // snapshot of data AFTER change
    changedFields String[]            // which fields changed: ["status", "amount"]
    description   String?  @db.Text   // human-readable: "User approved milestone payment of $5,000"

    // Context
    projectId     String?
    organizationId String?
    traceId       String?             // links to OpenTelemetry trace
    source        String?             // 'api', 'webhook', 'worker', 'cron', 'admin'

    @@index([userId, timestamp])
    @@index([resource, resourceId])
    @@index([projectId, timestamp])
    @@index([action, timestamp])
    @@index([timestamp])
  }

  IMPORTANT: AuditLog table should be APPEND-ONLY.
  No UPDATE or DELETE operations allowed.
  In Supabase RLS:
    CREATE POLICY "audit_insert_only" ON "AuditLog"
      FOR INSERT USING (true);
    -- No SELECT policy for regular users
    -- Only service_role and admin can read

═══ PART B: AUDIT MIDDLEWARE ═══

FILE: packages/audit/src/audit.ts

  CLASS: AuditService

  METHOD: async log(entry: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    description?: string;
    projectId?: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
    traceId?: string;
    source?: string;
  })
    1. Determine changedFields by diffing previousValue and newValue
    2. Sanitize values (remove passwords, tokens, full card numbers)
    3. Insert into AuditLog table
    4. Do NOT await — fire-and-forget to avoid slowing down operations
       (use a queue or setImmediate)

  METHOD: async logApiRequest(request: FastifyRequest, resource: string, action: string, details?: any)
    Extract user, IP, user agent from request and call log()

═══ PART C: AUTO-AUDIT ON KEY OPERATIONS ═══

FILE: apps/api/src/middleware/audit.ts

  Fastify onResponse hook:
  For routes that MODIFY data (POST, PUT, PATCH, DELETE):
    Auto-log with: userId, action (from HTTP method), route, response status

  SPECIFIC AUDIT POINTS (these are compliance-critical):

  FINANCIAL:
  - Escrow funded → log amount, payer, project
  - Payment released → log amount, recipient, approver, milestone
  - Refund issued → log amount, reason, authorizer
  - Subscription created/changed/canceled → log plan, amount, user

  CONTRACTS:
  - Contract generated → log template, parties, amount
  - Contract signed → log signer, timestamp, IP address
  - Change order created → log amount, impact, submitter
  - Change order approved/rejected → log decision, decider, reason

  ACCESS:
  - User login → log method (password/OAuth), IP, device
  - User logout → log timestamp
  - Failed login attempt → log email, IP (for security monitoring)
  - Role change → log old role, new role, who changed it
  - Project access → log who viewed (especially for sensitive financial data)

  DECISIONS:
  - Bid accepted → log which bid, alternatives, who decided
  - Milestone approved → log amount, approver
  - QA issue resolved → log issue, resolution, who resolved
  - Schedule change approved → log old schedule, new schedule, impact

  DATA EXPORTS:
  - Report downloaded → log report type, who, when
  - Financial data exported → log scope, who, when
  - Client data exported → log scope, who, when

═══ PART D: AUDIT VIEWER (ADMIN) ═══

FILE: apps/os-admin/app/(dashboard)/audit/page.tsx

  Admin-only audit log viewer:
  - Search by: user, resource, action, date range, project
  - Filterable table: timestamp, user, action, resource, description
  - Click row → expand to show full before/after diff
  - Export to CSV for compliance reporting
  - Stats: actions per day, top users, most accessed resources

  Also add per-project audit trail:
  FILE: apps/os-pm/app/(workspace)/projects/[id]/audit/page.tsx
  - Shows all audit entries for this project
  - PM can see: who approved what, when payments were made, what changed

  Also add per-user audit trail (admin view):
  FILE: apps/os-admin/app/(dashboard)/users/[id]/audit/page.tsx
  - Shows all actions by this user across all projects
```

---

## PROMPT 40 — Client-Facing Analytics & Project Benchmarking

**Why now:** When a homeowner sees "Your kitchen renovation is costing 8% less than average for your area" — that's instant confidence in the platform. When a contractor sees "You complete projects 12% faster than peers" — that's a reason to stay on the platform. Analytics aren't a back-office feature — they're client-facing value.

```
Implement analytics dashboards for every user type showing benchmarks, trends, and insights from platform data.

═══ PART A: ANALYTICS SERVICE ═══

FILE: packages/analytics/src/analytics.service.ts

  CLASS: AnalyticsService

  METHODS:

  // ── PROJECT BENCHMARKING ──

  async getProjectBenchmark(projectId: string): Promise<{
    costVsAverage: { percent: number; label: 'above' | 'below' | 'at' };
    timeVsAverage: { percent: number; label: 'ahead' | 'behind' | 'on_track' };
    qualityScore: number;          // 0-100 based on QA pass rate
    changeOrderRate: number;       // vs average for project type
    averageForType: {
      cost: number;
      durationWeeks: number;
      changeOrderCount: number;
    };
  }>
    1. Get this project's stats (cost, duration, CO count)
    2. Query all completed projects of same type + region
    3. Calculate percentiles and comparisons
    4. Return benchmark data

    NOTE: For launch (few projects), use assembly library estimates as baseline.
    As real data accumulates, switch to actual project data.

  // ── CONTRACTOR SCORECARD ──

  async getContractorScorecard(contractorId: string): Promise<{
    overallScore: number;          // 0-100
    onTimeRate: number;            // % of milestones on time
    onBudgetRate: number;          // % of projects within budget
    qualityScore: number;          // % QA inspections passed first time
    responseTime: number;          // avg hours to respond to messages
    completedProjects: number;
    repeatClientRate: number;      // % of clients who hire again
    ranking: {
      percentile: number;          // top X% in their trade
      totalInTrade: number;
    };
  }>
    Calculate from all this contractor's project data.
    Anonymized — they see their score and percentile, not other contractors' data.

  // ── PM PERFORMANCE ──

  async getPmDashboardAnalytics(pmId: string): Promise<{
    activeProjects: number;
    projectHealth: { green: number; yellow: number; red: number };
    avgDecisionTime: number;       // hours to resolve decision cards
    clientSatisfaction: number;    // from reviews
    budgetAccuracy: number;        // how close estimates are to actuals
    overdueTaskRate: number;
    automationSavings: {
      hoursPerWeek: number;        // estimated hours saved by automation
      tasksAutomated: number;      // tasks handled without PM input this month
    };
  }>

  // ── PLATFORM-WIDE (ADMIN) ──

  async getPlatformAnalytics(dateRange: { start: Date; end: Date }): Promise<{
    revenue: { mrr: number; arr: number; growth: number };
    projects: { active: number; completed: number; avgDuration: number };
    marketplace: { leads: number; bids: number; bidRate: number; avgTimeToFirstBid: number };
    users: { total: number; new: number; churn: number; byRole: Record<string, number> };
    financial: { escrowBalance: number; released: number; platformFees: number };
    aiMetrics: { predictionsAccuracy: number; qaFlagRate: number; avgAiResponseTime: number };
  }>

═══ PART B: CLIENT ANALYTICS DASHBOARD ═══

FILE: apps/m-project-owner/app/(dashboard)/analytics/page.tsx

  WHAT THE CLIENT SEES:

  1. PROJECT HEALTH SCORE (large, prominent):
     Score out of 100 based on:
     - Budget adherence (30% weight)
     - Schedule adherence (30% weight)
     - Quality (QA pass rate) (25% weight)
     - Communication responsiveness (15% weight)

     Visual: large circular gauge, color-coded (green 80+, yellow 60-79, red <60)

  2. COST COMPARISON:
     "Your {{projectType}} is costing ${{amount}} — that's {{X%}} {{above/below}} the
     average for {{region}}."

     Bar chart: Your Project vs Regional Average vs National Average

  3. TIMELINE COMPARISON:
     "Your project is {{X days}} {{ahead of/behind}} typical {{projectType}} timeline."

     Gantt-style visual: Your project vs average timeline

  4. BUDGET TRACKER (visual):
     - Donut chart: spent vs remaining vs contingency
     - Trend line: spending pace vs expected pace
     - If ahead of budget: green messaging
     - If over: yellow/red with explanation

  5. MILESTONE PROGRESS:
     - Visual timeline with completed (green), current (blue), upcoming (gray)
     - Each milestone shows: completion date, payment amount, status

  6. CONTRACTOR SCORECARD (their contractor):
     - Overall score
     - On-time rate for this project
     - Response time
     - "Your contractor is in the top {{X}}% for {{trade}} in {{region}}"

═══ PART C: CONTRACTOR ANALYTICS DASHBOARD ═══

FILE: apps/marketplace/app/(dashboard)/analytics/page.tsx

  WHAT THE CONTRACTOR SEES:

  1. PERFORMANCE SCORECARD:
     - Overall score: 87/100
     - On-time: 92%
     - On-budget: 88%
     - Quality: 95%
     - "You're in the top 15% of {{trade}} contractors on Kealee"

  2. EARNINGS OVERVIEW:
     - Total earned this month / quarter / year
     - Pending payments
     - Chart: monthly earnings trend

  3. BID PERFORMANCE:
     - Win rate: 35%
     - Avg bid-to-award time: 3.2 days
     - Bids submitted this month: 12
     - "You win 2x more often when you bid within 4 hours"

  4. LEAD INSIGHTS:
     - Best performing project types (by win rate)
     - Best performing areas (by win rate)
     - Recommended focus areas

  5. PORTFOLIO INSIGHTS:
     - Profile view count this month
     - How they compare to similar contractors
     - Suggestions to improve profile (add more photos, update description, etc.)

═══ PART D: PM ANALYTICS ═══

FILE: apps/os-pm/app/(workspace)/analytics/page.tsx

  1. WORKLOAD OVERVIEW:
     - Projects by health status (green/yellow/red pie chart)
     - Tasks due today, overdue, upcoming

  2. AUTOMATION IMPACT:
     - "This month, the Command Center automated {{X}} tasks that would have taken you
       an estimated {{Y}} hours"
     - Breakdown: reports generated, photos analyzed, decisions prepared, messages sent

  3. DECISION METRICS:
     - Average time to resolve decisions
     - Decision types breakdown
     - AI recommendation accuracy (how often PM agrees with AI)

  4. BUDGET ACCURACY:
     - Across all projects: estimate vs actual trend
     - Which project types are most accurate
     - Which have the most variance

═══ PART E: ADMIN PLATFORM ANALYTICS ═══

FILE: apps/os-admin/app/(dashboard)/analytics/page.tsx

  Full business intelligence dashboard:
  - Revenue: MRR, ARR, churn rate, ARPU, LTV
  - Growth: user signups, project starts, conversion funnel
  - Marketplace: lead velocity, bid rate, match quality
  - Financial: escrow balances, platform fees, payout volume
  - AI: token usage, cost, prediction accuracy, QA flag rate
  - Operations: active PMs, workload distribution, capacity

IMPLEMENTATION NOTES:
  - Use Recharts for all visualizations (already available in monorepo)
  - Pre-calculate analytics daily via cron job (avoid expensive real-time queries)
  - Store pre-calculated metrics in AnalyticsSnapshot model
  - Cache heavily (5-minute TTL for dashboards, 1-hour for benchmarks)
```

---

## PROMPT 41 — Presence System & On-Site Tracking

**Why now:** A homeowner's #1 anxiety is "is anyone actually working on my house?" Showing "Contractor checked in at 8:02 AM" with a GPS pin is worth more than 10 weekly reports. It's instant trust.

```
Implement presence tracking: who's online, who's on-site, and live crew status.

═══ PART A: SITE CHECK-IN ═══

FILE: packages/ui/src/components/site-check-in.tsx

  Mobile component for contractors and PMs:

  1. "Check In" button on project page
  2. On tap:
     - Get GPS coordinates via navigator.geolocation
     - Compare to project address coordinates
     - If within 200 meters → "Checked in at {{time}} ✓"
     - If NOT within 200 meters → "You don't appear to be at the site.
       Check in anyway?" (allow manual override with note)
  3. Record check-in:
     SiteCheckIn { userId, projectId, timestamp, lat, lng, verified: boolean }
  4. "Check Out" button when leaving
  5. Calculate time on site from check-in to check-out

═══ PART B: LIVE STATUS FOR CLIENT ═══

FILE: apps/m-project-owner/app/(dashboard)/projects/[id]/page.tsx (UPDATE)

  Add to project dashboard:

  LIVE STATUS BAR (top of page):
  - If contractor currently checked in:
    🟢 "{{contractorName}} is on site (arrived {{time}})"
  - If contractor not on site, during work hours:
    ⚪ "No one currently on site"
  - If outside work hours:
    🌙 "Work resumes {{nextScheduledDay}} at {{time}}"

  TODAY'S ACTIVITY:
  - Check-in/check-out times
  - Crew count (if multiple check-ins from same contractor org)
  - Hours on site today
  - Photos uploaded today (count)

  WEEKLY ATTENDANCE SUMMARY:
  - Mon–Fri attendance (checked in or not)
  - Total hours on site this week
  - Comparison to expected hours

  This is delivered via Supabase Realtime (Prompt 35):
  When contractor checks in → broadcast to project channel → client dashboard updates live

═══ PART C: PM FLEET VIEW ═══

FILE: apps/os-pm/app/(workspace)/field-status/page.tsx

  Map view showing all active projects:
  - Each project pin on map
  - Green pin = someone on site
  - Gray pin = no one on site
  - Red pin = expected to be on site but isn't (overdue check-in)
  - Click pin → project summary popup

  List view alongside map:
  - All projects sorted by status
  - Who's on site at each
  - Who was supposed to be but isn't
  - Quick call/message buttons

═══ PART D: ONLINE PRESENCE ═══

FILE: packages/realtime/src/presence.ts

  Track which users are currently active on the platform:
  - Use Supabase Realtime presence feature
  - Track: userId, currentPage, lastActive

  Show in PM dashboard:
  - "{{clientName}} is viewing their project dashboard" → good time to send update
  - "{{contractorName}} is online" → send that urgent message now

  Show in admin dashboard:
  - Current active users count
  - Users by role breakdown
  - Peak usage times

COST: Zero additional cost — uses GPS API (free) and Supabase Realtime (included).
```

---

## PROMPT 42 — IoT-Ready Sensor Framework

**Why now:** You don't need to deploy sensors on day one, but building the data ingestion framework now means you can add sensors to ANY project instantly when you're ready. The framework is cheap to build and makes you "IoT-ready" as a selling point even before you deploy hardware.

```
Build the sensor data ingestion and alerting framework so the platform is ready to accept IoT data from jobsite sensors.

═══ PART A: SENSOR DATA MODEL ═══

FILE: packages/database/prisma/schema.prisma (ADD)

  model SensorDevice {
    id          String   @id @default(uuid())
    projectId   String
    project     Project  @relation(fields: [projectId], references: [id])
    type        String   // "temperature", "humidity", "vibration", "noise", "water_leak", "air_quality", "motion"
    name        String   // "Kitchen Humidity Sensor", "Basement Temp #1"
    location    String   // "Kitchen wall A", "Basement NE corner"
    deviceId    String   @unique  // hardware device identifier
    status      String   @default("active") // active, offline, low_battery, error
    batteryLevel Int?    // percentage, if applicable
    lastReading DateTime?
    config      Json?    // threshold settings: { alertAbove: 80, alertBelow: 32 }
    createdAt   DateTime @default(now())
    readings    SensorReading[]
    @@index([projectId])
  }

  model SensorReading {
    id          String   @id @default(uuid())
    deviceId    String
    device      SensorDevice @relation(fields: [deviceId], references: [id])
    value       Float
    unit        String   // "°F", "%RH", "dB", "g", "ppm"
    timestamp   DateTime @default(now())
    alert       Boolean  @default(false)  // true if this reading triggered an alert
    @@index([deviceId, timestamp])
    @@index([alert])
  }

═══ PART B: INGESTION API ═══

FILE: apps/api/src/routes/sensors/index.ts

  POST /api/v1/sensors/readings
  Auth: API key (device-level, not user-level)
  Body: {
    deviceId: string;
    readings: Array<{ value: number; unit: string; timestamp: string }>;
  }

  Process:
  1. Validate device exists and is active
  2. Store readings (batch insert)
  3. Check each reading against device config thresholds
  4. If threshold exceeded:
     - Set alert: true on reading
     - Publish 'sensor.alert' event:
       → APP-08 notifies PM via SMS (urgent)
       → APP-11 incorporates into risk prediction
       → Dashboard shows real-time alert
  5. Update device.lastReading timestamp

  POST /api/v1/sensors/register
  Auth: requireRoles('ADMIN', 'PM')
  Body: { projectId, type, name, location, deviceId, config }
  Creates SensorDevice record

  GET /api/v1/sensors/project/:projectId
  Returns all sensors and latest readings for project

  GET /api/v1/sensors/:deviceId/history
  Query params: ?from=X&to=Y&interval=1h (aggregated)
  Returns time-series data for charts

═══ PART C: SENSOR DASHBOARD WIDGET ═══

FILE: packages/ui/src/components/sensor-widget.tsx

  If project has sensors:
  - Show sensor cards on project dashboard
  - Each card: sensor name, current value, min/max today, status indicator
  - Sparkline chart showing last 24 hours
  - Red highlight if in alert state
  - Click to expand → full history chart (Recharts line chart)

  Example:
  ┌──────────────────────────┐
  │ 🌡️ Kitchen Humidity      │
  │ Current: 62% RH          │
  │ Range today: 55-68%      │
  │ ▁▂▃▄▅▅▄▃▂▂▃▄▅▆ (24hr)  │
  │ Status: ✅ Normal         │
  └──────────────────────────┘

═══ PART D: SENSOR + AI INTEGRATION ═══

FILE: packages/automation/src/apps/predictive-engine/sensor-analysis.ts

  When daily risk analysis runs (APP-11), include sensor data:

  Add to AI prompt:
  "Sensor data for {{projectName}} (last 24 hours):
   - Kitchen humidity: avg 65%, max 78% (threshold: 70%)
   - Basement temperature: avg 58°F, min 45°F
   - Noise levels: peak 95dB at 2pm

   Consider these environmental conditions when predicting:
   - Humidity impacts on drywall, paint, adhesives
   - Temperature impacts on concrete curing, pipe freezing
   - Noise compliance with local ordinances"

  Also feed into APP-12 Smart Scheduler:
  "Tomorrow's forecast: rain + high humidity. Current basement humidity already elevated.
   Recommend postponing basement drywall from Tuesday to Thursday."

WHY BUILD THE FRAMEWORK NOW:
  - Framework cost: ~1 day of development
  - Makes every sales pitch more impressive: "We support IoT jobsite monitoring"
  - When you're ready to deploy sensors (even one project), it just works
  - Premium upsell: "$200/month for sensor monitoring package"
  - Government contracts love this: "continuous environmental monitoring"
```

---

## PROMPT 43 — Mobile-Optimized Progressive Web App (PWA)

**Why now:** Contractors are on jobsites with phones, not laptops. If the site photo upload is clunky on mobile, they won't use it. If the client can't check project status from their phone, they'll call the PM instead — defeating the automation. Mobile isn't a nice-to-have, it's where 70%+ of contractor and client interactions happen.

```
Convert all user-facing apps into Progressive Web Apps optimized for mobile field use.

═══ PART A: PWA CONFIGURATION ═══

FILE: apps/m-project-owner/public/manifest.json
  {
    "name": "Kealee - My Projects",
    "short_name": "Kealee",
    "description": "Track your construction project in real-time",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#1a1a2e",         // Kealee brand color
    "orientation": "portrait",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }

  Same pattern for apps/marketplace (contractor) and apps/os-pm (PM).

FILE: apps/m-project-owner/public/sw.js (Service Worker)
  - Cache static assets (shell, CSS, JS, fonts)
  - Cache API responses for offline viewing (project data, photos)
  - Background sync for offline actions:
    * Photos taken offline → queued → uploaded when online
    * Check-ins made offline → queued → synced when online
    * Messages written offline → queued → sent when online
  - Push notification support (Web Push API)

FILE: apps/m-project-owner/app/layout.tsx (ADD)
  <link rel="manifest" href="/manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  Register service worker on load.

═══ PART B: MOBILE-FIRST LAYOUTS ═══

For EVERY page in m-project-owner, marketplace, and os-pm:
  - Design mobile-first (default layout is mobile)
  - Desktop is the enhanced version, not the other way around
  - Touch targets minimum 44px (Apple HIG)
  - Bottom navigation bar (not top nav) for primary actions
  - Pull-to-refresh on all data pages
  - Swipe gestures for common actions (swipe to approve, swipe to dismiss)

  MOBILE NAVIGATION:
  Bottom tab bar (5 tabs max):

  Client app:
  [Home] [Projects] [Messages] [Payments] [More]

  Contractor app:
  [Leads] [Projects] [Photos] [Payments] [More]

  PM app:
  [Dashboard] [Decisions] [Schedule] [Messages] [More]

═══ PART C: OFFLINE SUPPORT ═══

FILE: packages/ui/src/hooks/use-offline-queue.ts

  export function useOfflineQueue() {
    // Detect online/offline status
    // When offline:
    //   - Show yellow banner: "Offline — changes will sync when connected"
    //   - Queue all write operations to IndexedDB
    // When back online:
    //   - Process queue in order
    //   - Show "Syncing [X] items..." progress
    //   - Confirm: "All changes synced ✓"
    //   - Remove yellow banner
  }

  CRITICAL FOR CONTRACTORS:
  Contractors work on job sites with spotty cell service.
  They MUST be able to:
  - Take photos → saved locally → auto-upload when signal returns
  - Write daily log → saved locally → synced later
  - Check in/out → queued → synced later
  - View project info → cached from last online visit

  Offline-capable actions:
  ✅ Take and store photos
  ✅ Write daily log entries
  ✅ Check in / check out
  ✅ View project details (cached)
  ✅ View task list (cached)
  ✅ Draft messages

  Requires-online actions:
  ❌ Submit bids (financial)
  ❌ Approve payments (financial)
  ❌ Sign contracts (legal)

═══ PART D: PUSH NOTIFICATIONS ═══

FILE: packages/communications/src/push.ts

  import webpush from 'web-push';

  Configure web-push with VAPID keys (generate and store in env).

  export async function sendPushNotification(userId: string, notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;       // where to navigate on click
    tag?: string;       // group related notifications
    requireInteraction?: boolean;  // true for important ones
  })
    1. Get user's push subscription from database
    2. Send via webpush.sendNotification
    3. If subscription expired → remove from database

  INTEGRATE WITH APP-08:
  Add 'push' as a channel option alongside email, sms, in_app.
  Critical events always include push:
  - Payment received
  - Payment approval needed
  - Bid accepted
  - QA issue (HIGH/CRITICAL)
  - Decision card created

  USER SUBSCRIBES ON FIRST VISIT:
  FILE: packages/ui/src/components/push-permission.tsx
  - Prompt user to enable push notifications
  - Store subscription in PushSubscription model
  - Respect user preferences (can disable per category)

COST: Zero — web push is free. Service worker and PWA are just code.
This eliminates the need for a native mobile app at launch.
```

---

## PROMPT 44 — Advanced Estimating: AI-Powered Scope Analysis

**Why now:** A homeowner describes their project in plain English. Instead of making them fill out 20 form fields, the AI reads their description, understands the scope, maps to assemblies, and generates a detailed estimate — in seconds. This is the wow moment that converts website visitors into users. It's also the core of APP-01's ability to set accurate suggested prices.

```
Implement AI-powered project scope analysis that converts natural language descriptions into detailed, accurate cost estimates.

═══ PART A: SCOPE ANALYZER ═══

FILE: packages/estimating/src/scope-analyzer.ts

  CLASS: ScopeAnalyzer

  METHOD: async analyzeScope(input: {
    description: string;           // "I want to gut my kitchen and start fresh. About 12x15 space, want quartz counters, new cabinets, keep the layout the same but update everything."
    projectType?: string;          // "kitchen_renovation" (if provided)
    photos?: string[];             // base64 photos of existing condition
    address?: string;              // for regional pricing
  }): Promise<{
    projectType: string;
    estimatedSqft: number;
    qualityTier: string;
    assemblies: Array<{
      code: string;
      name: string;
      quantity: number;
      unit: string;
      reasoning: string;           // "Client specified quartz counters, estimated 40 sqft based on 12x15 kitchen layout"
    }>;
    assumptions: string[];         // "Assuming standard ceiling height of 8'", "Layout staying the same means no plumbing relocation"
    questions: string[];           // "Do you want to replace the flooring as well?", "Will you be keeping existing appliances?"
    scopeNotes: string;
    confidence: number;            // 0-1
  }>

  IMPLEMENTATION:
  1. Build prompt with full assembly library context:
     System: "You are an expert construction estimator with 20+ years of experience
     in the DC-Baltimore corridor. Analyze the client's project description and
     map it to specific construction assemblies.

     AVAILABLE ASSEMBLIES:
     {{list of all assembly codes, names, units, and descriptions}}

     REGIONAL CONTEXT:
     DC-Baltimore corridor pricing. Adjust for location if address provided.

     RULES:
     - Be thorough: include all work that would logically be needed
     - Include work the client might not have mentioned but is implied
       (e.g., kitchen renovation implies demo, possible permit, final cleanup)
     - Estimate quantities based on dimensions mentioned or standard sizes
     - Note your assumptions clearly
     - If photos are provided, use visual information to refine estimates
     - Ask clarifying questions for ambiguous aspects
     - Assign a quality tier based on material mentions
       (quartz, granite, custom → high; standard, basic → mid; budget → low)
     - Return ONLY valid JSON"

  2. If photos provided:
     Include in Claude message as images
     "Here are photos of the existing space. Use these to:
      - Verify dimensions if possible
      - Identify existing conditions that affect scope
      - Note any visible issues (water damage, structural concerns)"

  3. Parse Claude response → validate all assembly codes exist in database
  4. Calculate costs using EstimatingService.calculateSuggestedPrice
  5. Return complete scope analysis

  METHOD: async refineEstimate(originalAnalysis: ScopeAnalysis, userAnswers: Record<string, string>)
    Takes the original analysis + answers to the AI's clarifying questions
    Re-runs analysis with additional context → more accurate estimate

═══ PART B: SMART ESTIMATE UI ═══

FILE: apps/marketing/app/estimate/page.tsx (public, no auth needed)
  AND
FILE: apps/m-project-owner/app/(dashboard)/new-project/page.tsx (for logged-in users)

  STEP 1: DESCRIBE YOUR PROJECT
  - Large text area: "Tell us about your project in your own words"
  - Placeholder example: "I want to renovate my master bathroom. It's about 8x10.
    I'd like a walk-in shower with frameless glass, double vanity, heated floors,
    and new tile throughout."
  - Optional: upload photos of existing space (drag & drop, up to 5)
  - Optional: property address (auto-populates from profile if logged in)
  - "Get Estimate" button

  STEP 2: AI PROCESSING (3-8 seconds)
  - Show animated progress:
    "Analyzing your project..." (brain icon)
    "Mapping construction scope..." (checklist icon)
    "Calculating costs for your area..." (calculator icon)

  STEP 3: RESULTS
  - INSTANT ESTIMATE RANGE (big, prominent):
    "$28,000 – $42,000"
    "For a Premium Bathroom Remodel in DC"

  - SCOPE BREAKDOWN (expandable):
    ✓ Demolition & disposal — $2,100 – $3,200
    ✓ Plumbing rough-in — $1,800 – $2,400
    ✓ Electrical update — $1,200 – $1,800
    ✓ Waterproofing — $800 – $1,200
    ✓ Tile installation (floor + walls) — $6,500 – $9,800
    ✓ Walk-in shower (frameless glass) — $3,500 – $5,200
    ✓ Double vanity + countertop — $2,800 – $4,500
    ✓ Heated floor system — $1,500 – $2,200
    ✓ Painting & finishing — $800 – $1,200
    ✓ Fixtures (faucets, shower, toilet) — $2,000 – $4,500
    ✓ Permits & inspections — $500 – $800
    ✓ General conditions & cleanup — $1,200 – $1,800

  - AI ASSUMPTIONS (expandable):
    "Based on your description, I assumed..."
    • Standard 8' ceiling height
    • Existing plumbing stays in roughly the same locations
    • Premium-grade materials (you mentioned frameless glass + heated floors)
    • One building permit required

  - FOLLOW-UP QUESTIONS:
    "To refine this estimate, a few questions:"
    □ "Are you keeping the existing tub drain location?"
    □ "Do you have a preference for tile material (porcelain, marble, natural stone)?"
    □ "Is the existing bathroom on a slab or raised floor?"

    Answer these → "Refine Estimate" button → more accurate numbers

  - CTA:
    [Get Matched with Contractors] → signup/login → creates Lead with full scope analysis attached

  STEP 4: COMPARISON (if logged in)
  "How your estimate compares:"
  - Bar chart: Your estimate vs average for your area
  - "Similar projects in {{neighborhood}} typically run $X – $Y"

═══ PART C: INTEGRATION WITH APP-01 BID ENGINE ═══

  When a Lead is created from the scope analyzer:
  1. Full assembly breakdown attached to Lead record
  2. suggestedPrice calculated from assemblies
  3. Contractors see the scope breakdown when viewing the lead
  4. They bid against a well-defined scope (fewer misunderstandings)
  5. Their bid is validated against the assembly-based suggested price
  6. Reduces change orders because scope was clear from the start

  This creates a virtuous cycle:
  Better scope → more accurate bids → fewer surprises →
  happier clients → more referrals → more leads
```

---

## PROMPT 45 — Performance & Speed Optimization

**Why now:** If the dashboard takes 3 seconds to load, nobody cares how many features you have. If photo upload takes 20 seconds, contractors skip it. Speed is the feature. Especially on mobile with spotty cell service.

```
Optimize the entire platform for speed: page load, API response times, and upload performance.

═══ PART A: DATABASE QUERY OPTIMIZATION ═══

FILE: Review ALL Prisma queries across the codebase and apply:

  1. SELECT ONLY WHAT YOU NEED:
     Instead of: prisma.project.findMany()
     Use: prisma.project.findMany({ select: { id: true, name: true, status: true, ... } })
     Never load full records with all relations for dashboard views.

  2. COMPOUND INDEXES:
     Add indexes for every common query pattern:
     - Project: @@index([clientId, status]) — client dashboard
     - Project: @@index([assignedPmId, status]) — PM dashboard
     - Project: @@index([contractorId, status]) — contractor dashboard
     - Task: @@index([projectId, status, dueDate]) — task board
     - Document: @@index([projectId, type, createdAt]) — photo gallery
     - SiteVisit: @@index([projectId, scheduledDate]) — visit calendar
     - Notification: @@index([userId, read, createdAt]) — notification bell
     - Lead: @@index([status, createdAt]) — marketplace
     - BudgetSnapshot: @@index([projectId, createdAt]) — budget charts
     - AutomationEvent: @@index([eventType, createdAt]) — event monitoring

  3. PAGINATION EVERYWHERE:
     No query ever returns more than 50 records without pagination.
     Use cursor-based pagination for infinite scroll:
     prisma.task.findMany({
       take: 20,
       cursor: { id: lastId },
       orderBy: { createdAt: 'desc' }
     })

  4. N+1 PREVENTION:
     Use Prisma includes/joins instead of separate queries:
     Wrong: projects.forEach(p => prisma.task.findMany({ where: { projectId: p.id } }))
     Right: prisma.project.findMany({ include: { tasks: { where: { status: 'active' } } } })

═══ PART B: API RESPONSE CACHING ═══

FILE: apps/api/src/middleware/cache.ts

  Redis-based response cache for read-heavy endpoints:

  CACHE STRATEGY:
  - Dashboard data: 30-second TTL (real-time enough, prevents hammering)
  - Project details: 60-second TTL (invalidated on update events)
  - Assembly library: 1-hour TTL (rarely changes)
  - Analytics/benchmarks: 5-minute TTL (pre-calculated)
  - User profile: 5-minute TTL

  CACHE INVALIDATION:
  When an event fires that changes data, invalidate relevant cache keys:
  - 'task.completed' → invalidate project dashboard cache
  - 'payment.released' → invalidate financial caches
  - 'photo.uploaded' → invalidate photo gallery cache

  Implementation:
  export function cacheMiddleware(ttlSeconds: number, keyFn: (req) => string) {
    return async (request, reply) => {
      const key = `cache:${keyFn(request)}`;
      const cached = await redis.get(key);
      if (cached) {
        reply.header('X-Cache', 'HIT');
        return reply.send(JSON.parse(cached));
      }
      // Continue to handler, cache the response
    };
  }

═══ PART C: FRONTEND PERFORMANCE ═══

  1. NEXT.JS OPTIMIZATIONS:
     - Use React Server Components for all data-fetching pages
     - Client components only for interactive elements (forms, real-time)
     - Streaming SSR with Suspense boundaries:
       <Suspense fallback={<DashboardSkeleton />}>
         <ProjectDashboard />
       </Suspense>
     - Loading skeletons for every page (shimmer animation)

  2. IMAGE OPTIMIZATION:
     - Use Next.js <Image> component for all photos
     - Serve thumbnails (400px) in lists/grids
     - Full-size only on click/expand
     - WebP format with JPEG fallback
     - Lazy loading for images below the fold
     - Blur placeholder while loading (from thumbnail base64)

  3. BUNDLE OPTIMIZATION:
     - Dynamic imports for heavy components:
       const Chart = dynamic(() => import('./chart'), { ssr: false })
       const PDFViewer = dynamic(() => import('./pdf-viewer'), { ssr: false })
     - Tree shake unused shadcn components
     - Analyze bundle with @next/bundle-analyzer

  4. PREFETCHING:
     - Next.js Link prefetch for likely navigation targets
     - Prefetch project detail data when hovering project card
     - Prefetch next page of paginated results

═══ PART D: UPLOAD PERFORMANCE ═══

  1. CHUNKED UPLOADS for large files (>5MB):
     - Split file into 1MB chunks
     - Upload chunks in parallel (3 concurrent)
     - Server reassembles
     - If chunk fails → retry only that chunk
     - Progress bar shows real upload progress

  2. CLIENT-SIDE IMAGE COMPRESSION:
     Before uploading photos:
     - Resize to max 2000px (if larger)
     - Compress to 80% JPEG quality
     - Reduces typical phone photo from 5-8MB to 500KB-1MB
     - 5x faster upload on cellular

  3. BACKGROUND UPLOADS:
     - User takes photo → thumbnail appears instantly in gallery
     - Upload happens in background (Web Worker)
     - Green checkmark when complete
     - User can keep working while photos upload

═══ PART E: PERFORMANCE BUDGET ═══

  TARGET METRICS:
  - Page load (LCP): < 2.0s on 4G mobile
  - Time to Interactive: < 3.0s on 4G mobile
  - API response (cached): < 50ms
  - API response (uncached): < 500ms
  - Photo upload (5MB on 4G): < 8s with compression
  - WebSocket event delivery: < 200ms
  - Dashboard data refresh: < 1s

  MONITORING:
  - Web Vitals tracking on all pages (LCP, FID, CLS)
  - Report to analytics (or Vercel Analytics, included free)
  - Alert if metrics degrade: LCP > 3s for > 10% of users
```

---

## Complete Revised Build Order (Prompts 01–45)

```
PHASE 1: SHARED INFRASTRUCTURE (Prompts 01–04)
  Schema, queues, event bus, AI wrapper

PHASE 2: CORE COMMAND CENTER (Prompts 05–11)
  15 automation apps (bid, visit, change order, budget, report,
  permit, inspection, communication, task, document)

PHASE 3: AI AGENTS (Prompts 12–15)
  Predictive, scheduler, QA inspector, decision support

PHASE 4: DASHBOARD & MONITORING (Prompt 16)
  Admin Command Center UI

PHASE 5: WIRING & LIFECYCLE (Prompts 17–19)
  Event chains, cron jobs, onboarding flows

PHASE 6: API & FRONTEND (Prompts 20–23)
  All API routes, PM dashboard, client dashboard

PHASE 7: DEPLOYMENT (Prompts 24–25)
  Worker entry point, deployment config

PHASE 8: PRODUCTION ESSENTIALS (Prompts 26–33)
  Auth/RBAC, Stripe, Twilio/Resend, file uploads,
  assembly library, templates, error handling, marketing site

PHASE 9: COMPETITIVE EDGE (Prompts 34–45) ← NEW
  34 → Observability & distributed tracing
  35 → Real-time WebSockets & live updates
  36 → Self-healing workers & graceful degradation
  37 → Natural language chat interface (AI assistant)
  38 → Smart camera & AR-assisted documentation
  39 → Audit trail & compliance foundation
  40 → Client-facing analytics & benchmarking
  41 → Presence system & on-site tracking
  42 → IoT sensor framework (ready, not deployed)
  43 → Mobile PWA & offline support
  44 → AI-powered scope analysis & smart estimating
  45 → Performance & speed optimization
```

---

## What This Gets You at Launch That Competitors Don't Have

| Capability | Kealee (at launch) | Typical Construction PM Software |
|---|---|---|
| Real-time dashboard updates | ✅ WebSocket, live | ❌ Manual refresh |
| Natural language chat | ✅ "How's my project?" | ❌ Navigate forms |
| AI-powered QA from photos | ✅ Automatic | ❌ Manual inspection only |
| Smart camera guidance | ✅ Phase-based checklists | ❌ Generic photo upload |
| Instant AI estimates | ✅ From plain English | ❌ Manual takeoff required |
| On-site presence tracking | ✅ GPS check-in, live status | ❌ Not available |
| IoT sensor ready | ✅ Framework built | ❌ Not on roadmap |
| Full audit trail | ✅ From day one | ❌ Added later if at all |
| Offline mobile support | ✅ PWA with background sync | ❌ Requires connectivity |
| Self-healing automation | ✅ Auto-recovery | ❌ Manual restart |
| Client-facing analytics | ✅ Benchmarks, scores | ❌ Basic reports only |
| Distributed tracing | ✅ End-to-end visibility | ❌ Log files |
| Sub-2s page loads | ✅ Optimized | ❌ Often 5-10s |
| Government compliance ready | ✅ Audit trail, MFA ready | ❌ Major retrofit needed |
