import { motion } from "framer-motion";
import { MapPin, Clock, LogOut, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveCheckin, useHubCheckout } from "@/hooks/useDriverHubCheckins";

const ActiveCheckinBanner = () => {
  const { data: activeCheckin, isLoading } = useActiveCheckin();
  const checkoutMutation = useHubCheckout();

  if (isLoading || !activeCheckin) return null;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatFee = (cents: number | null) => {
    if (!cents) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleCheckout = () => {
    checkoutMutation.mutate({ hubId: activeCheckin.hub_id });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card variant="glow" className="border-success/50 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Building2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{activeCheckin.hub.hub_name}</span>
                  <Badge variant="success" className="text-xs">Checked In</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{activeCheckin.hub.location_label || "Hub location"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(activeCheckin.duration_minutes)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Fee</p>
                <p className="font-semibold">{formatFee(activeCheckin.fee_charged_cents)}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="border-success/50 hover:bg-success/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {checkoutMutation.isPending ? "..." : "Check Out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActiveCheckinBanner;
