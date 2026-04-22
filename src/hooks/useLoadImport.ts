import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { calculateDistance } from "@/lib/eta";

export interface ImportedLoad {
  external_ref?: string | null;
  pickup_label: string;
  drop_label: string;
  pickup_date?: string | null;
  dropoff_date?: string | null;
  weight_lbs?: number | null;
  rate_usd?: number | null;
  equipment?: string | null;
  contact?: string | null;
}

export type ImportSource = "trulos" | "ffs" | "text" | "csv";

interface SearchParams {
  source: ImportSource;
  params: Record<string, unknown>;
}

async function geocode(label: string): Promise<{ lat: number; lng: number } | null> {
  if (!label || label.length < 3) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(label)}`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export const useLoadImportSearch = () => {
  const [loads, setLoads] = useState<ImportedLoad[]>([]);

  const mutation = useMutation({
    mutationFn: async ({ source, params }: SearchParams) => {
      const { data, error } = await supabase.functions.invoke("import-loads", {
        body: { source, params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.loads ?? []) as ImportedLoad[];
    },
    onSuccess: (data) => {
      setLoads(data);
      if (data.length === 0) {
        toast({
          title: "No loads found",
          description: "Try a different search or paste raw text instead.",
        });
      } else {
        toast({ title: `Found ${data.length} loads`, description: "Review and import below." });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  return { loads, setLoads, search: mutation.mutate, isSearching: mutation.isPending };
};

export const useImportSelectedLoads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loads, source }: { loads: ImportedLoad[]; source: ImportSource }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not signed in");

      let created = 0;
      const failures: string[] = [];

      for (const load of loads) {
        const [pickup, drop] = await Promise.all([
          geocode(load.pickup_label),
          geocode(load.drop_label),
        ]);

        const distance =
          pickup && drop ? calculateDistance(pickup.lat, pickup.lng, drop.lat, drop.lng) : null;

        const rateCents = load.rate_usd ? Math.round(load.rate_usd * 100) : null;
        const weightKg = load.weight_lbs ? Math.round(load.weight_lbs * 0.453592) : null;

        const { error } = await supabase.from("jobs").insert({
          shipper_id: user.user.id,
          title: `${load.pickup_label} → ${load.drop_label}`,
          pickup_label: load.pickup_label,
          pickup_lat: pickup?.lat ?? null,
          pickup_lng: pickup?.lng ?? null,
          drop_label: load.drop_label,
          drop_lat: drop?.lat ?? null,
          drop_lng: drop?.lng ?? null,
          weight_kg: weightKg,
          budget_cents: rateCents,
          pricing_type: "bid",
          min_budget_cents: rateCents ? Math.round(rateCents * 0.8) : null,
          max_budget_cents: rateCents,
          distance_km: distance,
          scheduled_pickup: load.pickup_date ?? null,
          scheduled_dropoff: load.dropoff_date ?? null,
          status: "posted",
          source,
          external_ref: load.external_ref ?? null,
          imported_at: new Date().toISOString(),
        });

        if (error) {
          console.error("insert failed", error);
          failures.push(`${load.pickup_label} → ${load.drop_label}`);
        } else {
          created++;
        }

        // Be polite to Nominatim
        await new Promise((r) => setTimeout(r, 1100));
      }

      return { created, failures };
    },
    onSuccess: ({ created, failures }) => {
      queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["shipper-job-stats"] });
      toast({
        title: `Imported ${created} ${created === 1 ? "load" : "loads"}`,
        description:
          failures.length > 0 ? `${failures.length} failed to import.` : "Jobs are now live.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });
};
