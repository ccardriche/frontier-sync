import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Package, Truck, MapPin, ArrowRight, CheckCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const roles = [
  {
    id: "shipper",
    title: "Shipper",
    icon: Package,
    description: "Post freight jobs, track deliveries, and manage your supply chain with real-time visibility.",
    features: [
      "Post jobs and receive instant bids",
      "Real-time cargo tracking",
      "Proof of delivery verification",
      "Escrow payment protection"
    ],
    color: "primary",
    path: "/auth?tab=signup"
  },
  {
    id: "driver",
    title: "Driver",
    icon: Truck,
    description: "Find contracts, execute deliveries, and contribute to the pioneer mapping network.",
    features: [
      "Browse and bid on available jobs",
      "Optimized route suggestions",
      "Offline mode with auto-sync",
      "Build your reputation & ratings"
    ],
    color: "accent",
    path: "/auth?tab=signup"
  },
  {
    id: "landowner",
    title: "Landowner",
    icon: MapPin,
    description: "List micro-hubs and transit stops. Monetize your land as logistics infrastructure.",
    features: [
      "List hubs and access points",
      "Flexible fee structures",
      "Check-in/out tracking",
      "Passive income generation"
    ],
    color: "success",
    path: "/auth?tab=signup"
  }
];

const RoleSelection = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4 py-20">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-3xl font-display font-bold text-primary text-glow">
              ANCHOR
            </h1>
          </Link>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Choose Your <span className="text-primary">Role</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select how you want to participate in the ANCHOR network
          </p>
        </motion.div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card 
                variant="glow" 
                className="h-full hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-xl bg-${role.color}/10 flex items-center justify-center mb-4 group-hover:bg-${role.color}/20 transition-colors`}>
                    <role.icon className={`w-8 h-8 text-${role.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" className="w-full" asChild>
                    <Link to={role.path}>
                      Get Started as {role.title}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Back Link */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-muted-foreground">
                ← Back to Home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                toast({ title: "Logged out", description: "You can now test the signup flow." });
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out First
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleSelection;
