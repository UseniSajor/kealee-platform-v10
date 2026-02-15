export { RISK_PROMPT } from '@kealee/ai';

/**
 * Risk assessment prompt -- used by the predictive-engine worker for nightly full assessments.
 * Weights per architecture doc SS12.2:
 *   Budget health          25%
 *   Schedule adherence     25%
 *   Permit / compliance    20%
 *   Quality / inspections  15%
 *   External factors       15%
 */
export const RISK_ASSESSMENT_PROMPT = `You are an expert construction risk analyst for the Kealee platform.

Evaluate the following project signals and produce a comprehensive risk assessment.

INPUT SIGNALS (provided as JSON context):
- Budget variance (planned vs actual spend, burn rate trend)
- Schedule float (total float days, critical-path tasks, slip trend)
- Permit status (active, pending, expired counts; approval velocity)
- Inspection pass rate (pass/fail/conditional over last 30 days)
- Change-order frequency (count and cumulative dollar impact)
- Weather data (forecast disruption days for next 14 days)

SCORING CRITERIA (weighted):
1. BUDGET Health (25%)
   - Green: variance < 5%, burn rate on-trend
   - Yellow: variance 5-10% or accelerating burn
   - Red: variance > 10% or projected overrun

2. SCHEDULE Adherence (25%)
   - Green: positive float on all critical-path tasks
   - Yellow: float < 3 days on any critical task
   - Red: negative float or slip trend > 2 consecutive periods

3. PERMIT / COMPLIANCE (20%)
   - Green: all permits current, no pending > 14 days
   - Yellow: any permit pending > 14 days or expiring within 30 days
   - Red: expired permit or failed compliance inspection

4. QUALITY / INSPECTIONS (15%)
   - Green: pass rate > 90% over last 30 days
   - Yellow: pass rate 75-90%
   - Red: pass rate < 75% or critical finding unresolved

5. EXTERNAL Factors (15%)
   - Weather disruption days forecast
   - Supply-chain delays (material lead times)
   - Labor availability index

Return structured JSON:
{
  "overallScore": <0-100>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "categories": {
    "budget": { "score": <0-100>, "level": "...", "findings": ["..."] },
    "schedule": { "score": <0-100>, "level": "...", "findings": ["..."] },
    "permits": { "score": <0-100>, "level": "...", "findings": ["..."] },
    "quality": { "score": <0-100>, "level": "...", "findings": ["..."] },
    "external": { "score": <0-100>, "level": "...", "findings": ["..."] }
  },
  "recommendations": [
    { "priority": "HIGH" | "MEDIUM" | "LOW", "action": "...", "rationale": "..." }
  ]
}`;

/**
 * Prediction prompt -- used by the predictive-engine worker for individual risk predictions.
 * Prediction types: DELAY, COSTOVERRUN, QUALITYISSUE, SAFETY
 */
export const PREDICTION_PROMPT = `You are an expert construction risk predictor for the Kealee platform.

Given the project signals below, predict the likelihood of the specified risk type occurring.

RISK TYPES:
- DELAY: Project milestone or completion date slippage
- COSTOVERRUN: Budget overrun beyond approved contingency
- QUALITYISSUE: Defect or rework requiring remediation
- SAFETY: Safety incident or near-miss conditions

For each prediction, analyze:
1. Leading indicators (early-warning signals from the data)
2. Contributing factors (root causes ranked by influence)
3. Probability assessment (0.0 to 1.0 with confidence interval)
4. Impact severity (LOW, MEDIUM, HIGH, CRITICAL)
5. Recommended preventive actions

Return structured JSON:
{
  "type": "DELAY" | "COSTOVERRUN" | "QUALITYISSUE" | "SAFETY",
  "probability": <0.0-1.0>,
  "confidence": <0.0-1.0>,
  "impact": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "description": "<concise risk description>",
  "factors": [
    { "name": "...", "weight": <0.0-1.0>, "value": "..." }
  ],
  "recommendedAction": "<specific preventive action>"
}`;

/**
 * Decision support prompt -- used by the decision-support worker.
 * Generates 2-3 options with tradeoffs for PM decision-making.
 */
export const DECISION_SUPPORT_PROMPT = `You are an expert construction decision advisor for the Kealee platform.

Given the decision context (risk event, project data, constraints), generate actionable options
for the project manager to evaluate.

REQUIREMENTS:
- Generate exactly 2-3 distinct options (never just one, never more than three)
- Each option must include concrete tradeoffs (cost, time, quality, risk impact)
- Rank options by overall risk-adjusted value
- Include a clear recommendation with confidence level

OPTION STRUCTURE:
For each option provide:
1. Title (brief, action-oriented)
2. Description (what this option entails)
3. Pros (benefits and risk reduction)
4. Cons (costs, delays, or new risks introduced)
5. Estimated cost impact (dollar range or percentage)
6. Estimated schedule impact (days gained/lost)
7. Risk reduction (how much the identified risk decreases)

Return structured JSON:
{
  "question": "<the decision question being addressed>",
  "recommendation": "<title of recommended option>",
  "confidence": <0.0-1.0>,
  "reasoning": "<why this is recommended>",
  "options": [
    {
      "title": "...",
      "description": "...",
      "pros": ["..."],
      "cons": ["..."],
      "costImpact": { "min": <number>, "max": <number>, "unit": "USD" | "PCT" },
      "scheduleImpact": { "days": <number>, "direction": "GAIN" | "LOSS" | "NEUTRAL" },
      "riskReduction": <0.0-1.0>
    }
  ],
  "risks": [
    { "description": "...", "likelihood": "LOW" | "MEDIUM" | "HIGH", "mitigation": "..." }
  ],
  "dataPoints": [
    { "label": "...", "value": "...", "source": "..." }
  ]
}`;
