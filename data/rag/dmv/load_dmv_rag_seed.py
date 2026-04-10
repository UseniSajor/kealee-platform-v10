#!/usr/bin/env python3
"""
data/rag/dmv/load_dmv_rag_seed.py

Kealee RAG Seed Loader — DMV Permits & Zoning

Loads JSONL records from dmv_permits_zoning_generated.jsonl into PostgreSQL
for vector similarity search (Phase 2) or direct retrieval (Phase 1).

Phase 1: Inserts raw records into rag_documents table.
Phase 2 (future): Will add pgvector embeddings column and similarity index.

Usage:
  python data/rag/dmv/load_dmv_rag_seed.py
  python data/rag/dmv/load_dmv_rag_seed.py --dry-run
  python data/rag/dmv/load_dmv_rag_seed.py --reset
"""

import json
import os
import sys
import argparse
from pathlib import Path

# ── Dependency check ──────────────────────────────────────────────────────────

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("ERROR: psycopg2-binary is required.")
    print("Install with: pip install psycopg2-binary")
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

# DATABASE_URL: set via environment variable or update this default.
# Format: postgresql://user:password@host:port/database
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/kealee"
)

SCRIPT_DIR    = Path(__file__).parent
JSONL_FILE    = SCRIPT_DIR / "dmv_permits_zoning_generated.jsonl"
COSTS_FILE    = SCRIPT_DIR.parent / "costs" / "construction_costs_workflows.jsonl"

TABLE_NAME    = "rag_documents"
BATCH_SIZE    = 50

# ── DDL ───────────────────────────────────────────────────────────────────────

CREATE_TABLE_SQL = f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    id                  TEXT PRIMARY KEY,
    record_type         TEXT NOT NULL DEFAULT 'permit_zoning',
    jurisdiction        TEXT,
    state               TEXT,
    region              TEXT,
    county_or_city      TEXT,
    document_type       TEXT,
    topic               TEXT,
    source_type         TEXT,
    source_title        TEXT,
    source_url          TEXT,
    content             TEXT NOT NULL,
    tags                TEXT[],
    last_verified_date  TEXT,
    retrieval_weight    FLOAT DEFAULT 0.5,
    confidence          TEXT,
    raw_json            JSONB NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_documents_jurisdiction ON {TABLE_NAME}(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_rag_documents_topic        ON {TABLE_NAME}(topic);
CREATE INDEX IF NOT EXISTS idx_rag_documents_record_type  ON {TABLE_NAME}(record_type);
"""

# ── Loader ────────────────────────────────────────────────────────────────────

def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        print(f"  WARN: File not found: {path}")
        return []
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"  WARN: Skipping line {i} in {path.name} — {e}")
    return records


def record_to_row(record: dict) -> tuple:
    """Convert a JSONL record to a DB row tuple."""
    record_type = record.get("type", "permit_zoning")

    if record_type == "cost":
        row_id = f"cost-{record.get('project_type','unknown')}-{hash(json.dumps(record, sort_keys=True)) % 100000}"
        content = (
            f"{record.get('description', '')} "
            f"Cost range: ${record.get('cost_low') or 'varies'} – ${record.get('cost_high') or 'varies'}. "
            f"Assumptions: {', '.join(record.get('assumptions', []))}."
        )
        return (
            row_id,
            "cost",
            None,                            # jurisdiction
            "DMV",                           # state (region)
            record.get("region"),
            None,                            # county_or_city
            "cost_data",                     # document_type
            record.get("project_type"),      # topic
            record.get("source_type"),
            "Kealee Cost Database",
            None,                            # source_url
            content,
            [],                              # tags
            record.get("last_updated"),
            0.7,                             # retrieval_weight
            record.get("confidence", "MEDIUM").lower(),
            json.dumps(record),
        )

    elif record_type == "workflow":
        row_id = f"wf-{record.get('stage','unknown')}-{hash(json.dumps(record, sort_keys=True)) % 100000}"
        steps_preview = " → ".join(record.get("steps", [])[:4])
        content = (
            f"{record.get('description', '')} "
            f"Steps: {steps_preview}. "
            f"Outputs: {', '.join(record.get('outputs_generated', []))}."
        )
        return (
            row_id,
            "workflow",
            None,
            None,
            "DMV",
            None,
            "workflow_data",
            record.get("stage"),
            "kealee_internal",
            "Kealee Workflow Definition",
            None,
            content,
            [],
            record.get("last_updated"),
            0.8,
            "high",
            json.dumps(record),
        )

    else:
        # permit_zoning record
        return (
            record.get("id", f"pz-{hash(str(record)) % 100000}"),
            "permit_zoning",
            record.get("jurisdiction"),
            record.get("state"),
            record.get("region"),
            record.get("county_or_city"),
            record.get("document_type"),
            record.get("topic"),
            record.get("source_type"),
            record.get("source_title"),
            record.get("source_url"),
            record.get("content", ""),
            record.get("tags", []),
            record.get("last_verified_date"),
            record.get("retrieval_weight", 0.5),
            record.get("confidence", "medium"),
            json.dumps(record),
        )


INSERT_SQL = f"""
INSERT INTO {TABLE_NAME} (
    id, record_type, jurisdiction, state, region, county_or_city,
    document_type, topic, source_type, source_title, source_url,
    content, tags, last_verified_date, retrieval_weight, confidence, raw_json
) VALUES %s
ON CONFLICT (id) DO UPDATE SET
    content             = EXCLUDED.content,
    raw_json            = EXCLUDED.raw_json,
    retrieval_weight    = EXCLUDED.retrieval_weight,
    confidence          = EXCLUDED.confidence;
"""


def run_loader(dry_run: bool = False, reset: bool = False) -> None:
    print(f"\n{'='*60}")
    print(f"  Kealee RAG Seed Loader")
    print(f"  Database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    # Load records
    print(f"Loading permit/zoning records from: {JSONL_FILE}")
    pz_records = load_jsonl(JSONL_FILE)
    print(f"  → {len(pz_records)} records loaded")

    print(f"Loading cost/workflow records from: {COSTS_FILE}")
    cw_records = load_jsonl(COSTS_FILE)
    print(f"  → {len(cw_records)} records loaded")

    all_records = pz_records + cw_records
    print(f"\nTotal records to process: {len(all_records)}")

    if dry_run:
        print("\nDRY RUN — no database operations performed.")
        print("Sample record (first):")
        if all_records:
            print(json.dumps(all_records[0], indent=2)[:500])
        return

    # Connect
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        cur  = conn.cursor()
        print("\nDatabase connection established.")
    except Exception as e:
        print(f"\nERROR: Could not connect to database: {e}")
        print(f"Set DATABASE_URL environment variable to a valid PostgreSQL connection string.")
        sys.exit(1)

    try:
        # Create table
        print("Creating table if not exists...")
        cur.execute(CREATE_TABLE_SQL)

        if reset:
            print(f"RESET: Deleting all existing records from {TABLE_NAME}...")
            cur.execute(f"DELETE FROM {TABLE_NAME}")

        # Insert in batches
        rows = [record_to_row(r) for r in all_records]
        total_inserted = 0

        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            execute_values(cur, INSERT_SQL, batch)
            total_inserted += len(batch)
            print(f"  Inserted batch {i // BATCH_SIZE + 1}: {total_inserted}/{len(rows)} records")

        conn.commit()
        print(f"\nSUCCESS: {total_inserted} records inserted/updated in {TABLE_NAME}.")

        # Verify
        cur.execute(f"SELECT record_type, COUNT(*) FROM {TABLE_NAME} GROUP BY record_type ORDER BY record_type")
        rows_counts = cur.fetchall()
        print("\nRecord counts by type:")
        for record_type, count in rows_counts:
            print(f"  {record_type:<20} {count}")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR during insert: {e}")
        raise
    finally:
        cur.close()
        conn.close()


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Kealee RAG Seed Loader")
    parser.add_argument("--dry-run", action="store_true", help="Parse and validate without writing to DB")
    parser.add_argument("--reset",   action="store_true", help="Delete existing records before inserting")
    args = parser.parse_args()

    run_loader(dry_run=args.dry_run, reset=args.reset)
