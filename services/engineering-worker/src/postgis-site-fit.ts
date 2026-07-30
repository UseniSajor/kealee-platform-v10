import type { SolveSiteFitInput, SiteFitOption } from '@kealee/os-engineering';

type Queryable = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

type EnvelopeRow = {
  envelope_geojson: string;
  area_sq_ft: number | string;
  postgis_version: string;
};

function epsgCode(crs: string): number {
  const match = /^EPSG:(\d+)$/i.exec(crs);
  if (!match) throw new Error('PostGIS site-fit requires a valid EPSG authority code');
  return Number(match[1]);
}

/**
 * Builds the exact inward setback and subtracts exclusion polygons in PostGIS.
 * Buffer distance is evaluated as geography metres so projected CRS units never
 * silently alter a setback entered in feet.
 */
export async function buildPostgisEnvelope(
  db: Queryable,
  input: SolveSiteFitInput,
): Promise<NonNullable<SolveSiteFitInput['precomputedEnvelope']>> {
  const srid = epsgCode(input.crs);
  const setback = input.ruleSet.setbacks;
  const direction = input.ruleSet.frontageDirection ?? 'NORTH';
  const cardinal = (() => {
    if (!setback) {
      return { north: input.ruleSet.uniformSetback, east: input.ruleSet.uniformSetback,
        south: input.ruleSet.uniformSetback, west: input.ruleSet.uniformSetback };
    }
    if (direction === 'EAST') return { north: setback.leftSide, east: setback.front,
      south: setback.rightSide, west: setback.rear };
    if (direction === 'SOUTH') return { north: setback.rear, east: setback.leftSide,
      south: setback.front, west: setback.rightSide };
    if (direction === 'WEST') return { north: setback.rightSide, east: setback.rear,
      south: setback.leftSide, west: setback.front };
    return { north: setback.front, east: setback.rightSide,
      south: setback.rear, west: setback.leftSide };
  })();
  const baseSetback = Math.min(cardinal.north, cardinal.east, cardinal.south, cardinal.west);
  const extra = {
    north: (cardinal.north - baseSetback) * 0.3048,
    east: (cardinal.east - baseSetback) * 0.3048,
    south: (cardinal.south - baseSetback) * 0.3048,
    west: (cardinal.west - baseSetback) * 0.3048,
  };
  const rows = await db.$queryRawUnsafe<EnvelopeRow[]>(`
    WITH source AS (
      SELECT extensions.ST_SetSRID(
        extensions.ST_GeomFromGeoJSON($1),
        $2::integer
      ) AS boundary
    ),
    checked AS (
      SELECT boundary
      FROM source
      WHERE extensions.ST_IsValid(boundary)
        AND NOT extensions.ST_IsEmpty(boundary)
        AND extensions.ST_GeometryType(boundary) IN ('ST_Polygon', 'ST_MultiPolygon')
    ),
    inset AS (
      SELECT extensions.ST_Transform(
        extensions.ST_Buffer(
          extensions.ST_Transform(boundary, 4326)::extensions.geography,
          -$3
        )::extensions.geometry,
        $2::integer
      ) AS geometry
      FROM checked
    ),
    cardinal_inset AS (
      SELECT extensions.ST_Transform(
        extensions.ST_Intersection(
          projected,
          extensions.ST_MakeEnvelope(
            extensions.ST_XMin(projected) + $5,
            extensions.ST_YMin(projected) + $6,
            extensions.ST_XMax(projected) - $7,
            extensions.ST_YMax(projected) - $8,
            3857
          )
        ),
        $2::integer
      ) AS geometry
      FROM (
        SELECT extensions.ST_Transform(geometry, 3857) AS projected
        FROM inset
      ) projected_geometry
    ),
    exclusions AS (
      SELECT extensions.ST_UnaryUnion(extensions.ST_Collect(
        extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(value::text), $2::integer)
      )) AS geometry
      FROM jsonb_array_elements($4::jsonb)
    ),
    net AS (
      SELECT CASE
        WHEN exclusions.geometry IS NULL THEN inset.geometry
        ELSE extensions.ST_Difference(inset.geometry, exclusions.geometry)
      END AS geometry
      FROM cardinal_inset AS inset CROSS JOIN exclusions
    ),
    polygons AS (
      SELECT (extensions.ST_Dump(
        extensions.ST_CollectionExtract(
          extensions.ST_MakeValid(geometry),
          3
        )
      )).geom AS geometry
      FROM net
    ),
    largest AS (
      SELECT geometry
      FROM polygons
      WHERE NOT extensions.ST_IsEmpty(geometry)
      ORDER BY extensions.ST_Area(geometry) DESC
      LIMIT 1
    )
    SELECT
      extensions.ST_AsGeoJSON(geometry) AS envelope_geojson,
      extensions.ST_Area(
        extensions.ST_Transform(geometry, 4326)::extensions.geography
      ) * 10.76391041671 AS area_sq_ft,
      extensions.PostGIS_Lib_Version() AS postgis_version
    FROM largest
  `, JSON.stringify(input.boundary), srid, baseSetback * 0.3048,
  JSON.stringify(input.exclusions ?? []), extra.west, extra.south, extra.east, extra.north);

  const row = rows[0];
  if (!row) {
    throw new Error('PostGIS found no buildable polygon after applying setbacks and exclusions');
  }
  return {
    geometry: JSON.parse(row.envelope_geojson),
    areaSqFt: Number(row.area_sq_ft),
    engine: 'POSTGIS',
    engineVersion: row.postgis_version,
  };
}

export async function validateOptionsWithPostgis(
  db: Queryable,
  input: SolveSiteFitInput,
  options: SiteFitOption[],
): Promise<SiteFitOption[]> {
  const srid = epsgCode(input.crs);
  const envelope = input.precomputedEnvelope;
  if (!envelope) throw new Error('PostGIS validation requires a precomputed envelope');

  return Promise.all(options.map(async option => {
    const footprint = option.geometry.features.find(
      feature => feature.properties.layer === 'PROPOSED_BUILDING',
    )?.geometry;
    if (!footprint) throw new Error(`Option ${option.ordinal} has no proposed-building geometry`);
    const rows = await db.$queryRawUnsafe<Array<{ covered: boolean; valid: boolean }>>(`
      SELECT
        extensions.ST_CoveredBy(
          extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON($1), $3::integer),
          extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON($2), $3::integer)
        ) AS covered,
        extensions.ST_IsValid(
          extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON($1), $3::integer)
        ) AS valid
    `, JSON.stringify(footprint), JSON.stringify(envelope.geometry), srid);
    const result = rows[0];
    const passed = Boolean(result?.covered && result?.valid);
    const errors = passed
      ? option.errors.filter(error => error !== 'Footprint exceeds the conceptual buildable envelope')
      : [...new Set([...option.errors, 'PostGIS validation: footprint is outside the buildable envelope'])];
    return {
      ...option,
      valid: errors.length === 0,
      errors,
      validationReport: {
        ...option.validationReport,
        ruleResults: option.validationReport.ruleResults.map(rule =>
          rule.rule === 'footprint_within_buildable_envelope'
            ? { ...rule, passed, actual: passed ? 1 : 0 }
            : rule),
      },
    };
  }));
}
