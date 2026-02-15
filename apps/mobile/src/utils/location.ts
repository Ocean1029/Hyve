/**
 * Location utility for mobile. Fetches current position and posts to backend.
 */
import * as Location from 'expo-location';
import { API_PATHS } from '@hyve/shared';

const apiUrl = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3000';

export interface LocationResult {
  success: boolean;
  error?: string;
}

/**
 * Requests location permission, gets current position, and posts to backend.
 */
export async function updateLocation(token: string): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Location permission denied' };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const res = await fetch(`${apiUrl}${API_PATHS.LOCATIONS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return {
        success: false,
        error: (data as { error?: string }).error ?? 'Failed to update location',
      };
    }
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Location error',
    };
  }
}
