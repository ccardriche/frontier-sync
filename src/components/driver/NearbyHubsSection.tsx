import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, QrCode, Building2, Clock, DollarSign, ChevronDown, ChevronUp, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import QRScannerDialog from "./QRScannerDialog";
import { useNearbyHubs, useHubCheckin, useActiveCheckin, HubWithDistance } from "@/hooks/useDriverHubCheckins";

const NearbyHubsSection = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { data: hubs, isLoading } = useNearbyHubs(userLocation?.lat, userLocation?.lng);
  const { data: activeCheckin } = useActiveCheckin();
  const checkinMutation = useHubCheckin();

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  }, []);

  const handleQRScan = (hubId: string) => {
    checkinMutation.mutate({ hubId });
  };

  const handleTapCheckin = (hubId: string) => {
    checkinMutation.mutate({ hubId });
  };

  const formatDistance = (km?: number) => {
    if (km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const formatFee = (hub: HubWithDistance) => {
    if (hub.fee_model === "free" || !hub.fee_cents) return "Free";
    const amount = (hub.fee_cents / 100).toFixed(2);
    switch (hub.fee_model) {
      case "per_checkin":
        return `$${amount}/visit`;
      case "daily":
        return `$${amount}/day`;
      case "monthly":
        return `$${amount}/mo`;
      default:
        return `$${amount}`;
    }
  };

  const getHubTypeLabel = (type: string) => {
    switch (type) {
      case "micro_hub":
        return "Micro Hub";
      case "transit_stop":
        return "Transit Stop";
      default:
        return type;
    }
  };

  return (
    <>
      <QRScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleQRScan}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card variant="glass">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                    Nearby Hubs
                    {hubs && hubs.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {hubs.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowScanner(true);
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan QR
                    </Button>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                {isLoading && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && (!hubs || hubs.length === 0) && (
                  <div className="text-center py-8">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No hubs available nearby</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back later or scan a QR code at a hub
                    </p>
                  </div>
                )}

                {hubs && hubs.length > 0 && (
                  <div className="space-y-3">
                    {hubs.slice(0, 5).map((hub, index) => {
                      const isCurrentHub = activeCheckin?.hub_id === hub.id;
                      
                      return (
                        <motion.div
                          key={hub.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            isCurrentHub
                              ? "bg-success/10 border border-success/30"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isCurrentHub ? "bg-success/20" : "bg-primary/10"}`}>
                            <Building2 className={`w-5 h-5 ${isCurrentHub ? "text-success" : "text-primary"}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{hub.hub_name}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {getHubTypeLabel(hub.hub_type)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              {hub.location_label && (
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{hub.location_label}</span>
                                </div>
                              )}
                              {hub.distance_km !== undefined && (
                                <span className="shrink-0">{formatDistance(hub.distance_km)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <div className="flex items-center gap-1 text-sm">
                                <DollarSign className="w-3 h-3" />
                                <span>{formatFee(hub)}</span>
                              </div>
                              {hub.operating_hours && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{hub.operating_hours}</span>
                                </div>
                              )}
                            </div>

                            {isCurrentHub ? (
                              <Badge variant="success">Checked In</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTapCheckin(hub.id)}
                                disabled={checkinMutation.isPending || !!activeCheckin}
                              >
                                <LogIn className="w-4 h-4 mr-1" />
                                Check In
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </>
  );
};

export default NearbyHubsSection;
