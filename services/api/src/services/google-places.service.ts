/**
 * Google Places API Service
 * Handles address autocomplete, place details, geocoding, and jurisdiction detection
 */

import { config } from '../config';

interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  types: string[];
  name?: string;
}

interface GeocodeResult {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  placeId?: string;
}

interface JurisdictionInfo {
  city?: string;
  county?: string;
  state: string;
  country: string;
  zipCode?: string;
  jurisdictionCode?: string;
  detectedJurisdiction?: string;
}

/**
 * Get Google Places API base URL
 */
function getPlacesApiUrl(endpoint: string, params: Record<string, string>): string {
  const baseUrl = 'https://maps.googleapis.com/maps/api';
  const apiKey = config.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  const queryParams = new URLSearchParams({
    ...params,
    key: apiKey,
  });

  return `${baseUrl}${endpoint}?${queryParams.toString()}`;
}

/**
 * Autocomplete addresses
 */
export async function autocompleteAddresses(
  input: string,
  sessionToken?: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<PlaceAutocompleteResult[]> {
  try {
    if (!config.googleMapsApiKey) {
      console.warn('⚠️  Google Maps API key not configured. Returning empty results.');
      return [];
    }

    const params: Record<string, string> = {
      input,
      types: 'address',
    };

    if (sessionToken) {
      params.sessiontoken = sessionToken;
    }

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      if (radius) {
        params.radius = radius.toString();
      }
    }

    const url = getPlacesApiUrl('/place/autocomplete/json', params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }

    return (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text || prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types || [],
    }));
  } catch (error: any) {
    console.error('Address autocomplete error:', error);
    throw new Error(`Failed to autocomplete addresses: ${error.message}`);
  }
}

/**
 * Get place details by place ID
 */
export async function getPlaceDetails(
  placeId: string,
  sessionToken?: string,
  fields?: string[]
): Promise<PlaceDetails> {
  try {
    if (!config.googleMapsApiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const defaultFields = [
      'place_id',
      'formatted_address',
      'address_components',
      'geometry',
      'types',
      'name',
    ];

    const params: Record<string, string> = {
      place_id: placeId,
      fields: (fields || defaultFields).join(','),
    };

    if (sessionToken) {
      params.sessiontoken = sessionToken;
    }

    const url = getPlacesApiUrl('/place/details/json', params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }

    const result = data.result;
    const location = result.geometry?.location;

    return {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types || [],
      })),
      geometry: {
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
        },
        viewport: result.geometry?.viewport ? {
          northeast: {
            lat: result.geometry.viewport.northeast.lat,
            lng: result.geometry.viewport.northeast.lng,
          },
          southwest: {
            lat: result.geometry.viewport.southwest.lat,
            lng: result.geometry.viewport.southwest.lng,
          },
        } : undefined,
      },
      types: result.types || [],
      name: result.name,
    };
  } catch (error: any) {
    console.error('Get place details error:', error);
    throw new Error(`Failed to get place details: ${error.message}`);
  }
}

/**
 * Geocode an address
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    if (!config.googleMapsApiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const params: Record<string, string> = {
      address,
    };

    const url = getPlacesApiUrl('/geocode/json', params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message || ''}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for address');
    }

    const result = data.results[0];
    const location = result.geometry?.location;

    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: location?.lat || 0,
        lng: location?.lng || 0,
      },
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types || [],
      })),
      placeId: result.place_id,
    };
  } catch (error: any) {
    console.error('Geocode address error:', error);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
}

/**
 * Detect jurisdiction from address
 */
export async function detectJurisdiction(address: string): Promise<JurisdictionInfo> {
  try {
    const geocodeResult = await geocodeAddress(address);
    
    const jurisdiction: JurisdictionInfo = {
      state: '',
      country: 'US',
    };

    // Extract jurisdiction info from address components
    for (const component of geocodeResult.addressComponents) {
      if (component.types.includes('locality')) {
        jurisdiction.city = component.longName;
      } else if (component.types.includes('administrative_area_level_2')) {
        jurisdiction.county = component.longName;
      } else if (component.types.includes('administrative_area_level_1')) {
        jurisdiction.state = component.shortName;
      } else if (component.types.includes('postal_code')) {
        jurisdiction.zipCode = component.longName;
      } else if (component.types.includes('country')) {
        jurisdiction.country = component.shortName;
      }
    }

    // Generate jurisdiction code (e.g., "US-DC-DC", "US-MD-MONT")
    if (jurisdiction.country === 'US') {
      if (jurisdiction.state === 'DC') {
        jurisdiction.jurisdictionCode = 'US-DC-DC';
        jurisdiction.detectedJurisdiction = 'dc';
      } else if (jurisdiction.county) {
        // Map common counties to jurisdiction codes
        const countyMap: Record<string, string> = {
          'Montgomery': 'US-MD-MONT',
          "Prince George's": 'US-MD-PG',
          'Arlington': 'US-VA-ARL',
          'Fairfax': 'US-VA-FFX',
        };

        const countyKey = jurisdiction.county.replace(' County', '');
        if (countyMap[countyKey]) {
          jurisdiction.jurisdictionCode = countyMap[countyKey];
          jurisdiction.detectedJurisdiction = countyKey.toLowerCase().replace(/\s+/g, '-');
        }
      }
    }

    return jurisdiction;
  } catch (error: any) {
    console.error('Detect jurisdiction error:', error);
    throw new Error(`Failed to detect jurisdiction: ${error.message}`);
  }
}

/**
 * Reverse geocode (coordinates to address)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    if (!config.googleMapsApiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const params: Record<string, string> = {
      latlng: `${lat},${lng}`,
    };

    const url = getPlacesApiUrl('/geocode/json', params);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Geocoding API error: ${data.status} - ${data.error_message || ''}`);
    }

    if (!data.results || data.results.length === 0) {
      throw new Error('No results found for coordinates');
    }

    const result = data.results[0];

    return {
      formattedAddress: result.formatted_address,
      location: {
        lat,
        lng,
      },
      addressComponents: (result.address_components || []).map((comp: any) => ({
        longName: comp.long_name,
        shortName: comp.short_name,
        types: comp.types || [],
      })),
      placeId: result.place_id,
    };
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    throw new Error(`Failed to reverse geocode: ${error.message}`);
  }
}


