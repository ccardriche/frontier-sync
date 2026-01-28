import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Filter, Bell, User, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AIAssistant from "@/components/AIAssistant";
import StatsGrid from "@/components/shipper/StatsGrid";
import JobForm from "@/components/shipper/JobForm";
import JobCard from "@/components/shipper/JobCard";
import { useShipperJobs } from "@/hooks/useJobs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useShipperJobNotifications } from "@/hooks/useJobStatusNotifications";

const ShipperDashboard = () => {
  const [showNewJob, setShowNewJob] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: jobs, isLoading, error } = useShipperJobs();
  
  // Enable real-time job status notifications
  useShipperJobNotifications();

  const filteredJobs = jobs?.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.pickup_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.drop_label?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-primary">PIONEER NEXUS</h1>
            <Badge variant="glow">Shipper</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button variant="outline" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats Grid */}
        <StatsGrid />

        {/* Actions Bar */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            variant="hero"
            size="lg"
            onClick={() => setShowNewJob(true)}
            className="shrink-0"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </Button>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search jobs..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* New Job Form */}
        <AnimatePresence>
          {showNewJob && <JobForm onClose={() => setShowNewJob(false)} />}
        </AnimatePresence>

        {/* Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold mb-4">Your Jobs</h2>

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right space-y-1">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-9 w-20" />
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
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No jobs match your search" : "No jobs posted yet"}
              </p>
              {!searchQuery && (
                <Button variant="hero" onClick={() => setShowNewJob(true)}>
                  <Plus className="w-4 h-4" />
                  Post Your First Job
                </Button>
              )}
            </div>
          )}

          <div className="space-y-4">
            {filteredJobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))}
          </div>
        </motion.div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default ShipperDashboard;
