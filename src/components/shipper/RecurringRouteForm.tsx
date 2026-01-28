import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Scale, Clock, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { useCreateRecurringTemplate } from "@/hooks/useRecurringJobs";
import { Database, Json } from "@/integrations/supabase/types";

type CargoType = Database["public"]["Enums"]["cargo_type"];
type Cadence = "daily" | "weekly" | "biweekly" | "monthly";

interface RecurringRouteFormProps {
  onClose: () => void;
}

const CARGO_TYPE_OPTIONS: { value: CargoType; label: string }[] = [
  { value: "small_parcels", label: "Small Parcels" },
  { value: "palletized_goods", label: "Palletized Goods" },
  { value: "bulk_goods", label: "Bulk Goods" },
  { value: "mixed_freight", label: "Mixed Freight" },
  { value: "dry_food", label: "Dry Food" },
  { value: "perishables", label: "Perishables" },
  { value: "frozen_goods", label: "Frozen Goods" },
  { value: "produce", label: "Produce" },
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "documents", label: "Documents" },
  { value: "small_packages", label: "Small Packages" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const RecurringRouteForm = ({ onClose }: RecurringRouteFormProps) => {
  const [title, setTitle] = useState("");
  const [cargoType, setCargoType] = useState<CargoType | "">("");
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationData | null>(null);
  const [budget, setBudget] = useState("");
  const [weight, setWeight] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [preferredTime, setPreferredTime] = useState("09:00");

  const createTemplate = useCreateRecurringTemplate();

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;
    if (!pickupLocation || !dropLocation) return;

    const budgetCents = budget ? Math.round(parseFloat(budget) * 100) : undefined;
    const weightKg = weight ? parseFloat(weight) : undefined;

    const cargoDetails: Json = cargoType
      ? { type: cargoType }
      : {};

    await createTemplate.mutateAsync({
      title: title.trim(),
      cargo_type: cargoType || undefined,
      cargo_details: cargoDetails,
      pickup_label: pickupLocation.label,
      pickup_lat: pickupLocation.lat,
      pickup_lng: pickupLocation.lng,
      drop_label: dropLocation.label,
      drop_lat: dropLocation.lat,
      drop_lng: dropLocation.lng,
      budget_cents: budgetCents,
      weight_kg: weightKg,
      urgency,
      cadence,
      days_of_week: cadence === "weekly" ? selectedDays : [],
      preferred_time: preferredTime,
    });

    onClose();
  };

  const isFormValid = title.trim() && pickupLocation && dropLocation;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8"
    >
      <Card variant="glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Create Recurring Route
          </CardTitle>
          <CardDescription>
            Set up a regular route that will automatically generate jobs on your schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Name */}
            <div className="space-y-2">
              <Label htmlFor="routeTitle">
                Route Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="routeTitle"
                placeholder="e.g., Daily Warehouse to Store Run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Cargo Type */}
            <div className="space-y-2">
              <Label>Cargo Type</Label>
              <Select value={cargoType} onValueChange={(val) => setCargoType(val as CargoType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type..." />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
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

            {/* Budget & Weight */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget per Job (USD)</Label>
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
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Typical Weight (kg)</Label>
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
                  />
                </div>
              </div>
            </div>

            {/* Recurrence Settings */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={cadence} onValueChange={(val) => setCadence(val as Cadence)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTime">Preferred Pickup Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="preferredTime"
                      type="time"
                      className="pl-10"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {cadence === "weekly" && (
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day.value}
                        className={`flex items-center justify-center w-12 h-10 rounded-md cursor-pointer border transition-colors ${
                          selectedDays.includes(day.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedDays.includes(day.value)}
                          onCheckedChange={() => handleDayToggle(day.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    ))}
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
              <Label htmlFor="urgency">Mark jobs as urgent</Label>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="hero"
                disabled={createTemplate.isPending || !isFormValid}
              >
                {createTemplate.isPending ? "Creating..." : "Create Route"}
                <Repeat className="w-4 h-4" />
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

export default RecurringRouteForm;
