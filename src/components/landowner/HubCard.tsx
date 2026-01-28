import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Building2, MapPin, Users, Activity, DollarSign, 
  Shield, Camera, Fence, Lightbulb, Edit2, Trash2, 
  ToggleLeft, ToggleRight, Clock, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HubWithStats, useUpdateHub, useDeleteHub } from "@/hooks/useHubs";

interface HubCardProps {
  hub: HubWithStats;
  index: number;
}

interface SecurityFeatures {
  guards?: boolean;
  cameras?: boolean;
  fencing?: boolean;
  lighting?: boolean;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

const HubCard = ({ hub, index }: HubCardProps) => {
  const updateHub = useUpdateHub();
  const deleteHub = useDeleteHub();

  const securityFeatures = (hub.security_features as SecurityFeatures) || {};
  const securityCount = Object.values(securityFeatures).filter(Boolean).length;

  const handleToggleActive = () => {
    updateHub.mutate({
      hubId: hub.id,
      updates: { is_active: !hub.is_active },
    });
  };

  const handleDelete = () => {
    deleteHub.mutate(hub.id);
  };

  const getStatusBadge = () => {
    if (hub.verification_status === "pending") {
      return <Badge variant="warning">Pending Review</Badge>;
    }
    if (hub.verification_status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (!hub.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  const getFeeDisplay = () => {
    if (hub.fee_model === "free") return "Free";
    const amount = formatCurrency(hub.fee_cents || 0);
    switch (hub.fee_model) {
      case "per_checkin":
        return `${amount}/check-in`;
      case "daily":
        return `${amount}/day`;
      case "monthly":
        return `${amount}/month`;
      default:
        return amount;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card variant="glass" className="hover:border-success/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{hub.hub_name}</h3>
                    {getStatusBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {hub.hub_type.replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-display font-bold text-success">
                  {formatCurrency(hub.monthly_earnings)}
                </div>
                <div className="text-sm text-muted-foreground">this month</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate" title={hub.location_label || undefined}>
                  {hub.location_label || "No location set"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {hub.checkins_today} check-ins today
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Capacity: {hub.capacity}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {getFeeDisplay()}
                </span>
              </div>
            </div>

            {/* Operating Hours & Security */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{hub.operating_hours || "Not set"}</span>
              </div>
              
              {/* Security Features */}
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${securityCount >= 3 ? "text-success" : securityCount >= 2 ? "text-amber-500" : "text-muted-foreground"}`} />
                <div className="flex gap-1">
                  {securityFeatures.guards && (
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center" title="Guards">
                      <Shield className="w-3 h-3" />
                    </span>
                  )}
                  {securityFeatures.cameras && (
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center" title="Cameras">
                      <Camera className="w-3 h-3" />
                    </span>
                  )}
                  {securityFeatures.fencing && (
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center" title="Fencing">
                      <Fence className="w-3 h-3" />
                    </span>
                  )}
                  {securityFeatures.lighting && (
                    <span className="w-6 h-6 rounded bg-muted flex items-center justify-center" title="Lighting">
                      <Lightbulb className="w-3 h-3" />
                    </span>
                  )}
                  {securityCount === 0 && (
                    <span className="text-xs text-muted-foreground">No security features</span>
                  )}
                </div>
              </div>

              {/* View on Map */}
              {hub.lat && hub.lng && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() =>
                    window.open(
                      `https://www.openstreetmap.org/?mlat=${hub.lat}&mlon=${hub.lng}&zoom=17`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Map
                </Button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={updateHub.isPending || hub.verification_status === "pending"}
              >
                {hub.is_active ? (
                  <>
                    <ToggleRight className="w-4 h-4 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 mr-1" />
                    Activate
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="sm" disabled>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Hub</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{hub.hub_name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HubCard;
