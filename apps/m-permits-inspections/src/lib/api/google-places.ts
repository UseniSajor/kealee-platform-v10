// apps/m-permits-inspections/lib/api/google-places.ts
// Google Places API integration for address autocomplete

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

class GooglePlacesService {
  private apiKey: string;
  private sessionToken: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    this.sessionToken = this.generateSessionToken();
  }

  private generateSessionToken(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async autocomplete(input: string): Promise<PlacePrediction[]> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    if (input.length < 3) {
      return [];
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
        `input=${encodeURIComponent(input)}` +
        `&key=${this.apiKey}` +
        `&sessiontoken=${this.sessionToken}` +
        `&types=address` +
        `&components=country:us`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        return data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: prediction.structured_formatting,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching place autocomplete:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}` +
        `&key=${this.apiKey}` +
        `&sessiontoken=${this.sessionToken}` +
        `&fields=place_id,formatted_address,address_components,geometry`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          place_id: data.result.place_id,
          formatted_address: data.result.formatted_address,
          address_components: data.result.address_components || [],
          geometry: data.result.geometry,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  extractJurisdiction(addressComponents: PlaceDetails['address_components']): string {
    const city = addressComponents.find(
      (component) => component.types.includes('locality')
    )?.long_name;

    const state = addressComponents.find(
      (component) => component.types.includes('administrative_area_level_1')
    )?.short_name;

    if (city && state) {
      return `${city}, ${state}`;
    }

    return state || 'Unknown';
  }
}

export const googlePlacesService = new GooglePlacesService();
