# Apollo Automated Import

The Apollo importer runs through `marketing-cron-apollo` every six hours and
calls the authenticated `GET /api/cron/apollo-import` endpoint on `web-main`.
It is fail-closed and performs no Apollo or database work unless explicitly
enabled.

## Required production variables (`web-main`)

```text
APOLLO_API_KEY=<secret>
APOLLO_IMPORT_ENABLED=true
APOLLO_ORGANIZATION_ID=<canonical Kealee organization UUID>
APOLLO_CAMPAIGN_ID=<approved marketing_campaigns_v2 UUID>
APOLLO_AUDIENCE_JSON={"personTitles":["Owner","President"],"organizationLocations":["Washington, DC","Maryland","Virginia"],"personSeniorities":["owner","c_suite","vp","director"],"organizationEmployeeRanges":["1,10","11,50","51,200"],"organizationKeywords":["construction","design build","property management"],"requireVerifiedEmail":true}
APOLLO_IMPORT_PER_RUN_CAP=25
APOLLO_IMPORT_DAILY_CAP=100
```

The campaign must belong to the configured organization and have status
`approved` or `active`. Audience configuration requires at least one title and
one organization location. Code clamps per-run imports to 100 and daily Apollo
records processed to 500 even if larger environment values are supplied.

## Safety behavior

- Only verified-email contacts are accepted by default.
- Search uses Apollo's credit-free People API Search, then bulk-enriches at most
  ten people per request. Personal-email reveal, phone reveal, and waterfall
  enrichment are disabled to avoid unintended higher credit use.
- Global, organization, and campaign suppression records are checked in batch
  before canonical ingestion.
- Contacts are normalized and deduplicated through `marketing_contacts` and
  `public_intake_leads`.
- Imported records are marked `importedForReview=true` and
  `outreachAuthorized=false`; import never enrolls or messages a contact.
- A compare-and-set lease on `marketing_integration_cursors` prevents
  overlapping runs and expires after 30 minutes.
- Daily caps count every Apollo result examined, including duplicates,
  suppressed contacts, and rejected records.

## Monitoring

- Cursor state and the last run summary are stored in
  `marketing_integration_cursors`.
- Daily aggregate metrics are upserted into `marketing_daily_metrics` with
  channel `apollo_import`.
- Authorized operations users can query
  `GET /api/admin/marketing/apollo/health`.
- A run is unhealthy after a failure/rate-limit or when no successful import
  has occurred for 48 hours while enabled.

## Rollback

Set `APOLLO_IMPORT_ENABLED=false`. The cron remains healthy and returns a
disabled response without contacting Apollo or modifying lead data.
