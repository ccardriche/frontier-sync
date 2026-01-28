import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  timestamp: Date;
}

// Hook for drivers to share their location
export const useDriverLocationSharing = (jobId: string | null, isActive: boolean) => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GPSLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logLocation = useCallback(
    async (position: GeolocationPosition) => {
      if (!jobId) return;

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const location: GPSLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed ?? undefined,
        timestamp: new Date(),
      };

      setCurrentLocation(location);

      // Insert GPS log to database
      const { error: insertError } = await supabase.from("gps_logs").insert({
        job_id: jobId,
        user_id: user.user.id,
        lat: location.lat,
        lng: location.lng,
        accuracy_m: location.accuracy,
        speed_kph: location.speed ? location.speed * 3.6 : null,
        source: "device",
      });

      if (insertError) {
        console.error("Error logging GPS:", insertError);
      }
    },
    [jobId]
  );

  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      toast({
        title: "Location Unavailable",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    setError(null);

    // Watch position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      logLocation,
      (err) => {
        console.error("Geolocation error:", err);
        setError(err.message);
        if (err.code === err.PERMISSION_DENIED) {
          toast({
            title: "Location Permission Denied",
            description: "Please enable location access to share your position.",
            variant: "destructive",
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    // Also set up interval for periodic logging (every 30 seconds)
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(logLocation, console.error, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    }, 30000);

    toast({
      title: "Location Sharing Started",
      description: "Your location is now being shared with the shipper.",
    });
  }, [logLocation]);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsSharing(false);
    toast({
      title: "Location Sharing Stopped",
      description: "Your location is no longer being shared.",
    });
  }, []);

  // Auto-start when active, auto-stop when inactive
  useEffect(() => {
    if (isActive && jobId && !isSharing) {
      startSharing();
    } else if (!isActive && isSharing) {
      stopSharing();
    }
  }, [isActive, jobId, isSharing, startSharing, stopSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isSharing,
    currentLocation,
    error,
    startSharing,
    stopSharing,
  };
};

// Hook for shippers to track driver location in real-time
export const useDriverTracking = (jobId: string | null) => {
  const [driverLocation, setDriverLocation] = useState<GPSLocation | null>(null);
  const [routeHistory, setRouteHistory] = useState<GPSLocation[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!jobId) return;

    // Fetch initial location history
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("gps_logs")
        .select("lat, lng, created_at, accuracy_m, speed_kph")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching GPS history:", error);
        return;
      }

      if (data && data.length > 0) {
        const history = data.map((log) => ({
          lat: log.lat,
          lng: log.lng,
          accuracy: log.accuracy_m ?? undefined,
          speed: log.speed_kph ?? undefined,
          timestamp: new Date(log.created_at),
        }));

        setRouteHistory(history);
        setDriverLocation(history[history.length - 1]);
      }
    };

    fetchHistory();

    // Subscribe to real-time GPS updates
    const channel = supabase
      .channel(`gps-tracking-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gps_logs",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newLog = payload.new as Tables<"gps_logs">;
          const newLocation: GPSLocation = {
            lat: newLog.lat,
            lng: newLog.lng,
            accuracy: newLog.accuracy_m ?? undefined,
            speed: newLog.speed_kph ?? undefined,
            timestamp: new Date(newLog.created_at),
          };

          setDriverLocation(newLocation);
          setRouteHistory((prev) => [...prev, newLocation]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return {
    driverLocation,
    routeHistory,
  };
};
