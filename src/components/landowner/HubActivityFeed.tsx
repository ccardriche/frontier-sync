import { formatDistanceToNow } from "date-fns";
import { CheckCircle, ArrowRight, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHubActivity } from "@/hooks/useHubs";

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

interface HubActivityFeedProps {
  hubId?: string;
}

const HubActivityFeed = ({ hubId }: HubActivityFeedProps) => {
  const { data: activity, isLoading } = useHubActivity(hubId);

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((checkin) => {
            const isCheckin = checkin.event_type === "check_in";
            const timeAgo = formatDistanceToNow(new Date(checkin.created_at), { addSuffix: true });
            
            return (
              <div 
                key={checkin.id} 
                className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCheckin ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                }`}>
                  {isCheckin ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">
                      {checkin.event_type.replace("_", " ")}
                    </span>
                    {checkin.fee_charged_cents ? (
                      <span className="text-success font-semibold text-sm flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(checkin.fee_charged_cents)}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default HubActivityFeed;
