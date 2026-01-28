import { format } from "date-fns";
import { History, Building2, Clock, DollarSign, LogIn, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDriverCheckinHistory } from "@/hooks/useDriverHubCheckins";

const CheckinHistorySheet = () => {
  const { data: history, isLoading } = useDriverCheckinHistory();

  const formatFee = (cents: number | null) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Check-in History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-4">
          {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!history || history.length === 0) && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No check-in history yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your hub visits will appear here
              </p>
            </div>
          )}

          {history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      entry.event_type === "checkin"
                        ? "bg-success/20"
                        : "bg-muted"
                    }`}
                  >
                    {entry.event_type === "checkin" ? (
                      <LogIn className="w-5 h-5 text-success" />
                    ) : (
                      <LogOut className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {entry.hub?.hub_name || "Unknown Hub"}
                      </span>
                      <Badge
                        variant={entry.event_type === "checkin" ? "success" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {entry.event_type === "checkin" ? "In" : "Out"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      {entry.event_type === "checkin" && entry.fee_charged_cents && entry.fee_charged_cents > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatFee(entry.fee_charged_cents)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CheckinHistorySheet;
