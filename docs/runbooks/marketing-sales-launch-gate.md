# Marketing and Sales Launch Gate

This checklist is the operating gate for paid traffic, outbound sales, and
public launch of `kealee.com`. A checked item needs current evidence, not an
assumption based on UI copy.

## Required owners

| Area | Accountable role | Operating expectation |
| --- | --- | --- |
| Intake and checkout | Product Operations | Test every public purchase path before each campaign launch |
| Paid-order fulfillment | Fulfillment Operations | Review paid orders and failed jobs every business day |
| Payments and refunds | Finance Operations | Reconcile Stripe payments, refunds, and disputes daily |
| Marketplace profiles | Marketplace Operations | Confirm business identity and displayed credentials before publication |
| Marketing claims | Marketing Operations | Link every quantified or regulated claim to dated evidence |
| Incidents and privacy | Security/Engineering | Monitor alerts and own containment, notification, and recovery |

Named people and escalation contacts must be recorded in the private operations
system before launch. Role names in this repository are not a substitute.

## P0 launch checklist

- [x] `/privacy`, `/terms`, and `/service-policies` are public without login.
- [ ] The correct contracting legal entity, address, support contact, and
      governing terms have been approved by counsel.
- [x] Contractor and developer acquisition routes resolve only through
      `/marketplace`; homeowner and project-owner services retain standalone
      pages.
- [x] Homeowner intake persists a real database record before checkout is
      offered. A database failure produces a visible retry message and no
      charge.
- [ ] Stripe test purchases have completed end-to-end for every sellable SKU:
      checkout, webhook, paid status, fulfillment queue, email, and portal
      visibility.
- [ ] The launch-integrity scheduled check is authorized with `CRON_SECRET`,
      running, and delivering Sentry alerts to an actively monitored channel.
- [ ] Refund, cancellation, revision, delivery, professional-review, and
      marketplace policies match actual operations.
- [x] Every public professional profile is sourced from production data and has
      dated evidence for business identity and any displayed license,
      insurance, bond, certification, rating, or review. No profiles are
      currently published because the production source is not connected.
- [x] Every testimonial is attributable, consented, and linked to a real
      engagement. Unverified testimonials remain unpublished.
- [ ] Every claim involving an architect, engineer, estimator, permit
      expediter, escrow provider, lender acceptance, cost database, project
      count, response time, or delivery time has an evidence owner and review
      date.

## Paid-order response targets

- New paid order acknowledged: within 15 minutes by automation.
- Missing fulfillment job: alert at 15 minutes and manual review within one
  business hour.
- Failed fulfillment: alert immediately; customer contacted within one business
  hour with the recovery plan.
- Refund request: acknowledged within one business day and handled under the
  policy shown at purchase.

## Daily review

1. Run or inspect `/api/cron/launch-integrity`.
2. Review Stripe payments with no matching intake or fulfillment record.
3. Review failed webhooks and fulfillment jobs.
4. Confirm the customer received the promised acknowledgment and next step.
5. Record owner, action, and resolution for every exception.

## Rollback criteria

Pause affected campaigns and disable the affected checkout when any of these
occur:

- payment can succeed without a durable intake;
- a paid order is not queued for fulfillment;
- the public promise differs from the service currently deliverable;
- legal identity or required professional credentials cannot be substantiated;
- alerts are not reaching an accountable operator.
