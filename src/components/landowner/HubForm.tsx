import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Camera, Fence, Lightbulb, Users, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationInput, { LocationData } from "@/components/location/LocationInput";
import { useCreateHub } from "@/hooks/useHubs";
import { Database, Json } from "@/integrations/supabase/types";

type HubType = Database["public"]["Enums"]["hub_type"];
type FeeModel = Database["public"]["Enums"]["fee_model"];

interface HubFormProps {
  onClose: () => void;
}

interface SecurityFeatures {
  guards: boolean;
  cameras: boolean;
  fencing: boolean;
  lighting: boolean;
}

const HUB_TYPES: { value: HubType; label: string; description: string }[] = [
  { value: "micro_hub", label: "Micro Hub", description: "Full-service hub with parking, storage, and facilities" },
  { value: "transit_stop", label: "Transit Stop", description: "Quick stop for rest, refueling, or short breaks" },
];

const FEE_MODELS: { value: FeeModel; label: string; description: string }[] = [
  { value: "per_checkin", label: "Per Check-in", description: "Charge each time a driver checks in" },
  { value: "daily", label: "Daily Rate", description: "Flat daily fee for unlimited access" },
  { value: "monthly", label: "Monthly Rate", description: "Monthly subscription for regular users" },
  { value: "free", label: "Free", description: "No charge for drivers" },
];

const HubForm = ({ onClose }: HubFormProps) => {
  const [hubName, setHubName] = useState("");
  const [hubType, setHubType] = useState<HubType | "">("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [capacity, setCapacity] = useState("");
  const [feeModel, setFeeModel] = useState<FeeModel>("per_checkin");
  const [feeCents, setFeeCents] = useState("");
  const [operatingHours, setOperatingHours] = useState("24/7");
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeatures>({
    guards: false,
    cameras: false,
    fencing: false,
    lighting: false,
  });

  const createHub = useCreateHub();

  const handleSecurityChange = (feature: keyof SecurityFeatures, checked: boolean) => {
    setSecurityFeatures((prev) => ({
      ...prev,
      [feature]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hubName.trim()) {
      return;
    }

    if (!hubType) {
      return;
    }

    if (!location) {
      return;
    }

    const feeValue = feeCents ? Math.round(parseFloat(feeCents) * 100) : 0;
    const capacityValue = capacity ? parseInt(capacity, 10) : 20;

    await createHub.mutateAsync({
      hub_name: hubName.trim(),
      hub_type: hubType,
      location_label: location.label,
      lat: location.lat,
      lng: location.lng,
      capacity: capacityValue,
      fee_model: feeModel,
      fee_cents: feeValue,
      operating_hours: operatingHours,
      security_features: securityFeatures as unknown as Json,
      is_active: true,
      verification_status: "pending",
    });

    onClose();
  };

  const isFormValid = hubName.trim() && hubType && location;
  const securityLevel = Object.values(securityFeatures).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8"
    >
      <Card variant="glow">
        <CardHeader>
          <CardTitle>List New Hub</CardTitle>
          <CardDescription>Add a new micro-hub or transit stop to the network</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hubName">
                  Hub Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="hubName"
                  placeholder="e.g., Lagos Transit Hub"
                  value={hubName}
                  onChange={(e) => setHubName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hubType">
                  Hub Type <span className="text-destructive">*</span>
                </Label>
                <Select value={hubType} onValueChange={(val) => setHubType(val as HubType)}>
                  <SelectTrigger id="hubType">
                    <SelectValue placeholder="Select hub type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <LocationInput
              label="Hub Location"
              value={location}
              onChange={setLocation}
              placeholder="Enter hub address..."
              required
            />

            {/* Capacity & Hours */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Vehicle Capacity</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="capacity"
                    placeholder="20"
                    type="number"
                    min="1"
                    className="pl-10"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatingHours">Operating Hours</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="operatingHours"
                    placeholder="24/7 or 6AM - 10PM"
                    className="pl-10"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feeModel">Fee Model</Label>
                <Select value={feeModel} onValueChange={(val) => setFeeModel(val as FeeModel)}>
                  <SelectTrigger id="feeModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">
                  {feeModel === "per_checkin" && "Fee per Check-in (USD)"}
                  {feeModel === "daily" && "Daily Rate (USD)"}
                  {feeModel === "monthly" && "Monthly Rate (USD)"}
                  {feeModel === "free" && "Fee (USD)"}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fee"
                    placeholder={feeModel === "free" ? "0" : "5"}
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={feeCents}
                    onChange={(e) => setFeeCents(e.target.value)}
                    disabled={feeModel === "free"}
                  />
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Security Features</Label>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${securityLevel >= 3 ? "text-success" : securityLevel >= 2 ? "text-amber-500" : "text-muted-foreground"}`} />
                  <span className="text-sm text-muted-foreground">
                    Security Level: {securityLevel === 0 ? "Basic" : securityLevel <= 2 ? "Moderate" : "High"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={securityFeatures.guards}
                    onCheckedChange={(checked) => handleSecurityChange("guards", checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Guards</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={securityFeatures.cameras}
                    onCheckedChange={(checked) => handleSecurityChange("cameras", checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Cameras</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={securityFeatures.fencing}
                    onCheckedChange={(checked) => handleSecurityChange("fencing", checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <Fence className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Fencing</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={securityFeatures.lighting}
                    onCheckedChange={(checked) => handleSecurityChange("lighting", checked as boolean)}
                  />
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Lighting</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="hero"
                disabled={createHub.isPending || !isFormValid}
              >
                {createHub.isPending ? "Submitting..." : "Submit for Review"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HubForm;
