import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShipperTrackingView from "./ShipperTrackingView";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

interface TrackingDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrackingDialog = ({ job, open, onOpenChange }: TrackingDialogProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${
          isFullscreen
            ? "max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none"
            : "max-w-4xl w-[95vw]"
        } p-0 overflow-hidden`}
      >
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="font-display">
              Tracking: {job.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Live tracking for your shipment
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogHeader>
        <div className={`p-6 ${isFullscreen ? "h-[calc(100vh-80px)]" : ""}`}>
          <ShipperTrackingView job={job} className={isFullscreen ? "h-full" : ""} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrackingDialog;
