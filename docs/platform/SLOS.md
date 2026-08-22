# Product and service delivery SLOs

Measured monthly in production unless stated otherwise.

| Indicator | Objective | Alert threshold |
| --- | --- | --- |
| Public web availability | 99.9% successful probes | two failures in five minutes |
| API availability | 99.9% non-5xx responses | 5xx rate above 1% for five minutes |
| API latency | p95 under 1 second | p95 above 1 second for ten minutes |
| Queue success | 99.5% jobs complete within retry policy | failure above 0.5% or oldest job above 15 minutes |
| Payment processing | 99.9% valid webhooks processed | any unprocessed event above five minutes |
| Signup completion | 99% of valid attempts create a Clerk identity and tenant | failure above 1% over 15 minutes |
| Deliverable turnaround | 95% within the purchased service promise | any premium deliverable breaches its deadline |
| Deployment recovery | restore or rollback within 30 minutes | failed production deployment without rollback after 15 minutes |

Every event must include `environment`, `service`, `release`, `request_id`, and—where safe—`tenant_id`, `job_id`, `order_id`, or `deliverable_id`. Never include secrets, payment details, or raw customer documents in telemetry.
