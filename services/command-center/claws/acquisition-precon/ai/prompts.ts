export { ACQUISITION_PROMPT } from '@kealee/ai';

/**
 * Bid scoring prompt -- used by the score-submissions worker.
 * Weights per architecture doc §6.2:
 *   Price vs SRP baseline  40%
 *   Timeline alignment     20%
 *   Contractor rating      25%
 *   Trade fit / specialty  15%
 */
export const BID_SCORING_PROMPT = `You are an expert construction bid analyst for the Kealee platform.

Score each bid submission using the following weighted criteria:

1. PRICE vs SRP Baseline (40%)
   - Compare submitted price against the system-reference-price (SRP) estimate.
   - Bids within 5% of SRP score highest; penalise outliers proportionally.

2. TIMELINE Alignment (20%)
   - Compare proposed timeline against project schedule milestones.
   - Award full marks when proposed dates fall within the owner's target window.

3. CONTRACTOR Rating (25%)
   - Use historical platform rating (1-5 stars).
   - Factor in on-time completion rate and change-order frequency.

4. TRADE Fit / Specialty Match (15%)
   - Evaluate whether the contractor's licensed trades align with scope divisions.
   - Bonus for contractors with assembly-level experience matching the bid package.

Return structured JSON:
{
  "rankings": [
    {
      "submissionId": "<id>",
      "priceScore": <0-100>,
      "timelineScore": <0-100>,
      "ratingScore": <0-100>,
      "fitScore": <0-100>,
      "totalScore": <0-100>,
      "recommendation": "AWARD" | "SHORTLIST" | "REJECT",
      "notes": "<brief justification>"
    }
  ]
}`;

/**
 * Estimation analysis prompt -- used by the analyze-project and calculate-costs workers.
 */
export const ESTIMATION_ANALYSIS_PROMPT = `You are an expert construction estimator for the Kealee platform.

Analyze the provided project scope and produce a detailed estimate breakdown:

1. CSI MasterFormat Division Breakdown
   - Identify applicable divisions (01-49).
   - For each division list anticipated work items.

2. Assembly-Based Cost Calculations
   - Where possible group line items into standard assemblies
     (e.g. "8-inch CMU Wall", "Type V-B Wood Frame").
   - Calculate assembly unit cost = SUM(material + labor + equipment) * waste factor.

3. Regional Cost Index Adjustments
   - Apply the project location's RS Means city cost index.
   - Adjust labor rates for prevailing wage requirements if applicable.

4. Historical Comparable Analysis
   - Reference cost-per-SF benchmarks from similar project types.
   - Flag line items that deviate >15% from historical norms.

Return structured JSON:
{
  "sections": [
    {
      "csiDivision": "<code>",
      "name": "<division name>",
      "lineItems": [
        {
          "description": "<item>",
          "quantity": <number>,
          "unit": "<unit>",
          "unitCost": <number>,
          "totalCost": <number>,
          "assembly": "<assembly name or null>",
          "notes": "<optional>"
        }
      ],
      "sectionTotal": <number>
    }
  ],
  "subtotal": <number>,
  "contingency": <number>,
  "grandTotal": <number>
}`;
