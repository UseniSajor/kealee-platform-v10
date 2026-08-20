/**
 * Minimal GeoJSON shapes used by the data-source clients (RFC 7946).
 *
 * These were previously written as `GeoJSON.Polygon` / `GeoJSON.FeatureCollection`,
 * referencing the global namespace from `@types/geojson` — a package that is not
 * a dependency of this workspace and is absent from the lockfile, so the build
 * failed with "Cannot find namespace 'GeoJSON'".
 *
 * Declared locally rather than by adding `@types/geojson` because the lockfile is
 * consumed by builders that run `pnpm install --frozen-lockfile`, and rather than
 * as `declare namespace GeoJSON` because that would collide with the real types
 * if the package is ever installed.
 */

export type GeoJsonPosition = [number, number] | [number, number, number]

export interface GeoJsonPolygon {
  type: 'Polygon'
  /** First ring is the exterior boundary; any others are holes. */
  coordinates: GeoJsonPosition[][]
  bbox?: number[]
}

export interface GeoJsonGeometry {
  type: string
  coordinates?: unknown
  geometries?: GeoJsonGeometry[]
  bbox?: number[]
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: GeoJsonGeometry | null
  properties: Record<string, unknown> | null
  id?: string | number
  bbox?: number[]
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
  bbox?: number[]
}
