import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  MapPin, Plus, DollarSign, 
  Building2, TrendingUp, Users, Calendar,
  ArrowRight, Bell, User, CheckCircle,
  Clock, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AIAssistant from "@/components/AIAssistant";

// Mock hubs
const myHubs = [
  {
    id: "1",
    name: "Lagos Transit Hub",
    type: "micro_hub",
    location: "Lagos, Nigeria",
    status: "approved",
    monthlyEarnings: "$1,240",
    checkinsToday: 18,
    capacity: 50
  },
  {
    id: "2",
    name: "Nairobi Waypoint",
    type: "transit_stop",
    location: "Nairobi, Kenya",
    status: "approved",
    monthlyEarnings: "$680",
    checkinsToday: 7,
    capacity: 20
  },
  {
    id: "3",
    name: "Accra Distribution Point",
    type: "micro_hub",
    location: "Accra, Ghana",
    status: "pending",
    monthlyEarnings: "$0",
    checkinsToday: 0,
    capacity: 35
  }
];

// Mock recent activity
const recentActivity = [
  { id: "1", action: "Check-in", driver: "John M.", hub: "Lagos Transit Hub", time: "5 min ago", amount: "$5" },
  { id: "2", action: "Check-out", driver: "Sarah K.", hub: "Lagos Transit Hub", time: "12 min ago", amount: "$5" },
  { id: "3", action: "Check-in", driver: "Mike O.", hub: "Nairobi Waypoint", time: "1 hour ago", amount: "$3" },
];

const stats = [
  { label: "Active Hubs", value: "2", icon: Building2 },
  { label: "This Month", value: "$1,920", icon: DollarSign },
  { label: "Total Check-ins", value: "342", icon: Users },
  { label: "Growth", value: "+24%", icon: TrendingUp },
];

const LandownerDashboard = () => {
  const [showNewHub, setShowNewHub] = useState(false);

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
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {stats.map((stat, index) => (
            <Card key={index} variant="glass" className="hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <stat.icon className="w-5 h-5 text-success mb-2" />
                <div className="text-2xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

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
        {showNewHub && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8"
          >
            <Card variant="glow">
              <CardHeader>
                <CardTitle>List New Hub</CardTitle>
                <CardDescription>Add a new micro-hub or transit stop to the network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hub Name</label>
                    <Input placeholder="e.g., Downtown Transit Point" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hub Type</label>
                    <Input placeholder="Micro Hub / Transit Stop" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Enter address" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Capacity (vehicles)</label>
                    <Input placeholder="20" type="number" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fee per Check-in ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="5" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Operating Hours</label>
                    <Input placeholder="24/7 or 6AM - 10PM" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="hero">
                    Submit for Review
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewHub(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Hubs */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-display font-bold mb-4">My Hubs</h2>
            <div className="space-y-4">
              {myHubs.map((hub, index) => (
                <motion.div
                  key={hub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card variant="glass" className="hover:border-success/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-5 h-5 text-success" />
                            <h3 className="font-semibold">{hub.name}</h3>
                            <Badge variant={hub.status === "approved" ? "success" : "warning"}>
                              {hub.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {hub.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {hub.checkinsToday} today
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              Cap: {hub.capacity}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-display font-bold text-success">{hub.monthlyEarnings}</div>
                          <div className="text-sm text-muted-foreground">this month</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.action === "Check-in" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}>
                        {activity.action === "Check-in" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{activity.driver}</span>
                          <span className="text-success font-semibold text-sm">{activity.amount}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.action} at {activity.hub}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
};

export default LandownerDashboard;
