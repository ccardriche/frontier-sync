import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, DatabaseZap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { PendingApprovalsTable } from "@/components/admin/PendingApprovalsTable";
import { JobsOversightTable } from "@/components/admin/JobsOversightTable";
import { SupportTicketsTable } from "@/components/admin/SupportTicketsTable";
import { UsersTable } from "@/components/admin/UsersTable";
import {
  useAdminStats,
  usePendingApprovals,
  useUpdateVerification,
  useAllJobs,
  useUpdateJobStatus,
  useSupportTickets,
  useUpdateTicket,
  useAllUsers,
  useCheckAdminRole,
} from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data: isAdmin, isLoading: checkingAdmin } = useCheckAdminRole();

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();
  const { data: jobs, isLoading: jobsLoading } = useAllJobs();
  const { data: tickets, isLoading: ticketsLoading } = useSupportTickets();
  const { data: users, isLoading: usersLoading } = useAllUsers();

  const updateVerification = useUpdateVerification();
  const updateJobStatus = useUpdateJobStatus();
  const updateTicket = useUpdateTicket();

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, checkingAdmin, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-admin-data");
      if (error) throw error;
      toast({
        title: "Sample data seeded!",
        description: "Admin portal now has pending approvals, tickets, and enriched users.",
      });
      // Invalidate all admin queries to refresh the dashboard
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    } catch (err: any) {
      toast({
        title: "Seeding failed",
        description: err.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold font-display truncate">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">ANCHOR Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedData}
              disabled={seeding}
              className="text-xs sm:text-sm"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 mr-1 sm:mr-2 animate-spin" />
              ) : (
                <DatabaseZap className="h-4 w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{seeding ? "Seeding..." : "Seed Sample Data"}</span>
              <span className="sm:hidden">{seeding ? "..." : "Seed"}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <AdminStatsGrid stats={stats} isLoading={statsLoading} />

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList className="w-full max-w-lg overflow-x-auto">
            <TabsTrigger value="approvals" className="flex-1">
              Approvals
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1">
              Jobs
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex-1">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <PendingApprovalsTable
              data={approvals}
              isLoading={approvalsLoading}
              onUpdateVerification={(params) => updateVerification.mutate(params)}
            />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsOversightTable
              jobs={jobs}
              isLoading={jobsLoading}
              onUpdateStatus={(params) => updateJobStatus.mutate(params)}
            />
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTicketsTable
              tickets={tickets}
              isLoading={ticketsLoading}
              onUpdateTicket={(params) => updateTicket.mutate(params)}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable users={users} isLoading={usersLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
