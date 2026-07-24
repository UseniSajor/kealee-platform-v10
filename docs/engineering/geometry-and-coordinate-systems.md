# Geometry and Coordinate Systems

Every geometry carries CRS, unit, source references, classification, confidence, verification state and calculation version. `createParcelPolygon`, `calculateBoundaryClosure`, `validateGeometryTopology`, `calculateBuildableEnvelope`, `placeBuildingFootprint`, coverage/imperviousness and LOD tools are implemented in `os-engineering`.

The current setback offset is explicitly a conceptual uniform offset. Frontage-specific, corner-lot and concave geometry requires resolved local rules and professional review. No coordinate transformation is performed without a configured geospatial provider. GIS parcel geometry remains `OFFICIAL_GIS` or informational, never `SURVEYED`.
