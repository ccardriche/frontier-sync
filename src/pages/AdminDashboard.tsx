import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Pioneer Nexus Control Center</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <AdminStatsGrid stats={stats} isLoading={statsLoading} />

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList className="w-full max-w-lg">
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
