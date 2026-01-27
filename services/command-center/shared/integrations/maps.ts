/**
 * KEALEE COMMAND CENTER - GOOGLE MAPS INTEGRATION
 * Geocoding, routing, and distance calculations
 */

import { Client, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});
const API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
}

export interface RouteInfo {
  destination: Location;
  distance: number; // meters
  distanceMiles: number;
  duration: number; // seconds
  durationMinutes: number;
}

export interface OptimizedRoute {
  stops: Location[];
  totalDistance: number;
  totalDuration: number;
  legs: RouteInfo[];
  polyline?: string;
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<Location> {
  const response = await mapsClient.geocode({
    params: {
      address,
      key: API_KEY,
    },
  });

  if (response.data.results.length === 0) {
    throw new Error(`Could not geocode address: ${address}`);
  }

  const result = response.data.results[0];

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    address: result.formatted_address,
    placeId: result.place_id,
  };
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await mapsClient.reverseGeocode({
    params: {
      latlng: { lat, lng },
      key: API_KEY,
    },
  });

  if (response.data.results.length === 0) {
    throw new Error(`Could not reverse geocode: ${lat}, ${lng}`);
  }

  return response.data.results[0].formatted_address;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
    Math.cos(toRad(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get driving distances from origin to multiple destinations
 */
export async function getDistanceMatrix(
  origin: Location,
  destinations: Location[]
): Promise<RouteInfo[]> {
  const response = await mapsClient.distancematrix({
    params: {
      origins: [`${origin.lat},${origin.lng}`],
      destinations: destinations.map(d => `${d.lat},${d.lng}`),
      mode: TravelMode.driving,
      units: UnitSystem.imperial,
      key: API_KEY,
    },
  });

  const elements = response.data.rows[0].elements;

  return elements.map((element, index) => ({
    destination: destinations[index],
    distance: element.distance?.value || 0,
    distanceMiles: (element.distance?.value || 0) / 1609.34,
    duration: element.duration?.value || 0,
    durationMinutes: Math.round((element.duration?.value || 0) / 60),
  }));
}

/**
 * Optimize route through multiple waypoints
 */
export async function optimizeRoute(
  origin: Location,
  waypoints: Location[],
  returnToOrigin = true
): Promise<OptimizedRoute> {
  if (waypoints.length === 0) {
    return {
      stops: [origin],
      totalDistance: 0,
      totalDuration: 0,
      legs: [],
    };
  }

  const response = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: returnToOrigin
        ? `${origin.lat},${origin.lng}`
        : `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`,
      waypoints: returnToOrigin
        ? waypoints.map(w => `${w.lat},${w.lng}`)
        : waypoints.slice(0, -1).map(w => `${w.lat},${w.lng}`),
      optimize: true,
      mode: TravelMode.driving,
      key: API_KEY,
    },
  });

  const route = response.data.routes[0];

  if (!route) {
    throw new Error('Could not calculate route');
  }

  // Get optimized waypoint order
  const waypointOrder = route.waypoint_order || [];
  const optimizedWaypoints = waypointOrder.map(i => waypoints[i]);

  // Calculate total distance and duration
  let totalDistance = 0;
  let totalDuration = 0;

  const legs: RouteInfo[] = route.legs.map((leg, index) => {
    const distance = leg.distance?.value || 0;
    const duration = leg.duration?.value || 0;

    totalDistance += distance;
    totalDuration += duration;

    return {
      destination: index < optimizedWaypoints.length
        ? optimizedWaypoints[index]
        : origin,
      distance,
      distanceMiles: distance / 1609.34,
      duration,
      durationMinutes: Math.round(duration / 60),
    };
  });

  return {
    stops: [origin, ...optimizedWaypoints, ...(returnToOrigin ? [origin] : [])],
    totalDistance,
    totalDuration,
    legs,
    polyline: route.overview_polyline?.points,
  };
}

/**
 * Find contractors within a radius
 */
export async function findLocationsWithinRadius(
  center: Location,
  locations: Array<Location & { id: string }>,
  radiusMiles: number
): Promise<Array<Location & { id: string; distanceMiles: number }>> {
  const results: Array<Location & { id: string; distanceMiles: number }> = [];

  for (const location of locations) {
    const distance = calculateDistance(center, location);

    if (distance <= radiusMiles) {
      results.push({
        ...location,
        distanceMiles: Math.round(distance * 10) / 10,
      });
    }
  }

  // Sort by distance
  return results.sort((a, b) => a.distanceMiles - b.distanceMiles);
}

/**
 * Get estimated travel time accounting for traffic
 */
export async function getTrafficAwareETA(
  origin: Location,
  destination: Location,
  departureTime: Date = new Date()
): Promise<{
  duration: number;
  durationInTraffic: number;
  distance: number;
  eta: Date;
}> {
  const response = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: TravelMode.driving,
      departure_time: departureTime,
      key: API_KEY,
    },
  });

  const route = response.data.routes[0];
  const leg = route?.legs[0];

  if (!leg) {
    throw new Error('Could not calculate route');
  }

  const duration = leg.duration?.value || 0;
  const durationInTraffic = leg.duration_in_traffic?.value || duration;
  const distance = leg.distance?.value || 0;

  const eta = new Date(departureTime.getTime() + durationInTraffic * 1000);

  return {
    duration,
    durationInTraffic,
    distance,
    eta,
  };
}

/**
 * Plan site visits route for a PM's day
 */
export async function planDailyRoute(
  pmHomeLocation: Location,
  siteVisits: Array<{
    id: string;
    projectName: string;
    location: Location;
    estimatedDurationMinutes: number;
  }>,
  startTime: Date = new Date()
): Promise<{
  orderedVisits: Array<{
    id: string;
    projectName: string;
    location: Location;
    arrivalTime: Date;
    departureTime: Date;
    travelTimeFromPrevious: number;
  }>;
  totalTravelTime: number;
  totalDistance: number;
  returnHomeTime: Date;
}> {
  if (siteVisits.length === 0) {
    return {
      orderedVisits: [],
      totalTravelTime: 0,
      totalDistance: 0,
      returnHomeTime: startTime,
    };
  }

  // Optimize route
  const optimized = await optimizeRoute(
    pmHomeLocation,
    siteVisits.map(v => v.location),
    true
  );

  // Build schedule
  const orderedVisits: Array<{
    id: string;
    projectName: string;
    location: Location;
    arrivalTime: Date;
    departureTime: Date;
    travelTimeFromPrevious: number;
  }> = [];

  let currentTime = startTime;

  // Match optimized stops back to visits
  for (let i = 0; i < optimized.stops.length - 2; i++) {
    const stop = optimized.stops[i + 1]; // Skip origin
    const leg = optimized.legs[i];

    // Find matching visit
    const visit = siteVisits.find(v =>
      v.location.lat === stop.lat && v.location.lng === stop.lng
    );

    if (!visit) continue;

    // Add travel time
    currentTime = new Date(currentTime.getTime() + leg.duration * 1000);
    const arrivalTime = new Date(currentTime);

    // Add visit duration
    const departureTime = new Date(
      currentTime.getTime() + visit.estimatedDurationMinutes * 60 * 1000
    );
    currentTime = departureTime;

    orderedVisits.push({
      id: visit.id,
      projectName: visit.projectName,
      location: visit.location,
      arrivalTime,
      departureTime,
      travelTimeFromPrevious: leg.durationMinutes,
    });
  }

  // Calculate return home time
  const lastLeg = optimized.legs[optimized.legs.length - 1];
  const returnHomeTime = new Date(currentTime.getTime() + lastLeg.duration * 1000);

  return {
    orderedVisits,
    totalTravelTime: Math.round(optimized.totalDuration / 60),
    totalDistance: Math.round(optimized.totalDistance / 1609.34 * 10) / 10,
    returnHomeTime,
  };
}
