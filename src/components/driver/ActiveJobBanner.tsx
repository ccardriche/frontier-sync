import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveAssignment } from "@/hooks/useBids";
import { Skeleton } from "@/components/ui/skeleton";

const ActiveJobBanner = () => {
  const { data: assignment, isLoading } = useActiveAssignment();

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

  if (!assignment || !assignment.job) {
    return null;
  }

  const job = assignment.job as {
    title: string;
    drop_label: string | null;
    status: string;
  };

  // Calculate a mock progress based on job status
  const statusProgress: Record<string, number> = {
    assigned: 10,
    enroute_pickup: 25,
    picked_up: 50,
    in_transit: 75,
    arrived: 90,
  };

  const progress = statusProgress[job.status] || 0;

  return (
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
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="inTransit">Active Delivery</Badge>
                  <span className="text-sm text-muted-foreground">{progress}% complete</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {job.drop_label && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      {job.drop_label}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    En route
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    In progress
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="hero" size="lg">
                  <Navigation className="w-5 h-5" />
                  Navigate
                </Button>
                <Button variant="success" size="lg">
                  <CheckCircle className="w-5 h-5" />
                  Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default ActiveJobBanner;
