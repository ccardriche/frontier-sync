import { motion } from "framer-motion";
import { ExternalLink, Phone, Mail, MapPin, Calendar, Truck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import type { ExternalLoad } from "@/hooks/useExternalLoads";

interface Props {
  load: ExternalLoad;
  index: number;
}

const formatRate = (cents: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const ExternalLoadCard = ({ load, index }: Props) => {
  const rpm =
    load.rate_cents && load.miles && load.miles > 0
      ? (load.rate_cents / 100 / load.miles).toFixed(2)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-accent/10 border-accent/40 text-accent">
              External · {load.source_name}
            </Badge>
            {load.equipment_type && <Badge variant="secondary">{load.equipment_type}</Badge>}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 cursor-help">
                  <AlertTriangle className="w-3 h-3" />
                  Third-party
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium">This load is listed by a third party.</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Rates and availability may change. Booking may happen outside Anchor.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-display font-semibold text-base sm:text-lg truncate">
                {load.title ?? `${load.origin_city} → ${load.destination_city}`}
              </h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="truncate">
                  <span className="text-foreground font-medium">
                    {load.origin_city}, {load.origin_state}
                  </span>
                  {" → "}
                  <span className="text-foreground font-medium">
                    {load.destination_city}, {load.destination_state}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {load.pickup_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Pickup {format(new Date(load.pickup_date), "MMM d")}
                  </span>
                )}
                {load.miles && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    {load.miles} mi
                  </span>
                )}
                {load.weight_lbs && <span>{load.weight_lbs.toLocaleString()} lbs</span>}
                {load.broker_name && <span>· {load.broker_name}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="text-2xl font-display font-bold text-accent">
                {formatRate(load.rate_cents)}
              </div>
              {rpm && <div className="text-xs text-muted-foreground">${rpm}/mi</div>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
            {load.broker_phone && (
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <a href={`tel:${load.broker_phone}`}>
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </Button>
            )}
            {load.broker_email && (
              <Button size="sm" variant="outline" asChild>
                <a href={`mailto:${load.broker_email}`}>
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              </Button>
            )}
            {load.external_url && (
              <Button size="sm" variant="default" className="ml-auto" asChild>
                <a href={load.external_url} target="_blank" rel="noopener noreferrer">
                  Open Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExternalLoadCard;
