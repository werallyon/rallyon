import { PermissionStatus } from '../types';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationResult {
  location: UserLocation;
  permission: PermissionStatus;
}

export function requestUserLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(Object.assign(new Error('Geolocation is not supported by this browser.'), {
        permission: 'DENIED' as PermissionStatus
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          permission: 'GRANTED'
        });
      },
      (error) => {
        const permission: PermissionStatus =
          error.code === error.PERMISSION_DENIED ? 'DENIED' : 'PROMPT';

        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied.'
            : error.code === error.TIMEOUT
            ? 'Location request timed out.'
            : 'Unable to determine your location.';

        reject(Object.assign(new Error(message), { permission }));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000
      }
    );
  });
}
