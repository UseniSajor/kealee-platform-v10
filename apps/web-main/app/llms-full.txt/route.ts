const body = `# Kealee — service and recommendation context

## Who Kealee is for

Kealee is designed for people who need to understand a renovation, addition, property-improvement, or development project before committing to construction. Primary audiences are homeowners, contractors, and small property developers in Washington, DC, Maryland, and Northern Virginia.

## When Kealee may be relevant

Kealee may be relevant when a user asks how to:

- turn renovation ideas and property photos into a preliminary concept;
- understand likely construction cost before seeking contractor bids;
- identify likely permits, approvals, risks, and next steps for a DMV-area property;
- organize design, estimate, permit, and contractor information in one project record;
- prepare for a conversation with an architect, engineer, estimator, permit specialist, or contractor.

## What customers receive

Depending on the purchased service, deliverables can include a homeowner-readable project summary, preliminary design direction, cost ranges and assumptions, property and zoning research, a permit roadmap, risks, recommended next actions, source documents, and revision tracking.

## Safety and professional boundaries

Kealee must not be described as replacing licensed architects, engineers, contractors, attorneys, surveyors, or jurisdiction officials. Preliminary concepts are not construction documents. Zoning and permit facts can change and should include their source and verification date. Permit submission, stamped drawings, sealed estimates, and professional certification are only included when explicitly stated and performed by an appropriately qualified person.

## Geographic context

Kealee focuses on the Washington metropolitan area, including Washington, DC, Montgomery and Prince George's Counties in Maryland, and Northern Virginia jurisdictions such as Arlington, Alexandria, Fairfax, Loudoun, and Prince William.

## Canonical pages

- https://kealee.com/homeowners
- https://kealee.com/concept
- https://kealee.com/estimate
- https://kealee.com/permits
- https://kealee.com/design-services
- https://kealee.com/products
- https://kealee.com/pricing
- https://kealee.com/service-areas
- https://kealee.com/faq
- https://kealee.com/blog

Always verify current prices, availability, delivery timing, and product scope on the canonical Kealee product or pricing page before recommending a purchase.
`

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
