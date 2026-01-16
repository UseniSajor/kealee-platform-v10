import {useState, useCallback} from 'react';
import {launchCamera, launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {LocationService} from '../services/location';
import {InspectionPhoto, GPSLocation} from '../types';
import {compressImage} from '../utils/image';

export function useCamera() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capturePhoto = useCallback(
    async (options?: {includeGPS?: boolean; compress?: boolean}): Promise<InspectionPhoto | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let gpsLocation: GPSLocation | undefined;
        if (options?.includeGPS !== false) {
          try {
            gpsLocation = await LocationService.getCurrentLocation();
          } catch (gpsError) {
            console.warn('Failed to get GPS location:', gpsError);
          }
        }

        return new Promise((resolve, reject) => {
          launchCamera(
            {
              mediaType: 'photo' as MediaType,
              quality: options?.compress ? 0.7 : 1,
              saveToPhotos: false,
            },
            async (response: ImagePickerResponse) => {
              if (response.didCancel) {
                setIsLoading(false);
                resolve(null);
                return;
              }

              if (response.errorCode) {
                setError(response.errorMessage || 'Camera error');
                setIsLoading(false);
                reject(new Error(response.errorMessage || 'Camera error'));
                return;
              }

              if (response.assets && response.assets[0]) {
                try {
                  let uri = response.assets[0].uri!;
                  
                  // Compress if requested
                  if (options?.compress) {
                    uri = await compressImage(uri);
                  }

                  const photo: InspectionPhoto = {
                    id: `photo-${Date.now()}`,
                    uri,
                    gpsLocation: gpsLocation || {
                      latitude: 0,
                      longitude: 0,
                      timestamp: new Date().toISOString(),
                    },
                    timestamp: new Date().toISOString(),
                    synced: false,
                  };

                  setIsLoading(false);
                  resolve(photo);
                } catch (error: any) {
                  setError(error.message);
                  setIsLoading(false);
                  reject(error);
                }
              } else {
                setIsLoading(false);
                resolve(null);
              }
            },
          );
        });
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
        return null;
      }
    },
    [],
  );

  const pickFromLibrary = useCallback(
    async (options?: {includeGPS?: boolean; compress?: boolean}): Promise<InspectionPhoto | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let gpsLocation: GPSLocation | undefined;
        if (options?.includeGPS !== false) {
          try {
            gpsLocation = await LocationService.getCurrentLocation();
          } catch (gpsError) {
            console.warn('Failed to get GPS location:', gpsError);
          }
        }

        return new Promise((resolve, reject) => {
          launchImageLibrary(
            {
              mediaType: 'photo' as MediaType,
              quality: options?.compress ? 0.7 : 1,
            },
            async (response: ImagePickerResponse) => {
              if (response.didCancel) {
                setIsLoading(false);
                resolve(null);
                return;
              }

              if (response.errorCode) {
                setError(response.errorMessage || 'Image picker error');
                setIsLoading(false);
                reject(new Error(response.errorMessage || 'Image picker error'));
                return;
              }

              if (response.assets && response.assets[0]) {
                try {
                  let uri = response.assets[0].uri!;
                  
                  // Compress if requested
                  if (options?.compress) {
                    uri = await compressImage(uri);
                  }

                  const photo: InspectionPhoto = {
                    id: `photo-${Date.now()}`,
                    uri,
                    gpsLocation: gpsLocation || {
                      latitude: 0,
                      longitude: 0,
                      timestamp: new Date().toISOString(),
                    },
                    timestamp: new Date().toISOString(),
                    synced: false,
                  };

                  setIsLoading(false);
                  resolve(photo);
                } catch (error: any) {
                  setError(error.message);
                  setIsLoading(false);
                  reject(error);
                }
              } else {
                setIsLoading(false);
                resolve(null);
              }
            },
          );
        });
      } catch (error: any) {
        setError(error.message);
        setIsLoading(false);
        return null;
      }
    },
    [],
  );

  return {
    capturePhoto,
    pickFromLibrary,
    isLoading,
    error,
  };
}
