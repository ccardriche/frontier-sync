import { calculateDistance } from "./eta";

export interface RouteStop {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: "pickup" | "dropoff" | "current";
  jobId?: string;
  jobTitle?: string;
  completed?: boolean;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  savings: {
    distanceKm: number;
    timeMinutes: number;
    percentageSaved: number;
  };
}

/**
 * Nearest Neighbor Algorithm for route optimization
 * Starts from current location and greedily picks the nearest unvisited stop
 */
export const optimizeRouteNearestNeighbor = (
  currentLocation: { lat: number; lng: number },
  stops: RouteStop[]
): OptimizedRoute => {
  if (stops.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedTimeMinutes: 0,
      savings: { distanceKm: 0, timeMinutes: 0, percentageSaved: 0 },
    };
  }

  // Calculate original route distance (in order provided)
  const originalDistance = calculateTotalDistance(currentLocation, stops);

  // Optimize using nearest neighbor
  const unvisited = [...stops];
  const optimized: RouteStop[] = [];
  let current = currentLocation;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(current, unvisited[0]);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateDistance(current, unvisited[i]);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    optimized.push(nearest);
    current = nearest;
  }

  const optimizedDistance = calculateTotalDistance(currentLocation, optimized);
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = estimateTimeFromDistance(distanceSaved);

  return {
    stops: optimized,
    totalDistanceKm: optimizedDistance,
    estimatedTimeMinutes: estimateTimeFromDistance(optimizedDistance),
    savings: {
      distanceKm: Math.max(0, distanceSaved),
      timeMinutes: Math.max(0, timeSaved),
      percentageSaved: originalDistance > 0 
        ? Math.round((distanceSaved / originalDistance) * 100) 
        : 0,
    },
  };
};

/**
 * Optimizes route with pickup/dropoff constraints
 * Ensures pickups happen before their corresponding dropoffs
 */
export const optimizeRouteWithConstraints = (
  currentLocation: { lat: number; lng: number },
  stops: RouteStop[]
): OptimizedRoute => {
  if (stops.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedTimeMinutes: 0,
      savings: { distanceKm: 0, timeMinutes: 0, percentageSaved: 0 },
    };
  }

  // Group stops by job
  const jobStops = new Map<string, { pickups: RouteStop[]; dropoffs: RouteStop[] }>();
  const standaloneStops: RouteStop[] = [];

  stops.forEach(stop => {
    if (stop.jobId) {
      if (!jobStops.has(stop.jobId)) {
        jobStops.set(stop.jobId, { pickups: [], dropoffs: [] });
      }
      const job = jobStops.get(stop.jobId)!;
      if (stop.type === "pickup") {
        job.pickups.push(stop);
      } else {
        job.dropoffs.push(stop);
      }
    } else {
      standaloneStops.push(stop);
    }
  });

  // Build route respecting constraints
  const originalDistance = calculateTotalDistance(currentLocation, stops);
  const optimized: RouteStop[] = [];
  const completedJobs = new Set<string>();
  let current = currentLocation;

  // Process until all stops are added
  const pendingStops = [...stops];
  
  while (pendingStops.length > 0) {
    // Find eligible stops (pickups, or dropoffs whose pickups are done)
    const eligible = pendingStops.filter(stop => {
      if (stop.type === "pickup") return true;
      if (!stop.jobId) return true;
      
      // Check if all pickups for this job are completed
      const job = jobStops.get(stop.jobId);
      if (!job) return true;
      
      return job.pickups.every(p => 
        optimized.some(o => o.id === p.id)
      );
    });

    if (eligible.length === 0) {
      // Fallback: add remaining stops
      optimized.push(...pendingStops);
      break;
    }

    // Find nearest eligible stop
    let nearestIndex = 0;
    let nearestDistance = calculateDistance(current, eligible[0]);

    for (let i = 1; i < eligible.length; i++) {
      const dist = calculateDistance(current, eligible[i]);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearest = eligible[nearestIndex];
    optimized.push(nearest);
    current = nearest;

    // Remove from pending
    const pendingIndex = pendingStops.findIndex(s => s.id === nearest.id);
    if (pendingIndex !== -1) {
      pendingStops.splice(pendingIndex, 1);
    }
  }

  const optimizedDistance = calculateTotalDistance(currentLocation, optimized);
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = estimateTimeFromDistance(distanceSaved);

  return {
    stops: optimized,
    totalDistanceKm: optimizedDistance,
    estimatedTimeMinutes: estimateTimeFromDistance(optimizedDistance),
    savings: {
      distanceKm: Math.max(0, distanceSaved),
      timeMinutes: Math.max(0, timeSaved),
      percentageSaved: originalDistance > 0 
        ? Math.max(0, Math.round((distanceSaved / originalDistance) * 100))
        : 0,
    },
  };
};

/**
 * Calculate total distance for a route
 */
export const calculateTotalDistance = (
  start: { lat: number; lng: number },
  stops: RouteStop[]
): number => {
  if (stops.length === 0) return 0;

  let total = calculateDistance(start, stops[0]);
  
  for (let i = 1; i < stops.length; i++) {
    total += calculateDistance(stops[i - 1], stops[i]);
  }

  return total;
};

/**
 * Estimate time from distance using average speeds
 */
const estimateTimeFromDistance = (km: number): number => {
  if (km <= 0) return 0;
  
  // Use average speed of 40 km/h for mixed driving
  const avgSpeedKmh = 40;
  return Math.round((km / avgSpeedKmh) * 60);
};

/**
 * Format savings for display
 */
export const formatSavings = (savings: OptimizedRoute["savings"]): string => {
  if (savings.percentageSaved <= 0) {
    return "Route is already optimal";
  }
  
  const parts: string[] = [];
  
  if (savings.distanceKm >= 1) {
    parts.push(`${savings.distanceKm.toFixed(1)} km`);
  } else if (savings.distanceKm > 0) {
    parts.push(`${Math.round(savings.distanceKm * 1000)} m`);
  }
  
  if (savings.timeMinutes > 0) {
    parts.push(`${savings.timeMinutes} min`);
  }
  
  if (parts.length === 0) return "Minimal savings";
  
  return `Save ${parts.join(" / ")} (${savings.percentageSaved}% shorter)`;
};
