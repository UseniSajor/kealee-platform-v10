# Ingestion

**Phase 1 (built):** `ingestArtifact()` registers identity, checksum, files, project links, lineage and
governance for anything — bytes stay in their current store (`Document`, S3 URL, `output/` folder).
Re-ingesting the same `(sourceSystem, sourceRecordId)` with the same checksum returns the existing
artifact; a different checksum creates **version n+1** and keeps the history (`knowledge_artifact_versions`).

**Phase 2 (planned):** per-format extractors writing `artifact_pages` / `artifact_regions` /
`artifact_chunks` with `extractionConfidence`, never mutating the original:
PDF (pypdfium/PyMuPDF — text, vector layers, sheet numbers/titles/scale/revision from the title block),
DXF/DWG (entities by layer), LandXML (parcels, surfaces), GeoJSON/CSV/XLSX/DOCX/TXT/JSON, images
(EXIF + vision description), video (keyframes). The site-plan digitising scripts in
`packages/spatial-engine/scripts/digitise/` are the first drawing extractors and will be wrapped.

Artifact-aware chunking (spec §6): specification by section, estimate by division/item, drawing by
sheet/region, site plan by feature/sheet, contract by clause, RFI by question/answer, inspection by
deficiency, workspace session by task/outcome. Every chunk carries `artifactId`, `artifactVersion` and
its region/page — exact provenance.
