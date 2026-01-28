import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface RecurringJobTemplate {
  id: string;
  shipper_id: string;
  title: string;
  cargo_type: string | null;
  cargo_details: Json | null;
  pickup_label: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  drop_label: string | null;
  drop_lat: number | null;
  drop_lng: number | null;
  weight_kg: number | null;
  budget_cents: number | null;
  urgency: boolean | null;
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
  days_of_week: number[];
  preferred_time: string | null;
  is_active: boolean | null;
  next_run_date: string | null;
  last_run_date: string | null;
  total_jobs_created: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringTemplateInput {
  title: string;
  cargo_type?: string;
  cargo_details?: Json;
  pickup_label?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  drop_label?: string;
  drop_lat?: number;
  drop_lng?: number;
  weight_kg?: number;
  budget_cents?: number;
  urgency?: boolean;
  cadence: "daily" | "weekly" | "biweekly" | "monthly";
  days_of_week?: number[];
  preferred_time?: string;
}

// Calculate next run date based on cadence
const calculateNextRunDate = (
  cadence: string,
  daysOfWeek: number[] = [],
  fromDate: Date = new Date()
): string => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1); // Start from tomorrow

  switch (cadence) {
    case "daily":
      return date.toISOString().split("T")[0];
    case "weekly":
      // Find next occurrence of specified days
      if (daysOfWeek.length > 0) {
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + i);
          if (daysOfWeek.includes(checkDate.getDay())) {
            return checkDate.toISOString().split("T")[0];
          }
        }
      }
      date.setDate(date.getDate() + 7);
      return date.toISOString().split("T")[0];
    case "biweekly":
      date.setDate(date.getDate() + 14);
      return date.toISOString().split("T")[0];
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split("T")[0];
    default:
      return date.toISOString().split("T")[0];
  }
};

export const useRecurringTemplates = () => {
  return useQuery({
    queryKey: ["recurring-templates"],
    queryFn: async (): Promise<RecurringJobTemplate[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Direct query since types haven't regenerated yet
      const { data, error } = await (supabase as any)
        .from("recurring_job_templates")
        .select("*")
        .eq("shipper_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as RecurringJobTemplate[];
    },
  });
};

export const useCreateRecurringTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecurringTemplateInput) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const nextRunDate = calculateNextRunDate(input.cadence, input.days_of_week);

      // Direct query since types haven't regenerated yet
      const { data, error } = await (supabase as any)
        .from("recurring_job_templates")
        .insert({
          shipper_id: user.user.id,
          title: input.title,
          cargo_type: input.cargo_type,
          cargo_details: input.cargo_details,
          pickup_label: input.pickup_label,
          pickup_lat: input.pickup_lat,
          pickup_lng: input.pickup_lng,
          drop_label: input.drop_label,
          drop_lat: input.drop_lat,
          drop_lng: input.drop_lng,
          weight_kg: input.weight_kg,
          budget_cents: input.budget_cents,
          urgency: input.urgency || false,
          cadence: input.cadence,
          days_of_week: input.days_of_week || [],
          preferred_time: input.preferred_time,
          next_run_date: nextRunDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
      toast({
        title: "Route Template Created",
        description: "Your recurring route has been set up successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create recurring route. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useToggleTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("recurring_job_templates")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
      toast({
        title: "Template Updated",
        description: "Route status has been updated.",
      });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("recurring_job_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
      toast({
        title: "Template Deleted",
        description: "Recurring route has been removed.",
      });
    },
  });
};

export const useGenerateJobFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: RecurringJobTemplate) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Create the job - cast cargo_type to handle enum
      const jobInsert: any = {
        shipper_id: user.user.id,
        title: template.title,
        cargo_type: template.cargo_type,
        cargo_details: template.cargo_details,
        pickup_label: template.pickup_label,
        pickup_lat: template.pickup_lat,
        pickup_lng: template.pickup_lng,
        drop_label: template.drop_label,
        drop_lat: template.drop_lat,
        drop_lng: template.drop_lng,
        weight_kg: template.weight_kg,
        budget_cents: template.budget_cents,
        urgency: template.urgency,
        status: "posted",
      };

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert(jobInsert)
        .select()
        .single();

      if (jobError) throw jobError;

      // Update the template with new next_run_date
      const nextRunDate = calculateNextRunDate(
        template.cadence,
        template.days_of_week,
        new Date()
      );

      const { error: updateError } = await (supabase as any)
        .from("recurring_job_templates")
        .update({
          last_run_date: new Date().toISOString().split("T")[0],
          next_run_date: nextRunDate,
          total_jobs_created: (template.total_jobs_created || 0) + 1,
        })
        .eq("id", template.id);

      if (updateError) throw updateError;

      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
      queryClient.invalidateQueries({ queryKey: ["shipper-jobs"] });
      toast({
        title: "Job Created",
        description: "A new job has been created from this route template.",
      });
    },
    onError: (error) => {
      console.error("Error generating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job from template.",
        variant: "destructive",
      });
    },
  });
};
