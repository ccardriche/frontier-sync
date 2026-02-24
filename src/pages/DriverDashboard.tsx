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
import AIAssistant from "@/components/AIAssistant";
import DriverStatsGrid from "@/components/driver/DriverStatsGrid";
import ActiveJobBanner from "@/components/driver/ActiveJobBanner";
import AvailableJobCard from "@/components/driver/AvailableJobCard";
import ActiveCheckinBanner from "@/components/driver/ActiveCheckinBanner";
import NearbyHubsSection from "@/components/driver/NearbyHubsSection";
import CheckinHistorySheet from "@/components/driver/CheckinHistorySheet";
import { useAvailableJobs, useDriverStats } from "@/hooks/useBids";
import { useDriverJobNotifications } from "@/hooks/useJobStatusNotifications";
import EarningsDashboard from "@/components/driver/EarningsDashboard";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEarnings, setShowEarnings] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const { data: jobs, isLoading, error } = useAvailableJobs();
  const { data: stats } = useDriverStats();
  
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
            <Button variant="outline" size="icon" className="hidden sm:flex h-9 w-9" onClick={() => navigate("/onboarding")}>
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
            <h2 className="text-xl sm:text-2xl font-display font-bold">Available Jobs</h2>
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

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load jobs. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No jobs match your search" : "No jobs available right now"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for new opportunities!
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredJobs.map((job, index) => (
              <AvailableJobCard
                key={job.id}
                job={job}
                index={index}
                isSelected={selectedJob === job.id}
                onSelect={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              />
            ))}
          </div>
        </motion.div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default DriverDashboard;
