import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LaneWatch {
  id: string;
  owner_id: string;
  name: string;
  sources: string[];
  origin_label: string | null;
  origin_radius_km: number | null;
  dest_label: string | null;
  dest_radius_km: number | null;
  equipment: string | null;
  min_rate_cents: number | null;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_imported: number | null;
  total_imported: number;
  created_at: string;
  updated_at: string;
}

export type LaneWatchInput = Omit<
  LaneWatch,
  "id" | "owner_id" | "created_at" | "updated_at" | "last_run_at" | "last_run_status" | "last_run_imported" | "total_imported"
>;

export const useLaneWatches = () => {
  return useQuery({
    queryKey: ["lane-watches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lane_watches" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LaneWatch[];
    },
  });
};

export const useCreateLaneWatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LaneWatchInput) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("lane_watches" as never)
        .insert({ ...input, owner_id: u.user.id } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lane-watches"] });
      toast({ title: "Lane watch created", description: "Auto-import will begin on the next sync." });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateLaneWatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LaneWatchInput> }) => {
      const { error } = await supabase.from("lane_watches" as never).update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lane-watches"] }),
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteLaneWatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lane_watches" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lane-watches"] });
      toast({ title: "Lane watch deleted" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
};

export const useRunLaneWatchNow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (watchId: string) => {
      const { data, error } = await supabase.functions.invoke("sync-loads", {
        body: { watch_id: watchId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { totalImported?: number }) => {
      qc.invalidateQueries({ queryKey: ["lane-watches"] });
      qc.invalidateQueries({ queryKey: ["shipper-jobs"] });
      toast({
        title: "Sync complete",
        description: `${data?.totalImported ?? 0} loads imported.`,
      });
    },
    onError: (e: Error) => toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
  });
};
