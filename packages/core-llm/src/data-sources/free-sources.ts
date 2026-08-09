/**
 * FREE GIS DATA SOURCES
 * County Assessor APIs, OpenGov, OpenStreetMap, USGS
 */

import fetch from 'node-fetch';

export interface JurisdictionData {
  name: string;
  code: string;
  state: string;
  county?: string;
  type: 'STATE' | 'COUNTY' | 'CITY' | 'MUNICIPALITY';
  buildingCodes?: string[];
  permitTypes?: string[];
}

export interface ParcelData {
  address: string;
  county: string;
  state: string;
  coordinates?: { lat: number; lng: number };
  boundaries?: GeoJSON.Polygon;
  sqft?: number;
  lotSize?: number;
  zoning?: string;
}

export interface ZoningData {
  designation: string;
  description: string;
  permitUses: string[];
  conditionalUses: string[];
  heightLimit?: number;
  setbackFeet?: number;
  faRatio?: number;
  parkingRequired?: number;
}

// ============================================================================
// COUNTY ASSESSOR API (FREE)
// ============================================================================

export class CountyAssessorSource {
  /**
   * Fetch California County Assessor GIS data
   * Most counties expose GIS data via ArcGIS REST API
   */
  static async fetchCACountyData(county: string): Promise<{
    jurisdictions: JurisdictionData[];
    parcels: ParcelData[];
  }> {
    console.log(`Fetching CA County Assessor data for ${county}`);

    // California county assessors typically expose data via:
    // {county}.ca.gov/assessor/gis/ or ArcGIS REST endpoints

    const sources: Record<string, string> = {
      'San Francisco': 'https://gis.sfgov.org/rest/services/Assessor',
      'Los Angeles': 'https://gis.lacity.gov/arcgis/rest/services/Assessor',
      'San Diego': 'https://services1.arcgisonline.com/ArcGIS/rest/services/SanDiego',
      'Alameda': 'https://gis.acgov.org/arcgis/rest/services/Assessor',
      'Contra Costa': 'https://gis.ccgov.org/arcgis/rest/services/Assessor',
      'Marin': 'https://marincounty-gis.opendata.arcgis.com',
      'Santa Clara': 'https://gis.sccgov.org/arcgis/rest/services/Assessor',
      'Solano': 'https://gis.solanocounty.com/arcgis/rest/services/Assessor',
      'Sonoma': 'https://gis.sonomacounty.ca.gov/arcgis/rest/services/Assessor',
    };

    const endpoint = sources[county];
    if (!endpoint) {
      console.warn(`No public GIS endpoint found for ${county}`);
      return { jurisdictions: [], parcels: [] };
    }

    try {
      // Query ArcGIS REST API for parcel data
      const parcelUrl = `${endpoint}/Parcels/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=json`;
      const response = await fetch(parcelUrl);
      const data = (await response.json()) as any;

      const parcels = (data.features || []).map((feature: any) => ({
        address: feature.attributes?.SITUS_ADDRESS || '',
        county,
        state: 'CA',
        coordinates: feature.geometry?.centroid || null,
        boundaries: feature.geometry,
        sqft: feature.attributes?.SHAPE_AREA || 0,
      }));

      return {
        jurisdictions: [{
          name: county,
          code: `CA_${county.replace(/\s/g, '_')}`,
          state: 'CA',
          county,
          type: 'COUNTY',
        }],
        parcels,
      };
    } catch (error) {
      console.error(`Failed to fetch CA County data for ${county}:`, error);
      return { jurisdictions: [], parcels: [] };
    }
  }

  /**
   * Fetch Texas County Assessor/Appraisal Data
   */
  static async fetchTXCountyData(county: string): Promise<{
    jurisdictions: JurisdictionData[];
    parcels: ParcelData[];
  }> {
    console.log(`Fetching TX County Appraisal data for ${county}`);

    // Texas has centralized appraisal data portals (CAD - Central Appraisal Districts)
    // Example: Travis County = Travis CAD

    const cadSources: Record<string, string> = {
      'Travis': 'https://www.traviscad.org',
      'Dallas': 'https://www.dallascad.org',
      'Harris': 'https://www.hcad.org',
      'Bexar': 'https://bexar.oncore.org',
      'Tarrant': 'https://www.tar-county.com/PublicInterface/api',
    };

    const endpoint = cadSources[county];
    if (!endpoint) {
      console.warn(`No CAD endpoint found for ${county}`);
      return { jurisdictions: [], parcels: [] };
    }

    try {
      // Most Texas CADs expose GIS data via public APIs or web services
      const response = await fetch(`${endpoint}/property/search?format=json&limit=10000`);
      const data = (await response.json()) as any;

      const parcels = (data.results || []).map((prop: any) => ({
        address: prop.address || '',
        county,
        state: 'TX',
        coordinates: prop.location || null,
        zoning: prop.zoning_classification,
      }));

      return {
        jurisdictions: [{
          name: county,
          code: `TX_${county.replace(/\s/g, '_')}`,
          state: 'TX',
          county,
          type: 'COUNTY',
        }],
        parcels,
      };
    } catch (error) {
      console.error(`Failed to fetch TX County data for ${county}:`, error);
      return { jurisdictions: [], parcels: [] };
    }
  }

  /**
   * Fetch Maryland County Assessor Data (DMV + Baltimore)
   * Maryland has excellent free public GIS data
   */
  static async fetchMDCountyData(county: string): Promise<{
    jurisdictions: JurisdictionData[];
    parcels: ParcelData[];
  }> {
    console.log(`Fetching MD County Assessor data for ${county}`);

    // Maryland counties expose free GIS data via:
    // msa.maryland.gov (Maryland State Archives)
    // Individual county assessor portals

    const mdSources: Record<string, string> = {
      'Montgomery': 'https://gis.montgomerycountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Prince George\'s': 'https://gis.pgcmd.org/arcgis/rest/services/AssessmentParcel',
      'Baltimore': 'https://gis.baltimorecountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Baltimore City': 'https://gis.baltimorecity.gov/arcgis/rest/services/AssessmentParcel',
      'Anne Arundel': 'https://gis.aacounty.org/arcgis/rest/services/AssessmentParcel',
      'Harford': 'https://gis.harfordcountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Carroll': 'https://gis.carrollcountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Howard': 'https://gis.howardcountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Frederick': 'https://gis.frederickcountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Washington': 'https://gis.washingtonco-md.gov/arcgis/rest/services/AssessmentParcel',
      'Allegany': 'https://gis.alleganycounty.gov/arcgis/rest/services/AssessmentParcel',
      'Wicomico': 'https://gis.wicomicocounty.org/arcgis/rest/services/AssessmentParcel',
      'Somerset': 'https://gis.somersetcountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Dorchester': 'https://gis.dorchestercountymd.gov/arcgis/rest/services/AssessmentParcel',
      'Talbot': 'https://gis.talbotcountymd.gov/arcgis/rest/services/AssessmentParcel',
    };

    const endpoint = mdSources[county];
    if (!endpoint) {
      console.warn(`No public GIS endpoint found for ${county}, MD`);
      return { jurisdictions: [], parcels: [] };
    }

    try {
      const response = await fetch(
        `${endpoint}/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=json`
      );
      const data = (await response.json()) as any;

      const parcels = (data.features || []).map((feature: any) => ({
        address: feature.attributes?.SITUS_ADDRESS || '',
        county,
        state: 'MD',
        coordinates: feature.geometry?.centroid || null,
        boundaries: feature.geometry,
        sqft: feature.attributes?.SHAPE_AREA || 0,
      }));

      return {
        jurisdictions: [{
          name: county,
          code: `MD_${county.replace(/\s/g, '_')}`,
          state: 'MD',
          county,
          type: 'COUNTY',
        }],
        parcels,
      };
    } catch (error) {
      console.error(`Failed to fetch MD County data for ${county}:`, error);
      return { jurisdictions: [], parcels: [] };
    }
  }

  /**
   * Fetch Virginia County Assessor Data (DMV + Northern Virginia)
   * Virginia has excellent free public parcel data
   */
  static async fetchVACountyData(county: string): Promise<{
    jurisdictions: JurisdictionData[];
    parcels: ParcelData[];
  }> {
    console.log(`Fetching VA County Assessor data for ${county}`);

    // Virginia counties expose free GIS data via:
    // vgis.lis.virginia.gov
    // Individual county GIS portals

    const vaSources: Record<string, string> = {
      'Fairfax': 'https://gis.fairfaxcounty.gov/arcgis/rest/services/ParcelInfo',
      'Arlington': 'https://gis.arlingtonva.us/arcgis/rest/services/ParcelData',
      'Alexandria': 'https://gis.alexandriava.gov/arcgis/rest/services/AssessmentParcel',
      'Loudoun': 'https://gis.loudoun.gov/arcgis/rest/services/ParcelData',
      'Prince William': 'https://mapping.pwcgov.org/arcgis/rest/services/ParcelInfo',
      'Stafford': 'https://gis.staffordcountyva.gov/arcgis/rest/services/ParcelData',
      'Fauquier': 'https://gis.fauquiercounty.gov/arcgis/rest/services/ParcelData',
      'Clarke': 'https://gis.clarkecountyva.gov/arcgis/rest/services/ParcelData',
      'Frederick': 'https://gis.co.frederick.va.us/arcgis/rest/services/ParcelData',
      'Shenandoah': 'https://gis.shenandoahco.gov/arcgis/rest/services/ParcelData',
      'Warren': 'https://gis.warrencountyva.gov/arcgis/rest/services/ParcelData',
      'Page': 'https://gis.pagecountyva.gov/arcgis/rest/services/ParcelData',
      'Rappahannock': 'https://gis.rappahannockcountyva.gov/arcgis/rest/services/ParcelData',
    };

    const endpoint = vaSources[county];
    if (!endpoint) {
      console.warn(`No public GIS endpoint found for ${county}, VA`);
      return { jurisdictions: [], parcels: [] };
    }

    try {
      const response = await fetch(
        `${endpoint}/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=json`
      );
      const data = (await response.json()) as any;

      const parcels = (data.features || []).map((feature: any) => ({
        address: feature.attributes?.ADDRESS || feature.attributes?.SITUS_ADDRESS || '',
        county,
        state: 'VA',
        coordinates: feature.geometry?.centroid || null,
        boundaries: feature.geometry,
        sqft: feature.attributes?.ACRES ? feature.attributes.ACRES * 43560 : 0,
      }));

      return {
        jurisdictions: [{
          name: county,
          code: `VA_${county.replace(/\s/g, '_')}`,
          state: 'VA',
          county,
          type: 'COUNTY',
        }],
        parcels,
      };
    } catch (error) {
      console.error(`Failed to fetch VA County data for ${county}:`, error);
      return { jurisdictions: [], parcels: [] };
    }
  }

  /**
   * Fetch DC (District of Columbia) Assessor Data
   * DC has excellent free public parcel data
   */
  static async fetchDCData(): Promise<{
    jurisdictions: JurisdictionData[];
    parcels: ParcelData[];
  }> {
    console.log('Fetching DC Assessor data');

    try {
      // DC Open GIS data
      const response = await fetch(
        'https://opendata.dc.gov/api/3/action/package_search?q=parcel'
      );
      const data = (await response.json()) as any;

      // Alternatively: https://gis.dc.gov/arcgis/rest/services/AssessmentParcel
      const alt_response = await fetch(
        'https://gis.dc.gov/arcgis/rest/services/AssessmentParcel/MapServer/0/query?' +
        'where=1%3D1&outFields=*&returnGeometry=true&f=json'
      );
      const altData = (await alt_response.json()) as any;

      const parcels = (altData.features || []).map((feature: any) => ({
        address: feature.attributes?.ADDRESS || '',
        county: 'District of Columbia',
        state: 'DC',
        coordinates: feature.geometry?.centroid || null,
        boundaries: feature.geometry,
        sqft: feature.attributes?.SHAPE_AREA || 0,
      }));

      return {
        jurisdictions: [{
          name: 'District of Columbia',
          code: 'DC',
          state: 'DC',
          type: 'CITY',
        }],
        parcels,
      };
    } catch (error) {
      console.error('Failed to fetch DC Assessor data:', error);
      return { jurisdictions: [], parcels: [] };
    }
  }
}

// ============================================================================
// OPENGOV API (FREE)
// ============================================================================

export class OpenGovSource {
  private static readonly API_BASE = 'https://api.opengovus.org/api';

  /**
   * Fetch jurisdiction data from OpenGov
   */
  static async fetchJurisdictions(state: string): Promise<JurisdictionData[]> {
    console.log(`Fetching OpenGov jurisdictions for ${state}`);

    try {
      const response = await fetch(
        `${this.API_BASE}/states/${state}/counties?format=json`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenGov API returned ${response.status}`);
      }

      const data = (await response.json()) as any;

      return (data.results || data.counties || []).map((county: any) => ({
        name: county.name || county.county_name,
        code: county.geoid || `${state}_${county.name}`,
        state,
        county: county.name,
        type: 'COUNTY' as const,
      }));
    } catch (error) {
      console.error(`Failed to fetch OpenGov jurisdictions for ${state}:`, error);
      return [];
    }
  }

  /**
   * Fetch county boundaries and demographics
   */
  static async fetchCountyBoundaries(state: string, county: string): Promise<GeoJSON.FeatureCollection | null> {
    console.log(`Fetching county boundaries for ${county}, ${state}`);

    try {
      const response = await fetch(
        `${this.API_BASE}/geography/counties?state=${state}&county=${county}&format=geojson`,
        {
          headers: { 'Accept': 'application/geo+json' },
        }
      );

      if (!response.ok) return null;
      return (await response.json()) as GeoJSON.FeatureCollection;
    } catch (error) {
      console.error('Failed to fetch county boundaries:', error);
      return null;
    }
  }
}

// ============================================================================
// OPENSTREETMAP OVERPASS API (FREE)
// ============================================================================

export class OpenStreetMapSource {
  private static readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter';

  /**
   * Fetch buildings/parcels from OpenStreetMap
   */
  static async fetchBuildingFootprints(
    state: string,
    county?: string,
    bbox?: { minLat: number; minLng: number; maxLat: number; maxLng: number }
  ): Promise<ParcelData[]> {
    console.log(`Fetching OSM building footprints for ${state}${county ? `, ${county}` : ''}`);

    // Default bounding boxes for states
    const bboxes: Record<string, string> = {
      CA: '32.5,-124.5,42,-114',
      NY: '40.5,-79.8,45.1,-71.8',
      TX: '25.8,-106.6,36.5,-93.5',
      VA: '36.5,-83.7,39.5,-75.2',
      MD: '37.9,-79.5,39.7,-75.0',
    };

    const bboxStr = bbox
      ? `${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng}`
      : bboxes[state] || '25,-125,50,-65';

    const query = `[bbox:${bboxStr}];
      (
        way["building"];
        relation["building"];
      );
      out geom;`;

    try {
      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!response.ok) {
        throw new Error(`Overpass API returned ${response.status}`);
      }

      const data = (await response.json()) as any;

      return (data.elements || [])
        .filter((el: any) => el.type === 'way' && el.geometry)
        .slice(0, 10000) // Limit to 10K buildings
        .map((way: any) => {
          const coords = way.geometry as Array<{ lat: number; lon: number }>;
          const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
          const centerLng = coords.reduce((sum, c) => sum + c.lon, 0) / coords.length;

          return {
            address: way.tags?.name || way.tags?.addr?.street || 'Unknown',
            county: county || state,
            state,
            coordinates: { lat: centerLat, lng: centerLng },
            boundaries: {
              type: 'Polygon' as const,
              coordinates: [[coords.map(c => [c.lon, c.lat])]],
            },
          };
        });
    } catch (error) {
      console.error('Failed to fetch OSM buildings:', error);
      return [];
    }
  }

  /**
   * Fetch administrative boundaries from OpenStreetMap
   */
  static async fetchAdministrativeBoundaries(state: string): Promise<GeoJSON.FeatureCollection | null> {
    console.log(`Fetching administrative boundaries for ${state}`);

    const query = `
      [bbox:25,-125,50,-65];
      (
        relation["boundary"="administrative"]["admin_level"~"(4|6)"]["name"~"${state}"];
      );
      out geom;`;

    try {
      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) return null;

      const data = (await response.json()) as any;

      return {
        type: 'FeatureCollection' as const,
        features: (data.elements || []).map((el: any) => ({
          type: 'Feature' as const,
          properties: el.tags || {},
          geometry: el.geometry,
        })),
      };
    } catch (error) {
      console.error('Failed to fetch OSM boundaries:', error);
      return null;
    }
  }
}

// ============================================================================
// USGS GIS DATA (FREE)
// ============================================================================

export class USGSSource {
  private static readonly USGS_API = 'https://services.usgs.gov/arcgis/rest/services';

  /**
   * Fetch USGS geographic data
   */
  static async fetchGeographicNames(state: string, county?: string): Promise<JurisdictionData[]> {
    console.log(`Fetching USGS geographic names for ${state}`);

    try {
      const response = await fetch(
        `${this.USGS_API}/TNM_Geographic_Names/MapServer/0/query?` +
        `where=STATE='${state}'&outFields=*&f=json`
      );

      if (!response.ok) return [];

      const data = (await response.json()) as any;

      return (data.features || [])
        .filter((f: any) => f.attributes?.FEATURE_CLASS === 'County')
        .map((f: any) => ({
          name: f.attributes?.FEATURE_NAME,
          code: `${state}_${f.attributes?.FEATURE_NAME}`,
          state,
          county: f.attributes?.FEATURE_NAME,
          type: 'COUNTY' as const,
        }));
    } catch (error) {
      console.error('Failed to fetch USGS geographic names:', error);
      return [];
    }
  }

  /**
   * Fetch USGS 3DEP elevation/terrain data
   */
  static async fetchTerrainData(bbox: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }): Promise<any> {
    console.log('Fetching USGS terrain data');

    try {
      const response = await fetch(
        `${this.USGS_API}/elevation/MapServer/rest/services/elevation?` +
        `locations=${bbox.minLng},${bbox.minLat};${bbox.maxLng},${bbox.maxLat}&f=json`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch USGS terrain data:', error);
      return null;
    }
  }
}

// ============================================================================
// DATA AGGREGATOR (FREE SOURCES)
// ============================================================================

export class FreeDataSourceAggregator {
  /**
   * Fetch jurisdiction data from all free sources
   * Includes special handling for DMV and Baltimore (ALL counties have free data)
   */
  static async fetchJurisdictions(state: string): Promise<JurisdictionData[]> {
    const sources = await Promise.all([
      OpenGovSource.fetchJurisdictions(state),
      USGSSource.fetchGeographicNames(state),
    ]);

    // Merge and deduplicate
    const merged = new Map<string, JurisdictionData>();
    sources.forEach(jurisdictions => {
      jurisdictions.forEach(j => {
        if (!merged.has(j.code)) {
          merged.set(j.code, j);
        }
      });
    });

    return Array.from(merged.values());
  }

  /**
   * Fetch parcel data from free sources
   * Priority: County Assessor > OpenGov > OpenStreetMap fallback
   * DMV (DC, MD, VA) and Baltimore have EXCELLENT free tier coverage
   */
  static async fetchParcels(
    state: string,
    county?: string,
    options?: { limit?: number; bbox?: any }
  ): Promise<ParcelData[]> {
    // Try county assessor first (CA, TX, MD, VA have county-level APIs)
    if (state === 'CA' && county) {
      const caData = await CountyAssessorSource.fetchCACountyData(county);
      if (caData.parcels.length > 0) {
        return caData.parcels.slice(0, options?.limit || 10000);
      }
    }

    if (state === 'TX' && county) {
      const txData = await CountyAssessorSource.fetchTXCountyData(county);
      if (txData.parcels.length > 0) {
        return txData.parcels.slice(0, options?.limit || 10000);
      }
    }

    // DMV & BALTIMORE: ALL counties have free public GIS data!
    if (state === 'MD' && county) {
      const mdData = await CountyAssessorSource.fetchMDCountyData(county);
      if (mdData.parcels.length > 0) {
        return mdData.parcels.slice(0, options?.limit || 10000);
      }
    }

    if (state === 'VA' && county) {
      const vaData = await CountyAssessorSource.fetchVACountyData(county);
      if (vaData.parcels.length > 0) {
        return vaData.parcels.slice(0, options?.limit || 10000);
      }
    }

    if (state === 'DC') {
      const dcData = await CountyAssessorSource.fetchDCData();
      if (dcData.parcels.length > 0) {
        return dcData.parcels.slice(0, options?.limit || 10000);
      }
    }

    // Fall back to OpenStreetMap for other states/counties
    const osmParcels = await OpenStreetMapSource.fetchBuildingFootprints(
      state,
      county,
      options?.bbox
    );
    return osmParcels.slice(0, options?.limit || 10000);
  }

  /**
   * Fetch boundary data from free sources
   */
  static async fetchBoundaries(state: string): Promise<GeoJSON.FeatureCollection | null> {
    // Try OpenGov first
    const ogBoundaries = await OpenGovSource.fetchCountyBoundaries(state, '');
    if (ogBoundaries) return ogBoundaries;

    // Fall back to OpenStreetMap
    return await OpenStreetMapSource.fetchAdministrativeBoundaries(state);
  }
}

export default FreeDataSourceAggregator;
