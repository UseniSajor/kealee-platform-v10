# Kealee DMV Permit + Zoning RAG Seed Schema

Each record should be chunk-safe and retrieval-friendly.

## Required fields
- `id`
- `jurisdiction`
- `state`
- `region`
- `county_or_city`
- `document_type`
- `topic`
- `source_type`
- `source_title`
- `source_url`
- `content`
- `tags`
- `last_verified_date`
- `retrieval_weight`
- `confidence`

## Recommended additional fields for scaled ingestion
- `effective_date`
- `supersedes_id`
- `applies_to_project_types`
- `applies_to_zones`
- `permit_types`
- `review_authority`
- `fee_notes`
- `timeline_notes`
- `contact_info`
- `portal_url`
- `raw_html_hash`
- `source_language`
- `embedding_version`
