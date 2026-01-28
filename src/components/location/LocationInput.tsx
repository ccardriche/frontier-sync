import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Edit2, ExternalLink, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddressAutocomplete, { AddressResult } from "./AddressAutocomplete";
import PinLocationPicker, { PinLocation } from "./PinLocationPicker";

export interface LocationData {
  label: string;
  lat: number;
  lng: number;
  verified: boolean;
  landmarkDescription?: string;
  notes?: string;
  photoUrls?: string[];
}

interface LocationInputProps {
  label: string;
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  required?: boolean;
}

const LocationInput = ({
  label,
  value,
  onChange,
  placeholder = "Enter address...",
  required = false,
}: LocationInputProps) => {
  const [showPinPicker, setShowPinPicker] = useState(false);

  const handleAddressChange = (result: AddressResult | null) => {
    if (result) {
      onChange({
        label: result.label,
        lat: result.lat,
        lng: result.lng,
        verified: true,
      });
    } else {
      onChange(null);
    }
  };

  const handlePinSave = (pinLocation: PinLocation) => {
    onChange({
      label: pinLocation.locationName,
      lat: pinLocation.lat,
      lng: pinLocation.lng,
      verified: false,
      landmarkDescription: pinLocation.landmarkDescription,
      notes: pinLocation.notes,
      photoUrls: pinLocation.photoUrls,
    });
    setShowPinPicker(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  // If we have a pin-based location, show the saved state
  if (value && !value.verified) {
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="rounded-lg border border-amber-500 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">{value.label}</p>
                <p className="text-xs text-muted-foreground">
                  {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
                </p>
                {value.landmarkDescription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {value.landmarkDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowPinPicker(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={handleClear}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {value.photoUrls && value.photoUrls.length > 0 && (
            <div className="flex gap-2 pt-2">
              {value.photoUrls.slice(0, 3).map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-12 h-12 rounded overflow-hidden border border-border hover:opacity-80 transition-opacity"
                >
                  <img
                    src={url}
                    alt={`Location ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
              {value.photoUrls.length > 3 && (
                <div className="w-12 h-12 rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
                  +{value.photoUrls.length - 3}
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-amber-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Pin-based location (pending verification)
          </p>
        </div>

        {/* Pin Picker Dialog */}
        <Dialog open={showPinPicker} onOpenChange={setShowPinPicker}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Pin Location</DialogTitle>
            </DialogHeader>
            <PinLocationPicker
              onSave={handlePinSave}
              onCancel={() => setShowPinPicker(false)}
              initialLocation={{ lat: value.lat, lng: value.lng }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If we have a verified address, show simple display
  if (value && value.verified) {
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="rounded-lg border border-green-500 bg-green-500/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm line-clamp-2">{value.label}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Verified address
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  window.open(
                    `https://www.openstreetmap.org/?mlat=${value.lat}&mlon=${value.lng}&zoom=17`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={handleClear}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: show address autocomplete
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <AddressAutocomplete
        value={value ? { label: value.label, lat: value.lat, lng: value.lng, verified: value.verified } : null}
        onChange={handleAddressChange}
        onPinFallback={() => setShowPinPicker(true)}
        placeholder={placeholder}
      />

      {/* Pin Picker Dialog */}
      <Dialog open={showPinPicker} onOpenChange={setShowPinPicker}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Drop a Pin</DialogTitle>
          </DialogHeader>
          <PinLocationPicker
            onSave={handlePinSave}
            onCancel={() => setShowPinPicker(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationInput;
