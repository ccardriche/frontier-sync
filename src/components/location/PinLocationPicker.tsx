import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Upload, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon
const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface PinLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  locationName: string;
  landmarkDescription: string;
  notes?: string;
  photoUrls: string[];
}

interface PinLocationPickerProps {
  onSave: (location: PinLocation) => void;
  onCancel: () => void;
  initialLocation?: { lat: number; lng: number };
}

// Component to handle map click events
const MapClickHandler = ({
  onLocationSelect,
}: {
  onLocationSelect: (latlng: LatLng) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const PinLocationPicker = ({
  onSave,
  onCancel,
  initialLocation,
}: PinLocationPickerProps) => {
  const [position, setPosition] = useState<LatLng | null>(
    initialLocation ? new LatLng(initialLocation.lat, initialLocation.lng) : null
  );
  const [accuracy, setAccuracy] = useState<number | undefined>();
  const [locationName, setLocationName] = useState("");
  const [landmarkDescription, setLandmarkDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user's current location on mount
  useEffect(() => {
    if (!initialLocation && navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new LatLng(pos.coords.latitude, pos.coords.longitude));
          setAccuracy(pos.coords.accuracy);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Default to a central location if geolocation fails
          setPosition(new LatLng(-1.2921, 36.8219)); // Nairobi as default
          setIsGettingLocation(false);
        }
      );
    }
  }, [initialLocation]);

  const handleLocationSelect = (latlng: LatLng) => {
    setPosition(latlng);
    setAccuracy(undefined); // GPS accuracy not applicable for manual pin drops
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new LatLng(pos.coords.latitude, pos.coords.longitude));
          setAccuracy(pos.coords.accuracy);
          setIsGettingLocation(false);
          toast({
            title: "Location Updated",
            description: `GPS accuracy: ${Math.round(pos.coords.accuracy)}m`,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get your current location",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        title: "Too Many Photos",
        description: "Maximum 5 photos allowed",
        variant: "destructive",
      });
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setPhotos((prev) => [...prev, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${photo.name}`;
      const filePath = `locations/${fileName}`;

      const { error } = await supabase.storage
        .from("location-photos")
        .upload(filePath, photo);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("location-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!position) {
      toast({
        title: "No Location Selected",
        description: "Please drop a pin on the map",
        variant: "destructive",
      });
      return;
    }

    if (!locationName.trim()) {
      toast({
        title: "Location Name Required",
        description: "Please enter a name for this location",
        variant: "destructive",
      });
      return;
    }

    if (!landmarkDescription.trim()) {
      toast({
        title: "Landmark Description Required",
        description: "Please describe nearby landmarks",
        variant: "destructive",
      });
      return;
    }

    if (photos.length === 0) {
      toast({
        title: "Photo Required",
        description: "Please upload at least one photo of the location",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const photoUrls = await uploadPhotos();

      onSave({
        lat: position.lat,
        lng: position.lng,
        accuracy,
        locationName: locationName.trim(),
        landmarkDescription: landmarkDescription.trim(),
        notes: notes.trim() || undefined,
        photoUrls,
      });
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isGettingLocation && !position) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border border-border">
        <MapContainer
          center={position || [-1.2921, 36.8219]}
          zoom={13}
          style={{ height: "250px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {position && <Marker position={position} icon={defaultIcon} />}
        </MapContainer>

        {/* Current Location Button */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute bottom-3 right-3 z-[1000] shadow-lg"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <MapPin className="w-4 h-4 mr-1" />
          )}
          Use Current Location
        </Button>
      </div>

      {/* Coordinates Display */}
      {position && (
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </span>
            {accuracy && (
              <span className="text-xs">({Math.round(accuracy)}m accuracy)</span>
            )}
          </div>
        </div>
      )}

      {/* Location Details Form */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="locationName">Location Name *</Label>
          <Input
            id="locationName"
            placeholder="e.g., Warehouse on Industrial Road"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="landmarkDescription">Landmark Description *</Label>
          <Textarea
            id="landmarkDescription"
            placeholder="Describe nearby landmarks (e.g., next to the petrol station, opposite the blue warehouse)"
            value={landmarkDescription}
            onChange={(e) => setLandmarkDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Gate color, building number, special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Location Photos * (At least 1 required)</Label>
        <div className="flex flex-wrap gap-2">
          {photoPreviewUrls.map((url, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img
                src={url}
                alt={`Location photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                onClick={() => handleRemovePhoto(index)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <button
              type="button"
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-5 h-5" />
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoSelect}
        />
        <p className="text-xs text-muted-foreground">
          Upload photos of the location entrance, building, or landmarks
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="hero"
          onClick={handleSave}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Location
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PinLocationPicker;
