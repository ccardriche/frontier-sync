import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  RouteStop, 
  OptimizedRoute, 
  optimizeRouteWithConstraints 
} from "@/lib/routeOptimization";
import { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

interface UseRouteOptimizationProps {
  driverLocation: { lat: number; lng: number } | null;
  jobs?: Job[];
  enabled?: boolean;
}

/**
 * Hook to optimize route across multiple jobs
 */
export const useMultiJobOptimization = ({
  driverLocation,
  jobs,
  enabled = true,
}: UseRouteOptimizationProps) => {
  return useMemo(() => {
    if (!enabled || !driverLocation || !jobs || jobs.length === 0) {
      return null;
    }

    // Convert jobs to route stops
    const stops: RouteStop[] = [];
    
    jobs.forEach(job => {
      if (job.pickup_lat && job.pickup_lng) {
        stops.push({
          id: `${job.id}-pickup`,
          lat: job.pickup_lat,
          lng: job.pickup_lng,
          label: job.pickup_label || "Pickup",
          type: "pickup",
          jobId: job.id,
          jobTitle: job.title,
        });
      }
      
      if (job.drop_lat && job.drop_lng) {
        stops.push({
          id: `${job.id}-dropoff`,
          lat: job.drop_lat,
          lng: job.drop_lng,
          label: job.drop_label || "Drop-off",
          type: "dropoff",
          jobId: job.id,
          jobTitle: job.title,
        });
      }
    });

    if (stops.length === 0) return null;

    return optimizeRouteWithConstraints(driverLocation, stops);
  }, [driverLocation, jobs, enabled]);
};

/**
 * Hook to fetch and optimize stops for a single multi-stop job
 */
export const useJobStopsOptimization = (
  jobId: string | null,
  driverLocation: { lat: number; lng: number } | null
) => {
  const { data: stops, isLoading, error } = useQuery({
    queryKey: ["job-stops", jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from("job_stops")
        .select("*")
        .eq("job_id", jobId)
        .order("sequence_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const optimizedRoute = useMemo(() => {
    if (!driverLocation || !stops || stops.length === 0) {
      return null;
    }

    const routeStops: RouteStop[] = stops.map(stop => ({
      id: stop.id,
      lat: stop.lat,
      lng: stop.lng,
      label: stop.label || undefined,
      type: stop.stop_type as "pickup" | "dropoff",
      jobId: stop.job_id,
      completed: !!stop.completed_at,
    }));

    // Filter out completed stops
    const pendingStops = routeStops.filter(s => !s.completed);
    
    if (pendingStops.length === 0) return null;

    return optimizeRouteWithConstraints(driverLocation, pendingStops);
  }, [driverLocation, stops]);

  return {
    stops,
    optimizedRoute,
    isLoading,
    error,
  };
};

/**
 * Hook to get driver's active jobs and optimize their route
 */
export const useDriverRouteOptimization = (
  driverLocation: { lat: number; lng: number } | null
) => {
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["driver-active-assignments"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          jobs (*)
        `)
        .eq("driver_id", user.user.id)
        .is("completed_at", null);

      if (error) throw error;
      return data;
    },
  });

  const activeJobs = useMemo(() => {
    if (!assignments) return [];
    return assignments
      .map(a => a.jobs)
      .filter((job): job is Job => job !== null);
  }, [assignments]);

  const optimizedRoute = useMultiJobOptimization({
    driverLocation,
    jobs: activeJobs,
    enabled: activeJobs.length > 1,
  });

  return {
    activeJobs,
    optimizedRoute,
    isLoading: assignmentsLoading,
    hasMultipleJobs: activeJobs.length > 1,
  };
};
