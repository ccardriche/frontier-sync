import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import {
  DEMO_MODE,
  mockAdminStats,
  mockPendingShippers,
  mockPendingDrivers,
  mockPendingLandowners,
  mockSupportTickets,
  mockAdminJobs,
  mockAllUsers,
} from "@/lib/seedData";

type VerificationStatus = Database["public"]["Enums"]["verification_status"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type JobStatus = Database["public"]["Enums"]["job_status"];

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return mockAdminStats;
      }

      const [
        { count: pendingShippers },
        { count: pendingDrivers },
        { count: pendingLandowners },
        { count: openTickets },
        { count: activeJobs },
        { count: totalUsers },
      ] = await Promise.all([
        supabase.from("shipper_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("driver_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("landowner_profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("jobs").select("*", { count: "exact", head: true }).in("status", ["posted", "bidding", "assigned", "in_transit"]),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      return {
        pendingApprovals: (pendingShippers || 0) + (pendingDrivers || 0) + (pendingLandowners || 0),
        pendingShippers: pendingShippers || 0,
        pendingDrivers: pendingDrivers || 0,
        pendingLandowners: pendingLandowners || 0,
        openTickets: openTickets || 0,
        activeJobs: activeJobs || 0,
        totalUsers: totalUsers || 0,
      };
    },
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return {
          shippers: mockPendingShippers,
          drivers: mockPendingDrivers,
          landowners: mockPendingLandowners,
        };
      }

      const [shippersRes, driversRes, landownersRes] = await Promise.all([
        supabase.from("shipper_profiles").select("*").eq("verification_status", "pending"),
        supabase.from("driver_profiles").select("*").eq("verification_status", "pending"),
        supabase.from("landowner_profiles").select("*").eq("verification_status", "pending"),
      ]);

      return {
        shippers: shippersRes.data || [],
        drivers: driversRes.data || [],
        landowners: landownersRes.data || [],
      };
    },
  });
}

export function useUpdateVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      table,
      id,
      status,
    }: {
      table: "shipper_profiles" | "driver_profiles" | "landowner_profiles";
      id: string;
      status: VerificationStatus;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from(table)
        .update({
          verification_status: status,
          verified_at: status === "approved" ? new Date().toISOString() : null,
          verified_by: status === "approved" ? user?.id : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Verification updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update verification", description: error.message, variant: "destructive" });
    },
  });
}

export function useAllJobs() {
  return useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return mockAdminJobs;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*, bids(count)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Job status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update job", description: error.message, variant: "destructive" });
    },
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return mockSupportTickets;
      }

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      resolutionNote,
    }: {
      ticketId: string;
      status: TicketStatus;
      resolutionNote?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status,
          resolution_note: resolutionNote,
          resolved_by: status === "resolved" || status === "closed" ? user?.id : null,
        })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update ticket", description: error.message, variant: "destructive" });
    },
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      if (DEMO_MODE) {
        return mockAllUsers;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      return profiles.map((profile) => ({
        ...profile,
        roles: roles.filter((r) => r.user_id === profile.id).map((r) => r.role),
      }));
    },
  });
}

export function useCheckAdminRole() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      // In demo mode, always allow admin access
      if (DEMO_MODE) {
        return true;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
  });
}
