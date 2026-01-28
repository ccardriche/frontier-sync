import { MapPin, Navigation, Clock, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDriverTracking } from "@/hooks/useGPSTracking";
import TrackingMap from "@/components/tracking/TrackingMap";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

interface ShipperTrackingViewProps {
  job: Job;
}

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  enroute_pickup: "En Route to Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  arrived: "Arrived at Destination",
  delivered: "Delivered",
};

const ShipperTrackingView = ({ job }: ShipperTrackingViewProps) => {
  const { driverLocation, routeHistory } = useDriverTracking(job.id);

  const isActiveDelivery = ["enroute_pickup", "picked_up", "in_transit", "arrived"].includes(
    job.status
  );

  if (!isActiveDelivery) {
    return null;
  }

  const pickupLocation =
    job.pickup_lat && job.pickup_lng
      ? { lat: job.pickup_lat, lng: job.pickup_lng }
      : null;

  const dropoffLocation =
    job.drop_lat && job.drop_lng
      ? { lat: job.drop_lat, lng: job.drop_lng }
      : null;

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Live Tracking
          </CardTitle>
          <Badge variant="inTransit">{statusLabels[job.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="flex items-center gap-4 text-sm">
        {driverLocation ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-muted-foreground">Driver live</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                Updated {new Date(driverLocation.timestamp).toLocaleTimeString()}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">Waiting for driver location...</span>
            </div>
          )}
        </div>

        {/* Map */}
        <TrackingMap
          driverLocation={driverLocation}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          pickupLabel={job.pickup_label || "Pickup"}
          dropoffLabel={job.drop_label || "Drop-off"}
          routeHistory={routeHistory}
          className="h-[300px]"
        />

        {/* Route Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-primary" />
            </div>
            <div>
              <span className="text-muted-foreground">From</span>
              <p className="font-medium">{job.pickup_label || "Pickup location"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="w-3 h-3 text-accent" />
            </div>
            <div>
              <span className="text-muted-foreground">To</span>
              <p className="font-medium">{job.drop_label || "Drop-off location"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipperTrackingView;
