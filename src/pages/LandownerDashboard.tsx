import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bell, User, Building2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import AIAssistant from "@/components/AIAssistant";
import LandownerStatsGrid from "@/components/landowner/LandownerStatsGrid";
import HubForm from "@/components/landowner/HubForm";
import HubCard from "@/components/landowner/HubCard";
import HubActivityFeed from "@/components/landowner/HubActivityFeed";
import { useLandownerHubs } from "@/hooks/useHubs";

const LandownerDashboard = () => {
  const navigate = useNavigate();
  const [showNewHub, setShowNewHub] = useState(false);
  const { data: hubs, isLoading, error } = useLandownerHubs();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-primary">PIONEER NEXUS</h1>
            <Badge variant="success">Landowner</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <Button variant="outline" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats Grid */}
        <LandownerStatsGrid />

        {/* Actions */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => setShowNewHub(true)}
            className="shrink-0"
          >
            <Plus className="w-5 h-5" />
            List New Hub
          </Button>
        </motion.div>

        {/* New Hub Form */}
        <AnimatePresence>
          {showNewHub && <HubForm onClose={() => setShowNewHub(false)} />}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Hubs */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-display font-bold mb-4">My Hubs</h2>
            
            {isLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} variant="glass">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="text-right space-y-1">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Failed to load hubs. Please try again.</p>
              </div>
            )}

            {!isLoading && !error && hubs?.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hubs listed yet
                </p>
                <Button variant="hero" onClick={() => setShowNewHub(true)}>
                  <Plus className="w-4 h-4" />
                  List Your First Hub
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {hubs?.map((hub, index) => (
                <HubCard key={hub.id} hub={hub} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-display font-bold mb-4">Recent Activity</h2>
            <HubActivityFeed />
          </motion.div>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default LandownerDashboard;
