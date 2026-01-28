interface Location {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two points
export const calculateDistance = (from: Location, to: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Estimate travel time based on distance
// Uses average speeds for different distance ranges to account for urban vs highway driving
export const estimateTravelTime = (distanceKm: number): number => {
  if (distanceKm <= 0) return 0;
  
  // Approximate speeds based on distance (accounting for traffic, stops, etc.)
  // Short distances: more urban driving, lower speeds
  // Longer distances: more highway driving, higher speeds
  
  let avgSpeedKmh: number;
  
  if (distanceKm < 5) {
    avgSpeedKmh = 25; // Urban/local driving
  } else if (distanceKm < 20) {
    avgSpeedKmh = 35; // Mixed urban/suburban
  } else if (distanceKm < 50) {
    avgSpeedKmh = 50; // Suburban/rural
  } else {
    avgSpeedKmh = 65; // Highway
  }
  
  const timeHours = distanceKm / avgSpeedKmh;
  return Math.round(timeHours * 60); // Return minutes
};

// Calculate ETA from current location to destination
export const calculateETA = (
  driverLocation: Location | null,
  destination: Location | null
): { 
  distanceKm: number; 
  etaMinutes: number; 
  etaTime: Date | null;
  formattedDistance: string;
  formattedETA: string;
} | null => {
  if (!driverLocation || !destination) {
    return null;
  }
  
  const distanceKm = calculateDistance(driverLocation, destination);
  const etaMinutes = estimateTravelTime(distanceKm);
  const etaTime = new Date(Date.now() + etaMinutes * 60 * 1000);
  
  return {
    distanceKm,
    etaMinutes,
    etaTime,
    formattedDistance: formatDistance(distanceKm),
    formattedETA: formatETA(etaMinutes),
  };
};

// Format distance for display
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
};

// Format ETA for display
export const formatETA = (minutes: number): string => {
  if (minutes < 1) {
    return "< 1 min";
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMins} min`;
};

// Format arrival time
export const formatArrivalTime = (etaTime: Date): string => {
  return etaTime.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
};
