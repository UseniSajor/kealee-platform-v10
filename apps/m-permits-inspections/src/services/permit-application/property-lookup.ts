/**
 * Property Lookup Service
 * Integrates with GIS/Assessor systems for parcel data
 */

export interface ParcelData {
  parcelNumber: string;
  address: string;
  ownerName?: string;
  ownerAddress?: string;
  assessedValue?: number;
  lotSize?: number; // Square feet
  zoning?: string;
  zoningDescription?: string;
  landUse?: string;
  yearBuilt?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  taxId?: string;
  legalDescription?: string;
}

export interface GISProvider {
  name: string;
  apiUrl: string;
  apiKey?: string;
}

export class PropertyLookupService {
  /**
   * Lookup property by address
   */
  async lookupByAddress(
    address: string,
    jurisdictionId?: string
  ): Promise<ParcelData | null> {
    try {
      // Try multiple lookup methods
      const results = await Promise.allSettled([
        this.lookupViaAPI(address, jurisdictionId),
        this.lookupViaGeocoding(address),
      ]);

      // Return first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          return result.value;
        }
      }

      return null;
    } catch (error) {
      console.error('Property lookup error:', error);
      return null;
    }
  }

  /**
   * Lookup property by parcel number
   */
  async lookupByParcel(
    parcelNumber: string,
    jurisdictionId?: string
  ): Promise<ParcelData | null> {
    try {
      const response = await fetch(
        `/api/property/lookup?parcel=${encodeURIComponent(parcelNumber)}&jurisdictionId=${jurisdictionId || ''}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return this.normalizeParcelData(data);
    } catch (error) {
      console.error('Parcel lookup error:', error);
      return null;
    }
  }

  /**
   * Search properties by partial address
   */
  async searchProperties(
    query: string,
    jurisdictionId?: string
  ): Promise<ParcelData[]> {
    try {
      const response = await fetch(
        `/api/property/search?q=${encodeURIComponent(query)}&jurisdictionId=${jurisdictionId || ''}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data) ? data.map(d => this.normalizeParcelData(d)) : [];
    } catch (error) {
      console.error('Property search error:', error);
      return [];
    }
  }

  /**
   * Lookup via jurisdiction API
   */
  private async lookupViaAPI(
    address: string,
    jurisdictionId?: string
  ): Promise<ParcelData | null> {
    if (!jurisdictionId) return null;

    try {
      const response = await fetch(
        `/api/jurisdictions/${jurisdictionId}/property/lookup`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({address}),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return this.normalizeParcelData(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Lookup via geocoding service (Google Maps, Mapbox, etc.)
   */
  private async lookupViaGeocoding(address: string): Promise<ParcelData | null> {
    try {
      // Use geocoding API to get coordinates
      // Then reverse geocode to get parcel data
      const geocodeResponse = await fetch(
        `/api/geocode?address=${encodeURIComponent(address)}`
      );

      if (!geocodeResponse.ok) return null;

      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.coordinates) return null;

      // Reverse geocode to get parcel info
      const parcelResponse = await fetch(
        `/api/geocode/reverse?lat=${geocodeData.coordinates.latitude}&lng=${geocodeData.coordinates.longitude}`
      );

      if (!parcelResponse.ok) return null;

      const parcelData = await parcelResponse.json();
      return this.normalizeParcelData({
        ...parcelData,
        coordinates: geocodeData.coordinates,
        address,
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Normalize parcel data from various sources
   */
  private normalizeParcelData(data: any): ParcelData {
    return {
      parcelNumber: data.parcelNumber || data.parcel_id || data.apn || '',
      address: data.address || data.full_address || '',
      ownerName: data.ownerName || data.owner_name || data.owner,
      ownerAddress: data.ownerAddress || data.owner_address,
      assessedValue: data.assessedValue || data.assessed_value || data.tax_assessed_value,
      lotSize: data.lotSize || data.lot_size || data.lot_sqft,
      zoning: data.zoning || data.zoning_code,
      zoningDescription: data.zoningDescription || data.zoning_description,
      landUse: data.landUse || data.land_use || data.use_code,
      yearBuilt: data.yearBuilt || data.year_built,
      squareFootage: data.squareFootage || data.sqft || data.building_area,
      bedrooms: data.bedrooms || data.beds,
      bathrooms: data.bathrooms || data.baths,
      coordinates: data.coordinates || (data.lat && data.lng
        ? {latitude: data.lat, longitude: data.lng}
        : undefined),
      taxId: data.taxId || data.tax_id,
      legalDescription: data.legalDescription || data.legal_description,
    };
  }

  /**
   * Validate address format
   */
  validateAddress(address: string): {valid: boolean; normalized?: string; error?: string} {
    // Basic validation
    if (!address || address.trim().length < 5) {
      return {valid: false, error: 'Address is too short'};
    }

    // Check for street number
    const hasNumber = /\d/.test(address);
    if (!hasNumber) {
      return {valid: false, error: 'Address should include a street number'};
    }

    // Normalize address
    const normalized = address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '');

    return {valid: true, normalized};
  }
}

// Singleton instance
export const propertyLookupService = new PropertyLookupService();
