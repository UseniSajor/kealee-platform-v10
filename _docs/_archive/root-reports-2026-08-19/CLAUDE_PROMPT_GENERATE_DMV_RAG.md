You are working inside the Kealee Platform monorepo with repo write access.

Goal:
Generate scaled training and RAG seed data for DMV permits + zoning, using official primary sources only.

Rules:
1. Use only official jurisdiction sources (county/city/state agencies, official zoning or permitting portals, code libraries officially linked by those agencies).
2. Do not invent fees, timelines, or zoning entitlements.
3. When data is missing, emit a structured record with:
   - confidence = "low"
   - missing_fields = [...]
4. Output machine-usable JSONL records that follow this schema:
   - id
   - jurisdiction
   - state
   - region
   - county_or_city
   - document_type
   - topic
   - source_type
   - source_title
   - source_url
   - content
   - tags
   - last_verified_date
   - retrieval_weight
   - confidence

Target jurisdictions:
- District of Columbia
- Montgomery County, MD
- Prince George's County, MD
- Fairfax County, VA
- Arlington County, VA
- City of Alexandria, VA
- Loudoun County, VA
- Anne Arundel County, MD
- Baltimore County, MD
- Howard County, MD

Generate records for these topic families:
- permit_overview
- permit_required
- permit_process
- permit_categories
- zoning_authority
- zoning_resources
- zoning_confirmation
- certificate_of_occupancy
- home_occupation
- land_disturbance
- trade_permits
- portal_process
- inspection_process
- due_diligence_letters
- zoning_faq

For each jurisdiction:
1. find the main permitting hub
2. find the main zoning hub
3. find key process pages
4. generate 5-20 retrieval-safe records per jurisdiction
5. keep each content field concise, factual, and chunk-safe
6. preserve source URL and date verified
7. avoid duplicate records

Then:
- write output to `/data/rag/dmv_permits_zoning_generated.jsonl`
- generate `/data/rag/dmv_permits_zoning_generated_summary.md`
- generate `/data/rag/source_manifest.csv`
- if a jurisdiction is incomplete, list what remains to be harvested
