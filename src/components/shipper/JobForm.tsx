import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreateJob } from "@/hooks/useJobs";

interface JobFormProps {
  onClose: () => void;
}

const JobForm = ({ onClose }: JobFormProps) => {
  const [title, setTitle] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [pickupLabel, setPickupLabel] = useState("");
  const [dropLabel, setDropLabel] = useState("");
  const [budget, setBudget] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [weight, setWeight] = useState("");
  const [urgency, setUrgency] = useState(false);

  const createJob = useCreateJob();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const budgetCents = budget ? Math.round(parseFloat(budget) * 100) : null;
    const weightKg = weight ? parseFloat(weight) : null;
    const scheduledPickup = pickupDate ? new Date(pickupDate).toISOString() : null;

    await createJob.mutateAsync({
      title: title.trim(),
      cargo_details: cargoType ? { type: cargoType } : null,
      pickup_label: pickupLabel || null,
      drop_label: dropLabel || null,
      budget_cents: budgetCents,
      scheduled_pickup: scheduledPickup,
      weight_kg: weightKg,
      urgency,
      status: "posted",
    });

    onClose();
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Electronics Shipment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargoType">Cargo Type</Label>
                <Input
                  id="cargoType"
                  placeholder="e.g., General Freight"
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pickup"
                    placeholder="Enter pickup address"
                    className="pl-10"
                    value={pickupLabel}
                    onChange={(e) => setPickupLabel(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropoff">Drop-off Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="dropoff"
                    placeholder="Enter drop-off address"
                    className="pl-10"
                    value={dropLabel}
                    onChange={(e) => setDropLabel(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD)</Label>
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
                <Label htmlFor="pickupDate">Pickup Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  placeholder="1000"
                  type="number"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="urgency"
                checked={urgency}
                onCheckedChange={setUrgency}
              />
              <Label htmlFor="urgency">Mark as urgent</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="hero" disabled={createJob.isPending}>
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
