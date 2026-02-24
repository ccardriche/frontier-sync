import { useState, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Phone,
  ChevronDown,
  Camera,
  X,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

interface StopData {
  id: string;
  label: string | null;
  lat: number;
  lng: number;
  stop_type: string;
  sequence_order: number;
  completed_at: string | null;
  driver_notes?: string | null;
  photos?: string[] | null;
}

interface ShipperContact {
  name: string | null;
  phone: string | null;
}

interface StopDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  stops: StopData[];
  currentStopIndex: number;
  shipperContact: ShipperContact | null;
  onStopChange: (index: number) => void;
}

const StopDetailView = ({
  open,
  onOpenChange,
  job,
  stops,
  currentStopIndex,
  shipperContact,
  onStopChange,
}: StopDetailViewProps) => {
  const [driverNotes, setDriverNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [detailsReviewed, setDetailsReviewed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStop = stops[currentStopIndex];
  const totalStops = stops.length;

  // Parse cargo details
  const cargoDetails = job.cargo_details as Record<string, any> | null;
  const locationNotes =
    currentStop?.stop_type === "pickup"
      ? cargoDetails?.pickup_metadata?.notes
      : cargoDetails?.drop_metadata?.notes;

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const filePath = `${user.user.id}/${job.id}/stop-${currentStop?.id || currentStopIndex}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("pod-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pod-files")
        .getPublicUrl(filePath);

      const newPhotos = [...photos, urlData.publicUrl];
      setPhotos(newPhotos);

      // Save to job_stops if we have a real stop ID
      if (currentStop?.id && !currentStop.id.startsWith("virtual-")) {
        await supabase
          .from("job_stops")
          .update({ photos: newPhotos } as any)
          .eq("id", currentStop.id);
      }

      toast({ title: "Photo uploaded", description: "Photo saved successfully." });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNotes = async () => {
    if (!currentStop?.id || currentStop.id.startsWith("virtual-")) {
      toast({ title: "Notes saved locally", description: "Notes saved for this stop." });
      return;
    }

    setIsSavingNotes(true);
    try {
      await supabase
        .from("job_stops")
        .update({ driver_notes: driverNotes } as any)
        .eq("id", currentStop.id);
      toast({ title: "Notes saved", description: "Your notes have been saved." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Could not save notes.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleRequestHelp = async () => {
    setIsRequestingHelp(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      await supabase.from("support_tickets").insert({
        created_by: user.user.id,
        job_id: job.id,
        category: "driver_help",
        message: `Help requested at Stop ${currentStopIndex + 1} of ${totalStops} (${currentStop?.label || "Unknown"}). Job: ${job.title}. ${driverNotes ? `Driver notes: ${driverNotes}` : ""}`,
      });

      toast({
        title: "Help requested",
        description: "A support ticket has been created. We'll get back to you soon.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not create support ticket.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingHelp(false);
    }
  };

  if (!currentStop) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <SheetTitle className="text-lg font-display">
              Stop {currentStopIndex + 1} of {totalStops}
            </SheetTitle>
            <Badge
              variant={currentStop.stop_type === "pickup" ? "default" : "secondary"}
              className="ml-auto"
            >
              {currentStop.stop_type === "pickup" ? "Pickup" : "Drop-off"}
            </Badge>
          </div>
          {/* Stop navigation dots */}
          {totalStops > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {stops.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onStopChange(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentStopIndex
                      ? "bg-primary scale-125"
                      : i < currentStopIndex
                        ? "bg-primary/50"
                        : "bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="p-4 space-y-4">
          {/* Address Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {currentStop.label || "Address not specified"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentStop.lat.toFixed(4)}, {currentStop.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Notes */}
          {locationNotes && (
            <Card className="border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning uppercase tracking-wide">
                      Location Notes
                    </p>
                    <p className="text-sm text-foreground mt-1">{locationNotes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Contact */}
          {shipperContact && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Location Contact
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {shipperContact.name || "Shipper"}
                    </p>
                    {shipperContact.phone && (
                      <p className="text-sm text-muted-foreground">
                        {shipperContact.phone}
                      </p>
                    )}
                  </div>
                  {shipperContact.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`tel:${shipperContact.phone}`, "_self")
                      }
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Tasks
            </p>

            {/* Review Details */}
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <Card className="mb-3">
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={detailsReviewed}
                        onCheckedChange={(checked) =>
                          setDetailsReviewed(checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Review {currentStop.stop_type === "pickup" ? "Pickup" : "Delivery"} Details
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Verify cargo and order information
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          detailsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cargo:</span>
                      <span className="font-medium">
                        {job.cargo_type?.replace(/_/g, " ") || "Not specified"}
                      </span>
                    </div>
                    {job.weight_kg && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground ml-6">Weight:</span>
                        <span className="font-medium">{job.weight_kg} kg</span>
                      </div>
                    )}
                    {cargoDetails?.description && (
                      <div className="text-sm ml-6">
                        <span className="text-muted-foreground">Description: </span>
                        <span>{cargoDetails.description}</span>
                      </div>
                    )}
                    {cargoDetails?.special_instructions && (
                      <div className="text-sm ml-6 p-2 rounded bg-warning/10 border border-warning/20">
                        <span className="text-warning font-medium">Special: </span>
                        <span>{cargoDetails.special_instructions}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Photo Capture */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Checkbox checked={photos.length > 0} disabled />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Take Photo of Order</p>
                    <p className="text-sm text-muted-foreground">
                      {photos.length > 0
                        ? `${photos.length} photo(s) captured`
                        : "Capture photos for proof"}
                    </p>
                  </div>
                </div>

                {/* Photo previews */}
                {photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {photos.map((url, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-border">
                        <img
                          src={url}
                          alt={`Stop photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-0 right-0 bg-destructive rounded-bl-md p-0.5"
                        >
                          <X className="w-3 h-3 text-destructive-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="w-full"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-1" />
                      Take Photo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Additional Notes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Additional Notes
            </p>
            <Textarea
              placeholder="Add notes about this stop..."
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              rows={3}
            />
            {driverNotes && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="mt-2"
              >
                {isSavingNotes ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                Save Notes
              </Button>
            )}
          </div>

          {/* Request Help */}
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleRequestHelp}
            disabled={isRequestingHelp}
          >
            {isRequestingHelp ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <HelpCircle className="w-4 h-4 mr-1" />
            )}
            Request Help
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StopDetailView;
