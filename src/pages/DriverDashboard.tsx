import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Filter, Bell, User, Wallet, Truck, TrendingUp, LogOut, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AIAssistant from "@/components/AIAssistant";
import DriverStatsGrid from "@/components/driver/DriverStatsGrid";
import ActiveJobBanner from "@/components/driver/ActiveJobBanner";
import AvailableJobCard from "@/components/driver/AvailableJobCard";
import ActiveCheckinBanner from "@/components/driver/ActiveCheckinBanner";
import NearbyHubsSection from "@/components/driver/NearbyHubsSection";
import CheckinHistorySheet from "@/components/driver/CheckinHistorySheet";
import ExternalLoadCard from "@/components/driver/ExternalLoadCard";
import LoadFilters, { type LoadFilterState } from "@/components/driver/LoadFilters";
import { useAvailableJobs, useDriverStats } from "@/hooks/useBids";
import { useDriverJobNotifications } from "@/hooks/useJobStatusNotifications";
import { useExternalLoads } from "@/hooks/useExternalLoads";
import EarningsDashboard from "@/components/driver/EarningsDashboard";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEarnings, setShowEarnings] = useState(false);
  const [activeTab, setActiveTab] = useState<"anchor" | "all">("anchor");
  const [filters, setFilters] = useState<LoadFilterState>({
    origin: "", destination: "", pickupDate: "", equipment: "", minRate: "", source: "",
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const { data: jobs, isLoading, error } = useAvailableJobs();
  const { data: stats } = useDriverStats();
  const { data: externalLoads, isLoading: extLoading } = useExternalLoads();

  // Enable real-time job status notifications
  useDriverJobNotifications();

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`;
  };

  const filteredJobs = jobs?.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.pickup_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.drop_label?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const sourceOptions = Array.from(new Set((externalLoads ?? []).map((l) => l.source_name)));
  const equipmentOptions = Array.from(
    new Set((externalLoads ?? []).map((l) => l.equipment_type).filter((x): x is string => !!x))
  );

  const filteredExternal = (externalLoads ?? []).filter((l) => {
    const q = searchQuery.toLowerCase();
    if (q && !`${l.title} ${l.origin_city} ${l.destination_city} ${l.broker_name}`.toLowerCase().includes(q)) return false;
    if (filters.origin && !`${l.origin_city} ${l.origin_state}`.toLowerCase().includes(filters.origin.toLowerCase())) return false;
    if (filters.destination && !`${l.destination_city} ${l.destination_state}`.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (filters.equipment && l.equipment_type !== filters.equipment) return false;
    if (filters.source && l.source_name !== filters.source) return false;
    if (filters.minRate && (l.rate_cents ?? 0) < Number(filters.minRate) * 100) return false;
    if (filters.pickupDate && l.pickup_date && new Date(l.pickup_date) < new Date(filters.pickupDate)) return false;
    return true;
  });

  // Show earnings dashboard if active
  if (showEarnings) {
    return <EarningsDashboard onBack={() => setShowEarnings(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-display font-bold text-primary">ANCHOR</h1>
            <Badge variant="accent" className="hidden sm:inline-flex">Driver</Badge>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2"
              onClick={() => setShowEarnings(true)}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">Earnings</span>
            </Button>
            <div
              className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => setShowEarnings(true)}
            >
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{formatCurrency(stats?.walletBalance ?? 0)}</span>
            </div>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => toast({ title: "Notifications", description: "You have no new notifications." })}>
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button variant="outline" size="icon" className="hidden sm:flex h-9 w-9" onClick={() => navigate("/dashboard/driver/profile")}>
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out" className="h-9 w-9">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Active Check-in Banner */}
        <ActiveCheckinBanner />

        {/* Active Job Banner */}
        <ActiveJobBanner />

        {/* Stats Grid */}
        <DriverStatsGrid />

        {/* Nearby Hubs Section */}
        <NearbyHubsSection />

        {/* Available Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold">Available Loads</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/driver/bids")}>
                <Gavel className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Bid Portal</span>
              </Button>
              <CheckinHistorySheet />
              <div className="flex gap-2 flex-1 min-w-0">
                <Input
                  placeholder="Search..."
                  className="w-full sm:w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "anchor" | "all")}>
            <TabsList className="mb-4">
              <TabsTrigger value="anchor">
                Anchor Loads
                <Badge variant="secondary" className="ml-2">{filteredJobs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all">
                All Loads
                <Badge variant="secondary" className="ml-2">{filteredJobs.length + filteredExternal.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="anchor" className="space-y-4 mt-0">
              {isLoading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} variant="glass">
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-64 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {error && <div className="text-center py-12 text-destructive">Failed to load jobs.</div>}
              {!isLoading && !error && filteredJobs.length === 0 && (
                <div className="text-center py-12">
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No jobs match your search" : "No Anchor jobs right now"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Switch to All Loads to see external boards.</p>
                </div>
              )}
              {filteredJobs.map((job, index) => (
                <AvailableJobCard
                  key={job.id}
                  job={job}
                  index={index}
                  isSelected={selectedJob === job.id}
                  onSelect={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                />
              ))}
            </TabsContent>

            <TabsContent value="all" className="mt-0">
              <LoadFilters
                value={filters}
                onChange={setFilters}
                sources={sourceOptions}
                equipmentOptions={equipmentOptions}
              />
              <div className="space-y-4">
                {filteredJobs.map((job, index) => (
                  <AvailableJobCard
                    key={`a-${job.id}`}
                    job={job}
                    index={index}
                    isSelected={selectedJob === job.id}
                    onSelect={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  />
                ))}
                {extLoading && (
                  <Card variant="glass"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
                )}
                {filteredExternal.map((load, i) => (
                  <ExternalLoadCard key={load.id} load={load} index={i} />
                ))}
                {!extLoading && filteredJobs.length + filteredExternal.length === 0 && (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No loads match your filters</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default DriverDashboard;
