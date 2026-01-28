import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { startOfWeek, startOfMonth, subMonths, format, eachDayOfInterval, subDays } from "date-fns";

export interface EarningsSummary {
  totalEarnings: number;
  jobEarnings: number;
  hubFees: number;
  tips: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export interface CompletedJobEarning {
  id: string;
  title: string;
  completedAt: string;
  amount: number;
  tip?: number;
  pickupLabel?: string;
  dropLabel?: string;
}

export interface HubFeeRecord {
  id: string;
  hubName: string;
  eventType: string;
  feeCharged: number;
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  direction: string;
  description: string | null;
  createdAt: string;
  jobId?: string | null;
  hubId?: string | null;
}

export interface DailyEarning {
  date: string;
  earnings: number;
  jobs: number;
}

export const useDriverEarnings = () => {
  return useQuery({
    queryKey: ["driver-earnings"],
    queryFn: async (): Promise<EarningsSummary> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {
          totalEarnings: 0,
          jobEarnings: 0,
          hubFees: 0,
          tips: 0,
          weeklyEarnings: 0,
          monthlyEarnings: 0,
          pendingPayouts: 0,
          completedPayouts: 0,
        };
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);

      // Get completed assignments with bid amounts
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, completed_at, bid_id")
        .eq("driver_id", user.user.id)
        .not("completed_at", "is", null);

      const completedBidIds = assignments?.map((a) => a.bid_id) || [];
      let jobEarnings = 0;
      let weeklyEarnings = 0;
      let monthlyEarnings = 0;

      if (completedBidIds.length > 0) {
        const { data: bids } = await supabase
          .from("bids")
          .select("id, amount_cents, created_at")
          .in("id", completedBidIds);

        if (bids) {
          jobEarnings = bids.reduce((sum, b) => sum + b.amount_cents, 0);
          
          // Filter for weekly and monthly
          const assignmentMap = new Map(
            assignments?.map((a) => [a.bid_id, a.completed_at]) || []
          );

          for (const bid of bids) {
            const completedAt = assignmentMap.get(bid.id);
            if (completedAt) {
              const completedDate = new Date(completedAt);
              if (completedDate >= weekStart) {
                weeklyEarnings += bid.amount_cents;
              }
              if (completedDate >= monthStart) {
                monthlyEarnings += bid.amount_cents;
              }
            }
          }
        }
      }

      // Get hub fees (expenses for driver)
      const { data: checkins } = await supabase
        .from("hub_checkins")
        .select("fee_charged_cents")
        .eq("user_id", user.user.id);

      const hubFees = checkins?.reduce((sum, c) => sum + (c.fee_charged_cents || 0), 0) || 0;

      // Get transactions for tips and payouts
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.user.id);

      const tips = transactions
        ?.filter((t) => t.description?.toLowerCase().includes("tip"))
        .reduce((sum, t) => sum + t.amount_cents, 0) || 0;

      const pendingPayouts = transactions
        ?.filter((t) => t.direction === "out" && t.description?.toLowerCase().includes("pending"))
        .reduce((sum, t) => sum + t.amount_cents, 0) || 0;

      const completedPayouts = transactions
        ?.filter((t) => t.direction === "out" && !t.description?.toLowerCase().includes("pending"))
        .reduce((sum, t) => sum + t.amount_cents, 0) || 0;

      return {
        totalEarnings: jobEarnings + tips - hubFees,
        jobEarnings,
        hubFees,
        tips,
        weeklyEarnings,
        monthlyEarnings,
        pendingPayouts,
        completedPayouts,
      };
    },
  });
};

export const useCompletedJobs = () => {
  return useQuery({
    queryKey: ["driver-completed-jobs"],
    queryFn: async (): Promise<CompletedJobEarning[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, completed_at, bid_id, job_id")
        .eq("driver_id", user.user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (!assignments || assignments.length === 0) return [];

      // Get job details
      const jobIds = assignments.map((a) => a.job_id);
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, pickup_label, drop_label")
        .in("id", jobIds);

      // Get bid amounts
      const bidIds = assignments.map((a) => a.bid_id);
      const { data: bids } = await supabase
        .from("bids")
        .select("id, amount_cents")
        .in("id", bidIds);

      const jobMap = new Map(jobs?.map((j) => [j.id, j]) || []);
      const bidMap = new Map(bids?.map((b) => [b.id, b]) || []);

      return assignments.map((assignment) => {
        const job = jobMap.get(assignment.job_id);
        const bid = bidMap.get(assignment.bid_id);

        return {
          id: assignment.id,
          title: job?.title || "Unknown Job",
          completedAt: assignment.completed_at!,
          amount: bid?.amount_cents || 0,
          pickupLabel: job?.pickup_label || undefined,
          dropLabel: job?.drop_label || undefined,
        };
      });
    },
  });
};

export const useHubFeeHistory = () => {
  return useQuery({
    queryKey: ["driver-hub-fees"],
    queryFn: async (): Promise<HubFeeRecord[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: checkins } = await supabase
        .from("hub_checkins")
        .select("id, hub_id, event_type, fee_charged_cents, created_at")
        .eq("user_id", user.user.id)
        .gt("fee_charged_cents", 0)
        .order("created_at", { ascending: false });

      if (!checkins || checkins.length === 0) return [];

      const hubIds = [...new Set(checkins.map((c) => c.hub_id))];
      const { data: hubs } = await supabase
        .from("hub_listings")
        .select("id, hub_name")
        .in("id", hubIds);

      const hubMap = new Map(hubs?.map((h) => [h.id, h.hub_name]) || []);

      return checkins.map((checkin) => ({
        id: checkin.id,
        hubName: hubMap.get(checkin.hub_id) || "Unknown Hub",
        eventType: checkin.event_type,
        feeCharged: checkin.fee_charged_cents || 0,
        createdAt: checkin.created_at,
      }));
    },
  });
};

export const useTransactionHistory = () => {
  return useQuery({
    queryKey: ["driver-transactions"],
    queryFn: async (): Promise<TransactionRecord[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });

      return (
        transactions?.map((t) => ({
          id: t.id,
          amount: t.amount_cents,
          direction: t.direction,
          description: t.description,
          createdAt: t.created_at,
          jobId: t.job_id,
          hubId: t.hub_id,
        })) || []
      );
    },
  });
};

export const useDailyEarningsChart = () => {
  return useQuery({
    queryKey: ["driver-daily-earnings"],
    queryFn: async (): Promise<DailyEarning[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      // Get assignments completed in the last 30 days
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, completed_at, bid_id")
        .eq("driver_id", user.user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", startDate.toISOString())
        .lte("completed_at", endDate.toISOString());

      if (!assignments || assignments.length === 0) {
        // Return empty data for all days
        return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => ({
          date: format(date, "MMM dd"),
          earnings: 0,
          jobs: 0,
        }));
      }

      // Get bid amounts
      const bidIds = assignments.map((a) => a.bid_id);
      const { data: bids } = await supabase
        .from("bids")
        .select("id, amount_cents")
        .in("id", bidIds);

      const bidMap = new Map(bids?.map((b) => [b.id, b.amount_cents]) || []);

      // Group by day
      const dailyData: Record<string, { earnings: number; jobs: number }> = {};

      for (const assignment of assignments) {
        const day = format(new Date(assignment.completed_at!), "yyyy-MM-dd");
        if (!dailyData[day]) {
          dailyData[day] = { earnings: 0, jobs: 0 };
        }
        dailyData[day].earnings += bidMap.get(assignment.bid_id) || 0;
        dailyData[day].jobs += 1;
      }

      // Create array for all days in range
      return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => {
        const dayKey = format(date, "yyyy-MM-dd");
        return {
          date: format(date, "MMM dd"),
          earnings: (dailyData[dayKey]?.earnings || 0) / 100, // Convert to dollars
          jobs: dailyData[dayKey]?.jobs || 0,
        };
      });
    },
  });
};

export const useMonthlyEarningsChart = () => {
  return useQuery({
    queryKey: ["driver-monthly-earnings"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const endDate = new Date();
      const startDate = subMonths(endDate, 6);

      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, completed_at, bid_id")
        .eq("driver_id", user.user.id)
        .not("completed_at", "is", null)
        .gte("completed_at", startDate.toISOString());

      if (!assignments || assignments.length === 0) return [];

      const bidIds = assignments.map((a) => a.bid_id);
      const { data: bids } = await supabase
        .from("bids")
        .select("id, amount_cents")
        .in("id", bidIds);

      const bidMap = new Map(bids?.map((b) => [b.id, b.amount_cents]) || []);

      // Group by month
      const monthlyData: Record<string, number> = {};

      for (const assignment of assignments) {
        const month = format(new Date(assignment.completed_at!), "MMM yyyy");
        monthlyData[month] = (monthlyData[month] || 0) + (bidMap.get(assignment.bid_id) || 0);
      }

      return Object.entries(monthlyData).map(([month, earnings]) => ({
        month,
        earnings: earnings / 100,
      }));
    },
  });
};

// Export data to CSV
export const exportEarningsToCSV = (data: CompletedJobEarning[], filename: string) => {
  const headers = ["Job Title", "Completed At", "Amount ($)", "Pickup", "Drop-off"];
  const rows = data.map((job) => [
    job.title,
    format(new Date(job.completedAt), "yyyy-MM-dd HH:mm"),
    (job.amount / 100).toFixed(2),
    job.pickupLabel || "",
    job.dropLabel || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const exportTransactionsToCSV = (data: TransactionRecord[], filename: string) => {
  const headers = ["Date", "Type", "Amount ($)", "Description"];
  const rows = data.map((t) => [
    format(new Date(t.createdAt), "yyyy-MM-dd HH:mm"),
    t.direction === "in" ? "Credit" : "Debit",
    ((t.direction === "in" ? 1 : -1) * t.amount / 100).toFixed(2),
    t.description || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
