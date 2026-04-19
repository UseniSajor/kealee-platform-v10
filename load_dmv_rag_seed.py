#!/usr/bin/env python3
"""
Seed loader for Kealee DMV permits + zoning RAG dataset.

Supports:
1. JSONL ingestion
2. Optional chunking
3. Optional embeddings hook
4. Upsert into PostgreSQL / pgvector-ready table

Usage:
  python load_dmv_rag_seed.py \
      --input ./dmv_permits_zoning_seed.jsonl \
      --mode jsonl \
      --output-sql ./seed_output.sql

Or:
  DATABASE_URL=... python load_dmv_rag_seed.py \
      --input ./dmv_permits_zoning_seed.jsonl \
      --mode db
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, List, Dict

try:
    import psycopg
except Exception:
    psycopg = None


@dataclass
class ChunkRecord:
    chunk_id: str
    doc_id: str
    jurisdiction: str
    state: str
    region: str
    county_or_city: str
    document_type: str
    topic: str
    source_type: str
    source_title: str
    source_url: str
    content: str
    tags: List[str]
    metadata_json: Dict[str, Any]


def stable_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def chunk_text(text: str, max_chars: int = 550, overlap: int = 80) -> list[str]:
    text = " ".join(text.split())
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + max_chars)
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = max(0, end - overlap)
    return chunks


def make_chunks(rows: Iterable[dict[str, Any]]) -> list[ChunkRecord]:
    out: list[ChunkRecord] = []
    for row in rows:
        doc_id = row["id"]
        pieces = chunk_text(row["content"])
        for idx, piece in enumerate(pieces):
            chunk_id = stable_hash(f'{doc_id}:{idx}:{piece}')
            metadata = {
                "last_verified_date": row.get("last_verified_date"),
                "retrieval_weight": row.get("retrieval_weight"),
                "confidence": row.get("confidence"),
                "source_title": row.get("source_title"),
                "source_url": row.get("source_url"),
                "tags": row.get("tags", []),
            }
            out.append(
                ChunkRecord(
                    chunk_id=chunk_id,
                    doc_id=doc_id,
                    jurisdiction=row["jurisdiction"],
                    state=row["state"],
                    region=row["region"],
                    county_or_city=row["county_or_city"],
                    document_type=row["document_type"],
                    topic=row["topic"],
                    source_type=row["source_type"],
                    source_title=row["source_title"],
                    source_url=row["source_url"],
                    content=piece,
                    tags=row.get("tags", []),
                    metadata_json=metadata,
                )
            )
    return out


def render_sql(chunks: list[ChunkRecord]) -> str:
    stmts = []
    stmts.append("""
CREATE TABLE IF NOT EXISTS rag_source_chunks (
  chunk_id text PRIMARY KEY,
  doc_id text NOT NULL,
  jurisdiction text NOT NULL,
  state text NOT NULL,
  region text NOT NULL,
  county_or_city text NOT NULL,
  document_type text NOT NULL,
  topic text NOT NULL,
  source_type text NOT NULL,
  source_title text NOT NULL,
  source_url text NOT NULL,
  content text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536)
);
""")
    for ch in chunks:
        esc = lambda s: s.replace("'", "''")
        stmts.append(f"""
INSERT INTO rag_source_chunks
(chunk_id, doc_id, jurisdiction, state, region, county_or_city, document_type, topic, source_type, source_title, source_url, content, tags, metadata)
VALUES
(
'{esc(ch.chunk_id)}',
'{esc(ch.doc_id)}',
'{esc(ch.jurisdiction)}',
'{esc(ch.state)}',
'{esc(ch.region)}',
'{esc(ch.county_or_city)}',
'{esc(ch.document_type)}',
'{esc(ch.topic)}',
'{esc(ch.source_type)}',
'{esc(ch.source_title)}',
'{esc(ch.source_url)}',
'{esc(ch.content)}',
'{esc(json.dumps(ch.tags))}'::jsonb,
'{esc(json.dumps(ch.metadata_json))}'::jsonb
)
ON CONFLICT (chunk_id) DO UPDATE SET
content = EXCLUDED.content,
metadata = EXCLUDED.metadata,
tags = EXCLUDED.tags,
source_title = EXCLUDED.source_title,
source_url = EXCLUDED.source_url;
""")
    return "\n".join(stmts)


def upsert_db(chunks: list[ChunkRecord], database_url: str) -> None:
    if psycopg is None:
        raise RuntimeError("psycopg is not installed. Install psycopg[binary] first.")
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS rag_source_chunks (
              chunk_id text PRIMARY KEY,
              doc_id text NOT NULL,
              jurisdiction text NOT NULL,
              state text NOT NULL,
              region text NOT NULL,
              county_or_city text NOT NULL,
              document_type text NOT NULL,
              topic text NOT NULL,
              source_type text NOT NULL,
              source_title text NOT NULL,
              source_url text NOT NULL,
              content text NOT NULL,
              tags jsonb NOT NULL DEFAULT '[]'::jsonb,
              metadata jsonb NOT NULL DEFAULT '{}'::jsonb
            );
            """)
            for ch in chunks:
                cur.execute(
                    """
                    INSERT INTO rag_source_chunks
                    (chunk_id, doc_id, jurisdiction, state, region, county_or_city, document_type, topic, source_type, source_title, source_url, content, tags, metadata)
                    VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
                    ON CONFLICT (chunk_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    tags = EXCLUDED.tags,
                    source_title = EXCLUDED.source_title,
                    source_url = EXCLUDED.source_url
                    """,
                    (
                        ch.chunk_id,
                        ch.doc_id,
                        ch.jurisdiction,
                        ch.state,
                        ch.region,
                        ch.county_or_city,
                        ch.document_type,
                        ch.topic,
                        ch.source_type,
                        ch.source_title,
                        ch.source_url,
                        ch.content,
                        json.dumps(ch.tags),
                        json.dumps(ch.metadata_json),
                    ),
                )
        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to JSONL input")
    parser.add_argument("--mode", choices=["jsonl", "db"], default="jsonl")
    parser.add_argument("--output-sql", default="rag_seed_output.sql")
    args = parser.parse_args()

    rows = load_jsonl(Path(args.input))
    chunks = make_chunks(rows)

    if args.mode == "jsonl":
        sql = render_sql(chunks)
        Path(args.output_sql).write_text(sql)
        print(f"Wrote {len(chunks)} chunks to SQL file: {args.output_sql}")
    else:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL env var is required for --mode db")
        upsert_db(chunks, database_url)
        print(f"Upserted {len(chunks)} chunks into database.")


if __name__ == "__main__":
    main()
