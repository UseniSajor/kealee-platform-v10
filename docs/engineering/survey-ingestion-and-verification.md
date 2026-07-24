# Survey Ingestion and Verification

Engineering intake validates extension, MIME type, size and requires antivirus plus SHA-256 duplicate checks before parsing. Supported classifications cover PDF, DWG/DXF, LandXML/XML, CSV, SHP ZIP/GeoJSON, GeoTIFF/TIFF and JPG/PNG. DWG parsing requires a configured isolated converter; the system does not pretend that an opaque DWG was parsed.

CSV points and bearings/distances are parsed deterministically. OCR providers return raw text, page and bounding box. OCR confidence never makes a value surveyed or verified. Values used in authoritative geometry require a human verification record with verifier and timestamp.

Boundary reconstruction reports closure error, relative precision, duplicate vertices and self-intersections. It never snaps a survey to GIS. Unknown units, CRS/datum, incomplete curves, tolerance failures and survey/plat conflicts remain blocking verification issues.
