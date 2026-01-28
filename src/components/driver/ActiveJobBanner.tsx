import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Play, 
  Package, 
  Truck, 
  CheckCircle,
  Loader2,
  Phone,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveAssignment } from "@/hooks/useBids";
import { useUpdateJobStatus, getNextStatusAction } from "@/hooks/useJobStatus";
import { useDriverLocationSharing } from "@/hooks/useGPSTracking";
import { Skeleton } from "@/components/ui/skeleton";
import ProofOfDeliveryDialog from "./ProofOfDeliveryDialog";
import TrackingMap from "@/components/tracking/TrackingMap";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  enroute_pickup: "En Route to Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  arrived: "Arrived at Destination",
};

const statusProgress: Record<string, number> = {
  assigned: 10,
  enroute_pickup: 25,
  picked_up: 50,
  in_transit: 75,
  arrived: 90,
};

const ActionIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "assigned":
      return <Play className="w-5 h-5" />;
    case "enroute_pickup":
      return <Package className="w-5 h-5" />;
    case "picked_up":
      return <Truck className="w-5 h-5" />;
    case "in_transit":
      return <MapPin className="w-5 h-5" />;
    case "arrived":
      return <CheckCircle className="w-5 h-5" />;
    default:
      return <CheckCircle className="w-5 h-5" />;
  }
};

const ActiveJobBanner = () => {
  const { data: assignment, isLoading } = useActiveAssignment();
  const updateStatus = useUpdateJobStatus();
  const [showPodDialog, setShowPodDialog] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  // Get job info early for location sharing hook
  const job = assignment?.job as Job | undefined;
  const isActiveDelivery = job && ["enroute_pickup", "picked_up", "in_transit", "arrived"].includes(job.status);
  
  // Location sharing hook - auto-starts when delivery is active
  const { isSharing, currentLocation, startSharing, stopSharing } = useDriverLocationSharing(
    job?.id ?? null,
    !!isActiveDelivery
  );

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card variant="glow">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment || !job) {
    return null;
  }

  const progress = statusProgress[job.status] || 0;
  const nextAction = getNextStatusAction(job.status);

  const handleStatusUpdate = () => {
    // If completing delivery (from "arrived" status), show PoD dialog
    if (job.status === "arrived") {
      setShowPodDialog(true);
      return;
    }

    updateStatus.mutate({
      jobId: job.id,
      assignmentId: assignment.id,
      currentStatus: job.status,
    });
  };

  const handlePodComplete = () => {
    // After PoD is saved, update the job status to delivered
    updateStatus.mutate({
      jobId: job.id,
      assignmentId: assignment.id,
      currentStatus: job.status,
    });
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "—";
    return `$${(cents / 100).toLocaleString()}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card variant="glow" className="overflow-hidden">
          <div className="relative">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="inTransit">Active Delivery</Badge>
                <span className="text-sm text-muted-foreground">{progress}% complete</span>
                <Badge variant="outline" className="ml-auto">
                  {statusLabels[job.status] || job.status}
                </Badge>
              </div>

              {/* Job Details */}
              <h3 className="text-xl font-display font-bold mb-2">{job.title}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Route Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pickup:</span>
                      <p className="font-medium">{job.pickup_label || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-accent" />
                    </div>
                    <div>
                      <span className="text-muted-foreground">Drop-off:</span>
                      <p className="font-medium">{job.drop_label || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                {/* Earnings & Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">
                      {assignment.started_at 
                        ? new Date(assignment.started_at).toLocaleTimeString()
                        : "Not started"
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg font-display font-bold text-primary">
                      {formatCurrency(job.budget_cents)}
                    </span>
                    <span className="text-muted-foreground">earnings</span>
                  </div>
                </div>
              </div>

              {/* Status Steps */}
              <div className="flex items-center gap-1 mb-6 overflow-x-auto py-2">
                {["assigned", "enroute_pickup", "picked_up", "in_transit", "arrived", "delivered"].map((status, i) => {
                  const isActive = job.status === status;
                  const isPast = statusProgress[status] < progress || job.status === "delivered";
                  return (
                    <div key={status} className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPast ? "bg-primary" : isActive ? "bg-primary animate-pulse" : "bg-muted"
                        }`}
                      />
                      {i < 5 && (
                        <div className={`w-8 h-0.5 ${isPast ? "bg-primary" : "bg-muted"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-4">
                {(job.pickup_lat && job.pickup_lng) || (job.drop_lat && job.drop_lng) ? (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      const lat = job.status === "assigned" || job.status === "enroute_pickup" 
                        ? job.pickup_lat 
                        : job.drop_lat;
                      const lng = job.status === "assigned" || job.status === "enroute_pickup" 
                        ? job.pickup_lng 
                        : job.drop_lng;
                      if (lat && lng) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
                      }
                    }}
                  >
                    <Navigation className="w-5 h-5" />
                    Navigate
                  </Button>
                ) : null}

                <Button variant="outline" size="lg">
                  <Phone className="w-5 h-5" />
                  Contact Shipper
                </Button>
                
                {/* Location Sharing Toggle */}
                <Button 
                  variant={isSharing ? "secondary" : "outline"} 
                  size="lg"
                  onClick={() => isSharing ? stopSharing() : startSharing()}
                >
                  <Radio className={`w-5 h-5 ${isSharing ? "animate-pulse" : ""}`} />
                  {isSharing ? "Sharing Location" : "Share Location"}
                </Button>
                
                {/* Toggle Map View */}
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowMap(!showMap)}
                >
                  <MapPin className="w-5 h-5" />
                  {showMap ? "Hide Map" : "Show Map"}
                </Button>

                {nextAction && (
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleStatusUpdate}
                    disabled={updateStatus.isPending}
                    className="flex-1 md:flex-none"
                  >
                    {updateStatus.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <ActionIcon status={job.status} />
                        {nextAction.label}
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Tracking Map */}
              {showMap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <TrackingMap
                    driverLocation={currentLocation}
                    pickupLocation={
                      job.pickup_lat && job.pickup_lng
                        ? { lat: job.pickup_lat, lng: job.pickup_lng }
                        : null
                    }
                    dropoffLocation={
                      job.drop_lat && job.drop_lng
                        ? { lat: job.drop_lat, lng: job.drop_lng }
                        : null
                    }
                    pickupLabel={job.pickup_label || "Pickup"}
                    dropoffLabel={job.drop_label || "Drop-off"}
                    className="h-[250px]"
                  />
                  {isSharing && currentLocation && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      Sharing your location with the shipper
                    </p>
                  )}
                </motion.div>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Proof of Delivery Dialog */}
      <ProofOfDeliveryDialog
        open={showPodDialog}
        onOpenChange={setShowPodDialog}
        jobId={job.id}
        onComplete={handlePodComplete}
      />
    </>
  );
};

export default ActiveJobBanner;
