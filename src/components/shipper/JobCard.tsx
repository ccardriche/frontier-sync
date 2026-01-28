import { motion } from "framer-motion";
import { MapPin, Clock, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Job } from "@/hooks/useJobs";

interface JobCardProps {
  job: Job & { bids_count: number };
  index: number;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "posted":
      return <Badge variant="posted">Posted</Badge>;
    case "bidding":
      return <Badge variant="bidding">Bidding</Badge>;
    case "assigned":
      return <Badge variant="assigned">Assigned</Badge>;
    case "enroute_pickup":
      return <Badge variant="assigned">En Route</Badge>;
    case "picked_up":
      return <Badge variant="inTransit">Picked Up</Badge>;
    case "in_transit":
      return <Badge variant="inTransit">In Transit</Badge>;
    case "arrived":
      return <Badge variant="inTransit">Arrived</Badge>;
    case "delivered":
      return <Badge variant="delivered">Delivered</Badge>;
    case "closed":
      return <Badge variant="delivered">Closed</Badge>;
    case "cancelled":
      return <Badge variant="cancelled">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatBudget = (budgetCents: number | null) => {
  if (!budgetCents) return "—";
  return `$${(budgetCents / 100).toLocaleString()}`;
};

const JobCard = ({ job, index }: JobCardProps) => {
  const createdAt = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card variant="glass" className="hover:border-primary/30 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{job.title}</h3>
                {getStatusBadge(job.status)}
                {job.urgency && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(job.pickup_label || job.drop_label) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.pickup_label || "TBD"} → {job.drop_label || "TBD"}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {createdAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-display font-bold text-primary">
                  {formatBudget(job.budget_cents)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {job.bids_count} {job.bids_count === 1 ? "bid" : "bids"}
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
