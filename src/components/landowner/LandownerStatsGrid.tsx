import { motion } from "framer-motion";
import { Building2, DollarSign, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandownerStats } from "@/hooks/useHubs";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

const LandownerStatsGrid = () => {
  const { data: stats, isLoading } = useLandownerStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="glass">
            <CardContent className="p-4">
              <Skeleton className="w-5 h-5 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    { 
      label: "Active Hubs", 
      value: stats?.activeHubs.toString() || "0", 
      icon: Building2,
      color: "text-success"
    },
    { 
      label: "This Month", 
      value: formatCurrency(stats?.monthlyEarnings || 0), 
      icon: DollarSign,
      color: "text-success"
    },
    { 
      label: "Total Check-ins", 
      value: stats?.totalCheckins.toString() || "0", 
      icon: Users,
      color: "text-success"
    },
    { 
      label: "Growth", 
      value: `${stats?.growthPercent >= 0 ? "+" : ""}${stats?.growthPercent || 0}%`, 
      icon: TrendingUp,
      color: stats?.growthPercent >= 0 ? "text-success" : "text-destructive"
    },
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {statsData.map((stat, index) => (
        <Card key={index} variant="glass" className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className="text-2xl font-display font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default LandownerStatsGrid;
