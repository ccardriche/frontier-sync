import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateLaneWatch, type LaneWatchInput } from "@/hooks/useLaneWatches";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LaneWatchForm = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [equipment, setEquipment] = useState("");
  const [minRate, setMinRate] = useState("");
  const create = useCreateLaneWatch();

  const handleSubmit = async () => {
    if (!name.trim() || !origin.trim() || !dest.trim()) return;
    const input: LaneWatchInput = {
      name: name.trim(),
      sources: ["trulos"],
      origin_label: origin.trim(),
      origin_radius_km: 80,
      dest_label: dest.trim(),
      dest_radius_km: 80,
      equipment: equipment.trim() || null,
      min_rate_cents: minRate ? Math.round(parseFloat(minRate) * 100) : null,
      is_active: true,
    };
    await create.mutateAsync(input);
    setName(""); setOrigin(""); setDest(""); setEquipment(""); setMinRate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Lane Watch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ATL → DAL daily" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Origin</Label>
              <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Atlanta, GA" />
            </div>
            <div>
              <Label>Destination</Label>
              <Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Dallas, TX" />
            </div>
          </div>
          <div>
            <Label>Equipment (optional)</Label>
            <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Dry van, reefer..." />
          </div>
          <div>
            <Label>Minimum rate (USD, optional)</Label>
            <Input
              type="number"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              placeholder="2000"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || !name || !origin || !dest}>
              {create.isPending ? "Creating..." : "Create Watch"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LaneWatchForm;
