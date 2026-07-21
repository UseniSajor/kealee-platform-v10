# keabot-support

Customer support automation bot for the Kealee Platform. Handles ticket routing, FAQ answering, refund processing, response drafting, escalation, and resolution tracking.

## Purpose

KeaBot Support is the first point of contact for all customer support interactions. It classifies incoming questions, resolves them automatically where possible, processes refunds, drafts responses at the right tone, escalates when needed, and records resolution outcomes.

## Tools

| Tool | Description |
|------|-------------|
| `route_ticket` | Classifies the support question and creates a routed ticket in the support system |
| `answer_faq` | Searches the FAQ knowledge base; auto-responds when confidence >= 0.85 |
| `handle_refund_request` | Calculates refund amount per policy and initiates the Stripe refund |
| `generate_response` | Drafts a customer-facing response via AI using the specified tone |
| `escalate_ticket` | Escalates the ticket to a human agent with an SLA-based response time |
| `track_resolution` | Records ticket resolution status and optional CSAT rating |

## Routing Rules

| Keywords Detected | Category | Assigned To |
|-------------------|----------|-------------|
| permit, zoning, approval, variance | `permit_support` | permit_specialist |
| contractor, worker, crew, builder, subcontractor | `contractor_support` | contractor_manager |
| payment, charge, invoice, billing, refund, stripe, price | `payment_support` | billing_team |
| design, render, image, floor plan, blueprint, architect | `design_support` | design_team |
| cost, estimate, budget, quote, pricing | `estimate_support` | estimation_team |
| how, what, when, why, where, ?, help, explain | `faq_search` | ai_assistant |
| (no match) | `general_support` | general_support |

Routing uses keyword density scoring: matched keywords / total rule keywords, multiplied by the rule's base confidence. The highest-scoring rule wins.

## Refund Policy

| Reason | Refund % | Notes |
|--------|----------|-------|
| `service_not_provided` | 100% | Full refund — service was not delivered |
| `project_cancelled` | 75% | 25% retained for platform setup costs |
| `contractor_quality_issue` | 50% | 50% retained for costs already incurred |

## Expected Output JSON

### route_ticket

```json
{
  "ticketId": "TKT-1K2M3N",
  "question": "I need a refund on my permit research fee",
  "routing": {
    "category": "payment_support",
    "confidence": 0.95,
    "assignTo": "billing_team",
    "keywords": ["refund", "permit"]
  },
  "status": "open",
  "createdAt": "2026-04-07T12:00:00.000Z",
  "message": "Ticket created and routed"
}
```

### answer_faq

```json
{
  "found": true,
  "answer": "Permit research fees are non-refundable once the research has been conducted...",
  "confidence": 0.91,
  "autoRespond": true,
  "faqId": "How do I get a permit",
  "estimatedResolutionTime": "Immediate (auto-responded)"
}
```

### handle_refund_request

```json
{
  "approved": true,
  "reason": "project_cancelled",
  "refundAmount": 750,
  "originalAmount": 1000,
  "refundPercentage": 75,
  "message": "75% refund for project cancellation...",
  "ticketId": "TKT-1K2M3N",
  "stripeRefundId": "re_1AbcXYZ"
}
```

### escalate_ticket

```json
{
  "ticketId": "TKT-1K2M3N",
  "escalated": true,
  "assignedTo": "support_manager",
  "severity": "high",
  "expectedResponseTime": "1 hour"
}
```

### track_resolution

```json
{
  "ticketId": "TKT-1K2M3N",
  "resolved": true,
  "status": "resolved",
  "resolutionTime": "2h 14m",
  "satisfactionRating": 5,
  "updatedAt": "2026-04-07T14:14:00.000Z"
}
```
