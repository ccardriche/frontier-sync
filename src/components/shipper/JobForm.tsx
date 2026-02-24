import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, ArrowRight, Scale, Calendar, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LocationInput, { LocationData } from "@/components/location/LocationInput";
import { useCreateJob } from "@/hooks/useJobs";
import { Database, Json } from "@/integrations/supabase/types";
import { calculateDistance, formatDistance } from "@/lib/eta";

type CargoType = Database["public"]["Enums"]["cargo_type"];

interface JobFormProps {
  onClose: () => void;
}

// Cargo type options with display labels
const CARGO_TYPE_OPTIONS: { value: CargoType; label: string; category: string }[] = [
  // General Freight
  { value: "small_parcels", label: "Small Parcels", category: "General Freight" },
  { value: "palletized_goods", label: "Palletized Goods", category: "General Freight" },
  { value: "bulk_goods", label: "Bulk Goods", category: "General Freight" },
  { value: "mixed_freight", label: "Mixed Freight", category: "General Freight" },
  // Food & Agriculture
  { value: "dry_food", label: "Dry Food", category: "Food & Agriculture" },
  { value: "perishables", label: "Perishables", category: "Food & Agriculture" },
  { value: "frozen_goods", label: "Frozen Goods", category: "Food & Agriculture" },
  { value: "livestock", label: "Livestock", category: "Food & Agriculture" },
  { value: "produce", label: "Produce", category: "Food & Agriculture" },
  // Construction & Industrial
  { value: "cement", label: "Cement", category: "Construction & Industrial" },
  { value: "lumber", label: "Lumber", category: "Construction & Industrial" },
  { value: "steel", label: "Steel", category: "Construction & Industrial" },
  { value: "pipes", label: "Pipes", category: "Construction & Industrial" },
  { value: "heavy_machinery", label: "Heavy Machinery", category: "Construction & Industrial" },
  // Retail & Consumer
  { value: "furniture", label: "Furniture", category: "Retail & Consumer" },
  { value: "appliances", label: "Appliances", category: "Retail & Consumer" },
  { value: "electronics", label: "Electronics", category: "Retail & Consumer" },
  { value: "clothing", label: "Clothing", category: "Retail & Consumer" },
  // Energy & Resources
  { value: "fuel", label: "Fuel", category: "Energy & Resources" },
  { value: "chemicals_non_hazardous", label: "Chemicals (Non-Hazardous)", category: "Energy & Resources" },
  { value: "minerals", label: "Minerals", category: "Energy & Resources" },
  { value: "raw_materials", label: "Raw Materials", category: "Energy & Resources" },
  // Specialty
  { value: "medical_supplies", label: "Medical Supplies", category: "Specialty" },
  { value: "pharmaceuticals", label: "Pharmaceuticals", category: "Specialty" },
  { value: "hazardous_materials", label: "Hazardous Materials", category: "Specialty" },
  { value: "fragile_items", label: "Fragile Items", category: "Specialty" },
  { value: "oversized_loads", label: "Oversized Loads", category: "Specialty" },
  // Gig-Friendly
  { value: "documents", label: "Documents", category: "Gig-Friendly" },
  { value: "small_packages", label: "Small Packages", category: "Gig-Friendly" },
  { value: "same_day_deliveries", label: "Same-Day Deliveries", category: "Gig-Friendly" },
  { value: "furniture_light", label: "Furniture (Light)", category: "Gig-Friendly" },
  { value: "appliances_small", label: "Appliances (Small)", category: "Gig-Friendly" },
];

// Group cargo types by category
const groupedCargoTypes = CARGO_TYPE_OPTIONS.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof CARGO_TYPE_OPTIONS>);

const JobForm = ({ onClose }: JobFormProps) => {
  const [cargoType, setCargoType] = useState<CargoType | "">("");
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationData | null>(null);
  const [budget, setBudget] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [weight, setWeight] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [pricingType, setPricingType] = useState<"fixed" | "bid">("bid");
  const [maxBudget, setMaxBudget] = useState("");
  const [minBudget, setMinBudget] = useState("");

  const createJob = useCreateJob();

  // Auto-calculate distance
  const distanceKm = useMemo(() => {
    if (!pickupLocation || !dropLocation) return null;
    return calculateDistance(
      { lat: pickupLocation.lat, lng: pickupLocation.lng },
      { lat: dropLocation.lat, lng: dropLocation.lng }
    );
  }, [pickupLocation, dropLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cargoType || !pickupLocation || !dropLocation) return;
    if (!weight || parseFloat(weight) <= 0) return;
    if (!dropDate) return;

    if (pricingType === "fixed" && (!budget || parseFloat(budget) <= 0)) return;
    if (pricingType === "bid") {
      if (!maxBudget || !minBudget) return;
      if (parseFloat(minBudget) > parseFloat(maxBudget)) return;
    }

    const budgetCents = pricingType === "fixed" ? Math.round(parseFloat(budget) * 100) : null;
    const maxBudgetCents = pricingType === "bid" ? Math.round(parseFloat(maxBudget) * 100) : null;
    const minBudgetCents = pricingType === "bid" ? Math.round(parseFloat(minBudget) * 100) : null;
    const weightKg = parseFloat(weight);
    const scheduledPickup = pickupDate ? new Date(pickupDate).toISOString() : null;
    const scheduledDropoff = new Date(dropDate).toISOString();

    const cargoDetails: Json = {
      type: cargoType,
      ...(pickupLocation && !pickupLocation.verified && {
        pickup_metadata: {
          landmarkDescription: pickupLocation.landmarkDescription || null,
          notes: pickupLocation.notes || null,
          photoUrls: pickupLocation.photoUrls || [],
        },
      }),
      ...(dropLocation && !dropLocation.verified && {
        drop_metadata: {
          landmarkDescription: dropLocation.landmarkDescription || null,
          notes: dropLocation.notes || null,
          photoUrls: dropLocation.photoUrls || [],
        },
      }),
    };

    await createJob.mutateAsync({
      title: `${CARGO_TYPE_OPTIONS.find(c => c.value === cargoType)?.label || cargoType} Shipment`,
      cargo_type: cargoType,
      cargo_details: cargoDetails,
      pickup_label: pickupLocation.label,
      pickup_lat: pickupLocation.lat,
      pickup_lng: pickupLocation.lng,
      drop_label: dropLocation.label,
      drop_lat: dropLocation.lat,
      drop_lng: dropLocation.lng,
      budget_cents: budgetCents,
      scheduled_pickup: scheduledPickup,
      scheduled_dropoff: scheduledDropoff,
      weight_kg: weightKg,
      urgency,
      status: "posted",
      distance_km: distanceKm ? Math.round(distanceKm * 10) / 10 : null,
      pricing_type: pricingType,
      max_budget_cents: maxBudgetCents,
      min_budget_cents: minBudgetCents,
    });

    onClose();
  };

  const isFormValid =
    cargoType &&
    pickupLocation &&
    dropLocation &&
    weight &&
    parseFloat(weight) > 0 &&
    dropDate &&
    (pricingType === "fixed"
      ? budget && parseFloat(budget) > 0
      : maxBudget && minBudget && parseFloat(minBudget) <= parseFloat(maxBudget));

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8"
    >
      <Card variant="glow">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>Post a freight job to receive bids from verified drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cargo Type */}
            <div className="space-y-2">
              <Label htmlFor="cargoType">
                Cargo Type <span className="text-destructive">*</span>
              </Label>
              <Select value={cargoType} onValueChange={(val) => setCargoType(val as CargoType)}>
                <SelectTrigger id="cargoType" className="w-full">
                  <SelectValue placeholder="Select cargo type..." />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(groupedCargoTypes).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {category}
                      </div>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Locations */}
            <div className="grid md:grid-cols-2 gap-4">
              <LocationInput
                label="Pickup Location"
                value={pickupLocation}
                onChange={setPickupLocation}
                placeholder="Enter pickup address..."
                required
              />
              <LocationInput
                label="Drop-off Location"
                value={dropLocation}
                onChange={setDropLocation}
                placeholder="Enter drop-off address..."
                required
              />
            </div>

            {/* Distance Display */}
            {distanceKm !== null && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Route className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Estimated Distance:</span>
                <span className="text-sm font-bold text-primary">{formatDistance(distanceKm)}</span>
              </div>
            )}

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pickupDate"
                    type="datetime-local"
                    className="pl-10"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropDate">
                  Drop-off Date/Time <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dropDate"
                    type="datetime-local"
                    className="pl-10"
                    value={dropDate}
                    onChange={(e) => setDropDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">
                Total Weight (kg) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="weight"
                  placeholder="1000"
                  className="pl-10"
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing Mode */}
            <div className="space-y-3">
              <Label>
                Pricing Mode <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={pricingType}
                onValueChange={(val) => setPricingType(val as "fixed" | "bid")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="pricing-fixed" />
                  <Label htmlFor="pricing-fixed" className="cursor-pointer">Fixed Rate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bid" id="pricing-bid" />
                  <Label htmlFor="pricing-bid" className="cursor-pointer">Open for Bidding</Label>
                </div>
              </RadioGroup>

              {pricingType === "fixed" ? (
                <div className="space-y-2">
                  <Label htmlFor="budget">
                    Fixed Rate (USD) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="budget"
                      placeholder="500"
                      className="pl-10"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxBudget">
                      Maximum Price (USD) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="maxBudget"
                        placeholder="1000"
                        className="pl-10"
                        type="number"
                        min="0"
                        step="0.01"
                        value={maxBudget}
                        onChange={(e) => setMaxBudget(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Highest you're willing to pay</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minBudget">
                      Minimum Price (USD) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="minBudget"
                        placeholder="500"
                        className="pl-10"
                        type="number"
                        min="0"
                        step="0.01"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Lowest you'd accept</p>
                  </div>
                </div>
              )}
            </div>

            {/* Urgency Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="urgency"
                checked={urgency}
                onCheckedChange={setUrgency}
              />
              <Label htmlFor="urgency">Mark as urgent</Label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="hero"
                disabled={createJob.isPending || !isFormValid}
              >
                {createJob.isPending ? "Posting..." : "Post Job"}
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

export default JobForm;