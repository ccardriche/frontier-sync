import { useMemo } from "react";
import { calculateETA, formatArrivalTime } from "@/lib/eta";

interface Location {
  lat: number;
  lng: number;
}

interface UseETAProps {
  driverLocation: Location | null;
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  jobStatus: string;
}

export const useETA = ({
  driverLocation,
  pickupLocation,
  dropoffLocation,
  jobStatus,
}: UseETAProps) => {
  return useMemo(() => {
    // Determine the current destination based on job status
    const isHeadingToPickup = ["assigned", "enroute_pickup"].includes(jobStatus);
    const isHeadingToDropoff = ["picked_up", "in_transit", "arrived"].includes(jobStatus);
    
    let destination: Location | null = null;
    let destinationType: "pickup" | "dropoff" | null = null;
    
    if (isHeadingToPickup && pickupLocation) {
      destination = pickupLocation;
      destinationType = "pickup";
    } else if (isHeadingToDropoff && dropoffLocation) {
      destination = dropoffLocation;
      destinationType = "dropoff";
    }
    
    const eta = calculateETA(driverLocation, destination);
    
    if (!eta) {
      return {
        hasETA: false,
        destinationType: null,
        distanceKm: 0,
        etaMinutes: 0,
        formattedDistance: "—",
        formattedETA: "—",
        arrivalTime: null,
        formattedArrivalTime: "—",
      };
    }
    
    return {
      hasETA: true,
      destinationType,
      distanceKm: eta.distanceKm,
      etaMinutes: eta.etaMinutes,
      formattedDistance: eta.formattedDistance,
      formattedETA: eta.formattedETA,
      arrivalTime: eta.etaTime,
      formattedArrivalTime: eta.etaTime ? formatArrivalTime(eta.etaTime) : "—",
    };
  }, [driverLocation, pickupLocation, dropoffLocation, jobStatus]);
};
