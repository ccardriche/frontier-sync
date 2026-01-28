import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardCheck, AlertTriangle, Truck, Shield, UserCheck } from "lucide-react";

interface AdminStatsGridProps {
  stats: {
    pendingApprovals: number;
    pendingShippers: number;
    pendingDrivers: number;
    pendingLandowners: number;
    openTickets: number;
    activeJobs: number;
    totalUsers: number;
  } | undefined;
  isLoading: boolean;
}

export function AdminStatsGrid({ stats, isLoading }: AdminStatsGridProps) {
  const cards = [
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: UserCheck,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Open Tickets",
      value: stats?.openTickets ?? 0,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Active Jobs",
      value: stats?.activeJobs ?? 0,
      icon: Truck,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {isLoading ? "..." : card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
