# Security, Audit Logging & Observability

## Overview

The agentic agent framework includes comprehensive security controls and audit logging to ensure:
- **Safety:** URL validation, no credential leakage, no internal service access
- **Compliance:** Full execution trail for regulatory review
- **Observability:** Tool history, decisions, and outputs tracked per session

## Security Model

### Layer 1: Input Validation

All tool inputs validated against JSON schema before execution:

```typescript
// Browser tool input
{
  sessionId: 'session_123',       // string ✓
  action: 'navigate',              // enum: navigate|click|input|extract|screenshot ✓
  url: 'https://example.com',      // URL validation + security check ✓
}

// RAG tool input
{
  query: 'DC zoning setback',      // string ✓
  topK: 5,                         // number, 1–20 ✓
}
```

Invalid inputs → rejected before execution.

### Layer 2: URL Blocking (Browser)

```typescript
// Blocked patterns:
const BLOCKED_PATTERNS = [
  /^file:\/\//i,                   // file://
  /localhost|127\.0\.0\.1/i,       // localhost, loopback
  /10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\./i,  // Private IPs
  /\.internal\.|\.local$/i,        // Internal domains
];

// Assessment:
const risk = security.assessRisk(url);
// 'blocked' → Reject immediately
// 'warning' → Allow but log (e.g., HTTP without S)
// 'safe' → Allow
```

### Layer 3: Tool Execution Isolation

Each tool execution:
1. **Timeout:** Max 10s per action (configurable)
2. **Sandboxing:** Browser session isolated from system
3. **Resource Limits:** Max 256MB per browser (auto-restart)
4. **Error Capture:** No exception leakage to Claude

```typescript
try {
  output = await tool.execute(input);
} catch (err) {
  // Never let Claude see stack trace
  return { error: 'Tool failed. Try again.' };
}
```

### Layer 4: Credential/Data Scrubbing

Before persisting tool outputs:
- Remove credit card numbers (regex match)
- Remove API keys (common patterns)
- Remove PII (emails, SSNs, phone numbers)
- Truncate large outputs (> 10KB)

```typescript
function scrubSensitiveData(output: unknown): unknown {
  if (typeof output !== 'string') return output;

  let scrubbed = output
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    .replace(/sk_live_[A-Za-z0-9]{20,}/g, '[APIKEY]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

  return scrubbed.length > 10240 ? scrubbed.slice(0, 10240) + '...' : scrubbed;
}
```

## Audit Logging

### What Gets Logged

**Tool Execution Record:**
```typescript
interface ToolExecutionRecord {
  id: string;              // 'toolrun_abc123'
  toolName: string;        // 'retrieve_context', 'browse_web'
  input: Record<string, unknown>;      // Sanitized input
  output: Record<string, unknown>;     // Sanitized output
  success: boolean;
  startedAt: string;       // ISO timestamp
  completedAt: string;
  error?: string;
}
```

**Example:**
```typescript
{
  id: 'toolrun_xyz789',
  toolName: 'retrieve_context',
  input: {
    query: 'DC kitchen remodel permit',
    jurisdictionCode: 'DC',
    sourceTypes: ['jurisdiction', 'workflow'],
    topK: 8,
  },
  output: {
    blocks: [ /* 5 blocks */ ],
    summary: 'Found 5 relevant DC kitchen remodel rules',
    hitCount: 5,
    avgScore: 0.73,
  },
  success: true,
  startedAt: '2026-06-06T15:30:45.123Z',
  completedAt: '2026-06-06T15:30:45.523Z',
}
```

**Browser Audit Log:**
```typescript
interface BrowserSecurityAuditLog {
  timestamp: string;       // ISO timestamp
  action: string;          // 'navigate', 'click', 'input', 'extract', 'screenshot'
  url?: string;            // For navigate
  selector?: string;       // For click/input/extract
  success: boolean;
  risk?: string;           // 'safe', 'warning', 'blocked'
}
```

**Example:**
```typescript
{
  timestamp: '2026-06-06T15:31:10.456Z',
  action: 'navigate',
  url: 'https://competitor.com/pricing',
  success: true,
  risk: 'safe',
},
{
  timestamp: '2026-06-06T15:31:15.123Z',
  action: 'extract',
  selector: '.price-tag',
  success: true,
  risk: undefined,  // Not applicable for extract
}
```

### Session Memory Audit Trail

```typescript
interface SessionMemory {
  // ... (other fields)
  
  // Layer 1: Tool executions
  toolHistory: ToolExecutionRecord[];
  
  // Layer 2: Step outputs (for plan-based execution)
  stepOutputs: Record<string, unknown>;
  
  // Layer 3: Final deliverables
  outputs: Record<string, unknown>;
  
  // Layer 4: Decision log
  decisions: DecisionRecord[];
}

interface DecisionRecord {
  at: string;              // ISO timestamp
  reason: string;          // Why this decision?
  chosen: string;          // What was chosen?
  alternatives?: string[]; // What were the alternatives?
}
```

**Example:**
```typescript
{
  at: '2026-06-06T15:30:00.000Z',
  reason: 'User asked about DC kitchen permits. Jurisdiction in context.',
  chosen: 'retrieve_context with jurisdictionCode=DC',
  alternatives: ['retrieve_context without jurisdiction (slower)', 'skip RAG (less accurate)'],
}
```

## Compliance & Regulatory

### GDPR / Privacy

**What to do:**
- Log user/session ID but not user email or name
- Log tool inputs/outputs but scrub PII
- Allow users to request execution history deletion

**Example:**
```typescript
// OK: Session belongs to user
{
  sessionId: 'session_abc123',
  userId: 'user_xyz789',  // ← ID, not email
  createdAt: '2026-06-06T15:30:00Z',
  toolHistory: [ /* scrubbed */ ],
}

// NOT OK: Leaks PII
{
  sessionId: '...',
  userEmail: 'alice@example.com',      // ✗ PII
  userFullName: 'Alice Johnson',       // ✗ PII
}
```

### Audit Trail Retention

Default: Keep tool history for 90 days, then archive or delete per policy.

```typescript
// Query execution history for audit
const toolHistory = session.memory.toolHistory;

// Filter by date range
const last30Days = toolHistory.filter(
  t => new Date(t.startedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
);

// Export for compliance review
console.log(JSON.stringify(last30Days, null, 2));
```

### Suspicious Activity Detection

Monitor for:
- **Repeated blocked URL attempts:** May indicate lateral movement attempt
- **High tool call volume:** May indicate scraping or abuse
- **Unusual source types:** RAG queries outside normal patterns

```typescript
function detectSuspiciousActivity(session: AgentSession): string[] {
  const warnings: string[] = [];

  // Check for repeated blocked URLs
  const blockedAttempts = session.memory.toolHistory
    .filter(t => t.toolName === 'browse_web' && !t.success && t.error?.includes('blocked'));
  if (blockedAttempts.length > 3) {
    warnings.push(`${blockedAttempts.length} blocked URL attempts — possible lateral movement`);
  }

  // Check for high tool volume in short time
  const last1m = session.memory.toolHistory.filter(
    t => new Date(t.startedAt) > new Date(Date.now() - 60000)
  );
  if (last1m.length > 50) {
    warnings.push('50+ tool calls in 1 minute — possible abuse');
  }

  return warnings;
}
```

## Observability Best Practices

### 1. Query Execution History

```typescript
async function getExecutionHistory(sessionId: string) {
  const session = await sessionManager.get(sessionId);
  return {
    sessionId,
    createdAt: session.createdAt,
    executionTime: new Date().getTime() - new Date(session.createdAt).getTime(),
    toolCalls: session.memory.toolHistory.length,
    toolBreakdown: Object.entries(
      session.memory.toolHistory.reduce((acc, t) => {
        acc[t.toolName] = (acc[t.toolName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
    successRate: session.memory.toolHistory.filter(t => t.success).length / session.memory.toolHistory.length,
    finalOutputs: Object.keys(session.memory.outputs),
  };
}
```

### 2. Monitor Browser Security

```typescript
async function getSecurityReport(agent: BrowserAgent) {
  const auditLog = agent.getSecurityAuditLog();
  return {
    totalActions: auditLog.length,
    blockedAttempts: auditLog.filter(l => l.risk === 'blocked').length,
    warnings: auditLog.filter(l => l.risk === 'warning').length,
    safeActions: auditLog.filter(l => l.risk === 'safe').length,
    blockedUrls: auditLog
      .filter(l => l.risk === 'blocked')
      .map(l => l.url)
      .filter(Boolean),
  };
}
```

### 3. Trace Tool Execution

```typescript
function traceToolExecution(record: ToolExecutionRecord) {
  const duration = new Date(record.completedAt!).getTime() - new Date(record.startedAt).getTime();
  
  console.log(`[${record.id}] ${record.toolName}`);
  console.log(`  Status: ${record.success ? '✓ OK' : '✗ FAIL'}`);
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Input: ${JSON.stringify(record.input, null, 2)}`);
  
  if (record.success) {
    console.log(`  Output keys: ${Object.keys(record.output).join(', ')}`);
  } else {
    console.log(`  Error: ${record.error}`);
  }
}
```

### 4. Alert on Failures

```typescript
async function checkToolHealthAndAlert(session: AgentSession) {
  const failures = session.memory.toolHistory.filter(t => !t.success);
  
  if (failures.length > 0) {
    const failureRate = failures.length / session.memory.toolHistory.length;
    
    if (failureRate > 0.5) {
      // 50%+ failure rate — alert ops team
      console.error(`⚠️ Session ${session.id} has ${failureRate * 100}% tool failure rate`);
      
      for (const failure of failures) {
        console.error(`  - ${failure.toolName}: ${failure.error}`);
      }
    }
  }
}
```

## Data Retention & Deletion

### Default Policy

- **Active:** Keep in memory while session is open
- **Archive:** Move to DB after session closes
- **Retention:** 90 days (configurable per org)
- **Deletion:** Automatic purge after 90d, or on-demand per GDPR request

### Implement Data Deletion

```typescript
async function deleteSessionData(sessionId: string) {
  const session = await sessionManager.get(sessionId);
  
  // Scrub sensitive data before deletion
  session.memory.toolHistory = session.memory.toolHistory.map(t => ({
    ...t,
    input: { toolName: t.toolName },  // Keep only tool name, drop input
    output: undefined,                  // Drop output
  }));
  
  // Archive to immutable log for compliance, then delete
  await auditLog.archive(session);
  await sessionManager.delete(sessionId);
}
```

## Examples

### Example: Audit Bot Execution

```typescript
const result = await estimateBot.handleMessage(
  'Generate a bathroom remodel estimate for DC (75 sqft, mid-range)'
);

// Retrieve audit trail
const session = await sessionManager.get(sessionId);

console.log('=== EXECUTION AUDIT ===');
console.log(`Session: ${session.id}`);
console.log(`Duration: ${session.memory.toolHistory.reduce((sum, t) => 
  sum + (new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime()), 0)}ms`);
console.log(`Tool calls: ${session.memory.toolHistory.length}`);

for (const call of session.memory.toolHistory) {
  console.log(`\n[${call.toolName}] ${call.success ? '✓' : '✗'}`);
  console.log(`  Input: ${JSON.stringify(call.input)}`);
  if (!call.success) {
    console.log(`  Error: ${call.error}`);
  }
}

console.log(`\nFinal output: ${JSON.stringify(session.memory.outputs.estimate_bot)}`);
```

### Example: Security Review

```typescript
const agent = getGlobalBrowserAgent();
const securityReport = await getSecurityReport(agent);

console.log('=== BROWSER SECURITY REPORT ===');
console.log(`Total actions: ${securityReport.totalActions}`);
console.log(`Safe: ${securityReport.safeActions}`);
console.log(`Warnings: ${securityReport.warnings}`);
console.log(`Blocked: ${securityReport.blockedAttempts}`);

if (securityReport.blockedAttempts > 0) {
  console.log('\nBlocked URLs:');
  for (const url of securityReport.blockedUrls) {
    console.log(`  - ${url}`);
  }
}
```
