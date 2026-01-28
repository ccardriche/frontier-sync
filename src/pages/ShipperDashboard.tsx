import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Package, Plus, MapPin, Clock, DollarSign, 
  TrendingUp, Eye, CheckCircle, AlertCircle,
  ArrowRight, Filter, Bell, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AIAssistant from "@/components/AIAssistant";

// Mock data for jobs
const mockJobs = [
  {
    id: "1",
    title: "Electronics Shipment",
    pickup: "Lagos, Nigeria",
    dropoff: "Accra, Ghana",
    status: "bidding",
    urgency: true,
    bidsCount: 5,
    budget: "$450",
    createdAt: "2 hours ago"
  },
  {
    id: "2",
    title: "Agricultural Supplies",
    pickup: "Nairobi, Kenya",
    dropoff: "Kampala, Uganda",
    status: "assigned",
    urgency: false,
    bidsCount: 8,
    budget: "$320",
    createdAt: "5 hours ago"
  },
  {
    id: "3",
    title: "Medical Equipment",
    pickup: "Johannesburg, SA",
    dropoff: "Harare, Zimbabwe",
    status: "in_transit",
    urgency: true,
    bidsCount: 3,
    budget: "$680",
    createdAt: "1 day ago"
  }
];

const stats = [
  { label: "Active Jobs", value: "12", icon: Package, trend: "+3" },
  { label: "In Transit", value: "5", icon: TrendingUp, trend: "+1" },
  { label: "Completed", value: "127", icon: CheckCircle, trend: "+8" },
  { label: "Total Spent", value: "$24.5K", icon: DollarSign, trend: "" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "posted":
      return <Badge variant="posted">Posted</Badge>;
    case "bidding":
      return <Badge variant="bidding">Bidding</Badge>;
    case "assigned":
      return <Badge variant="assigned">Assigned</Badge>;
    case "in_transit":
      return <Badge variant="inTransit">In Transit</Badge>;
    case "delivered":
      return <Badge variant="delivered">Delivered</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ShipperDashboard = () => {
  const [showNewJob, setShowNewJob] = useState(false);

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
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {stats.map((stat, index) => (
            <Card key={index} variant="glass" className="hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <stat.icon className="w-5 h-5 text-primary" />
                  {stat.trend && (
                    <span className="text-xs text-success font-medium">{stat.trend}</span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-display font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

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
            <Input placeholder="Search jobs..." className="flex-1" />
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* New Job Form */}
        {showNewJob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8"
          >
            <Card variant="glow">
              <CardHeader>
                <CardTitle>Create New Job</CardTitle>
                <CardDescription>Post a freight job to receive bids from verified drivers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input placeholder="e.g., Electronics Shipment" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo Type</label>
                    <Input placeholder="e.g., General Freight" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Enter pickup address" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Drop-off Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Enter drop-off address" className="pl-10" />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="500" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pickup Date</label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (kg)</label>
                    <Input placeholder="1000" type="number" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="hero">
                    Post Job
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewJob(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Jobs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-display font-bold mb-4">Your Jobs</h2>
          <div className="space-y-4">
            {mockJobs.map((job, index) => (
              <motion.div
                key={job.id}
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
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.pickup} → {job.dropoff}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.createdAt}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-display font-bold text-primary">{job.budget}</div>
                          <div className="text-sm text-muted-foreground">{job.bidsCount} bids</div>
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
