# Kealee Platform v10 — Accelerated Build

## Why Wait? You Shouldn't.

The original phased roadmap (Tier 1 → 2 → 3 over 3-5 years) was the safe, conventional path. But every month you launch without these capabilities is a month where:

- Clients get a "good" experience instead of an unmatched one
- Competitors could build something similar from generic tools
- You're collecting data but not weaponizing it immediately
- Your PMs are doing work that AI should handle from day one
- You're scaling headcount instead of scaling intelligence

**The revised approach:** Build the full stack from launch. Not everything from Tier 2 and 3 — but every element that directly impacts efficiency, speed, client satisfaction, and competitive moat.

---

## What Gets Pulled Forward and Why

### Decision Framework

Each Tier 2/3 feature was evaluated against your seven priorities:

| Priority | Code |
|---|---|
| Efficiency (less human labor per project) | EFF |
| Scale (handle more projects without more staff) | SCL |
| Competitiveness (features nobody else has) | CMP |
| Client satisfaction (clients love the experience) | SAT |
| Client scaling (easy for clients to grow with you) | CSC |
| Speed of project completion (projects finish faster) | SPD |
| Overall value (revenue per dollar invested) | VAL |

### What's Coming Forward

| Feature | Original Tier | Impacts | Reason to Build Now |
|---|---|---|---|
| Real-time WebSockets | 2.5 | SAT, SPD, CMP | Clients expect live updates in 2026. Polling feels broken. |
| Observability + tracing | 2.2 | EFF, SCL | Without it you're flying blind when things break at scale. Debugging 15 apps without traces is a nightmare. |
| Natural language interface | 2.4 | SAT, CMP, EFF | "How's my project?" via chat is the killer feature. Claude can do this now — no fine-tuning needed. |
| Agentic AI (Level 2 autonomy) | 2.4 + 3.7 | EFF, SCL, SPD | Let AI handle routine decisions from day one. One PM managing 30+ projects instead of 10. |
| Self-healing + degradation | 2.3 | SCL, SAT | Clients can't tolerate downtime. Auto-recovery is table stakes for a platform handling money. |
| Audit trail | 2.1 | CMP, SAT, VAL | Government contracts require it. Enterprise clients expect it. Build it once, never retrofit. |
| Client-facing analytics | 2.7 | SAT, CSC, CMP | "Your project is 12% under average cost" makes clients feel smart for choosing you. |
| Contractor reliability scoring | 3.5 | CMP, SPD, SAT | Even with limited data, score contractors on responsiveness, completeness of uploads, bid accuracy. Improves matching immediately. |
| AR remote inspection (basic) | 3.4 | SPD, EFF, CMP | Video call with annotation. Not full AR headsets — just phone-based. Cuts PM travel 30-40%. |
| IoT-ready architecture | 3.1 | CMP, SPD | Don't install sensors yet. But build the data ingestion layer so adding sensors later is plug-and-play, not a rebuild. |
| Advanced photo intelligence | 3.5 | SPD, SAT, CMP | Progress tracking by comparing photos across visits. Before/after overlays. Visual timeline. Claude Vision can do this now. |
| Smart scheduling with weather | 3.7 | SPD, EFF | Pull real weather API data into APP-12 from day one. Every outdoor task auto-adjusts. |
| White-label architecture | 2.6 | CSC, VAL, SCL | Don't build the white-label UI yet. But architect multi-tenant from day one so you never have to rebuild. |
| Data warehouse foundation | 2.7 | VAL, CMP | Start collecting everything into a warehouse from day one. The data compounds. Starting late means you lose the early data forever. |

### What Stays in Later Phases

| Feature | Why It Waits |
|---|---|
| SOC 2 / FedRAMP certification | Requires 6-12 months of documented controls + third-party audit. Start the practices now but certification takes time. |
| Fine-tuned ML models | Need 6-12 months of labeled data first. Can't shortcut this — the data doesn't exist yet. |
| Drone + LiDAR | Hardware dependency, pilot licensing, significant per-project cost. Add when premium clients demand it. |
| Full BIM integration | Complex, requires Revit/IFC parsing libraries, mostly relevant for $500K+ commercial projects. Add when you enter that market. |
| VR walkthroughs | Hardware barrier for clients. Not enough ROI at current project sizes. |
| Smart contract escrow | Blockchain adds complexity. Stripe escrow works fine. Add when institutional clients specifically request it. |
| Full autonomous PM (Level 4) | Needs trust built through Level 2-3 first. Clients won't trust full AI autonomy without a track record. |
| Marketplace network effects | Happens organically as user base grows. Can't be engineered — it's a result of volume. |
| SSO/SAML | Enterprise feature. Add when first enterprise client requires it. |

---

## Revised Implementation Prompts: 34–45

These 12 prompts add the pulled-forward Tier 2/3 features to the existing 33-prompt build.

---

## PROMPT 34 — Real-Time Layer (WebSockets + Presence)

```
Add real-time capabilities to the entire platform using Supabase Realtime.

Every user-facing dashboard should update LIVE — no refresh, no polling.

═══ PART A: SUPABASE REALTIME CONFIGURATION ═══

FILE: packages/realtime/src/realtime.ts

  EXPORTS:

  // ── SERVER-SIDE: BROADCAST EVENTS ──

  export async function broadcastToUser(userId: string, event: {
    type: string;           // 'notification', 'project_update', 'task_update', 'budget_update', 'message', 'decision_needed'
    payload: Record<string, any>;
  })
    - Use Supabase admin client
    - Broadcast to channel: `user:${userId}`
    - Include timestamp in payload

  export async function broadcastToProject(projectId: string, event: {
    type: string;           // 'milestone_complete', 'photo_uploaded', 'budget_changed', 'schedule_updated', 'qa_issue'
    payload: Record<string, any>;
    excludeUserId?: string; // don't send to the user who triggered it
  })
    - Broadcast to channel: `project:${projectId}`
    - All project members subscribed to this channel

  export async function broadcastToOrg(orgId: string, event: {
    type: string;
    payload: Record<string, any>;
  })
    - Broadcast to channel: `org:${orgId}`
    - All org members receive

  export async function broadcastSystemAlert(event: {
    type: string;
    payload: Record<string, any>;
  })
    - Broadcast to channel: `system:alerts`
    - Only admins subscribed

  // ── CLIENT-SIDE: SUBSCRIBE ──

  export function useProjectChannel(projectId: string, handlers: {
    onMilestoneComplete?: (data: any) => void;
    onPhotoUploaded?: (data: any) => void;
    onBudgetChanged?: (data: any) => void;
    onScheduleUpdated?: (data: any) => void;
    onQAIssue?: (data: any) => void;
    onMessage?: (data: any) => void;
    onTaskUpdate?: (data: any) => void;
  })
    - React hook that subscribes to `project:${projectId}` channel
    - Calls appropriate handler based on event type
    - Cleans up on unmount

  export function useUserChannel(userId: string, handlers: {
    onNotification?: (data: any) => void;
    onDecisionNeeded?: (data: any) => void;
    onProjectUpdate?: (data: any) => void;
  })
    - React hook for user-specific events
    - Powers the notification bell, live toast messages

  export function usePresence(channelName: string, userInfo: {
    userId: string;
    name: string;
    role: string;
    avatar?: string;
  })
    - Track who's online in a project/channel
    - Returns: { onlineUsers: Array<{ userId, name, role, lastSeen }> }
    - Shows "PM is viewing this project" or "Contractor is on-site"

═══ PART B: INTEGRATE INTO ALL COMMAND CENTER APPS ═══

  UPDATE every Command Center app to broadcast real-time events after processing:

  APP-01 Bid Engine:
    After bid submitted → broadcastToProject('bid_received', { bidId, amount, contractorName })
    After bid accepted → broadcastToProject('bid_accepted', { bidId, contractorName })

  APP-02 Visit Scheduler:
    After visit scheduled → broadcastToProject('visit_scheduled', { date, pmName })
    After visit completed → broadcastToProject('visit_complete', { visitId, photoCount })

  APP-03 Change Order:
    After CO created → broadcastToProject('change_order_created', { coId, amount, title })
    After CO approved → broadcastToProject('change_order_approved', { coId })

  APP-04 Reports:
    After report generated → broadcastToUser(clientId, 'report_ready', { reportId, title })

  APP-07 Budget:
    After receipt processed → broadcastToProject('budget_updated', { newTotal, variance })
    After variance alert → broadcastToProject('budget_alert', { variance, message })

  APP-08 Communication:
    After message sent → broadcastToUser(recipientId, 'message', { from, preview })

  APP-09 Task Queue:
    After task completed → broadcastToProject('task_complete', { taskName, phase, progress })
    After milestone reached → broadcastToProject('milestone_complete', { name, paymentAmount })

  APP-13 QA:
    After issue found → broadcastToProject('qa_issue', { severity, description, photoUrl })

  APP-14 Decision:
    After decision card created → broadcastToUser(deciderId, 'decision_needed', { title, type })
    After decision resolved → broadcastToProject('decision_resolved', { title, outcome })

  Stripe webhooks:
    After payment → broadcastToProject('payment_received', { amount, milestone })
    After escrow funded → broadcastToProject('escrow_funded', { amount })
    After payout → broadcastToUser(contractorId, 'payout_sent', { amount })

═══ PART C: LIVE DASHBOARD COMPONENTS ═══

FILE: packages/ui/src/components/live-notification-bell.tsx
  - Shows unread count badge (updates in real-time)
  - Dropdown shows recent notifications
  - New notifications slide in with subtle animation
  - Click → marks as read + navigates to relevant page

FILE: packages/ui/src/components/live-project-feed.tsx
  - Activity feed that updates without refresh
  - Shows: photos uploaded, tasks completed, budget changes, messages
  - Each item: icon + description + timestamp + actor
  - New items animate in at top

FILE: packages/ui/src/components/live-budget-ticker.tsx
  - Shows current spend vs budget
  - Number animates when budget changes (receipt processed)
  - Color shifts: green (on budget) → yellow (>90%) → red (over)

FILE: packages/ui/src/components/live-progress-bar.tsx
  - Project completion percentage
  - Updates as tasks are marked complete
  - Smooth animation on change

FILE: packages/ui/src/components/online-indicator.tsx
  - Small dot showing who's online in this project
  - Hover → shows names: "PM (Tim), Contractor (Mike)"
  - "On-site" badge when GPS check-in detected

FILE: packages/ui/src/components/live-toast.tsx
  - Toast notifications that appear for important real-time events
  - "Milestone payment approved ✓" slides in from corner
  - Auto-dismisses after 5 seconds
  - Click → navigates to detail
```

---

## PROMPT 35 — Natural Language Interface (Chat with the Platform)

```
Build a conversational AI interface where ANY user can interact with the platform via natural language.

This is the feature that makes clients say "I've never seen anything like this."

═══ PART A: PLATFORM CHAT ENGINE ═══

FILE: packages/ai-chat/src/chat-engine.ts

  CLASS: PlatformChatEngine

  This wraps Claude and gives it access to platform data. The AI can answer
  questions about projects, budgets, schedules, and take actions on behalf of users.

  METHOD: async chat(opts: {
    userId: string;
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }): Promise<{
    response: string;
    actions?: Array<{ type: string; description: string; data: any }>;
    sources?: Array<{ type: string; id: string; label: string }>;
  }>

  IMPLEMENTATION:

  1. Build system prompt with user context:
     - User's role, name, organization
     - List of their active projects (names, statuses, key metrics)
     - Current date/time
     - Available actions based on role

  2. Define tools (function calling) the AI can use:

     getProjectStatus(projectId: string)
       → Returns: phase, progress %, budget status, next milestone, recent activity
       → Pulls from: Project, BudgetSnapshot, Task (aggregate), WeeklyReport (latest)

     getProjectBudget(projectId: string)
       → Returns: total budget, spent, remaining, variance %, top expenses, forecast
       → Pulls from: BudgetSnapshot, FinancialTransaction

     getProjectSchedule(projectId: string)
       → Returns: start date, expected end, milestones with dates/status, critical path items
       → Pulls from: Project, Task, Milestone

     getProjectPhotos(projectId: string, opts?: { recent?: boolean; siteVisitId?: string })
       → Returns: URLs of recent photos with dates and visit context
       → Pulls from: Document WHERE type='photo'

     getTaskList(projectId: string, opts?: { status?: string; assignedTo?: string })
       → Returns: tasks with status, assignee, due date
       → Pulls from: AutomationTask, Task

     getDecisionQueue(userId: string)
       → Returns: pending decisions with AI recommendations
       → Pulls from: DecisionQueue WHERE deciderId

     getBidStatus(projectId: string)
       → Returns: number of bids, top bid, AI recommendation
       → Pulls from: BidEvaluation, Bid

     getContractorInfo(contractorId: string)
       → Returns: name, trades, rating, active projects, reliability score
       → Pulls from: User, MarketplaceProfile, ContractorScore

     getWeeklyReport(projectId: string, opts?: { weekOf?: string })
       → Returns: full weekly report content
       → Pulls from: WeeklyReport

     searchProjects(query: string)
       → Fuzzy search across user's projects by name, address, contractor, status

     // ACTION tools (role-gated):
     approveDecision(decisionId: string, option: string)
       → Only for the decision's assigned decider
       → Resolves the decision + triggers downstream

     rescheduleTask(taskId: string, newDate: string, reason: string)
       → Only for PM/Admin
       → Updates schedule + checks dependencies

     sendMessage(recipientId: string, message: string, projectId?: string)
       → Sends in-app message on behalf of user

     requestChangeOrder(projectId: string, description: string, estimatedCost?: number)
       → Only for PM/Contractor
       → Creates CO draft

  3. Call Claude with:
     - System prompt (user context + available tools + instructions)
     - Conversation history
     - User's message
     - Tool definitions

  4. Process tool calls:
     - Execute each tool against the real database
     - Return results to Claude for final response

  5. Security:
     - Every tool call validates the user has access to the requested data
     - Uses same requireProjectMembership logic from Prompt 26
     - Action tools require appropriate role
     - Log all chat interactions for audit trail

  SYSTEM PROMPT TEMPLATE:
  """
  You are the Kealee Platform assistant. You help {{user.firstName}} ({{user.role}})
  manage their construction projects. Today is {{currentDate}}.

  {{user.firstName}} has these active projects:
  {{#each projects}}
  - {{this.name}} at {{this.address}} ({{this.status}}, {{this.progress}}% complete)
  {{/each}}

  RULES:
  - Always give specific numbers (dollars, dates, percentages) not vague answers
  - If you need to look something up, use the tools — don't guess
  - For questions about a specific project, use getProjectStatus first
  - When the user says "my project" and has only one, assume that one
  - When the user says "my project" and has multiple, ask which one
  - You can take actions (approve, reschedule, message) if the user asks — confirm before executing
  - Keep responses concise but complete
  - Use conversational tone, not corporate speak
  """

═══ PART B: CHAT UI COMPONENT ═══

FILE: packages/ui/src/components/platform-chat.tsx

  Floating chat widget available on ALL dashboard pages.

  DESIGN:
  - Chat bubble in bottom-right corner (like Intercom but it's AI)
  - Click → opens chat panel (400px wide, full height)
  - Shows conversation history
  - Text input with send button
  - Typing indicator while AI processes
  - Rich responses: can include mini-charts, links, action buttons
  - If AI suggests an action → shows confirmation button inline:
    "I can approve the $4,200 milestone payment for the Jones kitchen.
     [Approve Now] [Let me review first]"
  - Can show inline project cards, photo thumbnails, budget summaries
  - Minimize button to hide

  MOBILE:
  - Full-screen chat when opened on mobile
  - Same functionality

  STATE:
  - Conversation persists for the session
  - Optional: save to database for continuity across sessions
  - User can start a new conversation anytime

═══ PART C: EXAMPLE CONVERSATIONS ═══

  CLIENT:
    User: "How's my kitchen project going?"
    AI: [calls getProjectStatus] → "Your kitchen renovation at 1234 Oak St is 64% complete
         and 3 days ahead of schedule. Budget is at $28,400 of $42,000 (67.6%).
         Cabinets were installed Tuesday and your PM noted excellent fit and finish.
         Next up: countertop templating this Thursday. Want to see this week's photos?"

    User: "Yes"
    AI: [calls getProjectPhotos(recent=true)] → Shows 6 photos from latest visit with descriptions.

    User: "Is there anything I need to do?"
    AI: [calls getDecisionQueue] → "Yes — there's one item waiting for you.
         The plumbing rough-in milestone is complete and passed inspection.
         Ready to release the $3,800 milestone payment to contractor?
         [Approve Payment] [View Details First]"

  PM:
    User: "What's my day look like?"
    AI: [calls getDecisionQueue + getTaskList for today] →
        "You have 3 decisions waiting and 2 site visits scheduled:

         Decisions:
         1. Bid award for Smith bathroom — AI recommends Carter Plumbing ($14,200)
         2. Change order approval for Jones kitchen — additional outlet ($280)
         3. Payment release for Park deck — $6,500 milestone

         Site visits:
         10:00 AM — Jones Kitchen (1234 Oak St) — cabinet inspection
         2:00 PM — Park Deck (567 Pine Ave) — framing check

         Want me to approve the small change order for $280 automatically?"

    User: "Yes approve that, and what's the budget situation on the Park deck?"
    AI: [calls approveDecision + getProjectBudget] →
        "Done — change order #003 approved for $280.

         Park Deck budget: $24,200 of $28,000 spent (86.4%).
         You have $3,800 remaining with one milestone left (decking + railing).
         The remaining milestone estimate is $3,200 so you should finish
         $600 under budget. No concerns."

  CONTRACTOR:
    User: "When's my next payment coming?"
    AI: [calls getProjectStatus + getBidStatus] →
        "Your framing milestone on the Johnson addition is marked complete.
         Inspection is scheduled for tomorrow at 10 AM. If it passes,
         the client will be prompted to release $8,500 within 24 hours.
         Typical payout hits your bank 2-3 business days after approval."

═══ PART D: ROUTES ═══

FILE: apps/api/src/routes/chat/index.ts

  POST /api/v1/chat
    - Body: { message: string; conversationId?: string }
    - Auth: requireAuth (any role)
    - Calls PlatformChatEngine.chat
    - Returns: { response, actions, sources, conversationId }
    - Streams response via SSE for real-time typing feel

  GET /api/v1/chat/history/:conversationId
    - Returns conversation history
    - Auth: requireAuth + verify ownership

FILE: packages/ai-chat/package.json
  {
    "name": "@kealee/ai-chat",
    "dependencies": {
      "@kealee/database": "workspace:*",
      "@kealee/automation": "workspace:*"
    }
  }
```

---

## PROMPT 36 — Agentic AI: Level 2 Autonomous Operations

```
Upgrade the AI agents from "recommend and wait" to "decide and act" for routine operations.

This is what lets one PM handle 30+ projects instead of 10.

═══ AUTONOMY LEVELS (CONFIGURABLE PER PROJECT) ═══

  Level 1 — AI recommends, human decides every time (current default)
  Level 2 — AI decides routine items, human approves major items (THIS PROMPT)
  Level 3 — AI decides most items, human reviews weekly (future)

═══ PART A: AUTONOMY CONFIGURATION ═══

FILE: packages/automation/src/autonomy/autonomy-config.ts

  Add to Project model (Prisma):
    autonomyLevel    Int     @default(1)   // 1, 2, or 3
    autonomyRules    Json?                 // custom overrides

  Default Level 2 rules:

  export const LEVEL_2_AUTO_APPROVE = {
    // These actions happen automatically without human approval:

    scheduling: {
      weatherReschedule: true,        // Reschedule outdoor tasks for rain/extreme weather
      maxDaysShift: 3,                // Auto-shift up to 3 days
      notifyAfter: true,              // Tell PM what was done
    },

    communications: {
      weeklyReportSend: true,         // Send weekly reports without PM review
      routineReminders: true,         // Send inspection reminders, payment reminders
      welcomeSequences: true,         // Onboarding emails
      progressUpdates: true,          // "Your project is X% complete" auto-updates to client
    },

    taskManagement: {
      createFollowUpTasks: true,      // When QA finds issue → auto-create correction task
      assignToContractor: true,       // Auto-assign tasks to project's contractor
      updatePhase: true,              // Auto-advance project phase when all phase tasks done
      overdueEscalation: true,        // Auto-escalate overdue tasks (notify PM)
    },

    budgetTracking: {
      processReceipts: true,          // OCR and categorize without human review
      varianceAlertThreshold: 0.10,   // Only alert PM if variance > 10%
      autoCategorizeMaterials: true,  // Auto-tag expense categories
    },

    qualityAssurance: {
      lowSeverityAutoCreate: true,    // LOW severity QA findings → auto-create task, no PM alert
      mediumSeverityNotify: true,     // MEDIUM → notify PM but create task automatically
      highSeveritySendAll: true,      // HIGH → notify PM + contractor + create urgent task
      criticalBlockProject: true,     // CRITICAL → pause milestone, require PM review
    },

    bidManagement: {
      autoRejectLateBids: true,       // Bids after deadline auto-rejected
      autoRejectOverpricedBids: true, // Bids > 3% above suggested price auto-rejected
      notifyContractorOnReject: true, // Send rejection notification with reason
    },

    documents: {
      autoGenerateInvoices: true,     // Generate milestone invoices automatically
      autoGeneratePunchLists: true,   // Generate punch lists from QA findings automatically
    },

    permits: {
      autoCheckExpiration: true,      // Auto-alert 30/14/7 days before permit expires
      autoPreReview: true,            // AI pre-review permit applications before submission
    },
  };

  // These ALWAYS require human approval at Level 2:
  export const LEVEL_2_HUMAN_REQUIRED = [
    'bid_award',                      // Which contractor wins
    'change_order_over_500',          // Change orders > $500
    'milestone_payment_release',      // Releasing escrow funds
    'contract_modification',          // Any contract changes
    'schedule_change_over_5_days',    // Major schedule shifts
    'project_pause_or_cancel',        // Stopping a project
    'budget_increase',                // Increasing total budget
    'high_critical_qa_resolution',    // How to fix serious issues
    'contractor_replacement',         // Swapping contractors
    'scope_change',                   // Changing project scope
  ];

═══ PART B: AUTONOMOUS ACTION ENGINE ═══

FILE: packages/automation/src/autonomy/action-engine.ts

  CLASS: AutonomousActionEngine

  METHOD: async evaluateAndAct(event: {
    type: string;
    projectId: string;
    data: any;
    suggestedAction: any;      // what the AI agent recommends
    appId: string;
  })

  LOGIC:
  1. Get project's autonomy level and rules
  2. Check if this action type is auto-approved at this level
  3. If auto-approved:
     a. Execute the action immediately
     b. Log to AutonomousActionLog (new model):
        { projectId, actionType, decision: 'auto_approved', data, reasoning }
     c. Notify PM via real-time (light notification, not blocking):
        "Auto-action: Rescheduled exterior painting to Monday due to Thursday rain forecast"
     d. Return { executed: true, method: 'autonomous' }
  4. If human-required:
     a. Create DecisionQueue entry (existing flow)
     b. Return { executed: false, method: 'queued_for_human' }

  METHOD: async getActionLog(projectId: string, opts?: { since?: Date; limit?: number })
    - Returns all autonomous actions taken on a project
    - PM and client can review what the AI did

  Add model to Prisma:
  model AutonomousActionLog {
    id          String   @id @default(uuid())
    projectId   String
    actionType  String
    decision    String   // 'auto_approved', 'auto_rejected', 'queued_for_human'
    data        Json
    reasoning   String   @db.Text
    revertedBy  String?  // userId if a human overrode this
    revertedAt  DateTime?
    createdAt   DateTime @default(now())
    @@index([projectId, createdAt])
  }

═══ PART C: INTEGRATE INTO COMMAND CENTER APPS ═══

  UPDATE APP-03 Change Order Processor:
    After generating change order:
    - If amount <= $500 AND autonomy >= 2 → auto-approve, notify PM
    - If amount > $500 → queue for human approval

  UPDATE APP-07 Budget Tracker:
    After receipt OCR:
    - If variance < 10% → log silently, update budget
    - If variance 10-20% → auto-create alert, notify PM
    - If variance > 20% → create decision card, pause related tasks

  UPDATE APP-09 Task Queue:
    After phase tasks all complete:
    - If autonomy >= 2 → auto-advance to next phase, notify PM
    - Create next phase's tasks automatically

  UPDATE APP-12 Smart Scheduler:
    After weather check:
    - If outdoor task and rain forecast → auto-reschedule to next clear day (within 3-day limit)
    - Notify affected parties via APP-08
    - If shift > 3 days → queue for PM decision

  UPDATE APP-13 QA Inspector:
    After finding issue:
    - LOW: auto-create correction task assigned to contractor
    - MEDIUM: auto-create task + notify PM
    - HIGH: create task + notify PM + contractor + block milestone
    - CRITICAL: all of above + create urgent decision card

  UPDATE APP-01 Bid Engine:
    - Auto-reject bids after deadline
    - Auto-reject bids over 3% ceiling
    - Send automated rejection notifications with reason

═══ PART D: AUTONOMOUS ACTION FEED (UI) ═══

FILE: apps/os-pm/app/(workspace)/autonomous-actions/page.tsx

  Dashboard showing all AI-taken actions across PM's projects:
  - Filter by project, action type, date
  - Each action shows: timestamp, project, what was done, reasoning
  - "Revert" button on each action (undoes the action and logs reversion)
  - Summary stats: "This week: 47 auto-actions, 12 queued for you, 0 reverted"
  - This gives PM confidence that AI is working correctly

FILE: apps/m-project-owner/app/(dashboard)/ai-activity/page.tsx

  Client-facing version (simpler):
  - "Things we handled automatically this week"
  - "Rescheduled painting for weather — no impact on your timeline"
  - "Processed 8 receipts — your budget is on track"
  - Builds trust that the platform is actively managing their project
```

---

## PROMPT 37 — Contractor Reliability Scoring

```
Build a dynamic contractor reliability scoring system that improves matching from day one.

Even without historical data, score contractors on measurable behaviors that correlate with quality.

═══ PART A: SCORING MODEL ═══

FILE: packages/scoring/src/contractor-score.ts

  Add to Prisma:
  model ContractorScore {
    id              String   @id @default(uuid())
    contractorId    String   @unique
    
    // Component scores (0-100 each)
    responsivenessScore    Int    @default(50)  // How fast they bid, reply, upload
    uploadComplianceScore  Int    @default(50)  // Do they upload photos/receipts consistently
    bidAccuracyScore       Int    @default(50)  // How close are bids to actual costs
    scheduleAdherenceScore Int    @default(50)  // Do they finish milestones on time
    qualityScore           Int    @default(50)  // QA inspection results
    clientSatisfactionScore Int   @default(50)  // Client reviews
    safetyScore            Int    @default(50)  // Safety violations from QA
    
    // Composite
    overallScore           Int    @default(50)  // Weighted average
    
    // Metadata
    projectsCompleted      Int    @default(0)
    totalBidsSubmitted     Int    @default(0)
    avgBidResponseTime     Int?                 // hours
    dataPoints             Int    @default(0)   // how many data points feed the score
    confidence             String @default("low") // low, medium, high (based on dataPoints)
    
    lastCalculated         DateTime @default(now())
    @@index([overallScore])
  }

  CLASS: ContractorScoringService

  WEIGHTS:
    responsiveness:     15%
    uploadCompliance:   10%
    bidAccuracy:        15%
    scheduleAdherence:  20%  ← Highest weight: finishing on time matters most
    quality:            20%  ← Tied highest: QA results
    clientSatisfaction: 15%
    safety:              5%

  METHOD: async calculateScore(contractorId: string): Promise<ContractorScore>

  SCORING RULES:

  Responsiveness (15%):
    - Bid response time:
      < 4 hours = 100, < 12 hours = 85, < 24 hours = 70, < 48 hours = 50, > 48 hours = 30
    - Message response time: same scale
    - Average across all interactions

  Upload Compliance (10%):
    - % of site visits where contractor uploaded photos = 0-100
    - % of expenses with receipt uploaded = 0-100
    - Daily log completion rate = 0-100
    - Average of the three

  Bid Accuracy (15%):
    - For completed projects: (bid amount - actual cost) / bid amount
    - < 5% difference = 100, < 10% = 85, < 15% = 70, < 25% = 50, > 25% = 30
    - Penalize more for under-bidding (cost overruns) than over-bidding

  Schedule Adherence (20%):
    - % of milestones completed on time = 0-100
    - Days late penalty: 1-3 days late = -5 per day, 4-7 = -8 per day, 7+ = -10 per day
    - Bonus: early completion = +5 per day (up to +15)

  Quality (20%):
    - QA inspection pass rate (first time, no corrections needed)
    - 100% pass = 100, 90% = 85, 80% = 70, 70% = 50, < 70% = 30
    - Weighted by severity: critical failures count 3x

  Client Satisfaction (15%):
    - Star rating average (1-5) → map to 0-100
    - Factor in number of reviews (more reviews = more confident score)
    - New contractors with 0 reviews get 50 (neutral)

  Safety (5%):
    - Safety violations from QA photos (PPE, fall protection, site cleanliness)
    - 0 violations = 100, 1 = 85, 2-3 = 60, 4+ = 30

  CONFIDENCE LEVELS:
    0-5 data points: "low" — score is mostly defaults, clearly labeled
    6-15 data points: "medium" — emerging pattern
    16+ data points: "high" — reliable score

  FOR NEW CONTRACTORS (0 data points):
    - Start at 50 across all components
    - Label as "New — no track record yet"
    - Don't penalize or benefit them vs established contractors
    - After first project, score updates rapidly

  METHOD: async updateFromEvent(event: {
    type: 'bid_submitted' | 'milestone_completed' | 'qa_result' | 'review_received' | 'photo_uploaded' | 'message_replied';
    contractorId: string;
    data: any;
  })
    - Incrementally update relevant component score
    - Recalculate overall
    - Update confidence level

  CRON: Run full recalculation for all contractors weekly (Sunday night)
    - Catches any events that were missed
    - Applies decay: scores slowly trend toward 50 if no recent data (prevents stale scores)

═══ PART B: INTEGRATE INTO BID ENGINE (APP-01) ═══

  UPDATE APP-01 scoring formula:

  Current: 5 factors (price, timeline, trades, reviews, distance)
  New: 7 factors with contractor reliability score

  UPDATED WEIGHTS:
    priceScore:         25% (was 30%)
    timelineScore:      10% (same)
    reliabilityScore:   25% (NEW — from ContractorScore.overallScore)
    tradeMatchScore:    15% (same)
    reviewScore:        10% (was 15%, now complemented by reliability)
    distanceScore:      10% (same)
    availabilityBonus:   5% (NEW — bonus if contractor has no overlapping projects)

  The reliability score means a contractor with an 85 reliability score
  and $45K bid beats a contractor with a 55 reliability score and $42K bid.
  Clients get better outcomes, not just cheaper bids.

═══ PART C: CONTRACTOR PROFILE ENHANCEMENT ═══

FILE: apps/marketplace/contractor-profile/[id]/page.tsx

  Public contractor profile shows:
  - Reliability badge: ★★★★☆ (4.2/5)
  - Or for new: "New to Kealee — Building Track Record"
  - Component breakdown (if enough data):
    "On-Time: 92% | Quality: 88% | Responsiveness: 95%"
  - Number of completed projects on platform
  - Verified badges: ✓ Licensed | ✓ Insured | ✓ Background Checked
  - Portfolio photos
  - Client reviews

  DO NOT show: exact numerical scores, ranking vs other contractors,
  or any data that could be gamed. Show qualitative badges.

FILE: apps/os-pm/app/(workspace)/contractor-rankings/page.tsx

  PM-only view:
  - Full leaderboard of contractors by overall score
  - Filter by trade, region, availability
  - Drill into any contractor: see all component scores with trend lines
  - "Recommend for [project]" button
  - Flag: "This contractor has declined 15% in quality score over 3 months"
```

---

## PROMPT 38 — Advanced Photo Intelligence

```
Upgrade APP-13 QA Inspector to do more than defect detection. Add progress tracking,
before/after comparison, and visual timeline capabilities.

═══ PART A: PROGRESS TRACKING BY PHOTO COMPARISON ═══

FILE: packages/automation/src/apps/qa-inspector/progress-analysis.ts

  METHOD: async analyzeProgress(opts: {
    projectId: string;
    currentPhotos: string[];     // URLs from latest visit
    previousPhotos?: string[];   // URLs from previous visit (auto-fetched if not provided)
  }): Promise<{
    overallProgress: number;     // 0-100 estimated completion
    changesDetected: Array<{
      area: string;              // "kitchen north wall", "bathroom floor"
      previousState: string;     // "framing complete"
      currentState: string;      // "drywall installed, taped, not mudded"
      progressDelta: number;     // estimated % progress in this area
    }>;
    areasOfConcern: Array<{
      area: string;
      concern: string;           // "No visible progress since last visit"
    }>;
    summary: string;             // Human-readable progress narrative
  }>

  IMPLEMENTATION:
  1. Get latest site visit photos for project
  2. Get previous site visit photos (most recent before current)
  3. Group photos by area/room if tags available
  4. For each current photo, send to Claude Vision with comparison prompt:

  System: "You are a construction progress analyst. Compare these two photos
  of the same construction area taken at different times. Identify what work
  has been completed between the visits. Be specific about construction phases
  (demolition, framing, rough-in, drywall, finishing, etc.)."

  User: [previous photo] "This was taken on {{previousDate}}."
        [current photo] "This was taken on {{currentDate}}."
        "What construction progress occurred between these photos?"

  5. Aggregate all area analyses into overall progress estimate
  6. Flag areas with no visible progress (potential delay indicator)
  7. Feed analysis to APP-11 Predictive Engine

═══ PART B: VISUAL TIMELINE ═══

FILE: packages/automation/src/apps/qa-inspector/visual-timeline.ts

  METHOD: async generateVisualTimeline(projectId: string): Promise<{
    timeline: Array<{
      date: string;
      siteVisitId: string;
      photos: Array<{ url: string; thumbnailUrl: string; area?: string }>;
      progressPercent: number;
      summary: string;
      milestone?: string;        // if a milestone was reached this visit
    }>;
  }>

  - Queries all site visits for the project chronologically
  - For each visit: representative photos, progress estimate, summary
  - Client sees: a scrollable visual timeline of their project from start to current

FILE: packages/ui/src/components/visual-timeline.tsx

  UI component:
  - Horizontal scrolling timeline
  - Each node: date, key photo thumbnail, progress %, brief summary
  - Click any node → expands to show all photos from that visit
  - Smooth transition/animation between nodes
  - Current milestone highlighted
  - "Before" and "After" toggle: first visit photos vs latest photos side by side

FILE: apps/m-project-owner/app/(dashboard)/project/[id]/timeline/page.tsx
  - Full-page visual timeline for client's project
  - This is the "wow" page that clients show their friends

═══ PART C: BEFORE/AFTER COMPARISON ═══

FILE: packages/ui/src/components/before-after-slider.tsx

  Interactive slider component:
  - Two photos overlaid
  - Drag slider left/right to reveal before vs after
  - Commonly used in renovation marketing
  - Auto-generated from first site visit vs latest
  - Also available for each milestone: before milestone started vs after complete

  Auto-generation:
  - APP-13 identifies "same area" photos across visits using Claude Vision
  - Pairs them automatically
  - Creates BeforeAfterPair records:
    model BeforeAfterPair {
      id          String  @id @default(uuid())
      projectId   String
      area        String
      beforeUrl   String
      afterUrl    String
      beforeDate  DateTime
      afterDate   DateTime
      @@index([projectId])
    }

═══ PART D: ENHANCED QA REPORTS ═══

  UPDATE APP-04 Report Generator to include:
  - Progress comparison section (this visit vs last visit)
  - Before/after photo pairs for completed areas
  - Visual progress percentage with photo evidence
  - "Areas with no progress" callout (if any)

  Weekly report to client now includes:
  "This week, drywall was installed in the kitchen and living room (photos below).
   The bathroom tile work is 60% complete. No progress was observed on the
   exterior painting, which is consistent with the schedule — painting is
   set to begin after interior work is complete."

  This is a dramatically better report than "Construction continued this week."
```

---

## PROMPT 39 — Observability & Distributed Tracing

```
Implement OpenTelemetry tracing, structured logging, and monitoring dashboards.

You cannot scale what you cannot see. This is infrastructure that pays for itself
the first time something goes wrong and you diagnose it in 60 seconds instead of 6 hours.

═══ PART A: OPENTELEMETRY SETUP ═══

FILE: packages/observability/src/tracing.ts

  import { NodeSDK } from '@opentelemetry/sdk-node';
  import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
  import { Resource } from '@opentelemetry/resources';
  import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

  export function initTracing(serviceName: string) {
    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
    });
    sdk.start();
    return sdk;
  }

  // Wrap any function with tracing
  export function withSpan<T>(
    name: string,
    attributes: Record<string, string>,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = trace.getTracer('kealee-platform');
    return tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  // Middleware for Fastify
  export function tracingPlugin(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request) => {
      // Extract or create trace context
      // Attach traceId to request for downstream use
      request.traceId = extractTraceId(request.headers) || generateTraceId();
    });

    fastify.addHook('onResponse', async (request, reply) => {
      // Log: method, path, status, duration, traceId
    });
  }

═══ PART B: TRACE PROPAGATION THROUGH COMMAND CENTER ═══

  Every BullMQ job carries traceId:

  UPDATE queue factory (packages/automation/src/infrastructure/queues.ts):
  - When adding jobs: include traceId in job data
  - When processing jobs: extract traceId, create child span
  - Event bus messages: include traceId in payload
  - All database queries within a traced context: create child spans

  RESULT: A single client action (e.g., "approve milestone payment") produces
  a trace that shows:
    API request (42ms)
    └── DecisionQueue.resolve (8ms)
    └── APP-14 processDecision (15ms)
    └── Stripe.createTransfer (920ms)
    └── APP-07 updateBudget (12ms)
    └── APP-08 sendNotification (380ms)
        ├── Resend.sendEmail (310ms)
        └── Twilio.sendSMS (65ms)
    └── DB writes: 6 operations (24ms)
    └── Realtime.broadcast (3ms)
  Total: 1,404ms

  Any slowness or failure is immediately visible and pinpointed.

═══ PART C: STRUCTURED LOGGING ═══

FILE: packages/observability/src/logger.ts

  import pino from 'pino';

  export function createLogger(serviceName: string) {
    return pino({
      level: process.env.LOG_LEVEL || 'info',
      base: { service: serviceName, env: process.env.NODE_ENV },
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  // Context-aware logging
  export function withContext(logger: pino.Logger, context: {
    traceId?: string;
    userId?: string;
    projectId?: string;
    appId?: string;
    jobId?: string;
  }) {
    return logger.child(context);
  }

  EVERY log line includes:
    { level, service, traceId, userId, projectId, appId, message, timestamp, ...data }

  Ship logs to: Axiom (recommended, good free tier) or Datadog or Loki

═══ PART D: HEALTH METRICS ENDPOINT ═══

FILE: apps/api/src/routes/health/index.ts

  GET /health
    Returns:
    {
      status: 'healthy' | 'degraded' | 'unhealthy',
      version: '10.0.0',
      uptime: 86400,
      checks: {
        database: { status: 'up', latency: 12 },
        redis: { status: 'up', latency: 3 },
        stripe: { status: 'up' },
        anthropic: { status: 'up' },
        resend: { status: 'up' },
        queues: {
          bidEngine: { depth: 2, processing: 1 },
          communicationHub: { depth: 0, processing: 0 },
          // ... all queues
        }
      }
    }

  Used by: Railway health checks, monitoring dashboards, internal status page

═══ PART E: MONITORING DASHBOARD ═══

  Option 1: Use Grafana Cloud (free tier) with Prometheus metrics
  Option 2: Build into os-admin dashboard (Prompt 16, enhanced)

  If building into os-admin:

  FILE: apps/os-admin/app/(dashboard)/monitoring/page.tsx

  Dashboard panels:
  - System Status: traffic light for each service (DB, Redis, Stripe, Claude, Email, SMS)
  - Request Rate: chart showing API requests per minute (last 24h)
  - Error Rate: chart showing errors per minute with annotations for spikes
  - Queue Health: all 14 queues with depth, processing rate, failed jobs
  - Top Slow Traces: list of slowest traces in last hour (click to view full trace)
  - AI Usage: Claude API calls today, tokens consumed, estimated cost
  - Active Users: real-time count of connected users (from presence system)

FILE: packages/observability/package.json
  {
    "name": "@kealee/observability",
    "dependencies": {
      "@opentelemetry/sdk-node": "^0.52.0",
      "@opentelemetry/exporter-trace-otlp-http": "^0.52.0",
      "@opentelemetry/semantic-conventions": "^1.25.0",
      "pino": "^9.0.0"
    }
  }
```

---

## PROMPT 40 — Smart Scheduling with Weather Integration

```
Upgrade APP-12 Smart Scheduler to pull real weather data and automatically
adjust outdoor tasks. Also add GPS-based crew tracking.

═══ PART A: WEATHER SERVICE ═══

FILE: packages/scheduling/src/weather.ts

  import axios from 'axios';

  // Use Open-Meteo (free, no API key needed) or WeatherAPI.com (free tier)

  export async function getForecast(opts: {
    latitude: number;
    longitude: number;
    days: number;             // 1-14 day forecast
  }): Promise<Array<{
    date: string;
    tempHigh: number;         // °F
    tempLow: number;
    precipitation: number;    // mm
    precipProbability: number; // 0-100%
    windSpeed: number;        // mph
    conditions: string;       // 'clear', 'rain', 'snow', 'thunderstorm'
    workable: boolean;        // true if conditions allow outdoor work
  }>>

  WORKABILITY RULES (construction industry standards):
  - Rain > 0.1 inches → not workable for: concrete, painting, roofing, excavation
  - Wind > 25 mph → not workable for: crane ops, roofing, high work
  - Temp < 32°F → not workable for: concrete, painting, masonry
  - Temp > 105°F → not workable for: ANY outdoor work (safety)
  - Snow / ice → not workable for: most exterior work
  - Rain is fine for: interior work, demolition, electrical rough-in, plumbing

  Each trade has different weather sensitivity:
  export const TRADE_WEATHER_SENSITIVITY = {
    roofing: { maxRain: 0, maxWind: 20, minTemp: 40, maxTemp: 100 },
    concrete: { maxRain: 0, maxWind: 30, minTemp: 40, maxTemp: 95 },
    painting_exterior: { maxRain: 0, maxWind: 15, minTemp: 50, maxTemp: 90 },
    excavation: { maxRain: 0.5, maxWind: 30, minTemp: 20, maxTemp: 105 },
    framing: { maxRain: 0.1, maxWind: 25, minTemp: 20, maxTemp: 105 },
    electrical: { maxRain: 999, maxWind: 999, minTemp: 0, maxTemp: 999 }, // interior, no weather issues
    plumbing: { maxRain: 999, maxWind: 999, minTemp: 0, maxTemp: 999 },   // interior
    // ... all trades
  };

═══ PART B: AUTO-RESCHEDULING ═══

FILE: packages/scheduling/src/weather-scheduler.ts

  CLASS: WeatherAwareScheduler

  METHOD: async checkAndReschedule(): Promise<Array<{
    taskId: string;
    projectId: string;
    originalDate: string;
    newDate: string;
    reason: string;
    autoApproved: boolean;
  }>>

  RUNS: Daily at 6 AM via cron (Prompt 18 update)

  LOGIC:
  1. Get all outdoor tasks scheduled for the next 7 days
  2. For each task:
     a. Get project location (lat/lng from address)
     b. Get weather forecast for task date
     c. Check if conditions are workable for the task's trade
     d. If NOT workable:
        - Find next workable day (search up to 7 days out)
        - Check for scheduling conflicts
        - If autonomy >= 2 AND shift <= 3 days:
          * Auto-reschedule
          * Notify contractor and PM
          * Log to AutonomousActionLog
        - If shift > 3 days OR autonomy < 2:
          * Create decision card for PM
          * Include weather data and suggested alternatives
  3. Return list of all changes made

  METHOD: async getWeatherRisks(projectId: string): Promise<{
    next7Days: Array<{ date, conditions, impactedTasks: string[] }>;
    recommendation: string;
  }>
    - Show PM upcoming weather and which tasks are at risk
    - "Thursday rain will impact roofing. Suggest moving interior work to Thursday, roofing to Friday (clear)."

═══ PART C: GPS CREW CHECK-IN ═══

FILE: packages/scheduling/src/crew-tracking.ts

  export async function recordCheckIn(opts: {
    userId: string;
    projectId: string;
    latitude: number;
    longitude: number;
    type: 'arrive' | 'depart';
  })
    1. Verify GPS coordinates are within 200m of project address
    2. Record: CrewCheckIn model (userId, projectId, timestamp, type, lat, lng)
    3. If arrival:
       - Broadcast real-time: "Contractor arrived on-site at 8:02 AM"
       - Start tracking work hours
    4. If departure:
       - Calculate hours on-site
       - Log to daily summary
       - Broadcast: "Contractor departed at 4:15 PM (8.2 hours on-site)"

  Used for:
  - Verifying contractor is actually on-site (trust building)
  - Automatic time tracking (hours on-site per day)
  - Client satisfaction: "Your contractor is on-site right now"
  - Labor cost verification: compare invoiced hours vs tracked hours
  - Safety: know who's on-site in case of emergency

  Add model:
  model CrewCheckIn {
    id          String   @id @default(uuid())
    userId      String
    projectId   String
    latitude    Decimal  @db.Decimal(10,8)
    longitude   Decimal  @db.Decimal(10,8)
    type        String   // arrive, depart
    verified    Boolean  @default(false)  // within geofence?
    hoursOnSite Decimal? @db.Decimal(4,2) // calculated on departure
    createdAt   DateTime @default(now())
    @@index([projectId, createdAt])
    @@index([userId, createdAt])
  }

═══ PART D: WEATHER UI ═══

FILE: packages/ui/src/components/weather-forecast-bar.tsx
  - Horizontal bar showing 7-day forecast for project location
  - Each day: icon (sun/cloud/rain), temp, workability indicator (green/red)
  - Shows which tasks are at risk
  - Displayed on project dashboard

FILE: packages/ui/src/components/crew-status.tsx
  - Shows who's currently on-site with arrival time
  - "On-site: Mike's Plumbing (arrived 8:02 AM, 6.3 hours)"
  - For client dashboard: simple "Your contractor is on-site" indicator
```

---

## PROMPT 41 — Audit Trail & Compliance Foundation

```
Build the audit logging system from day one. Every data access, modification, and
financial transaction is permanently logged.

This isn't just for SOC 2 — it's for trust. When a client asks "who approved that
payment?" you have an instant, irrefutable answer.

═══ PART A: AUDIT LOG MODEL & SERVICE ═══

FILE: packages/audit/src/audit.ts

  Add to Prisma:
  model AuditLog {
    id            String   @id @default(uuid())
    userId        String?              // who did it (null for system actions)
    userEmail     String?
    userRole      String?
    action        String               // CREATE, READ, UPDATE, DELETE, APPROVE, REJECT, LOGIN, EXPORT
    resource      String               // table/entity name
    resourceId    String?
    projectId     String?              // for project-scoped actions
    
    // What changed
    previousValue Json?    @db.JsonB   // snapshot before change
    newValue      Json?    @db.JsonB   // snapshot after change
    changedFields String[]             // which fields changed
    
    // Context
    ipAddress     String?
    userAgent     String?
    traceId       String?              // link to OpenTelemetry trace
    source        String?              // 'api', 'webhook', 'worker', 'cron', 'system'
    
    // Metadata
    description   String?              // human-readable: "Approved milestone payment of $4,200"
    createdAt     DateTime @default(now())
    
    @@index([userId, createdAt])
    @@index([resource, resourceId])
    @@index([projectId, createdAt])
    @@index([action, createdAt])
  }

  IMPORTANT: AuditLog table has NO update or delete permissions.
  Only INSERT is allowed. Even admins cannot modify audit logs.
  Implement via database role:
    GRANT INSERT ON "AuditLog" TO kealee_app;
    REVOKE UPDATE, DELETE ON "AuditLog" FROM kealee_app;

  CLASS: AuditService

  METHOD: async log(opts: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    projectId?: string;
    previousValue?: any;
    newValue?: any;
    description?: string;
    request?: { ip?: string; userAgent?: string; traceId?: string };
  })
    1. Calculate changedFields by diffing previousValue and newValue
    2. Sanitize sensitive fields (mask SSN, card numbers, passwords)
    3. Insert into AuditLog
    4. If action is financial (APPROVE, payment, escrow) → also log to FinancialAuditLog (separate table, extra retention)

  METHOD: async getAuditTrail(opts: {
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    projectId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  })
    - Query with filters
    - Return paginated results
    - Used by admin dashboard and compliance reports

  METHOD: async getProjectAuditTrail(projectId: string)
    - Complete history of everything that happened on a project
    - Sorted chronologically
    - Used for dispute resolution

═══ PART B: AUTO-AUDIT MIDDLEWARE ═══

FILE: packages/audit/src/middleware.ts

  Fastify plugin that auto-logs:
  - Every API mutation (POST, PUT, PATCH, DELETE) that modifies data
  - Every login/logout
  - Every file download/export
  - Every admin action

  For Prisma: middleware extension that auto-logs all write operations:

  prisma.$use(async (params, next) => {
    const result = await next(params);
    if (['create', 'update', 'delete'].includes(params.action)) {
      await auditService.log({
        action: params.action.toUpperCase(),
        resource: params.model,
        resourceId: result?.id,
        newValue: params.action === 'create' ? result : undefined,
        previousValue: params.action === 'update' ? /* fetch before */ : undefined,
      });
    }
    return result;
  });

═══ PART C: FINANCIAL AUDIT ═══

  Separate table for financial transactions — 7-year retention:

  model FinancialAuditLog {
    id              String   @id @default(uuid())
    transactionType String   // escrow_fund, escrow_release, subscription_payment, refund, payout
    amount          Decimal  @db.Decimal(12,2)
    currency        String   @default("USD")
    payerId         String?
    payeeId         String?
    projectId       String?
    stripeId        String?  // PaymentIntent ID, Transfer ID, etc.
    status          String
    approvedBy      String?  // userId who approved (for milestone releases)
    metadata        Json?
    createdAt       DateTime @default(now())
    @@index([projectId, createdAt])
    @@index([transactionType, createdAt])
  }

  Every Stripe webhook event creates a FinancialAuditLog entry.
  Every escrow operation creates a FinancialAuditLog entry.
  Every subscription event creates a FinancialAuditLog entry.

═══ PART D: AUDIT UI ═══

FILE: apps/os-admin/app/(dashboard)/audit/page.tsx
  - Searchable, filterable audit log viewer
  - Filter by: user, project, resource type, action, date range
  - Each entry expandable to show full before/after diff
  - Export to CSV for compliance audits
  - Financial audit tab with dedicated filters
  - Activity timeline view: see all actions for a specific entity

FILE: apps/m-project-owner/app/(dashboard)/project/[id]/activity/page.tsx
  - Client-friendly activity log for their project
  - Shows: "Payment of $4,200 approved by you on Feb 3"
  - Shows: "Inspection passed on Feb 2"
  - Shows: "Contract signed by all parties on Jan 15"
  - Builds transparency and trust
```

---

## PROMPT 42 — Client-Facing Analytics & Benchmarking

```
Give clients and PMs real-time analytics that make them feel in control.

═══ PART A: PROJECT ANALYTICS ENGINE ═══

FILE: packages/analytics/src/project-analytics.ts

  CLASS: ProjectAnalyticsService

  METHOD: async getProjectDashboardData(projectId: string): Promise<{
    // Status
    overallProgress: number;           // 0-100%
    daysElapsed: number;
    daysRemaining: number;             // estimated
    onSchedule: boolean;
    scheduleVariance: number;          // days ahead (+) or behind (-)

    // Budget
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    budgetUtilization: number;         // % spent
    projectedFinalCost: number;        // AI forecast
    costVariance: number;              // $ over/under

    // Performance
    milestonesCompleted: number;
    milestonesTotal: number;
    tasksCompleted: number;
    tasksTotal: number;
    qaPassRate: number;                // first-time inspection pass rate
    avgDaysPerMilestone: number;

    // Benchmarks
    vsBenchmark: {
      costVsAverage: number;           // "12% under average for kitchen renos in DC"
      durationVsAverage: number;       // "5 days faster than average"
      qualityVsAverage: number;        // "QA pass rate 15% above average"
    };

    // Trends
    weeklySpendTrend: Array<{ week: string; amount: number }>;
    progressTrend: Array<{ week: string; progress: number }>;
    
    // AI insights
    riskLevel: 'low' | 'medium' | 'high';
    topRisk: string;                   // "Countertop fabrication lead time may delay week 6"
    recommendation: string;            // "Consider scheduling flooring earlier to create buffer"
  }>

  METHOD: async getBenchmarkData(projectType: string, location: string): Promise<{
    avgCostPerSqft: number;
    avgDuration: number;               // days
    avgMilestoneCount: number;
    avgQaPassRate: number;
    sampleSize: number;                // how many projects this benchmark is based on
  }>
    - Initially: use assembly library data + industry averages (hardcoded)
    - Over time: calculate from actual platform data
    - Flag "benchmark based on N projects" for transparency

  METHOD: async getPortfolioAnalytics(orgId: string): Promise<{
    activeProjects: number;
    completedProjects: number;
    totalSpend: number;
    avgProjectDuration: number;
    avgCostVariance: number;
    avgScheduleVariance: number;
    topContractors: Array<{ name, projectsCompleted, avgRating }>;
    monthlySpend: Array<{ month, amount }>;
    projectsByType: Array<{ type, count }>;
    projectsByStatus: Array<{ status, count }>;
  }>
    - Portfolio-level analytics for developers and property managers

═══ PART B: ANALYTICS UI COMPONENTS ═══

FILE: packages/ui/src/components/analytics/project-health-card.tsx
  - Large card showing overall project health
  - Traffic light indicator: green/yellow/red
  - Key metrics: progress, budget, schedule, quality
  - "vs Benchmark" comparisons (e.g., "8% under average cost")
  - Click → expands to detailed view

FILE: packages/ui/src/components/analytics/budget-chart.tsx
  - Area chart: planned spend vs actual spend over time
  - Projected line showing where you'll end up
  - Red zone if projecting over budget
  - Built with Recharts

FILE: packages/ui/src/components/analytics/progress-chart.tsx
  - S-curve chart: planned progress vs actual progress
  - Industry standard construction progress visualization
  - Shows if project is ahead or behind

FILE: packages/ui/src/components/analytics/milestone-tracker.tsx
  - Horizontal timeline with milestones
  - Each: name, planned date, actual date (or projected), status
  - Visual: completed = green, in progress = blue, upcoming = gray, late = red

FILE: packages/ui/src/components/analytics/benchmark-comparison.tsx
  - Horizontal bar chart comparing this project vs average
  - "Your project: $145/sqft — Average: $162/sqft — You're saving 10.5%"
  - Feels great to clients. Reinforces value of using Kealee.

FILE: apps/m-project-owner/app/(dashboard)/project/[id]/analytics/page.tsx
  - Full analytics page for client's project
  - Health card, budget chart, progress chart, milestone tracker, benchmarks
  - AI insights panel at bottom: risk level + recommendation

FILE: apps/os-pm/app/(workspace)/analytics/page.tsx
  - PM analytics across all their projects
  - Portfolio health: how many green/yellow/red
  - This week's priorities based on AI analysis
  - Contractor performance comparison
```

---

## PROMPT 43 — Remote Inspection via Video (Basic AR)

```
Enable PMs to conduct remote inspections via live video call with annotation.

This isn't full AR headset — it's phone-based video with the ability to draw on
the live feed and capture screenshots. Cuts PM travel by 30-40%.

═══ PART A: VIDEO CALL INTEGRATION ═══

FILE: packages/video/src/video-call.ts

  Use Daily.co (simple WebRTC-based video API, generous free tier)
  or Twilio Video (you already have Twilio).

  export async function createVideoRoom(opts: {
    projectId: string;
    scheduledFor?: Date;
    participants: Array<{ userId: string; role: string }>;
  }): Promise<{
    roomUrl: string;
    roomId: string;
    token: string;            // per-participant token
  }>

  export async function createParticipantToken(roomId: string, userId: string, name: string)
    - Creates auth token for joining the room
    - Returns token

  export async function endVideoRoom(roomId: string)
    - End the call
    - Trigger: save all screenshots/annotations as site visit photos

═══ PART B: ANNOTATION LAYER ═══

FILE: packages/ui/src/components/video/annotated-video.tsx

  Client component that:
  - Shows live video feed from contractor's phone camera
  - PM can:
    * Tap to place a pin (marks a point of interest)
    * Draw circles/arrows on the video (red pen overlay)
    * Capture screenshot (saves current frame + annotations)
    * Add text note to any annotation
  - Contractor sees PM's annotations in real-time on their screen
  - All annotations are temporary (on the video) and permanent (on screenshots)

  TECH: Canvas overlay on top of video element. Use fabric.js for drawing tools.
  WebRTC data channel for sending annotation coordinates in real-time.

FILE: packages/ui/src/components/video/screenshot-capture.tsx
  - Captures video frame + annotation overlay as single image
  - Uploads to site-photos bucket via upload API
  - Tags as: type = 'remote_inspection', siteVisitId
  - These screenshots feed into APP-13 QA Inspector

═══ PART C: REMOTE INSPECTION WORKFLOW ═══

FILE: packages/automation/src/apps/visit-scheduler/remote-inspection.ts

  METHOD: async scheduleRemoteInspection(opts: {
    projectId: string;
    milestoneId: string;
    scheduledDate: Date;
    pmId: string;
    contractorId: string;
  })
    1. Create SiteVisit record: type = 'remote'
    2. Create video room
    3. Send calendar invites with video room link to PM + contractor
    4. Send reminder 1 hour before

  METHOD: async completeRemoteInspection(opts: {
    siteVisitId: string;
    screenshots: string[];     // URLs of captured screenshots
    notes: string;
    result: 'passed' | 'failed' | 'conditional';
  })
    1. Update SiteVisit: completed, result, notes
    2. Run all screenshots through APP-13 QA Inspector
    3. Generate inspection report
    4. If passed → trigger milestone completion chain
    5. If failed → create correction tasks

  PM can choose for each visit:
  - In-person visit (default for major milestones)
  - Remote inspection (for progress checks, minor milestones)
  - Hybrid: contractor sends photos + optional video walkthrough

  COST SAVINGS:
  - Average PM drive time per visit: 45 min each way
  - Average visits per project: 12-20
  - Remote inspections for 50% of visits saves 9-15 hours per project
  - At $75/hr PM cost = $675-$1,125 saved per project
  - With 20 active projects = $13,500-$22,500/month in PM time recovered
  - That time goes to managing MORE projects, not driving
```

---

## PROMPT 44 — Data Warehouse Foundation

```
Start collecting ALL platform data into a warehouse from day one.

The data you don't collect now is data you can never use later.
Start small: just pipe everything to a separate analytics database.

═══ PART A: EVENT COLLECTION ═══

FILE: packages/analytics/src/data-pipeline.ts

  Every significant event gets recorded in an analytics-optimized format:

  model AnalyticsEvent {
    id          String   @id @default(uuid())
    eventType   String   // 'project.created', 'bid.submitted', 'payment.released', etc.
    userId      String?
    projectId   String?
    orgId       String?
    
    // Denormalized data (so analytics queries don't need JOINs)
    projectType    String?
    projectRegion  String?
    userRole       String?
    contractorId   String?
    
    // Event-specific data
    data        Json     @db.JsonB
    
    // Financials (denormalized for fast aggregation)
    amount      Decimal? @db.Decimal(12,2)
    
    timestamp   DateTime @default(now())
    
    @@index([eventType, timestamp])
    @@index([projectId, timestamp])
    @@index([userId, timestamp])
    @@index([projectType, projectRegion, timestamp])
  }

  export async function trackEvent(event: {
    type: string;
    userId?: string;
    projectId?: string;
    data: Record<string, any>;
    amount?: number;
  })
    - Enrich with denormalized fields (look up projectType, region, orgId)
    - Insert into AnalyticsEvent
    - Fire-and-forget (never block the main operation)

═══ PART B: INSTRUMENT EVERYTHING ═══

  Add trackEvent calls throughout the platform:

  SIGNUP & ONBOARDING:
    trackEvent({ type: 'user.signed_up', data: { role, source, referrer }})
    trackEvent({ type: 'user.onboarding_started', data: { step: 1 }})
    trackEvent({ type: 'user.onboarding_completed', data: { durationMinutes }})
    trackEvent({ type: 'user.profile_completed', data: { completeness: 80 }})

  MARKETPLACE:
    trackEvent({ type: 'lead.created', data: { projectType, budget, location }})
    trackEvent({ type: 'lead.matched', data: { contractorCount, matchScore }})
    trackEvent({ type: 'bid.submitted', amount, data: { responseTimeHours }})
    trackEvent({ type: 'bid.accepted', amount, data: { bidRank, vsRecommended }})
    trackEvent({ type: 'bid.rejected', data: { reason }})

  PROJECT LIFECYCLE:
    trackEvent({ type: 'project.created', data: { type, estimatedBudget, duration }})
    trackEvent({ type: 'project.milestone_completed', data: { milestoneNumber, daysVsPlan }})
    trackEvent({ type: 'project.completed', data: { actualDuration, actualCost, satisfaction }})

  FINANCIAL:
    trackEvent({ type: 'escrow.funded', amount })
    trackEvent({ type: 'payment.released', amount, data: { milestone, daysToApprove }})
    trackEvent({ type: 'subscription.created', amount, data: { plan, billingCycle }})
    trackEvent({ type: 'subscription.churned', data: { reason, monthsActive }})

  AI OPERATIONS:
    trackEvent({ type: 'ai.prediction_made', data: { predictionType, confidence, projectId }})
    trackEvent({ type: 'ai.prediction_outcome', data: { predicted, actual, accurate }})
    trackEvent({ type: 'ai.qa_inspection', data: { issuesFound, severity, falsePositives }})
    trackEvent({ type: 'ai.autonomous_action', data: { actionType, reverted }})

  ENGAGEMENT:
    trackEvent({ type: 'chat.message_sent', data: { channel, responseTimeMinutes }})
    trackEvent({ type: 'report.viewed', data: { reportType }})
    trackEvent({ type: 'decision.resolved', data: { decisionType, responseTimeHours }})
    trackEvent({ type: 'notification.clicked', data: { notificationType, channel }})

═══ PART C: ANALYTICS QUERIES ═══

FILE: packages/analytics/src/queries.ts

  Pre-built analytical queries:

  async function getRevenueMetrics(period: 'day' | 'week' | 'month')
    - MRR, new subscriptions, churned, net revenue
    - Revenue by product category
    - Revenue by region

  async function getMarketplaceHealth(period)
    - Leads created, bids submitted, bid-to-lead ratio
    - Avg time to first bid, avg bids per lead
    - Lead conversion rate (lead → project)
    - Avg project value

  async function getOperationalMetrics(period)
    - Projects active, completed, started
    - Avg milestone completion time
    - QA pass rate trend
    - Budget variance trend
    - AI prediction accuracy

  async function getContractorMetrics()
    - Active contractors, new signups
    - Avg bids per contractor
    - Win rate distribution
    - Reliability score distribution

  async function getClientMetrics()
    - Active clients, new signups
    - Avg projects per client
    - Client satisfaction trend
    - Repeat client rate

  async function getAIPerformanceMetrics()
    - Prediction accuracy over time
    - QA false positive rate
    - Autonomous actions taken vs reverted
    - Cost savings from automation (estimated)

═══ PART D: ADMIN ANALYTICS DASHBOARD ═══

FILE: apps/os-admin/app/(dashboard)/analytics/page.tsx

  Executive dashboard:
  - Revenue: MRR chart, ARR projection, revenue by product
  - Marketplace: lead funnel (leads → bids → projects), conversion rates
  - Operations: active projects map (plotted on DC-Baltimore corridor), health distribution
  - AI: prediction accuracy trend, QA detection rate, automation coverage
  - Growth: new users, retention, churn

  This dashboard tells you the health of the entire business at a glance.

FILE: packages/analytics/package.json
  {
    "name": "@kealee/analytics",
    "dependencies": {
      "@kealee/database": "workspace:*"
    }
  }
```

---

## PROMPT 45 — Multi-Tenant Architecture Foundation

```
Architect the platform for multi-tenancy from day one so white-labeling
is a configuration change, not a rebuild.

═══ PART A: TENANT CONFIGURATION MODEL ═══

  Add to Prisma:
  model TenantConfig {
    id              String   @id @default(uuid())
    organizationId  String   @unique
    organization    Organization @relation(fields: [organizationId], references: [id])
    
    // Branding
    brandName       String   @default("Kealee")
    logoUrl         String?
    primaryColor    String   @default("#2563eb")   // Tailwind blue-600
    accentColor     String   @default("#059669")   // Tailwind emerald-600
    faviconUrl      String?
    
    // Domain
    customDomain    String?  @unique                // "pm.theircompany.com"
    
    // Email
    emailFromName   String   @default("Kealee")
    emailFromDomain String?                         // "notifications@theircompany.com"
    
    // Features (which Command Center apps are enabled)
    enabledApps     String[] @default(["all"])
    
    // Autonomy defaults
    defaultAutonomyLevel Int @default(1)
    
    // Billing
    platformFeePercent  Decimal @default(3.5) @db.Decimal(4,2)
    
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }

═══ PART B: TENANT-AWARE RENDERING ═══

FILE: packages/ui/src/providers/tenant-provider.tsx

  export function TenantProvider({ children }) {
    // Fetch TenantConfig based on:
    // 1. Custom domain (if accessing via pm.theircompany.com)
    // 2. Organization ID from logged-in user
    // 3. Default to Kealee branding
    
    // Provide via React context:
    // - brandName, logo, colors, features
    // - Used by all UI components
  }

FILE: packages/ui/src/components/brand-logo.tsx
  - Renders tenant's logo if set, otherwise Kealee logo

FILE: packages/ui/src/components/themed-button.tsx
  - Uses tenant's primary color

  Update email templates to use tenant branding:
  - Logo from TenantConfig
  - Brand name from TenantConfig
  - Colors from TenantConfig
  - "Powered by Kealee" in footer (always present for white-label)

═══ PART C: DATA ISOLATION ═══

  Already handled by Prompt 26 (RBAC + RLS).
  Tenants can only see their organization's data.
  No additional work needed — just verify all queries are org-scoped.

═══ PART D: WHY BUILD THIS NOW ═══

  Building multi-tenant architecture INTO the platform from day one means:
  - Kealee's own operations are "Tenant #1" using default config
  - When the first white-label client signs up, you create a TenantConfig row
  - They get their own branding, domain, and settings
  - ZERO code changes needed
  - Revenue from white-labeling starts in months, not years

  Without this foundation:
  - Every component has hardcoded "Kealee" branding
  - Every query assumes single-tenant
  - Adding white-label later requires touching every file in the codebase
  - 3-6 months of refactoring to add what could have been built in 1 week
```

---

## Revised Complete Build Order (Prompts 01–45)

```
FOUNDATION (Prompts 01-04):
  Prisma schema, BullMQ, Event bus, AI wrapper

CORE AUTOMATION (Prompts 05-18):
  All 15 Command Center apps, event routing, cron jobs

LIFECYCLE + API (Prompts 19-25):
  Onboarding, API routes, dashboards, deployment

PRODUCTION GAPS (Prompts 26-33):
  Auth/RBAC, Stripe, Communications, Uploads, Assemblies, Templates,
  Error handling, Marketing site

COMPETITIVE EDGE (Prompts 34-45):
  34 → Real-time WebSockets + presence
  35 → Natural language chat interface
  36 → Level 2 autonomous AI operations
  37 → Contractor reliability scoring
  38 → Advanced photo intelligence + visual timeline
  39 → Observability + distributed tracing
  40 → Weather-integrated scheduling + GPS crew tracking
  41 → Audit trail + compliance foundation
  42 → Client-facing analytics + benchmarking
  43 → Remote video inspection
  44 → Data warehouse foundation
  45 → Multi-tenant architecture foundation

TOTAL: 45 prompts → ~200+ files → Launch-ready with competitive moat
```

---

## What This Gets You vs. Competitors

| Capability | Typical Competitor | Kealee at Launch |
|---|---|---|
| Project dashboard updates | Refresh the page | Real-time, instant |
| Client communication | "Check your email" | Chat with AI: "How's my project?" |
| PM workload | 8-12 projects per PM | 25-35 projects per PM |
| Weather scheduling | Manual calendar check | Auto-reschedule, contractor notified |
| Quality inspection | PM drives to site | Remote video + AI photo analysis |
| Contractor selection | Reviews and gut feeling | AI scoring + reliability data |
| Budget tracking | Monthly spreadsheet update | Live, receipt-by-receipt, with forecasting |
| Progress visibility | Weekly email (maybe) | Visual timeline, before/after photos, live feed |
| Audit trail | "Let me check my files" | Every action logged, instant retrieval |
| Analytics | Manual reports | Real-time dashboards + benchmarking |
| Scalability | Hire more PMs | AI handles routine, PMs handle exceptions |
| White-label ready | Years away | Architecture built in from day one |

The difference isn't incremental — it's a generation leap. Clients using Kealee will feel like they're in a different decade from clients using Buildertrend or CoConstruct.
