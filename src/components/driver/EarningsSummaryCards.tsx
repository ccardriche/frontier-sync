import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Wallet, ArrowDownRight, Building2, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EarningsSummary } from "@/hooks/useDriverEarnings";

interface EarningsSummaryCardsProps {
  summary: EarningsSummary | undefined;
  isLoading: boolean;
}

const EarningsSummaryCards = ({ summary, isLoading }: EarningsSummaryCardsProps) => {
  const formatCurrency = (cents: number) => {
    if (Math.abs(cents) >= 100000) {
      return `$${(cents / 100000).toFixed(1)}K`;
    }
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      label: "Total Earnings",
      value: summary?.totalEarnings ?? 0,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "This Week",
      value: summary?.weeklyEarnings ?? 0,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "This Month",
      value: summary?.monthlyEarnings ?? 0,
      icon: Wallet,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Job Earnings",
      value: summary?.jobEarnings ?? 0,
      icon: DollarSign,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Hub Fees",
      value: -(summary?.hubFees ?? 0),
      icon: Building2,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      isNegative: true,
    },
    {
      label: "Tips",
      value: summary?.tips ?? 0,
      icon: Gift,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="glass">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-lg mb-3" />
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card variant="glass" className="hover:scale-[1.02] transition-transform h-full">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${card.bgColor} flex items-center justify-center mb-3`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`text-xl font-display font-bold ${card.isNegative ? "text-rose-500" : ""}`}>
                {card.isNegative && card.value !== 0 && "-"}
                {formatCurrency(Math.abs(card.value))}
              </div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default EarningsSummaryCards;
