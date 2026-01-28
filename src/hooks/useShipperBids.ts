import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { mockBids, DEMO_MODE } from "@/lib/seedData";

interface BidWithDriver extends Tables<"bids"> {
  driver_profile: {
    full_name: string | null;
    rating: number | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export const useJobBids = (jobId: string | null) => {
  return useQuery({
    queryKey: ["job-bids", jobId],
    queryFn: async (): Promise<BidWithDriver[]> => {
      if (!jobId) return [];

      // Return demo data if demo mode
      if (DEMO_MODE) {
        const demoBids = mockBids
          .filter((b) => b.job_id === jobId)
          .map((b) => ({
            id: b.id,
            job_id: b.job_id,
            driver_id: b.driver_id,
            amount_cents: b.amount_cents,
            eta_minutes: b.eta_minutes,
            status: b.status,
            note: b.note,
            created_at: b.created_at,
            driver_profile: {
              full_name: b.driver_name,
              rating: b.driver_rating,
              avatar_url: null,
              phone: b.driver_phone,
            },
          }));
        return demoBids as BidWithDriver[];
      }

      // Fetch active bids for the job
      const { data: bids, error } = await supabase
        .from("bids")
        .select("*")
        .eq("job_id", jobId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
        throw error;
      }

      if (!bids || bids.length === 0) {
        return [];
      }

      // Get driver profiles
      const driverIds = [...new Set(bids.map((bid) => bid.driver_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, rating, avatar_url, phone")
        .in("id", driverIds);

      if (profilesError) {
        console.error("Error fetching driver profiles:", profilesError);
      }

      // Map profiles to bids
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return bids.map((bid) => ({
        ...bid,
        driver_profile: profileMap.get(bid.driver_id) || null,
      }));
    },
    enabled: !!jobId,
  });
};

export const useAcceptBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bidId, jobId }: { bidId: string; jobId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to accept a bid");
      }

      // Get the bid details
      const { data: bid, error: bidError } = await supabase
        .from("bids")
        .select("*")
        .eq("id", bidId)
        .single();

      if (bidError || !bid) {
        throw new Error("Bid not found");
      }

      // 1. Update the accepted bid status
      const { error: acceptError } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (acceptError) {
        throw acceptError;
      }

      // 2. Reject other active bids on the same job
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("job_id", jobId)
        .eq("status", "active")
        .neq("id", bidId);

      if (rejectError) {
        console.error("Error rejecting other bids:", rejectError);
        // Non-critical, continue
      }

      // 3. Create an assignment
      const { error: assignError } = await supabase
        .from("assignments")
        .insert({
          job_id: jobId,
          bid_id: bidId,
          driver_id: bid.driver_id,
        });

      if (assignError) {
        throw assignError;
      }

      // 4. Update job status to assigned
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "assigned" })
        .eq("id", jobId);

      if (jobError) {
        throw jobError;
      }

      return bid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["shipper-job-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job-bids"] });
      queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
      toast({
        title: "Bid Accepted",
        description: "The driver has been assigned to this job.",
      });
    },
    onError: (error) => {
      console.error("Error accepting bid:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept bid. Please try again.",
        variant: "destructive",
      });
    },
  });
};
