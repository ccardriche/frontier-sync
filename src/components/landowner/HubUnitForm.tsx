import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHubUnit } from "@/hooks/useHubUnits";

interface Props {
  hubId: string;
  onClose: () => void;
}

export const HubUnitForm = ({ hubId, onClose }: Props) => {
  const create = useCreateHubUnit();
  const [form, setForm] = useState({
    unit_number: "",
    vin: "",
    year: "",
    make: "",
    license_plate: "",
    customer: "",
    carrier: "",
    in_gate_date: new Date().toISOString().split("T")[0],
    in_gate_doc: "",
    status: "in_yard" as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_number.trim()) return;
    await create.mutateAsync({
      hub_id: hubId,
      unit_number: form.unit_number.trim(),
      vin: form.vin || null,
      year: form.year ? parseInt(form.year) : null,
      make: form.make || null,
      license_plate: form.license_plate || null,
      customer: form.customer || null,
      carrier: form.carrier || null,
      in_gate_date: form.in_gate_date || null,
      in_gate_doc: form.in_gate_doc || null,
      status: form.status,
    });
    onClose();
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Unit to Inventory</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit_number">Unit Number *</Label>
              <Input id="unit_number" value={form.unit_number} onChange={(e) => set("unit_number", e.target.value)} placeholder="EJGZ105044" required />
            </div>
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" value={form.vin} onChange={(e) => set("vin", e.target.value)} placeholder="1JJV532D4EL799531" />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2014" />
            </div>
            <div>
              <Label htmlFor="make">Make</Label>
              <Input id="make" value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="WABASH" />
            </div>
            <div>
              <Label htmlFor="license_plate">Plate</Label>
              <Input id="license_plate" value={form.license_plate} onChange={(e) => set("license_plate", e.target.value)} placeholder="5395441" />
            </div>
            <div>
              <Label htmlFor="in_gate_date">In-Gate Date</Label>
              <Input id="in_gate_date" type="date" value={form.in_gate_date} onChange={(e) => set("in_gate_date", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Input id="customer" value={form.customer} onChange={(e) => set("customer", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="carrier">Carrier</Label>
              <Input id="carrier" value={form.carrier} onChange={(e) => set("carrier", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="in_gate_doc">In-Gate Doc #</Label>
              <Input id="in_gate_doc" value={form.in_gate_doc} onChange={(e) => set("in_gate_doc", e.target.value)} placeholder="IGC-115492412" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_yard">In Yard</SelectItem>
                  <SelectItem value="out">Out</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={create.isPending}>
              {create.isPending ? "Saving..." : "Add Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
