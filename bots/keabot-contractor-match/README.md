# KeaBot Contractor Match

Finds and scores the best contractors for a construction project using trade fit, proximity, experience, rating, and availability.

## Purpose

KeaBotContractorMatch automates the contractor discovery and qualification process. It searches a contractor database, scores candidates against project requirements, verifies licensing and insurance, and dispatches bid requests to the top matches — all via conversational AI.

## Tools

| Tool | Description |
|------|-------------|
| `search_contractors` | Query the contractor database by trade, location, and radius. Returns a filtered list with price ranges. |
| `score_contractors` | Run the weighted scoring algorithm against all candidates for a project and return the top 5 ranked matches. |
| `get_contractor_details` | Fetch a contractor's full profile including reviews, credentials, portfolio, and contact information. |
| `verify_license_insurance` | Check whether a contractor's license is valid and their insurance is active and not expiring soon. |
| `generate_contractor_bids` | Send bid requests to 3-5 shortlisted contractors with project description, budget, timeline, and location. |
| `track_contractor_engagement` | Monitor a contractor's response rate, average response time, active jobs, and job completion history. |

## Scoring Algorithm

Total score is a weighted sum of five factors (max 100):

| Factor | Weight | Notes |
|--------|--------|-------|
| Trade match | 35% | Exact = 100, related trade = 70, no match = 0 |
| Location | 20% | Within 20% of radius = 100; scales down to 0 at 2x radius |
| Experience | 20% | 20+ yrs = 100, 10+ = 85, 5+ = 70, 2+ = 50, <2 = 30 |
| Rating | 15% | `(rating / 5) * 100` |
| Availability | 10% | Immediate = 100; <=7 days = 90; <=14 = 75; <=30 = 60; <=60 = 40 |

Only contractors with `isActive: true`, `licenseStatus: 'valid'`, and `insuranceActive: true` are ranked. Results are capped at the top 10 before the caller slices to 5.

## Expected Output — `score_contractors`

```json
{
  "projectId": "proj_abc123",
  "matches": [
    {
      "contractorId": "cont_001",
      "name": "Premier Construction LLC",
      "score": 87,
      "distance": "2.4 km",
      "rating": 4.8,
      "yearsExperience": 15,
      "bidPrice": "$45,000–$85,000",
      "availability": "2 weeks",
      "scoreBreakdown": {
        "tradeMatch": 100,
        "location": 100,
        "experience": 85,
        "rating": 96,
        "availability": 75
      }
    }
  ]
}
```

## Run

```bash
# Development
pnpm dev

# Production build
pnpm build
node dist/index.js

# Type-check only
pnpm type-check
```
