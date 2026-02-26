import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MANUAL_LOCATION_KEY = 'manual_location_label';

const getBestLocationLabel = (place) => {
  if (!place) return 'Location unavailable';

  const primary =
    place.city ||
    place.subregion ||
    place.region ||
    place.district ||
    place.country;

  const secondary = place.region || place.country;

  if (primary && secondary && primary !== secondary) {
    return `${primary}, ${secondary}`;
  }

  return primary || 'Location unavailable';
};

export const locationService = {
  getCurrentLocationLabel: async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        return {
          success: false,
          location: 'Location permission denied',
        };
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const label = getBestLocationLabel(geocode?.[0]);
      return {
        success: true,
        location: label,
      };
    } catch (error) {
      return {
        success: false,
        location: 'Location unavailable',
        error: error?.message || 'Failed to detect location',
      };
    }
  },

  getManualLocationLabel: async () => {
    try {
      const value = await AsyncStorage.getItem(MANUAL_LOCATION_KEY);
      return value?.trim() || null;
    } catch (error) {
      return null;
    }
  },

  setManualLocationLabel: async (location) => {
    const value = (location || '').trim();
    if (!value) {
      return {
        success: false,
        error: 'Location is required',
      };
    }

    try {
      await AsyncStorage.setItem(MANUAL_LOCATION_KEY, value);
      return { success: true, location: value };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to save location',
      };
    }
  },

  clearManualLocationLabel: async () => {
    try {
      await AsyncStorage.removeItem(MANUAL_LOCATION_KEY);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message || 'Failed to clear location',
      };
    }
  },

  getPreferredLocationLabel: async () => {
    const manualLocation = await locationService.getManualLocationLabel();
    if (manualLocation) {
      return {
        success: true,
        location: manualLocation,
      };
    }

    return locationService.getCurrentLocationLabel();
  },
};
