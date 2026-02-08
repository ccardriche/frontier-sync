import { motion } from "framer-motion";
import { Truck, MapPin, Timer, Navigation, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDriverTracking } from "@/hooks/useGPSTracking";
import { useETA } from "@/hooks/useETA";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs"> & { bids_count: number };

interface InTransitJobCardProps {
  job: Job;
  onViewTracking: (jobId: string) => void;
}

const statusLabels: Record<string, string> = {
  enroute_pickup: "En Route to Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  arrived: "Arrived",
};

const InTransitJobCard = ({ job, onViewTracking }: InTransitJobCardProps) => {
  const pickupLocation =
    job.pickup_lat && job.pickup_lng
      ? { lat: job.pickup_lat, lng: job.pickup_lng }
      : null;

  const dropoffLocation =
    job.drop_lat && job.drop_lng
      ? { lat: job.drop_lat, lng: job.drop_lng }
      : null;

  // Memoize the job ID to prevent unnecessary re-subscriptions
  const { driverLocation } = useDriverTracking(job.id);

  const eta = useETA({
    driverLocation,
    pickupLocation,
    dropoffLocation,
    jobStatus: job.status,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        {/* Live indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>

        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Job Info */}
            <div>
              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
              <Badge variant="inTransit" className="text-xs">
                {statusLabels[job.status] || job.status}
              </Badge>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="truncate max-w-[100px]">{job.pickup_label || "Pickup"}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <Navigation className="w-3 h-3 text-accent" />
                <span className="truncate max-w-[100px]">{job.drop_label || "Drop-off"}</span>
              </div>
            </div>

            {/* ETA Display */}
            {eta.hasETA && driverLocation ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      ETA to {eta.destinationType}
                    </p>
                    <p className="font-display font-bold text-primary">
                      {eta.formattedETA}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{eta.formattedDistance}</p>
                  <p className="text-sm font-medium">{eta.formattedArrivalTime}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <span className="text-sm text-muted-foreground">
                  Waiting for driver location...
                </span>
              </div>
            )}

            {/* View Full Tracking Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewTracking(job.id)}
              className="w-full"
            >
              <Truck className="w-4 h-4 mr-2" />
              View Full Tracking
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface InTransitSectionProps {
  jobs: Job[];
  isLoading: boolean;
  onViewTracking: (jobId: string) => void;
}

const InTransitSection = ({ jobs, isLoading, onViewTracking }: InTransitSectionProps) => {
  const inTransitJobs = jobs.filter((job) =>
    ["enroute_pickup", "picked_up", "in_transit", "arrived"].includes(job.status)
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Live Tracking</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (inTransitJobs.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Truck className="w-5 h-5 text-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping" />
        </div>
        <h2 className="text-xl font-display font-bold">Live Tracking</h2>
        <Badge variant="glow" className="ml-2">
          {inTransitJobs.length} Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inTransitJobs.map((job) => (
          <InTransitJobCard
            key={job.id}
            job={job}
            onViewTracking={onViewTracking}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default InTransitSection;
