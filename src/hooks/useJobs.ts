import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type Job = Tables<"jobs">;
export type JobInsert = TablesInsert<"jobs">;

interface JobWithBidCount extends Job {
  bids_count: number;
}

export const useShipperJobs = () => {
  return useQuery({
    queryKey: ["shipper-jobs"],
    queryFn: async (): Promise<JobWithBidCount[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return [];
      }

      // Fetch jobs for the current shipper
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("shipper_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error);
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        return [];
      }

      // Fetch bid counts for each job
      const jobIds = jobs.map((job) => job.id);
      const { data: bidsData, error: bidsError } = await supabase
        .from("bids")
        .select("job_id")
        .in("job_id", jobIds)
        .eq("status", "active");

      if (bidsError) {
        console.error("Error fetching bids:", bidsError);
      }

      // Count bids per job
      const bidCounts: Record<string, number> = {};
      bidsData?.forEach((bid) => {
        bidCounts[bid.job_id] = (bidCounts[bid.job_id] || 0) + 1;
      });

      // Merge jobs with bid counts
      return jobs.map((job) => ({
        ...job,
        bids_count: bidCounts[job.id] || 0,
      }));
    },
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: Omit<JobInsert, "shipper_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to create a job");
      }

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          ...jobData,
          shipper_id: user.user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
      toast({
        title: "Job Posted",
        description: "Your freight job has been posted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useJobStats = () => {
  return useQuery({
    queryKey: ["shipper-job-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { activeJobs: 0, inTransit: 0, completed: 0, totalSpent: 0 };
      }

      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("status, budget_cents")
        .eq("shipper_id", user.user.id);

      if (error) {
        console.error("Error fetching job stats:", error);
        throw error;
      }

      const activeStatuses = ["posted", "bidding", "assigned", "enroute_pickup", "picked_up"];
      const transitStatuses = ["in_transit", "arrived"];
      const completedStatuses = ["delivered", "closed"];

      const activeJobs = jobs?.filter((j) => activeStatuses.includes(j.status)).length || 0;
      const inTransit = jobs?.filter((j) => transitStatuses.includes(j.status)).length || 0;
      const completed = jobs?.filter((j) => completedStatuses.includes(j.status)).length || 0;
      const totalSpent = jobs
        ?.filter((j) => completedStatuses.includes(j.status))
        .reduce((sum, j) => sum + (j.budget_cents || 0), 0) || 0;

      return { activeJobs, inTransit, completed, totalSpent };
    },
  });
};
