# KeaBots API Reference

Base URL: `https://api.kealee.com/api/v1` (production) or `http://localhost:3001/api/v1` (local)

---

## POST /api/v1/keabots/execute

Execute a bot for a specific project lifecycle stage.

**Request**

```http
POST /api/v1/keabots/execute
Content-Type: application/json
Authorization: Bearer <token>
```

**Body**

```json
{
  "projectId": "string (required)",
  "stage": "intake | design | permit | estimate | contractor | feasibility | payments | execution | monitoring | support | marketing",
  "data": {
    "key": "value"
  },
  "userId": "string (optional)",
  "timeout": 30000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectId` | string | Yes | Unique project identifier |
| `stage` | BotStage | Yes | Which lifecycle stage to execute |
| `data` | object | Yes | Contextual input data for the bot |
| `userId` | string | No | User making the request |
| `timeout` | number | No | Timeout in ms (default: 30000) |

**Response 200**

```json
{
  "success": true,
  "stage": "contractor",
  "botName": "keabot-contractor-match",
  "data": {
    "matches": [
      {
        "contractorId": "cont_001",
        "name": "Premier Construction LLC",
        "score": 87,
        "distance": "2.4 km",
        "rating": 4.8,
        "yearsExperience": 15,
        "bidPrice": "$45,000–$85,000",
        "availability": "2 weeks"
      }
    ]
  },
  "nextStage": "feasibility",
  "latencyMs": 1243
}
```

**Response 200 (failure)**

```json
{
  "success": false,
  "stage": "estimate",
  "botName": "keabot-estimate",
  "data": {},
  "errors": ["Bot timeout after 30000ms"],
  "latencyMs": 30001
}
```

---

## POST /api/v1/keabots/chain

Execute multiple bot stages in sequence, passing output of each as input to the next.

**Request**

```http
POST /api/v1/keabots/chain
Content-Type: application/json
Authorization: Bearer <token>
```

**Body**

```json
{
  "projectId": "proj_abc123",
  "stages": ["intake", "design", "permit", "estimate", "contractor"],
  "initialData": {
    "projectType": "kitchen_renovation",
    "budget": 80000,
    "location": "Washington, DC"
  }
}
```

**Response 200**

```json
{
  "projectId": "proj_abc123",
  "results": [
    {
      "success": true,
      "stage": "intake",
      "botName": "keabot-owner",
      "data": { "validated": true, "projectId": "proj_abc123" },
      "nextStage": "design",
      "latencyMs": 892
    },
    {
      "success": true,
      "stage": "design",
      "botName": "keabot-design",
      "data": { "conceptId": "concept_xyz", "imageUrls": ["..."] },
      "nextStage": "permit",
      "latencyMs": 3201
    }
  ],
  "totalLatencyMs": 4093,
  "completedStages": 2,
  "stoppedAt": null
}
```

---

## GET /api/v1/keabots/health

Returns the health status of all bots and supporting infrastructure.

**Request**

```http
GET /api/v1/keabots/health
```

**Response 200**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "bots": {
    "keabot-marketing": "ok",
    "keabot-owner": "ok",
    "keabot-permit": "ok",
    "keabot-estimate": "ok",
    "keabot-gc": "ok",
    "keabot-construction": "ok",
    "keabot-marketplace": "ok",
    "keabot-land": "ok",
    "keabot-operations": "ok",
    "keabot-command": "ok",
    "keabot-finance": "ok",
    "keabot-payments": "ok",
    "keabot-feasibility": "ok",
    "keabot-developer": "ok",
    "keabot-design": "ok",
    "keabot-contractor-match": "ok",
    "keabot-project-monitor": "ok",
    "keabot-support": "ok"
  },
  "database": "ok",
  "redis": "ok",
  "anthropic_api": "ok",
  "checked_at": "2026-04-07T15:00:00.000Z"
}
```

**Possible status values:** `"ok"` | `"degraded"` | `"critical"`

---

## GET /api/v1/keabots/runs

Fetch recent bot execution logs.

**Request**

```http
GET /api/v1/keabots/runs?botName=keabot-estimate&limit=20&since=2026-04-01T00:00:00Z
Authorization: Bearer <token>
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `botName` | string | Filter by bot name |
| `projectId` | string | Filter by project |
| `status` | string | `running \| completed \| failed \| timeout` |
| `limit` | number | Max results (default 50, max 200) |
| `since` | ISO date | Return runs after this timestamp |

**Response 200**

```json
{
  "runs": [
    {
      "id": "run_1712505600000_42",
      "botName": "keabot-estimate",
      "stage": "estimate",
      "projectId": "proj_abc123",
      "status": "completed",
      "latencyMs": 2134,
      "cost": 0.0024,
      "createdAt": "2026-04-07T15:00:01.000Z"
    }
  ],
  "total": 1,
  "stats": {
    "successRate": 97,
    "avgLatencyMs": 1842,
    "totalCost": 0.42
  }
}
```

---

## GET /api/v1/keabots/registry

List all registered bots with metadata.

**Request**

```http
GET /api/v1/keabots/registry
```

**Response 200**

```json
{
  "bots": [
    {
      "name": "keabot-contractor-match",
      "displayName": "Contractor Match Bot",
      "description": "Contractor matching and scoring",
      "stage": "contractor",
      "domain": "contractor",
      "version": "1.0.0"
    }
  ],
  "total": 18
}
```

---

## Error Responses

All endpoints return standard error shapes:

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid bearer token",
  "statusCode": 401
}
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid request body |
| 401 | Missing/invalid auth token |
| 404 | Bot or project not found |
| 429 | Rate limit exceeded (100 concurrent / 1000/hr) |
| 500 | Internal server error |
| 504 | Bot timeout (>30s) |
