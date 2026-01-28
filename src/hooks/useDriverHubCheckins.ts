import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { mockHubs, mockCheckins, DEMO_MODE } from "@/lib/seedData";

export type HubCheckin = Tables<"hub_checkins">;
export type HubListing = Tables<"hub_listings">;

export interface HubWithDistance extends HubListing {
  distance_km?: number;
}

export interface ActiveCheckin extends HubCheckin {
  hub: HubListing;
  duration_minutes: number;
}

export const useNearbyHubs = (userLat?: number, userLng?: number) => {
  return useQuery({
    queryKey: ["nearby-hubs", userLat, userLng],
    queryFn: async (): Promise<HubWithDistance[]> => {
      // Return demo data if demo mode
      if (DEMO_MODE) {
        const demoHubs = mockHubs.map((hub) => ({
          ...hub,
          geojson: null,
          verification_docs: null,
          distance_km: userLat && userLng && hub.lat && hub.lng
            ? calculateDistance(userLat, userLng, hub.lat, hub.lng)
            : Math.random() * 10 + 1,
        })) as HubWithDistance[];
        return demoHubs.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      }

      const { data: hubs, error } = await supabase
        .from("hub_listings")
        .select("*")
        .eq("is_active", true)
        .eq("verification_status", "approved");

      if (error) {
        console.error("Error fetching hubs:", error);
        throw error;
      }

      if (!hubs) return [];

      // Calculate distance if user location is provided
      if (userLat && userLng) {
        return hubs
          .map((hub) => {
            if (hub.lat && hub.lng) {
              const distance = calculateDistance(userLat, userLng, hub.lat, hub.lng);
              return { ...hub, distance_km: distance };
            }
            return { ...hub, distance_km: undefined };
          })
          .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
      }

      return hubs;
    },
    enabled: true,
  });
};

export const useActiveCheckin = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("driver-checkins")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hub_checkins",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["active-checkin"] });
          queryClient.invalidateQueries({ queryKey: ["driver-checkin-history"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["active-checkin"],
    queryFn: async (): Promise<ActiveCheckin | null> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Find the most recent check-in without a corresponding check-out
      const { data: checkins, error } = await supabase
        .from("hub_checkins")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching active checkin:", error);
        throw error;
      }

      if (!checkins || checkins.length === 0) return null;

      // Group by hub_id to find active sessions
      const hubSessions: Record<string, { checkin?: HubCheckin; checkout?: HubCheckin }> = {};
      
      for (const event of checkins) {
        if (!hubSessions[event.hub_id]) {
          hubSessions[event.hub_id] = {};
        }
        if (event.event_type === "checkin" && !hubSessions[event.hub_id].checkin) {
          hubSessions[event.hub_id].checkin = event;
        } else if (event.event_type === "checkout" && !hubSessions[event.hub_id].checkout) {
          hubSessions[event.hub_id].checkout = event;
        }
      }

      // Find an active session (checkin without checkout, or checkin after checkout)
      for (const hubId of Object.keys(hubSessions)) {
        const session = hubSessions[hubId];
        if (session.checkin && !session.checkout) {
          // Active session found
          const { data: hub } = await supabase
            .from("hub_listings")
            .select("*")
            .eq("id", hubId)
            .single();

          if (hub) {
            const checkinTime = new Date(session.checkin.created_at);
            const now = new Date();
            const durationMinutes = Math.floor((now.getTime() - checkinTime.getTime()) / (1000 * 60));

            return {
              ...session.checkin,
              hub,
              duration_minutes: durationMinutes,
            };
          }
        } else if (session.checkin && session.checkout) {
          const checkinTime = new Date(session.checkin.created_at);
          const checkoutTime = new Date(session.checkout.created_at);
          if (checkinTime > checkoutTime) {
            // Checkin is after checkout, so still active
            const { data: hub } = await supabase
              .from("hub_listings")
              .select("*")
              .eq("id", hubId)
              .single();

            if (hub) {
              const now = new Date();
              const durationMinutes = Math.floor((now.getTime() - checkinTime.getTime()) / (1000 * 60));

              return {
                ...session.checkin,
                hub,
                duration_minutes: durationMinutes,
              };
            }
          }
        }
      }

      return null;
    },
  });
};

export const useDriverCheckinHistory = () => {
  return useQuery({
    queryKey: ["driver-checkin-history"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      
      // Return demo data if no user or demo mode
      if (!user.user || DEMO_MODE) {
        return mockCheckins.map((c) => ({
          ...c,
          job_id: null,
          hub: mockHubs.find((h) => h.id === c.hub_id),
        }));
      }

      const { data: checkins, error } = await supabase
        .from("hub_checkins")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching checkin history:", error);
        throw error;
      }

      if (!checkins || checkins.length === 0) return [];

      // Fetch hub details for all checkins
      const hubIds = [...new Set(checkins.map((c) => c.hub_id))];
      const { data: hubs } = await supabase
        .from("hub_listings")
        .select("*")
        .in("id", hubIds);

      const hubMap = new Map(hubs?.map((h) => [h.id, h]) ?? []);

      return checkins.map((checkin) => ({
        ...checkin,
        hub: hubMap.get(checkin.hub_id),
      }));
    },
  });
};

export const useHubCheckin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hubId, jobId }: { hubId: string; jobId?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to check in");
      }

      // Get hub details for fee calculation
      const { data: hub } = await supabase
        .from("hub_listings")
        .select("*")
        .eq("id", hubId)
        .single();

      if (!hub) {
        throw new Error("Hub not found");
      }

      const feeCharged = hub.fee_model === "per_checkin" ? hub.fee_cents : 0;

      const { data, error } = await supabase
        .from("hub_checkins")
        .insert({
          hub_id: hubId,
          user_id: user.user.id,
          job_id: jobId,
          event_type: "checkin",
          fee_charged_cents: feeCharged,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-checkin"] });
      queryClient.invalidateQueries({ queryKey: ["driver-checkin-history"] });
      toast({
        title: "Checked In",
        description: "You've successfully checked in to this hub.",
      });
    },
    onError: (error) => {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useHubCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hubId }: { hubId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to check out");
      }

      const { data, error } = await supabase
        .from("hub_checkins")
        .insert({
          hub_id: hubId,
          user_id: user.user.id,
          event_type: "checkout",
          fee_charged_cents: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-checkin"] });
      queryClient.invalidateQueries({ queryKey: ["driver-checkin-history"] });
      toast({
        title: "Checked Out",
        description: "You've successfully checked out of this hub.",
      });
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to check out. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
