import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

export type HubUnit = Tables<"hub_units">;
export type HubUnitInsert = TablesInsert<"hub_units">;
export type HubUnitUpdate = TablesUpdate<"hub_units">;
export type UnitInspection = Tables<"unit_inspections">;
export type UnitInspectionInsert = TablesInsert<"unit_inspections">;

export const useHubUnits = (hubId?: string) => {
  return useQuery({
    queryKey: ["hub-units", hubId],
    queryFn: async (): Promise<HubUnit[]> => {
      let query = supabase.from("hub_units").select("*").order("in_gate_date", { ascending: false });
      if (hubId) query = query.eq("hub_id", hubId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateHubUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unit: HubUnitInsert) => {
      const { data, error } = await supabase.from("hub_units").insert(unit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub-units"] });
      toast({ title: "Unit added", description: "Unit has been added to inventory." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useUpdateHubUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: HubUnitUpdate }) => {
      const { data, error } = await supabase.from("hub_units").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub-units"] });
      toast({ title: "Unit updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};

export const useDeleteHubUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hub_units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hub-units"] });
      toast({ title: "Unit removed" });
    },
  });
};

export const useUnitInspection = (unitId?: string) => {
  return useQuery({
    queryKey: ["unit-inspection", unitId],
    queryFn: async (): Promise<UnitInspection | null> => {
      if (!unitId) return null;
      const { data, error } = await supabase
        .from("unit_inspections")
        .select("*")
        .eq("unit_id", unitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!unitId,
  });
};

export const useSaveInspection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inspection: Omit<UnitInspectionInsert, "inspector_id">) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Must be logged in");
      const payload = { ...inspection, inspector_id: user.user.id };
      const { data, error } = await supabase.from("unit_inspections").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["unit-inspection", vars.unit_id] });
      toast({ title: "Inspection saved", description: "Unit inspection has been recorded." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
};
