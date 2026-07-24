# DXF Generation

Phase 1 reuses the ASCII DXF and vector-PDF generator in `concept-engine`. Site-plan entities are separated by civil layer, carry units/CRS/revision metadata and preserve source authority in the accompanying GeoJSON and drawing manifest.

The drawing manifest evaluates cover, existing conditions, proposed plan, preliminary grading, erosion control, notes, calculations and revisions, with conditional demolition, stormwater, utilities, trees and retaining-wall sheets. Every unapproved output includes preliminary, not-a-survey and professional-review notes. Civil 3D can open the DXF for final professional editing.
