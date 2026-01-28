import { motion } from "framer-motion";
import { Route, Navigation, Clock, MapPin, Check, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedRoute, formatSavings } from "@/lib/routeOptimization";
import { formatDistance, formatETA } from "@/lib/eta";

interface RouteOptimizationCardProps {
  optimizedRoute: OptimizedRoute;
  onApplyRoute?: () => void;
  onNavigateToStop?: (stopId: string) => void;
  isApplied?: boolean;
}

const RouteOptimizationCard = ({
  optimizedRoute,
  onApplyRoute,
  onNavigateToStop,
  isApplied = false,
}: RouteOptimizationCardProps) => {
  const { stops, totalDistanceKm, estimatedTimeMinutes, savings } = optimizedRoute;

  if (stops.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card variant="glass" className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="w-5 h-5 text-primary" />
              Optimized Route
            </CardTitle>
            {savings.percentageSaved > 0 && (
              <Badge variant="accent" className="text-xs">
                {savings.percentageSaved}% shorter
              </Badge>
            )}
          </div>
          {savings.percentageSaved > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatSavings(savings)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route summary */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatDistance(totalDistanceKm)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {formatETA(estimatedTimeMinutes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {stops.length} stops
              </span>
            </div>
          </div>

          {/* Stop list */}
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-colors
                  ${stop.completed 
                    ? "bg-muted/50 border-muted" 
                    : "bg-card border-border hover:border-primary/50"
                  }
                `}
              >
                {/* Step number */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${stop.completed
                    ? "bg-green-500/20 text-green-500"
                    : stop.type === "pickup"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }
                `}>
                  {stop.completed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Stop info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={stop.type === "pickup" ? "success" : "destructive"}
                      className="text-xs"
                    >
                      {stop.type === "pickup" ? "Pickup" : "Drop-off"}
                    </Badge>
                    {stop.jobTitle && (
                      <span className="text-xs text-muted-foreground truncate">
                        {stop.jobTitle}
                      </span>
                    )}
                  </div>
                  {stop.label && (
                    <p className={`text-sm mt-1 truncate ${stop.completed ? "text-muted-foreground line-through" : ""}`}>
                      {stop.label}
                    </p>
                  )}
                </div>

                {/* Navigate button */}
                {!stop.completed && onNavigateToStop && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigateToStop(stop.id)}
                    className="shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Apply route button */}
          {onApplyRoute && !isApplied && stops.length > 1 && (
            <Button 
              onClick={onApplyRoute} 
              className="w-full"
              variant="default"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Apply Optimized Route
            </Button>
          )}

          {isApplied && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Check className="w-4 h-4" />
              Route applied
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RouteOptimizationCard;
