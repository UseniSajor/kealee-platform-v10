/**
 * PAID GIS DATA PROVIDERS
 * ESRI ArcGIS, Mapbox, Zillow, Pitney Bowes, Moody's Analytics
 *
 * RECOMMENDED PROVIDERS:
 * 1. ESRI (ArcGIS) - Best for comprehensive jurisdiction + parcel data
 * 2. Mapbox - Best for visualization and mapping
 * 3. Zillow - Best for property valuation + parcel data
 * 4. Pitney Bowes - Best for parcel data + zoning profiles
 * 5. Moody's Analytics - Best for jurisdiction demographics
 *
 * RECOMMENDATION FOR KEALEE:
 * Start with ESRI + Mapbox for comprehensive coverage
 * Add Zillow for property enhancement
 * Add Pitney Bowes for zoning optimization
 */

import fetch from 'node-fetch';
import type { GeoJsonFeatureCollection } from './geojson-types';

export interface ProviderConfig {
  apiKey: string;
  endpoint: string;
  rateLimit: number; // requests per minute
}

// ============================================================================
// ESRI ARCGIS (TOP RECOMMENDATION)
// ============================================================================

export class ESRIProvider {
  private apiKey: string;
  private baseUrl = 'https://services.arcgis.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for parcel data across ESRI's massive parcel dataset
   * ESRI has 150+ million US parcels
   */
  async fetchParcels(
    state: string,
    county: string,
    options?: { limit?: number; includeZoning?: boolean }
  ): Promise<any[]> {
    console.log(`Fetching ESRI parcels for ${state}/${county}`);

    const query = new URLSearchParams({
      where: `state='${state}' AND county='${county}'`,
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
      token: this.apiKey,
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/sharing/rest/content/items/search?${query}`
      );
      const data = (await response.json()) as any;

      // Query the parcel feature service
      const parcelServiceId = data.results?.[0]?.id;
      if (!parcelServiceId) {
        console.warn('No parcel service found in ESRI');
        return [];
      }

      const parcelResponse = await fetch(
        `${this.baseUrl}/sharing/rest/content/items/${parcelServiceId}/data?` +
        `f=json&token=${this.apiKey}`
      );
      const parcels = (await parcelResponse.json()) as any;

      return (parcels.features || []).slice(0, options?.limit || 50000).map((f: any) => ({
        address: f.properties?.SITUS_ADDRESS || f.properties?.ADDRESS || '',
        coordinates: f.geometry?.centroid,
        sqft: f.properties?.SHAPE_AREA,
        zoning: options?.includeZoning ? f.properties?.ZONING : undefined,
        apn: f.properties?.APN || f.properties?.PARCEL_ID,
      }));
    } catch (error) {
      console.error('ESRI parcel fetch failed:', error);
      return [];
    }
  }

  /**
   * Fetch zoning information from ESRI zoning layers
   */
  async fetchZoning(
    state: string,
    county: string
  ): Promise<Record<string, any>[]> {
    console.log(`Fetching ESRI zoning for ${state}/${county}`);

    const query = new URLSearchParams({
      where: `state='${state}' AND county='${county}'`,
      outFields: 'ZONE_CODE,ZONE_DESCRIPTION,HEIGHT_LIMIT,SETBACK,FAR,PERMITTED_USES',
      returnGeometry: 'false',
      f: 'json',
      token: this.apiKey,
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/sharing/rest/content/items/zoning/FeatureServer/0/query?${query}`
      );
      const data = (await response.json()) as any;

      return (data.features || []).map((f: any) => ({
        designation: f.attributes?.ZONE_CODE,
        description: f.attributes?.ZONE_DESCRIPTION,
        heightLimit: f.attributes?.HEIGHT_LIMIT,
        setback: f.attributes?.SETBACK,
        faRatio: f.attributes?.FAR,
        permittedUses: f.attributes?.PERMITTED_USES?.split(',') || [],
      }));
    } catch (error) {
      console.error('ESRI zoning fetch failed:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to parcels
   */
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    console.log(`ESRI reverse geocode: ${lat}, ${lng}`);

    const response = await fetch(
      `${this.baseUrl}/sharing/rest/findAddressCandidates?` +
      `location=${lng},${lat}&outSR=%7B%22wkid%22%3A4326%7D&` +
      `f=json&token=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data.candidates?.[0] || null;
  }
}

// ============================================================================
// MAPBOX (VISUALIZATION + MAPPING)
// ============================================================================

export class MapboxProvider {
  private apiKey: string;
  private baseUrl = 'https://api.mapbox.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Query Mapbox Tilesets API for parcel boundaries
   * Mapbox provides optimized vector tiles for fast rendering
   */
  async fetchParcelBoundaries(
    bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number },
    zoom?: number
  ): Promise<GeoJsonFeatureCollection> {
    console.log(`Fetching Mapbox parcel boundaries for bbox`);

    const zoomLevel = zoom || 14;
    const response = await fetch(
      `${this.baseUrl}/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v8/tilesets/` +
      `features?bbox=${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}` +
      `&zoom=${zoomLevel}&access_token=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

    return (await response.json()) as GeoJsonFeatureCollection;
  }

  /**
   * Create a tileset from parcel data for fast visualization
   */
  async createParcelTileset(
    name: string,
    sourceUrl: string
  ): Promise<{ tilesetId: string; status: string }> {
    console.log(`Creating Mapbox tileset: ${name}`);

    const response = await fetch(`${this.baseUrl}/tilesets/v1?access_token=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        source: sourceUrl,
        schema: {
          'address': 'string',
          'apn': 'string',
          'zoning': 'string',
          'sqft': 'number',
        },
      }),
    });

    const data = (await response.json()) as any;
    return {
      tilesetId: data.id,
      status: data.status,
    };
  }

  /**
   * Query Mapbox Geocoding API (reverse geocode)
   */
  async reverseGeocode(lng: number, lat: number): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
      `access_token=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data.features?.[0] || null;
  }
}

// ============================================================================
// ZILLOW API (PROPERTY DATA + VALUATION)
// ============================================================================

export class ZillowProvider {
  private apiKey: string;
  private baseUrl = 'https://www.zillow.com/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search properties by location
   * RATE LIMITED: 10 requests per minute
   */
  async searchProperties(
    state: string,
    county: string,
    options?: { limit?: number; includeZoning?: boolean }
  ): Promise<any[]> {
    console.log(`Fetching Zillow properties for ${state}/${county}`);

    const params = new URLSearchParams({
      state,
      county,
      zpid: '*', // All properties
      resultCount: String(options?.limit || 1000),
      zapi_key: this.apiKey,
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/property/search?${params}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Zillow API rate limit exceeded');
        }
        throw new Error(`Zillow API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return (data.properties || []).map((prop: any) => ({
        address: `${prop.streetAddress}, ${prop.city}, ${prop.state}`,
        apn: prop.parcelNumber,
        zEstimate: prop.zestimate,
        sqft: prop.lotSizeSqFt,
        yearBuilt: prop.yearBuilt,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        zoning: options?.includeZoning ? prop.zoning : undefined,
        propertyType: prop.propertyType,
      }));
    } catch (error) {
      console.error('Zillow search failed:', error);
      return [];
    }
  }

  /**
   * Get property details including valuation
   */
  async getPropertyDetails(zpid: string): Promise<any> {
    console.log(`Fetching Zillow property details for ZPID: ${zpid}`);

    const response = await fetch(
      `${this.baseUrl}/v1/property?zpid=${zpid}&zapi_key=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return {
      zpid: data.zpid,
      address: data.address,
      zEstimate: data.zestimate,
      zestimateLastUpdate: data.zestimateLastUpdateDate,
      priceHistory: data.priceHistory,
      taxHistory: data.taxHistory,
      valuation: data.zestimate,
    };
  }

  /**
   * Reverse geocode to find properties
   */
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/v1/property?latitude=${lat}&longitude=${lng}&` +
      `zapi_key=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data.properties?.[0] || null;
  }
}

// ============================================================================
// PITNEY BOWES (PARCEL DATA + ZONING)
// ============================================================================

export class PitneybowesProvider {
  private apiKey: string;
  private baseUrl = 'https://cloud.pitneybowes.com/parcel/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Query Pitney Bowes parcel database
   * Best for comprehensive parcel data with zoning
   */
  async searchParcels(
    state: string,
    county?: string,
    options?: { limit?: number }
  ): Promise<any[]> {
    console.log(`Fetching Pitney Bowes parcels for ${state}/${county || 'all'}`);

    const query = county
      ? `state='${state}' AND county='${county}'`
      : `state='${state}'`;

    const response = await fetch(
      `${this.baseUrl}/parcels?where=${encodeURIComponent(query)}&` +
      `outFields=*&limit=${options?.limit || 50000}&apikey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Pitney Bowes API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return (data.features || []).map((f: any) => ({
      parcelId: f.properties?.PARCEL_ID,
      address: f.properties?.SITUS_ADDRESS,
      owner: f.properties?.OWNER_NAME,
      ownerAddress: f.properties?.OWNER_ADDRESS,
      sqft: f.properties?.PARCEL_AREA_SQFT,
      zoning: f.properties?.ZONING_CODE,
      zoningDescription: f.properties?.ZONING_DESCRIPTION,
      coordinates: f.geometry?.centroid,
      assessedValue: f.properties?.ASSESSED_VALUE,
      taxAmount: f.properties?.TAX_AMOUNT,
    }));
  }

  /**
   * Get zoning and land use information
   */
  async getZoningInfo(parcelId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/parcels/${parcelId}/zoning?apikey=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data;
  }

  /**
   * Reverse geocode to parcel
   */
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/location?latitude=${lat}&longitude=${lng}&` +
      `apikey=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data.parcel || null;
  }
}

// ============================================================================
// MOODY'S ANALYTICS (JURISDICTION DATA + DEMOGRAPHICS)
// ============================================================================

export class MoodysAnalyticsProvider {
  private apiKey: string;
  private baseUrl = 'https://api.moodysanalytics.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch jurisdiction and demographic data
   */
  async fetchJurisdictionData(
    state: string,
    county?: string
  ): Promise<any[]> {
    console.log(`Fetching Moody's jurisdiction data for ${state}`);

    const response = await fetch(
      `${this.baseUrl}/jurisdictions?state=${state}` +
      `${county ? `&county=${county}` : ''}` +
      `&apikey=${this.apiKey}`
    );

    const data = (await response.json()) as any;

    return (data.jurisdictions || []).map((j: any) => ({
      fipsCode: j.fips_code,
      name: j.jurisdiction_name,
      state: j.state_code,
      county: j.county_name,
      populationEstimate: j.population,
      medianHouseholdIncome: j.median_household_income,
      housingUnits: j.housing_units,
      buildingPermits: j.building_permits_issued,
    }));
  }

  /**
   * Get economic indicators for a jurisdiction
   */
  async getEconomicIndicators(fipsCode: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/jurisdictions/${fipsCode}/economics?apikey=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data;
  }

  /**
   * Get construction/permit trends
   */
  async getConstructionTrends(state: string): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/construction-trends?state=${state}&apikey=${this.apiKey}`
    );

    const data = (await response.json()) as any;
    return data.trends || [];
  }
}

// ============================================================================
// PROVIDER FACTORY & ORCHESTRATION
// ============================================================================

export class PaidProviderFactory {
  private esri?: ESRIProvider;
  private mapbox?: MapboxProvider;
  private zillow?: ZillowProvider;
  private pitneybowes?: PitneybowesProvider;
  private moodys?: MoodysAnalyticsProvider;

  constructor() {
    // Initialize if API keys are provided
    if (process.env.ESRI_API_KEY) {
      this.esri = new ESRIProvider(process.env.ESRI_API_KEY);
    }
    if (process.env.MAPBOX_API_KEY) {
      this.mapbox = new MapboxProvider(process.env.MAPBOX_API_KEY);
    }
    if (process.env.ZILLOW_API_KEY) {
      this.zillow = new ZillowProvider(process.env.ZILLOW_API_KEY);
    }
    if (process.env.PITNEY_BOWES_API_KEY) {
      this.pitneybowes = new PitneybowesProvider(process.env.PITNEY_BOWES_API_KEY);
    }
    if (process.env.MOODY_ANALYTICS_API_KEY) {
      this.moodys = new MoodysAnalyticsProvider(process.env.MOODY_ANALYTICS_API_KEY);
    }
  }

  /**
   * Fetch parcels from best available paid provider
   * Priority: Pitney Bowes > ESRI > Zillow
   */
  async fetchParcels(state: string, county: string, options?: any): Promise<any[]> {
    if (this.pitneybowes) {
      return await this.pitneybowes.searchParcels(state, county, options);
    }
    if (this.esri) {
      return await this.esri.fetchParcels(state, county, options);
    }
    if (this.zillow) {
      return await this.zillow.searchProperties(state, county, options);
    }
    return [];
  }

  /**
   * Fetch zoning from best available provider
   * Priority: Pitney Bowes > ESRI
   */
  async fetchZoning(state: string, county: string): Promise<any[]> {
    if (this.pitneybowes) {
      // Pitney Bowes includes zoning in parcel data
      const parcels = await this.pitneybowes.searchParcels(state, county);
      return parcels.map(p => ({
        designation: p.zoning,
        description: p.zoningDescription,
      }));
    }
    if (this.esri) {
      return await this.esri.fetchZoning(state, county);
    }
    return [];
  }

  /**
   * Fetch jurisdiction data from best available provider
   * Priority: Moody's > ESRI
   */
  async fetchJurisdictions(state: string, county?: string): Promise<any[]> {
    if (this.moodys) {
      return await this.moodys.fetchJurisdictionData(state, county);
    }
    // ESRI also has jurisdiction data
    return [];
  }

  isConfigured(provider: string): boolean {
    const map: Record<string, boolean> = {
      esri: !!this.esri,
      mapbox: !!this.mapbox,
      zillow: !!this.zillow,
      pitney_bowes: !!this.pitneybowes,
      moody_analytics: !!this.moodys,
    };
    return map[provider] || false;
  }

  getConfiguredProviders(): string[] {
    const providers = [];
    if (this.esri) providers.push('esri');
    if (this.mapbox) providers.push('mapbox');
    if (this.zillow) providers.push('zillow');
    if (this.pitneybowes) providers.push('pitney_bowes');
    if (this.moodys) providers.push('moody_analytics');
    return providers;
  }
}

export default PaidProviderFactory;
