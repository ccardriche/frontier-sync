import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { User, Star, Clock, DollarSign, Loader2, MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobBids, useAcceptBid } from "@/hooks/useShipperBids";
import type { Job } from "@/hooks/useJobs";

interface BidsSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (cents: number) => {
  return `$${(cents / 100).toLocaleString()}`;
};

const BidsSheet = ({ job, open, onOpenChange }: BidsSheetProps) => {
  const { data: bids, isLoading } = useJobBids(job?.id || null);
  const acceptBid = useAcceptBid();
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  const handleAcceptBid = async (bidId: string) => {
    if (!job) return;
    setAcceptingBidId(bidId);
    try {
      await acceptBid.mutateAsync({ bidId, jobId: job.id });
      onOpenChange(false);
    } finally {
      setAcceptingBidId(null);
    }
  };

  const isJobOpen = job?.status === "posted" || job?.status === "bidding";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display">{job?.title}</SheetTitle>
          <SheetDescription>
            {job?.pickup_label} → {job?.drop_label}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Budget: {job?.budget_cents ? formatCurrency(job.budget_cents) : "—"}</span>
            <span>{bids?.length || 0} {bids?.length === 1 ? "bid" : "bids"}</span>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && bids?.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bids yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drivers will start bidding soon
              </p>
            </div>
          )}

          {!isLoading && bids && bids.length > 0 && (
            <div className="space-y-4">
              {bids.map((bid, index) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bid.driver_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {bid.driver_profile?.full_name || "Driver"}
                        </span>
                        <Badge variant="outline" className="shrink-0">
                          <Star className="w-3 h-3 mr-1 text-warning" />
                          {bid.driver_profile?.rating?.toFixed(1) || "5.0"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-display font-bold text-primary">
                        {formatCurrency(bid.amount_cents)}
                      </div>
                      {bid.eta_minutes && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Clock className="w-3 h-3" />
                          {bid.eta_minutes} min
                        </div>
                      )}
                    </div>
                  </div>

                  {bid.note && (
                    <div className="mb-3 p-2 rounded bg-muted/50 text-sm">
                      <MessageSquare className="w-3 h-3 inline mr-1 text-muted-foreground" />
                      {bid.note}
                    </div>
                  )}

                  {isJobOpen && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full"
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={acceptBid.isPending}
                    >
                      {acceptingBidId === bid.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        "Accept Bid"
                      )}
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!isJobOpen && (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                This job is no longer accepting bids
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BidsSheet;
