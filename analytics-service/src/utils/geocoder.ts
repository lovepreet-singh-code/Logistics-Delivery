import axios from "axios";

/**
 * Geocodes an address string to coordinates using OpenStreetMap Nominatim API.
 * @param address The full address string to geocode
 * @returns [lat, lng]
 */
export const geocodeAddress = async (address: string): Promise<[number, number]> => {
  const defaultCoords: [number, number] = [28.6139, 77.2090]; // New Delhi
  
  if (!address) return defaultCoords;

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        q: address,
        limit: 1,
      },
      headers: {
        "User-Agent": "LogisticsDeliveryApp/1.0", // Required by Nominatim TOS
      },
      timeout: 5000,
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return [parseFloat(lat), parseFloat(lon)];
    }
    
    return defaultCoords;
  } catch (error) {
    console.error("Geocoding failed for address:", address, error);
    return defaultCoords; // Fallback
  }
};
