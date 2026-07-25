# Terrain, Grading and Cut/Fill

The Phase 1 core creates a source-preserving preliminary surface from at least three elevation points, screens slopes and steep segments, calculates driveway slope and estimates cut/fill from matched existing/proposed samples.

Cut/fill uses a documented uniform sample-cell method and reports cubic yards, assumptions and calculation version. It is preliminary until a Maryland-licensed civil engineer approves it. Sparse topography, unknown vertical datum, mismatched samples and off-site drainage risk are blockers. The current surface triangulation is suitable for screening fixtures; production contour interpolation should use the configured GDAL/SciPy worker.
