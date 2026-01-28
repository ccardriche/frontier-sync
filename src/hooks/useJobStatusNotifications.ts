import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type JobStatus = Tables<"jobs">["status"];

const statusLabels: Record<JobStatus, string> = {
  posted: "Posted",
  bidding: "Receiving Bids",
  assigned: "Assigned to Driver",
  enroute_pickup: "Driver En Route to Pickup",
  picked_up: "Cargo Picked Up",
  in_transit: "In Transit",
  arrived: "Arrived at Destination",
  delivered: "Delivered",
  closed: "Closed",
  cancelled: "Cancelled",
};

const getDriverNotification = (
  oldStatus: JobStatus | null,
  newStatus: JobStatus,
  jobTitle: string
): { title: string; description: string } | null => {
  // Driver gets notified when they're assigned to a job
  if (oldStatus === "bidding" && newStatus === "assigned") {
    return {
      title: "🎉 Bid Accepted!",
      description: `Your bid on "${jobTitle}" was accepted. Start the pickup when ready.`,
    };
  }
  return null;
};

const getShipperNotification = (
  oldStatus: JobStatus | null,
  newStatus: JobStatus,
  jobTitle: string
): { title: string; description: string } | null => {
  switch (newStatus) {
    case "bidding":
      if (oldStatus === "posted") {
        return {
          title: "📬 New Bid Received",
          description: `A driver has submitted a bid on "${jobTitle}".`,
        };
      }
      break;
    case "enroute_pickup":
      return {
        title: "🚗 Driver En Route",
        description: `Driver is heading to pickup location for "${jobTitle}".`,
      };
    case "picked_up":
      return {
        title: "📦 Cargo Picked Up",
        description: `Your cargo for "${jobTitle}" has been picked up.`,
      };
    case "in_transit":
      return {
        title: "🚚 In Transit",
        description: `Your shipment "${jobTitle}" is now in transit.`,
      };
    case "arrived":
      return {
        title: "📍 Driver Arrived",
        description: `Driver has arrived at the destination for "${jobTitle}".`,
      };
    case "delivered":
      return {
        title: "✅ Delivery Complete",
        description: `"${jobTitle}" has been delivered successfully!`,
      };
    case "cancelled":
      return {
        title: "❌ Job Cancelled",
        description: `"${jobTitle}" has been cancelled.`,
      };
  }
  return null;
};

export const useDriverJobNotifications = () => {
  const queryClient = useQueryClient();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      userIdRef.current = user.user.id;

      const channel = supabase
        .channel("driver-job-notifications")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
          },
          async (payload) => {
            const oldJob = payload.old as Tables<"jobs">;
            const newJob = payload.new as Tables<"jobs">;

            // Skip if status didn't change
            if (oldJob.status === newJob.status) return;

            // Check if this driver has an assignment for this job
            const { data: assignment } = await supabase
              .from("assignments")
              .select("id")
              .eq("job_id", newJob.id)
              .eq("driver_id", userIdRef.current!)
              .maybeSingle();

            if (assignment) {
              const notification = getDriverNotification(
                oldJob.status,
                newJob.status,
                newJob.title
              );

              if (notification) {
                toast({
                  title: notification.title,
                  description: notification.description,
                });
              }

              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ["active-assignment"] });
              queryClient.invalidateQueries({ queryKey: ["driver-stats"] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [queryClient]);
};

export const useShipperJobNotifications = () => {
  const queryClient = useQueryClient();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const setupSubscription = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      userIdRef.current = user.user.id;

      const channel = supabase
        .channel("shipper-job-notifications")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
          },
          (payload) => {
            const oldJob = payload.old as Tables<"jobs">;
            const newJob = payload.new as Tables<"jobs">;

            // Only notify for jobs owned by this shipper
            if (newJob.shipper_id !== userIdRef.current) return;

            // Skip if status didn't change
            if (oldJob.status === newJob.status) return;

            const notification = getShipperNotification(
              oldJob.status,
              newJob.status,
              newJob.title
            );

            if (notification) {
              toast({
                title: notification.title,
                description: notification.description,
              });
            }

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
            queryClient.invalidateQueries({ queryKey: ["shipper-stats"] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [queryClient]);
};
