# Phase 1 Open-Source Licenses

The deterministic TypeScript core continues to use the repository's existing
dependencies. The isolated engineering worker image adds the pinned Python
dependencies below.

Reused dependencies and infrastructure:

| Component | License | Phase 1 use |
|---|---|---|
| PostgreSQL | PostgreSQL License | Business and calculation persistence |
| PostGIS | GPL-2.0-or-later | Server-side spatial type/index and queries; database extension, not distributed client code |
| Prisma | Apache-2.0 | Existing ORM |
| BullMQ | MIT | Existing job infrastructure |
| TypeScript | Apache-2.0 | Deterministic domain tools |
| Vitest | MIT | Tests |
| PaddleOCR 3.1.0 | Apache-2.0 | Local survey OCR and token confidence |
| PaddlePaddle 3.1.0 | Apache-2.0 | PaddleOCR inference runtime |
| pytesseract | Apache-2.0 | Optional local OCR fallback adapter |
| Tesseract OCR | Apache-2.0 | Optional OCR engine |
| OpenCV | Apache-2.0 | Document image preprocessing |
| pdfplumber | MIT | PDF text and page extraction |
| ezdxf | MIT | Editable DXF generation |
| NumPy | BSD-3-Clause | Numeric arrays |
| SciPy | BSD-3-Clause | Delaunay terrain triangulation |
| pyproj / PROJ | MIT | Coordinate transformations |
| Shapely | BSD-3-Clause | GEOS-backed deterministic geometry |
| GDAL 3.6.2 | MIT | Raster/vector geospatial processing |
| ReportLab 4.4.2 | BSD-3-Clause | Vector PDF output |
| Pillow 11.3.0 | HPND | Tesseract fallback image loading |

The worker is isolated in `services/engineering-worker`; the API sends bounded,
typed job payloads through BullMQ. Production deployment is pending Railway
account activation. Before promoting a rebuilt image, generate an SBOM and scan
the resolved transitive packages. No AGPL, paid embedded CAD, Autodesk runtime
or professional-seal automation was added.
