import {Route, RouteInspection, Inspection} from '../types';
import {ApiService} from './api';
import {StorageService} from './storage';

export class RouteOptimizationService {
  static async optimizeRouteForDate(date: string): Promise<Route> {
    // Try to get optimized route from server
    try {
      return await ApiService.getOptimizedRoute(date);
    } catch (error) {
      // Fallback to local optimization
      return await this.optimizeLocally(date);
    }
  }

  private static async optimizeLocally(date: string): Promise<Route> {
    const inspections = await StorageService.getInspectionsForDate(date);
    
    if (inspections.length === 0) {
      return {
        id: `route-${date}`,
        date,
        inspections: [],
        optimized: false,
        estimatedDuration: 0,
        estimatedDistance: 0,
      };
    }

    // Simple nearest-neighbor algorithm for local optimization
    const routeInspections: RouteInspection[] = [];
    const remaining = [...inspections];
    let currentLocation: {lat: number; lng: number} | null = null;

    // Start from first inspection or use current location
    if (remaining.length > 0) {
      const first = remaining[0];
      currentLocation = {
        lat: first.gpsLocation?.latitude || 0,
        lng: first.gpsLocation?.longitude || 0,
      };
      routeInspections.push({
        inspectionId: first.id,
        address: first.address,
        scheduledTime: first.scheduledDate,
        estimatedArrival: first.scheduledDate,
        order: 0,
        coordinates: first.gpsLocation || {
          latitude: 0,
          longitude: 0,
          timestamp: new Date().toISOString(),
        },
      });
      remaining.shift();
    }

    let order = 1;
    while (remaining.length > 0 && currentLocation) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const inspection = remaining[i];
        const coords = inspection.gpsLocation;
        if (coords) {
          const distance = this.calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            coords.latitude,
            coords.longitude,
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      const nearest = remaining[nearestIndex];
      routeInspections.push({
        inspectionId: nearest.id,
        address: nearest.address,
        scheduledTime: nearest.scheduledDate,
        estimatedArrival: nearest.scheduledDate,
        order: order++,
        coordinates: nearest.gpsLocation || {
          latitude: 0,
          longitude: 0,
          timestamp: new Date().toISOString(),
        },
      });

      if (nearest.gpsLocation) {
        currentLocation = {
          lat: nearest.gpsLocation.latitude,
          lng: nearest.gpsLocation.longitude,
        };
      }
      remaining.splice(nearestIndex, 1);
    }

    // Calculate total distance and estimated duration
    let totalDistance = 0;
    for (let i = 1; i < routeInspections.length; i++) {
      const prev = routeInspections[i - 1].coordinates;
      const curr = routeInspections[i].coordinates;
      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
    }

    const estimatedDuration = totalDistance * 2; // Rough estimate: 2 minutes per km

    return {
      id: `route-${date}`,
      date,
      inspections: routeInspections,
      optimized: true,
      estimatedDuration,
      estimatedDistance: totalDistance,
    };
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
