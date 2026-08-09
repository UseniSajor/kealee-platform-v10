# Browser Agent Guide

## Overview

The browser agent allows Claude to control a web browser for research, competitive analysis, and data extraction. It's built on Playwright with security constraints, session pooling, and full audit logging.

**Important:** Browser automation is resource-intensive. Use for agentic bots only when necessary (research, web scraping, verification). Disabled by default.

## Architecture

```
callModelAgentic()
    ↓
Claude generates tool_use: browse_web
    ↓
BrowserTool (input validation)
    ↓
BrowserAgent (session pooling)
    ↓
BrowserSessionManager (lifecycle + TTL)
    ↓
BrowserSecurity (URL blocking + audit log)
    ↓
Playwright (navigate, click, extract)
    ↓
Result → Claude
```

## Enabling Browser Tool

### In Bot Config

```typescript
const researchBot = new ResearchBotAgentic({
  name: 'ResearchBot',
  domain: 'research',
  systemPrompt: '...',
  enableBrowserTool: true,  // ← Enable browser
});
```

### Configuration Options

```typescript
import { BrowserSessionManager } from '@kealee/core-agents';

const sessionManager = new BrowserSessionManager({
  maxConcurrent: 3,              // Max 3 browsers at once
  sessionTTLMs: 5 * 60 * 1000,   // 5 min before auto-close
  maxMemoryPerBrowserMb: 256,    // Restart if > 256MB
  headless: true,                // Headless mode
});

const browserAgent = new BrowserAgent(undefined, undefined, security);
// Pass to bot or createBrowserTool()
```

## Actions

### Navigate

Go to a URL, optionally wait for an element.

```typescript
{
  action: 'navigate',
  sessionId: 'session_123',
  url: 'https://www.example.com/products',
  timeout: 10000,
  waitForSelector: '.product-list',  // Wait for list to load
}
```

**Result:**
```typescript
{ success: true, data: { url: 'https://...' }, durationMs: 2500 }
```

### Click

Click an element (button, link, checkbox, etc.).

```typescript
{
  action: 'click',
  sessionId: 'session_123',
  selector: 'button.add-to-cart',
  timeout: 5000,
}
```

### Input (Fill Text Field)

Fill a text field.

```typescript
{
  action: 'input',
  sessionId: 'session_123',
  selector: '#search-box',
  text: 'kitchen cabinets',
  timeout: 5000,
}
```

### Extract (Get Element Content)

Extract text, HTML, or JSON from an element.

```typescript
// Extract text
{
  action: 'extract',
  sessionId: 'session_123',
  selector: '.price',
  format: 'text',  // Returns "€49.99" as string
}

// Extract HTML
{
  action: 'extract',
  sessionId: 'session_123',
  selector: '.product-card',
  format: 'html',  // Returns full HTML
}

// Extract JSON (parse inner HTML as JSON)
{
  action: 'extract',
  sessionId: 'session_123',
  selector: '[data-product]',
  format: 'json',  // Tries to parse as JSON, falls back to HTML
}
```

**Result:**
```typescript
{
  success: true,
  data: '€49.99',  // or { name: '...', price: '...' } for JSON
  durationMs: 500,
}
```

### Screenshot

Take a screenshot of the full page or an element.

```typescript
// Full page
{
  action: 'screenshot',
  sessionId: 'session_123',
}

// Element
{
  action: 'screenshot',
  sessionId: 'session_123',
  selector: '.product-image',
}
```

**Result:**
```typescript
{
  success: true,
  data: 'iVBORw0KGgoAAAANSU...',  // Base64 PNG
  durationMs: 1200,
}
```

## Security Constraints

### Blocked URLs

The following URLs are **always blocked**:

- **Localhost:** `http://localhost`, `http://127.0.0.1`, `http://[::1]`
- **Private IPs:** `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- **File protocol:** `file://` (local files)
- **Internal domains:** `*.internal`, `*.local`

**Why?** Prevent exfiltration of internal services, credentials, or sensitive data.

### Audit Logging

Every browser action is logged:

```typescript
{
  timestamp: '2026-06-06T15:30:45Z',
  action: 'navigate',
  url: 'https://example.com/products',
  success: true,
  risk: 'safe',  // 'safe' | 'warning' | 'blocked'
}
```

Retrieved via:
```typescript
const logs = browserAgent.getSecurityAuditLog();
// Review all navigations, clicks, extractions
```

### User-Agent Obfuscation

Browser rotates through realistic user agents to avoid detection:

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...
Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...
```

## Session Management

### Pooling

Default: max 3 concurrent browsers. If bot needs a 4th:
1. Closes the least-recently-used session
2. Creates a new one
3. Continues execution

### Lifecycle

Each session has a TTL (time-to-live). Default: 5 minutes.

```
Create session → Active → (30 sec inactivity) → Cleanup interval (30s) → Close
```

Explicitly close:
```typescript
await browserAgent.sessionManager.closeSession(sessionId);
```

### Memory Limits

If a browser exceeds memory limit (default: 256MB), it's automatically restarted.

## Error Handling

### Navigation Timeout

If page takes > 10s to load (default):

```typescript
{
  success: false,
  error: 'Timeout waiting for navigation',
  durationMs: 10500,
}
```

### Element Not Found

If selector doesn't match any element:

```typescript
{
  success: false,
  error: 'Element not found: .nonexistent',
  durationMs: 250,
}
```

### Blocked URL

If URL matches security blocklist:

```typescript
{
  success: false,
  error: 'URL blocked: http://localhost:3000',
  durationMs: 50,
}
```

### Network Error

If page can't load (DNS, connection refused):

```typescript
{
  success: false,
  error: 'net::ERR_NAME_NOT_RESOLVED',
  durationMs: 5000,
}
```

## Best Practices

### 1. Validate URLs in System Prompt

```typescript
const systemPrompt = `
BROWSER RESTRICTIONS:
- Only navigate to public websites (example.com, github.com, etc.)
- NEVER navigate to localhost, 127.0.0.1, or internal IPs
- NEVER access internal company sites

Before navigate:
1. Verify URL is public and starts with https://
2. If blocked, tell the user and stop
`;
```

### 2. Handle Slow Pages

```typescript
// For dynamic content, wait longer
{
  action: 'navigate',
  sessionId: '...',
  url: 'https://slow-site.example.com',
  timeout: 30000,  // 30s instead of default 10s
  waitForSelector: '.content-loaded',
}
```

### 3. Extract Structured Data

```typescript
// Use consistent selectors
{
  action: 'extract',
  sessionId: '...',
  selector: '[data-product-price]',  // data attributes are more stable
  format: 'text',
}
```

### 4. Limit Concurrent Sessions

```typescript
const manager = new BrowserSessionManager({
  maxConcurrent: 2,  // Lower if memory-constrained
});
```

### 5. Review Audit Logs

```typescript
// After bot execution:
const logs = browserAgent.getSecurityAuditLog();
for (const log of logs) {
  if (log.risk === 'blocked') {
    console.warn(`Blocked: ${log.url}`);
  }
}
```

## Examples

### Example 1: Competitive Pricing Research

```typescript
class CompetitorResearchBot extends AgenticBotAgentic {
  constructor() {
    super({
      name: 'CompetitorResearchBot',
      domain: 'research',
      systemPrompt: `You research competitor pricing.
        
        Steps:
        1. Navigate to competitor website
        2. Find product price using extract with selector
        3. Compare to our pricing in RAG database
        4. Return pricing matrix
        
        SECURITY: Only research public websites. Never internal sites.
      `,
      enableBrowserTool: true,
      enableRagTool: true,
    });
  }

  async handleMessage(message: string, context?: Record<string, unknown>): Promise<string> {
    // "What are current kitchen cabinet prices at HomeDepot?"
    return this.callAgentic(message, context);
  }
}

// Usage:
const bot = new CompetitorResearchBot();
const result = await bot.handleMessage(
  'Get current price for oak kitchen cabinets at HomeDepot'
);
// Output: "HomeDepot oak cabinets: $299-$1,200/unit (full extract with SKUs)"
```

### Example 2: Specification Verification

```typescript
class ProductSpecBot extends AgenticBotAgentic {
  constructor() {
    super({
      name: 'ProductSpecBot',
      domain: 'verification',
      systemPrompt: `You verify product specs from manufacturer websites.
        
        For each product:
        1. Navigate to spec sheet URL
        2. Extract dimensions, materials, certifications
        3. Verify against our internal database (RAG)
        4. Flag discrepancies
      `,
      enableBrowserTool: true,
      enableRagTool: true,
    });
  }

  async handleMessage(message: string): Promise<string> {
    return this.callAgentic(message);
  }
}

// Usage:
const bot = new ProductSpecBot();
const result = await bot.handleMessage(
  'Verify specs for Kohler K-321 faucet at kohler.com'
);
```

## Limitations

1. **JavaScript Rendering:** Full JS support via Playwright, but some sites with complex SPA rendering may timeout.
2. **Login:** No automatic login. Can interact with login forms, but credentials must be provided (and audit-logged).
3. **PDFs:** Can navigate to PDF URLs but can't extract text (no PDF parsing).
4. **Rate Limiting:** No built-in rate limiting. If bot hits site limits, it gets HTTP 429 errors.
5. **CAPTCHA:** Can't bypass CAPTCHA. Will get stuck if page requires CAPTCHA.

## Monitoring & Observability

### Audit Trail

```typescript
// View all browser interactions
const auditLog = browserAgent.getSecurityAuditLog();

// Filter by action
const navigations = auditLog.filter(log => log.action === 'navigate');
const extractions = auditLog.filter(log => log.action === 'extract');

// Check for blocked attempts
const blocked = auditLog.filter(log => log.risk === 'blocked');
console.log(`${blocked.length} blocked attempts`);
```

### Session Status

```typescript
const sessions = browserAgent.sessionManager.getActiveSessions();
console.log(`${sessions.length} active browser sessions`);

for (const session of sessions) {
  console.log(`Session ${session.id}:`);
  console.log(`  Created: ${session.createdAt}`);
  console.log(`  Last access: ${session.lastAccessAt}`);
  console.log(`  Memory: ${session.memoryUsageBytes / 1024 / 1024}MB`);
}
```

### Cleanup

```typescript
// Graceful shutdown
process.on('SIGTERM', async () => {
  await browserAgent.destroyAll();
  process.exit(0);
});
```
