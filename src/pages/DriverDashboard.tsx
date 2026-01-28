import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Truck, MapPin, Clock, DollarSign, 
  Navigation, Star, Fuel, Wallet,
  ArrowRight, Filter, Bell, User, Play,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AIAssistant from "@/components/AIAssistant";

// Mock available jobs
const availableJobs = [
  {
    id: "1",
    title: "Electronics Shipment",
    pickup: "Lagos, Nigeria",
    dropoff: "Accra, Ghana",
    distance: "520 km",
    budget: "$450",
    deadline: "2 days",
    shipper: {
      name: "TechCorp Ltd",
      rating: 4.8
    }
  },
  {
    id: "2",
    title: "Construction Materials",
    pickup: "Nairobi, Kenya",
    dropoff: "Mombasa, Kenya",
    distance: "480 km",
    budget: "$380",
    deadline: "3 days",
    shipper: {
      name: "BuildRight Inc",
      rating: 4.5
    }
  },
  {
    id: "3",
    title: "Agricultural Export",
    pickup: "Addis Ababa, Ethiopia",
    dropoff: "Djibouti Port",
    distance: "780 km",
    budget: "$620",
    deadline: "1 day",
    shipper: {
      name: "AgriExport Co",
      rating: 4.9
    }
  }
];

// Mock active job
const activeJob = {
  id: "active-1",
  title: "Medical Supplies Delivery",
  pickup: "Johannesburg, SA",
  dropoff: "Pretoria, SA",
  status: "in_transit",
  progress: 65,
  eta: "45 min",
  distance: "58 km remaining"
};

const stats = [
  { label: "Available", value: "23", icon: Truck },
  { label: "This Week", value: "$1,850", icon: DollarSign },
  { label: "Rating", value: "4.9", icon: Star },
  { label: "Completed", value: "89", icon: CheckCircle },
];

const DriverDashboard = () => {
  const [bidAmount, setBidAmount] = useState("");
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-primary">PIONEER NEXUS</h1>
            <Badge variant="accent">Driver</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="font-semibold">$2,450</span>
            </div>
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
        {/* Active Job Banner */}
        {activeJob && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card variant="glow" className="overflow-hidden">
              <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${activeJob.progress}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="inTransit">Active Delivery</Badge>
                        <span className="text-sm text-muted-foreground">{activeJob.progress}% complete</span>
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2">{activeJob.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          {activeJob.dropoff}
                        </span>
                        <span className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          {activeJob.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          ETA: {activeJob.eta}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="hero" size="lg">
                        <Navigation className="w-5 h-5" />
                        Navigate
                      </Button>
                      <Button variant="success" size="lg">
                        <CheckCircle className="w-5 h-5" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {stats.map((stat, index) => (
            <Card key={index} variant="glass" className="hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <stat.icon className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Available Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Available Jobs</h2>
            <div className="flex gap-2">
              <Input placeholder="Search..." className="w-48" />
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {availableJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card 
                  variant={selectedJob === job.id ? "glow" : "glass"} 
                  className={`transition-all cursor-pointer ${selectedJob === job.id ? "ring-1 ring-primary" : ""}`}
                  onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{job.title}</h3>
                          <Badge variant="glow">{job.deadline}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.pickup} → {job.dropoff}
                          </span>
                          <span className="flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            {job.distance}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{job.shipper.name}</span>
                          <span className="flex items-center gap-1 text-warning">
                            <Star className="w-3 h-3 fill-current" />
                            {job.shipper.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-display font-bold text-primary">{job.budget}</div>
                          <div className="text-sm text-muted-foreground">budget</div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Bid Section */}
                    {selectedJob === job.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-border"
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1">
                            <label className="text-sm font-medium mb-2 block">Your Bid Amount</label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                placeholder="Enter your bid"
                                className="pl-10"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex items-end">
                            <Button variant="hero" className="w-full sm:w-auto">
                              <Play className="w-4 h-4" />
                              Submit Bid
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
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

export default DriverDashboard;
