/**
 * Kealee GIS Client
 * Dynamic integrations with public County GIS REST and Geocoding APIs.
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

export interface GisCoordinates {
  lat: number;
  lng: number;
}

export interface ZoningGisData {
  zoningClass: string;
  zoningDescription?: string;
  jurisdictionName: string;
  zoningAuthority: string;
  zoningMapUrl: string;
  parcelId?: string;
  rawAttributes?: Record<string, any>;
}

// Public ArcGIS REST Endpoints verified for DMV Area
const GIS_ENDPOINTS: Record<
  string,
  { zoningUrl: string; authority: string; mapUrl: string; name: string; bypassTls?: boolean }
> = {
  dc: {
    name: "District of Columbia",
    zoningUrl: "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Planning_Landuse_and_Zoning_WebMercator/MapServer/3",
    authority: "DC Office of Zoning (DCOZ)",
    mapUrl: "https://maps.dcoz.dc.gov/zr16/",
  },
  montgomery_md: {
    name: "Montgomery County",
    zoningUrl: "https://mcatlas.org/arcgis5/rest/services/backgrounds/Zoning_background/MapServer/26",
    authority: "Montgomery County DPS / M-NCPPC",
    mapUrl: "https://montgomeryplanning.org/tools/gis-and-mapping/zoning-maps/",
    bypassTls: true, // mcatlas.org has cert name mismatch or TLS errors sometimes
  },
  fairfax_va: {
    name: "Fairfax County",
    zoningUrl: "https://www.fairfaxcounty.gov/euclid/rest/services/GIS/Zoning/MapServer/0",
    authority: "Fairfax County Dept. of Planning and Development",
    mapUrl: "https://www.fairfaxcounty.gov/maps/open-geospatial-data",
  },
  arlington_va: {
    name: "Arlington County",
    zoningUrl: "https://arlgis.arlingtonva.us/arcgis/rest/services/Public_Maps/Zoning_Map/MapServer/0",
    authority: "Arlington County Zoning",
    mapUrl: "https://gis.arlingtonva.us/zoning",
  },
};

/**
 * A redirect-aware, TLS-bypass-supporting JSON fetch helper using Node's standard libraries.
 */
function fetchJson<T>(urlString: string, bypassTls = false, redirectCount = 0): Promise<T> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error("[GIS] Too many redirects"));
    }

    try {
      const u = new URL(urlString);
      const client = u.protocol === "https:" ? https : http;
      const options: https.RequestOptions = {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: "GET",
        headers: {
          "User-Agent": "KealeePlatform/1.0 (contact@kealee.com)",
        },
      };

      if (bypassTls && u.protocol === "https:") {
        options.rejectUnauthorized = false;
      }

      client
        .get(options, (res: any) => {
          // Handle redirect
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, urlString).toString();
            return fetchJson<T>(redirectUrl, bypassTls, redirectCount + 1)
              .then(resolve)
              .catch(reject);
          }

          let data = "";
          res.on("data", (chunk: any) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data) as T);
            } catch (e: any) {
              reject(new Error(`[GIS] Failed to parse JSON: ${e.message}. Body preview: ${data.slice(0, 500)}`));
            }
          });
        })
        .on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Geocodes a text address to coordinates using OSM Nominatim.
 */
export async function geocodeAddress(address: string): Promise<GisCoordinates | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
    
    const data = await fetchJson<any[]>(url);
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("[GIS] Geocoding error:", error);
    return null;
  }
}

/**
 * Resolves the county jurisdiction code from the geocoded address displayName or state.
 */
export function determineJurisdictionFromAddress(addressText: string, displayName: string): string | null {
  const text = (addressText + " " + displayName).toLowerCase();

  if (text.includes("district of columbia") || text.includes("washington, d.c.") || text.includes("washington d.c.")) {
    return "dc";
  }
  if (text.includes("montgomery county") || text.includes("rockville") || text.includes("bethesda") || text.includes("silver spring")) {
    return "montgomery_md";
  }
  if (text.includes("fairfax") || text.includes("mclean") || text.includes("reston") || text.includes("herndon")) {
    return "fairfax_va";
  }
  if (text.includes("arlington")) {
    return "arlington_va";
  }
  
  return null;
}

/**
 * Queries the specific jurisdiction's ArcGIS MapServer for zoning attributes at a coordinate point.
 */
export async function queryArcGisFeature(
  coords: GisCoordinates,
  zoningUrl: string,
  jurisdiction: string,
  bypassTls = false
): Promise<{ zoningClass: string; zoningDescription?: string; parcelId?: string; zoningMapUrl?: string; rawAttributes: Record<string, any> } | null> {
  try {
    // Spatial query with a 15m buffer in Esri meters to handle centerline fallback.
    const spatialQuery = {
      geometry: `${coords.lng},${coords.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
      distance: 15,
      units: "esriSRUnit_Meter",
      outFields: "*",
      returnGeometry: false,
      f: "json",
    };

    const queryParams = new URLSearchParams(spatialQuery as any).toString();
    const url = `${zoningUrl}/query?${queryParams}`;

    const data = await fetchJson<{ features?: any[] }>(url, bypassTls);
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const attributes = data.features[0].attributes || {};
    let zoningClass = "Unknown";
    let zoningDescription = undefined;
    let parcelId = undefined;
    let zoningMapUrl = undefined;

    // Attribute mappings vary by jurisdiction schema
    if (jurisdiction === "dc") {
      zoningClass = attributes.ZONING || attributes.ZONE_DISTRICT || "Unknown";
      zoningDescription = attributes.ZONE_DESCRIPTION;
      zoningMapUrl = attributes.ZONING_WEB_URL;
      parcelId = attributes.SSL || attributes.SQUARE_SUFFIX_LOT;
    } else if (jurisdiction === "montgomery_md") {
      zoningClass = attributes.ZONE_ || attributes.CODE || attributes.ZONE || "Unknown";
      zoningDescription = attributes.LONGZONE;
      parcelId = attributes.PARCEL_ID || attributes.ACCOUNT_NUMBER;
    } else if (jurisdiction === "fairfax_va") {
      zoningClass = attributes.ZONECODE || attributes.ZONETYPE || "Unknown";
      zoningDescription = attributes.ZONETYPE;
      parcelId = attributes.PARCEL_PIN || attributes.PIN || attributes.OBJ_ID_ALIAS;
    } else if (jurisdiction === "arlington_va") {
      zoningClass = attributes.ZN_DESIG || attributes.REA_ZONECODE || "Unknown";
      zoningDescription = attributes.LABEL;
      parcelId = attributes.RPC_NUMBER || attributes.RPC;
    }

    return {
      zoningClass,
      zoningDescription,
      parcelId,
      zoningMapUrl,
      rawAttributes: attributes,
    };
  } catch (error) {
    console.error(`[GIS] ArcGIS query error for ${jurisdiction}:`, error);
    return null;
  }
}

/**
 * Coordinates geocoding and live ArcGIS MapServer querying to resolve zoning and parcel data.
 */
export async function getJurisdictionGisData(address: string): Promise<ZoningGisData | null> {
  if (!address) return null;

  // 1. Geocode the address
  const coords = await geocodeAddress(address);
  if (!coords) return null;

  // 2. Identify the correct jurisdiction
  const jurisdiction = determineJurisdictionFromAddress(address, address);
  if (!jurisdiction || !GIS_ENDPOINTS[jurisdiction]) {
    console.warn(`[GIS] Jurisdiction not supported for address: ${address}`);
    return null;
  }

  const endpoint = GIS_ENDPOINTS[jurisdiction];

  // 3. Query ArcGIS REST service
  const gisResult = await queryArcGisFeature(coords, endpoint.zoningUrl, jurisdiction, endpoint.bypassTls);
  if (!gisResult) {
    return {
      zoningClass: "Zone Undetermined",
      jurisdictionName: endpoint.name,
      zoningAuthority: endpoint.authority,
      zoningMapUrl: endpoint.mapUrl,
    };
  }

  return {
    zoningClass: gisResult.zoningClass,
    zoningDescription: gisResult.zoningDescription,
    jurisdictionName: endpoint.name,
    zoningAuthority: endpoint.authority,
    zoningMapUrl: gisResult.zoningMapUrl || endpoint.mapUrl,
    parcelId: gisResult.parcelId,
    rawAttributes: gisResult.rawAttributes,
  };
}
