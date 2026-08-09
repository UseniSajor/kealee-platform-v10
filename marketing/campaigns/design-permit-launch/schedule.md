# Design + Permit Launch — Schedule

Two products, two value props, alternating so neither fatigues the audience:
- **Design concept** (top of funnel — aspiration, "see it before you build it")
- **Permits** (mid funnel — urgency, "don't lose months")

All links carry `utm_campaign=design_permit_2026`. Organic + email first; turn on paid search/social once tracking + Stripe are verified in production.

## Week 1 — Launch

| Day | Channel | Asset | Copy ref |
|-----|---------|-------|----------|
| Mon | LinkedIn + Facebook | `design-concept-hero` image | Copy §3 Post A / §4 design feed |
| Mon | Email | Email 1 (design) | Copy §5 Email 1 |
| Tue | Instagram feed + story | `design-concept-social`, `design-concept-story` | Copy §4 IG design |
| Wed | LinkedIn + Facebook | `permit-hero` image | Copy §3 Post B / §4 permit feed |
| Wed | Reels/Shorts | `design-concept-hero-video` | Copy §4 IG design |
| Thu | Email | Email 2 (permits) | Copy §5 Email 2 |
| Fri | Instagram feed + story | `permit-social` | Copy §4 IG permit |
| Fri | Review | Sessions, CTA clicks, form starts by product | — |

## Week 2 — Convert

| Day | Channel | Asset | Copy ref |
|-----|---------|-------|----------|
| Mon | LinkedIn + Facebook | `design-concept-after` (render) | Copy §3 Post A variant |
| Tue | Email | Email 3 (bundle) | Copy §5 Email 3 |
| Wed | Reels/Shorts | `permit-hero-video` | Copy §4 IG permit |
| Wed | Paid search (if verified) | RSA assets | Copy §2 |
| Fri | SMS (opted-in only) | Design + permit blasts | Copy §6 |
| Fri | Review + adjust | Lead-to-paid by product, by channel | — |

## Week 3+ — Scale + outbound

- Promote the best-performing Week 1–2 organic post as paid (Facebook/IG + LinkedIn).
- Turn on **parcel outreach** (Copy §7) once the property intelligence agent has populated `parcel_outreach_targets` (see README — this is the outbound channel, not a prerequisite for the inbound campaign).
- Weekly review by product, channel, jurisdiction, and funnel stage.

## Gate before paid spend
From `KEALEE_MARKETING_READY_TO_DEPLOY.md`: verify Stripe live, Resend, analytics pixels, `CRON_SECRET`, and an end-to-end purchase test before running paid campaigns. Organic + email do not require this gate.
