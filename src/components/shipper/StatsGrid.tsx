import { motion } from "framer-motion";
import { Package, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useJobStats } from "@/hooks/useJobs";
import { Skeleton } from "@/components/ui/skeleton";

const StatsGrid = () => {
  const { data: stats, isLoading } = useJobStats();

  const formatCurrency = (cents: number) => {
    if (cents >= 100000) {
      return `$${(cents / 100000).toFixed(1)}K`;
    }
    return `$${(cents / 100).toLocaleString()}`;
  };

  const statItems = [
    { label: "Active Jobs", value: stats?.activeJobs ?? 0, icon: Package },
    { label: "In Transit", value: stats?.inTransit ?? 0, icon: TrendingUp },
    { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle },
    { label: "Total Spent", value: formatCurrency(stats?.totalSpent ?? 0), icon: DollarSign, isFormatted: true },
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
            <div className="flex items-start justify-between">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-display font-bold">
                {stat.isFormatted ? stat.value : stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default StatsGrid;
