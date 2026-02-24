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
  Navigation,
  Plus,
  Pencil,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import SignatureCanvas from "./SignatureCanvas";
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
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [detailsReviewed, setDetailsReviewed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStop = stops[currentStopIndex];
  const totalStops = stops.length;
  const isDropoff = currentStop?.stop_type === "dropoff" || currentStop?.stop_type === "drop";

  // Parse cargo details
  const cargoDetails = job.cargo_details as Record<string, any> | null;
  const locationNotes =
    currentStop?.stop_type === "pickup"
      ? cargoDetails?.pickup_metadata?.notes
      : cargoDetails?.drop_metadata?.notes;

  // Build item summary line
  const itemCount = cargoDetails?.item_count || 1;
  const weightLbs = job.weight_kg ? Math.round(job.weight_kg * 2.205) : null;
  const stopTypeLabel = isDropoff ? "DROP-OFF" : "PICK UP";

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
      setIsEditingNotes(false);
      return;
    }

    setIsSavingNotes(true);
    try {
      await supabase
        .from("job_stops")
        .update({ driver_notes: driverNotes } as any)
        .eq("id", currentStop.id);
      toast({ title: "Notes saved", description: "Your notes have been saved." });
      setIsEditingNotes(false);
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

  const handleDirections = () => {
    if (currentStop) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${currentStop.lat},${currentStop.lng}`,
        "_blank"
      );
    }
  };

  if (!currentStop) return null;

  // Task numbering
  let taskNum = 0;

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
          </div>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {/* Address Card with stop number badge */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0 font-bold text-sm">
                  {currentStopIndex + 1}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">
                    {currentStop.label || "Address not specified"}
                  </p>
                </div>
              </div>

              {/* Item summary bar */}
              <div className="flex items-center gap-2 mt-3 pl-11">
                <div className="w-1 h-5 bg-warning rounded-full" />
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  {stopTypeLabel}:{" "}
                  <span className="text-foreground">
                    {itemCount} ITEM{itemCount > 1 ? "S" : ""}{" "}
                    {weightLbs ? `WEIGHING ${weightLbs} LBS.` : job.weight_kg ? `WEIGHING ${job.weight_kg} KG.` : ""}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Directions Button */}
          <Button
            variant="outline"
            className="w-full h-12 text-base font-medium"
            onClick={handleDirections}
          >
            <Navigation className="w-5 h-5 mr-2" />
            Directions
          </Button>

          {/* Distance / Pickup Time / ETA row */}
          {job.scheduled_pickup && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Distance to stop</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isDropoff ? "Drop-off time" : "Pick up time"}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {new Date(job.scheduled_pickup).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="text-lg font-bold text-foreground">—</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Location Notes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Location Notes
            </p>
            {locationNotes ? (
              <>
                <p className="font-bold text-foreground">{locationNotes}</p>
                <div className="flex items-center gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">
                    Hand loading/unloading is required.
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No special notes</p>
            )}
          </div>

          <Separator />

          {/* Location Contact */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Location Contact
            </p>
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground uppercase">
                {shipperContact?.name || "—"}
              </p>
              {shipperContact?.phone && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-lg"
                  onClick={() => window.open(`tel:${shipperContact.phone}`, "_self")}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Tasks Section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Tasks
            </p>
            <p className="text-foreground font-medium mb-4">
              Verify each task below to complete the stop
            </p>

            {/* Task 1: Review Details */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                detailsReviewed
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {detailsReviewed ? <CheckCircle2 className="w-5 h-5" /> : (taskNum = 1, taskNum)}
              </div>

              <Card className="flex-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 bg-accent rounded-full" />
                      <p className="font-semibold text-foreground uppercase text-sm">
                        REVIEW {isDropoff ? "DROP-OFF" : "PICKUP"} DETAILS
                      </p>
                    </div>
                    {!detailsReviewed ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setDetailsReviewed(true);
                          setDetailsOpen(false);
                        }}
                      >
                        Done
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Reviewed</span>
                    )}
                  </div>

                  {/* Order info */}
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Order ID: </span>
                      {job.id.slice(0, 10).toUpperCase()}
                    </p>
                    {cargoDetails?.po_number && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">PO Number: </span>
                        {cargoDetails.po_number}
                      </p>
                    )}
                  </div>

                  {/* Item count + show details */}
                  <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-foreground">
                        {itemCount} Item{itemCount > 1 ? "s" : ""}
                      </p>
                      <CollapsibleTrigger asChild>
                        <button className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
                          Show Details
                          <ChevronDown className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
                        </button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Cargo:</span>
                          <span className="font-medium">
                            {job.cargo_type?.replace(/_/g, " ") || "Not specified"}
                          </span>
                        </div>
                        {job.weight_kg && (
                          <div className="text-sm ml-6">
                            <span className="text-muted-foreground">Weight: </span>
                            <span className="font-medium">{job.weight_kg} kg ({weightLbs} lbs)</span>
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
                  </Collapsible>
                </CardContent>
              </Card>
            </div>

            {/* Task 2 (drop-off only): Capture Recipient Name */}
            {isDropoff && (
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  recipientName.trim()
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {recipientName.trim() ? <CheckCircle2 className="w-5 h-5" /> : (++taskNum, taskNum)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground uppercase text-sm mb-2">
                    Capture Recipient Name
                  </p>
                  <Input
                    placeholder="Enter recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="bg-card"
                  />
                </div>
              </div>
            )}

            {/* Task 3 (drop-off only): Recipient Signature */}
            {isDropoff && (
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  signature
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {signature ? <CheckCircle2 className="w-5 h-5" /> : (++taskNum, taskNum)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground uppercase text-sm mb-2">
                    Recipient Signature
                  </p>
                  <SignatureCanvas onSignatureChange={setSignature} />
                  {signature && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setSignature(null)}
                    >
                      Edit signature
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Task: Take Photo */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                photos.length > 0
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {photos.length > 0 ? <CheckCircle2 className="w-5 h-5" /> : (++taskNum, taskNum)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground uppercase text-sm mb-3">
                  Take Photo of {isDropoff ? "Drop-off" : "Pickup"} Order
                </p>

                {/* Photo grid with add button */}
                <div className="flex gap-3 flex-wrap">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={url}
                        alt={`Stop photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-foreground/80 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-background" />
                      </button>
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-accent-foreground" />
                      </div>
                    </div>
                  ))}
                  {/* Add photo button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="text-xs font-semibold uppercase">Add Photo</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Additional Notes
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add notes about this stop..."
                  value={driverNotes}
                  onChange={(e) => setDriverNotes(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Save Notes
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {driverNotes || "None"}
              </p>
            )}
          </div>

          {/* Help Requests */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Help Requests
            </p>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={handleRequestHelp}
              disabled={isRequestingHelp}
            >
              {isRequestingHelp ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <HelpCircle className="w-4 h-4 mr-2" />
              )}
              Request help
            </Button>
          </div>

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StopDetailView;
