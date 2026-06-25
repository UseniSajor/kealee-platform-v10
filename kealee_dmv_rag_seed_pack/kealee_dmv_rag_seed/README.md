# Kealee DMV RAG Seed Pack

This pack contains:
- `dmv_permits_zoning_seed.jsonl` — starter RAG seed dataset
- `dmv_permits_zoning_seed.csv` — spreadsheet-friendly version
- `load_dmv_rag_seed.py` — loader that chunks and writes SQL or upserts DB
- `CLAUDE_PROMPT_GENERATE_DMV_RAG.md` — scale-up prompt for Claude Code
- `SCHEMA.md` — dataset schema notes

Important:
This is a production-ready starter pack, not a claim of exhaustive legal coverage for every DMV jurisdiction.
Use it as the canonical seed, then scale with the Claude prompt and a verification pass.
