import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import anchorLogo from "@/assets/anchor-logo.png";
import {
  ArrowLeft, DollarSign, Filter, Search, CheckCircle, XCircle,
  Clock, User, Star, MessageSquare, Loader2, TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcceptBid } from "@/hooks/useShipperBids";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { DEMO_MODE } from "@/lib/seedData";

interface BidWithDetails {
  id: string;
  job_id: string;
  driver_id: string;
  amount_cents: number;
  eta_minutes: number | null;
  status: string;
  note: string | null;
  created_at: string;
  job_title: string;
  job_pickup: string | null;
  job_drop: string | null;
  job_budget: number | null;
  job_status: string;
  driver_name: string | null;
  driver_rating: number | null;
  driver_avatar: string | null;
  driver_phone: string | null;
}

const useAllShipperBids = () => {
  return useQuery({
    queryKey: ["shipper-all-bids"],
    queryFn: async (): Promise<BidWithDetails[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || DEMO_MODE) return [];

      // Get all shipper's jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, pickup_label, drop_label, budget_cents, status")
        .eq("shipper_id", user.user.id);

      if (jobsError || !jobs?.length) return [];

      const jobIds = jobs.map((j) => j.id);
      const jobMap = new Map(jobs.map((j) => [j.id, j]));

      // Get all bids for those jobs
      const { data: bids, error: bidsError } = await supabase
        .from("bids")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      if (bidsError || !bids?.length) return [];

      // Get driver profiles
      const driverIds = [...new Set(bids.map((b) => b.driver_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, rating, avatar_url, phone")
        .in("id", driverIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return bids.map((bid) => {
        const job = jobMap.get(bid.job_id);
        const profile = profileMap.get(bid.driver_id);
        return {
          id: bid.id,
          job_id: bid.job_id,
          driver_id: bid.driver_id,
          amount_cents: bid.amount_cents,
          eta_minutes: bid.eta_minutes,
          status: bid.status,
          note: bid.note,
          created_at: bid.created_at,
          job_title: job?.title || "Unknown Job",
          job_pickup: job?.pickup_label || null,
          job_drop: job?.drop_label || null,
          job_budget: job?.budget_cents || null,
          job_status: job?.status || "unknown",
          driver_name: profile?.full_name || null,
          driver_rating: profile?.rating || null,
          driver_avatar: profile?.avatar_url || null,
          driver_phone: profile?.phone || null,
        };
      });
    },
  });
};

const formatCurrency = (cents: number) => `$${(cents / 100).toLocaleString()}`;

const ShipperBidsPortal = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const { data: bids, isLoading } = useAllShipperBids();
  const acceptBid = useAcceptBid();
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  const filteredBids = useMemo(() => {
    if (!bids) return [];
    let filtered = bids;

    // Filter by tab
    if (activeTab === "active") {
      filtered = filtered.filter((b) => b.status === "active");
    } else if (activeTab === "accepted") {
      filtered = filtered.filter((b) => b.status === "accepted");
    } else if (activeTab === "rejected") {
      filtered = filtered.filter((b) => b.status === "rejected" || b.status === "withdrawn");
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.job_title.toLowerCase().includes(q) ||
          b.driver_name?.toLowerCase().includes(q) ||
          b.job_pickup?.toLowerCase().includes(q) ||
          b.job_drop?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [bids, activeTab, searchQuery]);

  const stats = useMemo(() => {
    if (!bids) return { active: 0, accepted: 0, rejected: 0, avgBid: 0 };
    const active = bids.filter((b) => b.status === "active").length;
    const accepted = bids.filter((b) => b.status === "accepted").length;
    const rejected = bids.filter((b) => b.status === "rejected" || b.status === "withdrawn").length;
    const activeBids = bids.filter((b) => b.status === "active");
    const avgBid = activeBids.length
      ? Math.round(activeBids.reduce((s, b) => s + b.amount_cents, 0) / activeBids.length)
      : 0;
    return { active, accepted, rejected, avgBid };
  }, [bids]);

  const handleAcceptBid = async (bid: BidWithDetails) => {
    setAcceptingBidId(bid.id);
    try {
      await acceptBid.mutateAsync({ bidId: bid.id, jobId: bid.job_id });
    } finally {
      setAcceptingBidId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <img src={anchorLogo} alt="Anchor Logo" className="w-8 h-8 rounded" />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/shipper")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold text-primary">Bid Management</h1>
              <p className="text-sm text-muted-foreground">Review and manage all incoming bids</p>
            </div>
          </div>
          <Badge variant="glow">Shipper</Badge>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Bids", value: stats.active, icon: Clock, color: "text-warning" },
            { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "text-primary" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
            { label: "Avg Bid", value: stats.avgBid ? formatCurrency(stats.avgBid) : "—", icon: TrendingUp, color: "text-primary" },
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

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job, driver, or location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({bids?.length || 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bids List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="glass">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? "No bids match your search" : "No bids yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Bids from drivers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredBids.map((bid, index) => {
                const isJobOpen = bid.job_status === "posted" || bid.job_status === "bidding";
                return (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card variant="glass" className="hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Driver Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={bid.driver_avatar || undefined} />
                              <AvatarFallback className="bg-primary/10">
                                <User className="h-5 w-5 text-primary" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {bid.driver_name || "Driver"}
                                </span>
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  <Star className="w-3 h-3 mr-0.5 text-warning" />
                                  {bid.driver_rating?.toFixed(1) || "5.0"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{bid.job_title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {bid.job_pickup || "TBD"} → {bid.job_drop || "TBD"}
                            </p>
                          </div>

                          {/* Bid Amount & Status */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-display font-bold text-primary">
                                {formatCurrency(bid.amount_cents)}
                              </p>
                              {bid.eta_minutes && (
                                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3" />
                                  {bid.eta_minutes} min ETA
                                </p>
                              )}
                              {bid.job_budget && (
                                <p className="text-xs text-muted-foreground">
                                  Budget: {formatCurrency(bid.job_budget)}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {bid.status === "active" && (
                                <Badge variant="bidding">Active</Badge>
                              )}
                              {bid.status === "accepted" && (
                                <Badge variant="delivered">Accepted</Badge>
                              )}
                              {bid.status === "rejected" && (
                                <Badge variant="cancelled">Rejected</Badge>
                              )}
                              {bid.status === "withdrawn" && (
                                <Badge variant="outline">Withdrawn</Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {bid.driver_phone && (
                              <WhatsAppButton
                                phone={bid.driver_phone}
                                messageType="bid_received"
                                jobDetails={{
                                  title: bid.job_title,
                                  pickupLocation: bid.job_pickup || undefined,
                                  dropLocation: bid.job_drop || undefined,
                                  driverName: bid.driver_name || undefined,
                                }}
                                tooltipText="Chat on WhatsApp"
                              />
                            )}
                            {bid.status === "active" && isJobOpen && (
                              <Button
                                variant="hero"
                                size="sm"
                                onClick={() => handleAcceptBid(bid)}
                                disabled={acceptBid.isPending}
                              >
                                {acceptingBidId === bid.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Note */}
                        {bid.note && (
                          <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
                            <MessageSquare className="w-3 h-3 inline mr-1 text-muted-foreground" />
                            {bid.note}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default ShipperBidsPortal;
