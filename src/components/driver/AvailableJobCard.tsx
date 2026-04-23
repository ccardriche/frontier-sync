import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Star, DollarSign, Play, Clock, Route, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSubmitBid } from "@/hooks/useBids";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface JobWithShipper extends Tables<"jobs"> {
  shipper_profile: {
    full_name: string | null;
    rating: number | null;
  } | null;
}

interface AvailableJobCardProps {
  job: JobWithShipper;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const formatBudget = (budgetCents: number | null) => {
  if (!budgetCents) return "Open";
  return `$${(budgetCents / 100).toLocaleString()}`;
};

const formatDistanceKm = (km: number | null) => {
  if (!km) return null;
  if (Number(km) < 1) return `${Math.round(Number(km) * 1000)} m`;
  if (Number(km) < 10) return `${Number(km).toFixed(1)} km`;
  return `${Math.round(Number(km))} km`;
};

const AvailableJobCard = ({ job, index, isSelected, onSelect }: AvailableJobCardProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("");
  const [note, setNote] = useState("");

  const submitBid = useSubmitBid();
  const isBidJob = job.pricing_type === "bid";
  const isFixedJob = job.pricing_type === "fixed";

  const handleSubmitBid = async () => {
    if (!bidAmount) return;

    const amountCents = Math.round(parseFloat(bidAmount) * 100);

    // Validate bid is within range for bid jobs
    if (isBidJob && job.min_budget_cents && job.max_budget_cents) {
      if (amountCents < job.min_budget_cents || amountCents > job.max_budget_cents) {
        toast({
          title: "Bid out of range",
          description: `Bid must be between ${formatBudget(job.min_budget_cents)} and ${formatBudget(job.max_budget_cents)}`,
          variant: "destructive",
        });
        return;
      }
    }

    const eta = etaMinutes ? parseInt(etaMinutes, 10) : undefined;

    await submitBid.mutateAsync({
      jobId: job.id,
      amountCents,
      etaMinutes: eta,
      note: note || undefined,
    });

    setBidAmount("");
    setEtaMinutes("");
    setNote("");
  };

  const handleAcceptFixed = async () => {
    if (!job.budget_cents) return;
    await submitBid.mutateAsync({
      jobId: job.id,
      amountCents: job.budget_cents,
      etaMinutes: undefined,
      note: "Accepted fixed rate",
    });
  };

  const deadline = job.scheduled_pickup
    ? formatDistanceToNow(new Date(job.scheduled_pickup), { addSuffix: false })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card
        variant={isSelected ? "glow" : "glass"}
        className={`transition-all cursor-pointer ${isSelected ? "ring-1 ring-primary" : ""}`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">{job.title}</h3>
                {deadline && <Badge variant="glow">{deadline}</Badge>}
                {job.urgency && <Badge variant="warning">Urgent</Badge>}
                {isFixedJob ? (
                  <Badge variant="assigned">Fixed Rate</Badge>
                ) : (
                  <Badge variant="bidding">Open Bid</Badge>
                )}
                {job.source && job.source !== "manual" ? (
                  <Badge variant="outline" className="capitalize">
                    Load board · {job.source}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Book in Anchor
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                {(job.pickup_label || job.drop_label) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.pickup_label || "TBD"} → {job.drop_label || "TBD"}
                  </span>
                )}
                {formatDistanceKm(job.distance_km) && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Route className="w-4 h-4" />
                    {formatDistanceKm(job.distance_km)}
                  </span>
                )}
                {job.weight_kg && (
                  <span className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    {job.weight_kg} kg
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {job.shipper_profile?.full_name || "Anonymous Shipper"}
                </span>
                {job.shipper_profile?.rating && (
                  <span className="flex items-center gap-1 text-warning">
                    <Star className="w-3 h-3 fill-current" />
                    {job.shipper_profile.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {isBidJob ? (
                  <>
                    <div className="text-2xl font-display font-bold text-primary">
                      {formatBudget(job.min_budget_cents)} – {formatBudget(job.max_budget_cents)}
                    </div>
                    <div className="text-sm text-muted-foreground">bid range</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-display font-bold text-primary">
                      {formatBudget(job.budget_cents)}
                    </div>
                    <div className="text-sm text-muted-foreground">fixed rate</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Section */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {isFixedJob ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Accept this job at the fixed rate of <span className="font-bold text-primary">{formatBudget(job.budget_cents)}</span>
                  </p>
                  <Button
                    variant="hero"
                    onClick={handleAcceptFixed}
                    disabled={submitBid.isPending}
                  >
                    <Check className="w-4 h-4" />
                    {submitBid.isPending ? "Accepting..." : "Accept Job"}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Bid between {formatBudget(job.min_budget_cents)} and {formatBudget(job.max_budget_cents)}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`bid-${job.id}`}>Your Bid Amount *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id={`bid-${job.id}`}
                          placeholder="Enter your bid"
                          className="pl-10"
                          type="number"
                          min={(job.min_budget_cents || 0) / 100}
                          max={(job.max_budget_cents || Infinity) / 100}
                          step="0.01"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`eta-${job.id}`}>ETA (minutes)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id={`eta-${job.id}`}
                          placeholder="Estimated time"
                          className="pl-10"
                          type="number"
                          min="0"
                          value={etaMinutes}
                          onChange={(e) => setEtaMinutes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label htmlFor={`note-${job.id}`}>Note (optional)</Label>
                      <Textarea
                        id={`note-${job.id}`}
                        placeholder="Add a note..."
                        className="h-10 min-h-[40px] resize-none"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleSubmitBid}
                        disabled={!bidAmount || submitBid.isPending}
                      >
                        <Play className="w-4 h-4" />
                        {submitBid.isPending ? "Submitting..." : "Submit Bid"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AvailableJobCard;
