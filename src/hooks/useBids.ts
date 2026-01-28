import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Bid = Tables<"bids">;
export type BidInsert = TablesInsert<"bids">;

interface JobWithShipper extends Tables<"jobs"> {
  shipper_profile: {
    full_name: string | null;
    rating: number | null;
  } | null;
}

export const useAvailableJobs = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to realtime changes on jobs table
    const channel = supabase
      .channel("driver-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
        },
        (payload) => {
          // Only refresh if job is relevant (posted or bidding status)
          const newJob = payload.new as Tables<"jobs"> | null;
          const oldJob = payload.old as Tables<"jobs"> | null;
          
          const relevantStatuses = ["posted", "bidding"];
          const isRelevant =
            (newJob && relevantStatuses.includes(newJob.status)) ||
            (oldJob && relevantStatuses.includes(oldJob.status));

          if (isRelevant) {
            queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["driver-stats"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["available-jobs"],
    queryFn: async (): Promise<JobWithShipper[]> => {
      // Get jobs that are open for bidding (posted or bidding status)
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .in("status", ["posted", "bidding"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching available jobs:", error);
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        return [];
      }

      // Get shipper profiles
      const shipperIds = [...new Set(jobs.map((job) => job.shipper_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, rating")
        .in("id", shipperIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Map profiles to jobs
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return jobs.map((job) => ({
        ...job,
        shipper_profile: profileMap.get(job.shipper_id) || null,
      }));
    },
  });
};

export const useDriverBids = () => {
  return useQuery({
    queryKey: ["driver-bids"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return [];
      }

      const { data: bids, error } = await supabase
        .from("bids")
        .select("*")
        .eq("driver_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching driver bids:", error);
        throw error;
      }

      return bids || [];
    },
  });
};

export const useSubmitBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      amountCents,
      etaMinutes,
      note,
    }: {
      jobId: string;
      amountCents: number;
      etaMinutes?: number;
      note?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to submit a bid");
      }

      // Check if driver already bid on this job
      const { data: existingBid } = await supabase
        .from("bids")
        .select("id")
        .eq("job_id", jobId)
        .eq("driver_id", user.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existingBid) {
        throw new Error("You have already submitted a bid for this job");
      }

      const { data, error } = await supabase
        .from("bids")
        .insert({
          job_id: jobId,
          driver_id: user.user.id,
          amount_cents: amountCents,
          eta_minutes: etaMinutes || null,
          note: note || null,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update job status to bidding if it was posted
      await supabase
        .from("jobs")
        .update({ status: "bidding" })
        .eq("id", jobId)
        .eq("status", "posted");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["driver-bids"] });
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error submitting bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDriverStats = () => {
  return useQuery({
    queryKey: ["driver-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { availableJobs: 0, weeklyEarnings: 0, rating: 0, completedJobs: 0, walletBalance: 0 };
      }

      // Get available jobs count
      const { count: availableCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .in("status", ["posted", "bidding"]);

      // Get driver's completed assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, completed_at, bid_id")
        .eq("driver_id", user.user.id);

      const completedJobs = assignments?.filter((a) => a.completed_at).length || 0;

      // Get earnings from completed jobs (sum of bid amounts)
      const completedBidIds = assignments
        ?.filter((a) => a.completed_at)
        .map((a) => a.bid_id) || [];

      let weeklyEarnings = 0;
      if (completedBidIds.length > 0) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: bids } = await supabase
          .from("bids")
          .select("amount_cents")
          .in("id", completedBidIds);

        weeklyEarnings = bids?.reduce((sum, b) => sum + b.amount_cents, 0) || 0;
      }

      // Get profile for rating and wallet
      const { data: profile } = await supabase
        .from("profiles")
        .select("rating, wallet_balance_cents")
        .eq("id", user.user.id)
        .maybeSingle();

      return {
        availableJobs: availableCount || 0,
        weeklyEarnings,
        rating: profile?.rating || 5.0,
        completedJobs,
        walletBalance: profile?.wallet_balance_cents || 0,
      };
    },
  });
};

export const useActiveAssignment = () => {
  return useQuery({
    queryKey: ["active-assignment"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return null;
      }

      const { data: assignment, error } = await supabase
        .from("assignments")
        .select("*, job:jobs(*)")
        .eq("driver_id", user.user.id)
        .is("completed_at", null)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active assignment:", error);
        throw error;
      }

      return assignment;
    },
  });
};
