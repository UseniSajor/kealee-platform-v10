import Geolocation from '@react-native-community/geolocation';
import {GPSLocation} from '../types';

export class LocationService {
  static async getCurrentLocation(): Promise<GPSLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  static watchPosition(
    callback: (location: GPSLocation) => void,
    errorCallback?: (error: any) => void,
  ): number {
    return Geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          timestamp: new Date().toISOString(),
        });
      },
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 10, // Update every 10 meters
      },
    );
  }

  static clearWatch(watchId: number): void {
    Geolocation.clearWatch(watchId);
  }
}
