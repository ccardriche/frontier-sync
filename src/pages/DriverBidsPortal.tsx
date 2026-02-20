import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, DollarSign, MapPin, Star, Clock,
  Play, Navigation, Filter, Briefcase, TrendingUp, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAvailableJobs, useDriverBids, useSubmitBid } from "@/hooks/useBids";
import { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

interface JobWithShipper extends Tables<"jobs"> {
  shipper_profile: {
    full_name: string | null;
    rating: number | null;
  } | null;
}

const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString()}`;
const formatBudget = (cents: number | null) => (cents ? formatCurrency(cents) : "Open");

const DriverBidsPortal = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("marketplace");
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("");
  const [note, setNote] = useState("");

  const { data: availableJobs, isLoading: jobsLoading } = useAvailableJobs();
  const { data: myBids, isLoading: bidsLoading } = useDriverBids();
  const submitBid = useSubmitBid();

  const filteredJobs = useMemo(() => {
    if (!availableJobs) return [];
    if (!searchQuery) return availableJobs;
    const q = searchQuery.toLowerCase();
    return availableJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.pickup_label?.toLowerCase().includes(q) ||
        j.drop_label?.toLowerCase().includes(q)
    );
  }, [availableJobs, searchQuery]);

  const bidStats = useMemo(() => {
    if (!myBids) return { active: 0, accepted: 0, total: 0 };
    return {
      active: myBids.filter((b) => b.status === "active").length,
      accepted: myBids.filter((b) => b.status === "accepted").length,
      total: myBids.length,
    };
  }, [myBids]);

  // Set of job IDs the driver already bid on
  const biddedJobIds = useMemo(
    () => new Set(myBids?.filter((b) => b.status === "active").map((b) => b.job_id) || []),
    [myBids]
  );

  const handleSubmitBid = async (jobId: string) => {
    if (!bidAmount) return;
    const amountCents = Math.round(parseFloat(bidAmount) * 100);
    const eta = etaMinutes ? parseInt(etaMinutes, 10) : undefined;
    await submitBid.mutateAsync({
      jobId,
      amountCents,
      etaMinutes: eta,
      note: note || undefined,
    });
    setBidAmount("");
    setEtaMinutes("");
    setNote("");
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/driver")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold text-primary">Bidding Marketplace</h1>
              <p className="text-sm text-muted-foreground">Browse jobs & manage your bids</p>
            </div>
          </div>
          <Badge variant="glow">Driver</Badge>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Open Jobs", value: availableJobs?.length || 0, icon: Briefcase, color: "text-primary" },
            { label: "My Active Bids", value: bidStats.active, icon: TrendingUp, color: "text-warning" },
            { label: "Accepted", value: bidStats.accepted, icon: CheckCircle, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="glass">
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title or location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="marketplace">
              Open Jobs ({availableJobs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="my-bids">
              My Bids ({bidStats.total})
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-6">
            {jobsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} variant="glass">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-72" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {searchQuery ? "No jobs match your search" : "No open jobs right now"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job, index) => {
                  const isSelected = selectedJob === job.id;
                  const alreadyBid = biddedJobIds.has(job.id);
                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Card
                        variant={isSelected ? "glow" : "glass"}
                        className={`transition-all cursor-pointer ${isSelected ? "ring-1 ring-primary" : ""}`}
                        onClick={() => setSelectedJob(isSelected ? null : job.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold truncate">{job.title}</h3>
                                {job.urgency && <Badge variant="warning">Urgent</Badge>}
                                {alreadyBid && <Badge variant="glow">Bid Sent</Badge>}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-1">
                                {(job.pickup_label || job.drop_label) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {job.pickup_label || "TBD"} → {job.drop_label || "TBD"}
                                  </span>
                                )}
                                {job.weight_kg && (
                                  <span className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {Number(job.weight_kg)} kg
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{job.shipper_profile?.full_name || "Shipper"}</span>
                                {job.shipper_profile?.rating && (
                                  <span className="flex items-center gap-0.5 text-warning">
                                    <Star className="w-3 h-3 fill-current" />
                                    {job.shipper_profile.rating.toFixed(1)}
                                  </span>
                                )}
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-display font-bold text-primary">
                                {formatBudget(job.budget_cents)}
                              </p>
                              <p className="text-xs text-muted-foreground">budget</p>
                            </div>
                          </div>

                          {/* Expanded bid form */}
                          {isSelected && !alreadyBid && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-4 pt-4 border-t border-border"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1">
                                  <Label>Your Bid *</Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Amount"
                                      className="pl-10"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={bidAmount}
                                      onChange={(e) => setBidAmount(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label>ETA (min)</Label>
                                  <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Minutes"
                                      className="pl-10"
                                      type="number"
                                      min="0"
                                      value={etaMinutes}
                                      onChange={(e) => setEtaMinutes(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label>Note</Label>
                                  <Textarea
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
                                    onClick={() => handleSubmitBid(job.id)}
                                    disabled={!bidAmount || submitBid.isPending}
                                  >
                                    <Play className="w-4 h-4" />
                                    {submitBid.isPending ? "Submitting..." : "Submit Bid"}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Bids Tab */}
          <TabsContent value="my-bids" className="mt-6">
            {bidsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} variant="glass">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !myBids?.length ? (
              <div className="text-center py-16">
                <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No bids submitted yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse open jobs and start bidding</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myBids.map((bid, index) => (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card variant="glass">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Job: {bid.job_id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                            </p>
                            {bid.note && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">"{bid.note}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-display font-bold text-primary">
                                {formatCurrency(bid.amount_cents)}
                              </p>
                              {bid.eta_minutes && (
                                <p className="text-xs text-muted-foreground">{bid.eta_minutes} min</p>
                              )}
                            </div>
                            {bid.status === "active" && <Badge variant="bidding">Active</Badge>}
                            {bid.status === "accepted" && <Badge variant="delivered">Accepted</Badge>}
                            {bid.status === "rejected" && <Badge variant="cancelled">Rejected</Badge>}
                            {bid.status === "withdrawn" && <Badge variant="outline">Withdrawn</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DriverBidsPortal;
