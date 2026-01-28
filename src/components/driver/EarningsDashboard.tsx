import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EarningsSummaryCards from "./EarningsSummaryCards";
import EarningsChart from "./EarningsChart";
import CompletedJobsTable from "./CompletedJobsTable";
import TransactionHistory from "./TransactionHistory";
import {
  useDriverEarnings,
  useCompletedJobs,
  useTransactionHistory,
  useDailyEarningsChart,
  useMonthlyEarningsChart,
} from "@/hooks/useDriverEarnings";

interface EarningsDashboardProps {
  onBack: () => void;
}

const EarningsDashboard = ({ onBack }: EarningsDashboardProps) => {
  const { data: summary, isLoading: summaryLoading } = useDriverEarnings();
  const { data: completedJobs, isLoading: jobsLoading } = useCompletedJobs();
  const { data: transactions, isLoading: transactionsLoading } = useTransactionHistory();
  const { data: dailyData, isLoading: dailyLoading } = useDailyEarningsChart();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyEarningsChart();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="border-b border-border glass sticky top-0 z-40">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold">Earnings Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Track your income and transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8">
        {/* Summary Cards */}
        <EarningsSummaryCards summary={summary} isLoading={summaryLoading} />

        {/* Charts */}
        <EarningsChart
          dailyData={dailyData}
          monthlyData={monthlyData}
          isLoading={dailyLoading || monthlyLoading}
        />

        {/* Two column layout for tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CompletedJobsTable jobs={completedJobs} isLoading={jobsLoading} />
          <TransactionHistory transactions={transactions} isLoading={transactionsLoading} />
        </div>
      </div>
    </motion.div>
  );
};

export default EarningsDashboard;
