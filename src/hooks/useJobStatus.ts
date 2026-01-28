import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

type JobStatus = Database["public"]["Enums"]["job_status"];

interface StatusUpdateConfig {
  nextStatus: JobStatus;
  successTitle: string;
  successDescription: string;
}

const statusTransitions: Record<string, StatusUpdateConfig> = {
  assigned: {
    nextStatus: "enroute_pickup",
    successTitle: "En Route",
    successDescription: "You're now en route to pickup location.",
  },
  enroute_pickup: {
    nextStatus: "picked_up",
    successTitle: "Cargo Picked Up",
    successDescription: "Cargo has been picked up. Head to the drop-off location.",
  },
  picked_up: {
    nextStatus: "in_transit",
    successTitle: "In Transit",
    successDescription: "You're now in transit to the destination.",
  },
  in_transit: {
    nextStatus: "arrived",
    successTitle: "Arrived",
    successDescription: "You've arrived at the destination.",
  },
  arrived: {
    nextStatus: "delivered",
    successTitle: "Delivered",
    successDescription: "Delivery completed successfully!",
  },
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      assignmentId,
      currentStatus,
    }: {
      jobId: string;
      assignmentId: string;
      currentStatus: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to update job status");
      }

      const config = statusTransitions[currentStatus];
      if (!config) {
        throw new Error("Cannot advance from current status");
      }

      // Update job status
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: config.nextStatus })
        .eq("id", jobId);

      if (jobError) {
        throw jobError;
      }

      // If completing delivery, update assignment completed_at
      if (config.nextStatus === "delivered") {
        const { error: assignmentError } = await supabase
          .from("assignments")
          .update({ completed_at: new Date().toISOString() })
          .eq("id", assignmentId);

        if (assignmentError) {
          console.error("Error updating assignment:", assignmentError);
        }
      }

      // If starting (assigned -> enroute_pickup), update started_at
      if (currentStatus === "assigned") {
        const { error: startError } = await supabase
          .from("assignments")
          .update({ started_at: new Date().toISOString() })
          .eq("id", assignmentId);

        if (startError) {
          console.error("Error updating assignment start:", startError);
        }
      }

      return config;
    },
    onSuccess: (config) => {
      queryClient.invalidateQueries({ queryKey: ["active-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["driver-stats"] });
      queryClient.invalidateQueries({ queryKey: ["available-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
      toast({
        title: config.successTitle,
        description: config.successDescription,
      });
    },
    onError: (error) => {
      console.error("Error updating job status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const getNextStatusAction = (currentStatus: string) => {
  const actions: Record<string, { label: string; icon: string }> = {
    assigned: { label: "Start Pickup", icon: "play" },
    enroute_pickup: { label: "Confirm Pickup", icon: "package" },
    picked_up: { label: "Start Delivery", icon: "truck" },
    in_transit: { label: "Arrived", icon: "map-pin" },
    arrived: { label: "Complete Delivery", icon: "check" },
  };
  return actions[currentStatus] || null;
};
