import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ExternalLoad {
  id: string;
  external_load_id: string;
  source_name: string;
  source_type: string | null;
  title: string | null;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  equipment_type: string | null;
  weight_lbs: number | null;
  miles: number | null;
  rate_cents: number | null;
  broker_name: string | null;
  broker_phone: string | null;
  broker_email: string | null;
  external_url: string | null;
  status: string;
  last_synced_at: string;
  created_at: string;
}

export interface LoadSource {
  id: string;
  source_name: string;
  source_type: string;
  feed_url: string | null;
  auth_type: string;
  api_key: string | null;
  is_active: boolean;
  sync_frequency_minutes: number;
  field_mapping_json: Record<string, string> | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  source_id: string | null;
  sync_status: string;
  records_added: number;
  records_updated: number;
  error_message: string | null;
  synced_at: string;
}

export const useExternalLoads = () =>
  useQuery({
    queryKey: ["external-loads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_loads")
        .select("*")
        .eq("status", "active")
        .order("pickup_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExternalLoad[];
    },
  });

export const useLoadSources = () =>
  useQuery({
    queryKey: ["load-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("load_sources")
        .select("*")
        .order("source_name");
      if (error) throw error;
      return (data ?? []) as LoadSource[];
    },
  });

export const useSyncLogs = (sourceId?: string) =>
  useQuery({
    queryKey: ["sync-logs", sourceId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("sync_logs").select("*").order("synced_at", { ascending: false }).limit(50);
      if (sourceId) q = q.eq("source_id", sourceId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SyncLog[];
    },
  });

export const useUpsertSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<LoadSource> & { source_name: string; source_type: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("load_sources").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("load_sources").insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["load-sources"] });
      toast({ title: "Source saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("load_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["load-sources"] });
      toast({ title: "Source removed" });
    },
  });
};

export const useToggleSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("load_sources").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["load-sources"] }),
  });
};

export const useTestSource = () => {
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke("ingest-external-loads", {
        body: { source_id: sourceId, test: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { ok?: boolean; message?: string }) => {
      toast({
        title: data?.ok ? "Connection OK" : "Test complete",
        description: data?.message ?? "Source reachable",
      });
    },
    onError: (e: Error) => toast({ title: "Test failed", description: e.message, variant: "destructive" }),
  });
};

export const useRunSync = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourceId?: string) => {
      const { data, error } = await supabase.functions.invoke("ingest-external-loads", {
        body: sourceId ? { source_id: sourceId } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { records_added?: number; records_updated?: number }) => {
      qc.invalidateQueries({ queryKey: ["external-loads"] });
      qc.invalidateQueries({ queryKey: ["load-sources"] });
      qc.invalidateQueries({ queryKey: ["sync-logs"] });
      toast({
        title: "Sync complete",
        description: `${data?.records_added ?? 0} added, ${data?.records_updated ?? 0} updated`,
      });
    },
    onError: (e: Error) => toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
  });
};
