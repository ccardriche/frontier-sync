import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type HubListing = Tables<"hub_listings">;
export type HubListingInsert = TablesInsert<"hub_listings">;
export type HubListingUpdate = TablesUpdate<"hub_listings">;
export type HubCheckin = Tables<"hub_checkins">;

export interface HubWithStats extends HubListing {
  checkins_today: number;
  monthly_earnings: number;
  current_occupancy: number;
}

export const useLandownerHubs = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to realtime changes on hub_checkins
    const channel = supabase
      .channel("hub-checkins-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hub_checkins",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["landowner-hubs"] });
          queryClient.invalidateQueries({ queryKey: ["hub-activity"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["landowner-hubs"],
    queryFn: async (): Promise<HubWithStats[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return [];
      }

      // Fetch hubs for the current landowner
      const { data: hubs, error } = await supabase
        .from("hub_listings")
        .select("*")
        .eq("owner_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching hubs:", error);
        throw error;
      }

      if (!hubs || hubs.length === 0) {
        return [];
      }

      // Fetch check-in stats for each hub
      const hubIds = hubs.map((hub) => hub.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get today's check-ins
      const { data: todayCheckins } = await supabase
        .from("hub_checkins")
        .select("hub_id, fee_charged_cents")
        .in("hub_id", hubIds)
        .gte("created_at", today.toISOString());

      // Get this month's check-ins for earnings
      const { data: monthCheckins } = await supabase
        .from("hub_checkins")
        .select("hub_id, fee_charged_cents")
        .in("hub_id", hubIds)
        .gte("created_at", startOfMonth.toISOString());

      // Calculate stats per hub
      const hubStats: Record<string, { checkins_today: number; monthly_earnings: number; current_occupancy: number }> = {};
      
      hubIds.forEach((id) => {
        hubStats[id] = { checkins_today: 0, monthly_earnings: 0, current_occupancy: 0 };
      });

      todayCheckins?.forEach((checkin) => {
        if (hubStats[checkin.hub_id]) {
          hubStats[checkin.hub_id].checkins_today += 1;
        }
      });

      monthCheckins?.forEach((checkin) => {
        if (hubStats[checkin.hub_id]) {
          hubStats[checkin.hub_id].monthly_earnings += checkin.fee_charged_cents || 0;
        }
      });

      return hubs.map((hub) => ({
        ...hub,
        checkins_today: hubStats[hub.id]?.checkins_today || 0,
        monthly_earnings: hubStats[hub.id]?.monthly_earnings || 0,
        current_occupancy: hubStats[hub.id]?.current_occupancy || 0,
      }));
    },
  });
};

export const useCreateHub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hubData: Omit<HubListingInsert, "owner_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("You must be logged in to create a hub");
      }

      const { data, error } = await supabase
        .from("hub_listings")
        .insert({
          ...hubData,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landowner-hubs"] });
      toast({
        title: "Hub Submitted",
        description: "Your hub has been submitted for review.",
      });
    },
    onError: (error) => {
      console.error("Error creating hub:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create hub. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateHub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hubId, updates }: { hubId: string; updates: HubListingUpdate }) => {
      const { data, error } = await supabase
        .from("hub_listings")
        .update(updates)
        .eq("id", hubId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landowner-hubs"] });
      toast({
        title: "Hub Updated",
        description: "Your hub has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating hub:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update hub. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteHub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hubId: string) => {
      const { error } = await supabase
        .from("hub_listings")
        .delete()
        .eq("id", hubId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landowner-hubs"] });
      toast({
        title: "Hub Deleted",
        description: "Your hub has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting hub:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete hub. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useHubActivity = (hubId?: string) => {
  return useQuery({
    queryKey: ["hub-activity", hubId],
    queryFn: async (): Promise<HubCheckin[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return [];
      }

      let query = supabase
        .from("hub_checkins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (hubId) {
        query = query.eq("hub_id", hubId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching hub activity:", error);
        throw error;
      }

      return data || [];
    },
    enabled: true,
  });
};

export const useLandownerStats = () => {
  return useQuery({
    queryKey: ["landowner-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { activeHubs: 0, monthlyEarnings: 0, totalCheckins: 0, growthPercent: 0 };
      }

      // Get active hubs count
      const { data: hubs } = await supabase
        .from("hub_listings")
        .select("id, is_active")
        .eq("owner_id", user.user.id);

      const activeHubs = hubs?.filter((h) => h.is_active).length || 0;
      const hubIds = hubs?.map((h) => h.id) || [];

      if (hubIds.length === 0) {
        return { activeHubs: 0, monthlyEarnings: 0, totalCheckins: 0, growthPercent: 0 };
      }

      // Get this month's earnings
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthCheckins } = await supabase
        .from("hub_checkins")
        .select("fee_charged_cents")
        .in("hub_id", hubIds)
        .gte("created_at", startOfMonth.toISOString());

      const monthlyEarnings = monthCheckins?.reduce((sum, c) => sum + (c.fee_charged_cents || 0), 0) || 0;
      const totalCheckins = monthCheckins?.length || 0;

      // Calculate growth (compare with last month)
      const lastMonthStart = new Date(startOfMonth);
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      
      const { data: lastMonthCheckins } = await supabase
        .from("hub_checkins")
        .select("fee_charged_cents")
        .in("hub_id", hubIds)
        .gte("created_at", lastMonthStart.toISOString())
        .lt("created_at", startOfMonth.toISOString());

      const lastMonthEarnings = lastMonthCheckins?.reduce((sum, c) => sum + (c.fee_charged_cents || 0), 0) || 0;
      const growthPercent = lastMonthEarnings > 0 
        ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
        : 0;

      return { activeHubs, monthlyEarnings, totalCheckins, growthPercent };
    },
  });
};
