import { motion } from "framer-motion";
import { Truck, DollarSign, Star, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useDriverStats } from "@/hooks/useBids";
import { Skeleton } from "@/components/ui/skeleton";

const DriverStatsGrid = () => {
  const { data: stats, isLoading } = useDriverStats();

  const formatCurrency = (cents: number) => {
    if (cents >= 100000) {
      return `$${(cents / 100000).toFixed(1)}K`;
    }
    return `$${(cents / 100).toLocaleString()}`;
  };

  const statItems = [
    { label: "Available", value: stats?.availableJobs ?? 0, icon: Truck },
    { label: "This Week", value: formatCurrency(stats?.weeklyEarnings ?? 0), icon: DollarSign },
    { label: "Rating", value: (stats?.rating ?? 5.0).toFixed(1), icon: Star },
    { label: "Completed", value: stats?.completedJobs ?? 0, icon: CheckCircle },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} variant="glass">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-5 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {statItems.map((stat, index) => (
        <Card key={index} variant="glass" className="hover:scale-[1.02] transition-transform">
          <CardContent className="p-4">
            <stat.icon className="w-5 h-5 text-primary mb-2" />
            <div className="text-2xl font-display font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default DriverStatsGrid;
