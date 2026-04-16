import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useUnitInspection, useSaveInspection, type HubUnit } from "@/hooks/useHubUnits";
import { Database } from "@/integrations/supabase/types";

type Condition = Database["public"]["Enums"]["tire_brake_condition"];
type FhwaStatus = Database["public"]["Enums"]["fhwa_status"];

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "ok", label: "OK" },
  { value: "cracked", label: "CRACKED" },
  { value: "oil_soaked", label: "OIL SOAKED" },
  { value: "corrosion", label: "CORROSION" },
  { value: "bad_other", label: "BAD OTHER" },
];

const WHEELS = [
  { key: "lf", label: "LEFT FRONT" },
  { key: "lr", label: "LEFT REAR" },
  { key: "rf", label: "RIGHT FRONT" },
  { key: "rr", label: "RIGHT REAR" },
] as const;

interface Props {
  unit: HubUnit;
  onClose: () => void;
}

interface WheelState {
  tread: number;
  condition: Condition;
}

const defaultWheel = (): WheelState => ({ tread: 5, condition: "ok" });

export const UnitInspectionDialog = ({ unit, onClose }: Props) => {
  const { data: existing, isLoading } = useUnitInspection(unit.id);
  const save = useSaveInspection();

  const [driverName, setDriverName] = useState("");
  const [driverCompany, setDriverCompany] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [noLicensePhoto, setNoLicensePhoto] = useState(false);

  const [tires, setTires] = useState<Record<string, WheelState>>({
    lf: defaultWheel(), lr: defaultWheel(), rf: defaultWheel(), rr: defaultWheel(),
  });
  const [brakes, setBrakes] = useState<Record<string, WheelState>>({
    lf: defaultWheel(), lr: defaultWheel(), rf: defaultWheel(), rr: defaultWheel(),
  });
  const [allLights, setAllLights] = useState<boolean | null>(null);
  const [fhwa, setFhwa] = useState<FhwaStatus>("none");
  const [damageStatus, setDamageStatus] = useState<"no_damage" | "damaged">("no_damage");
  const [damageDesc, setDamageDesc] = useState("");
  const [totalEstimate, setTotalEstimate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poInstructions, setPoInstructions] = useState("");
  const [sendBack, setSendBack] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!existing) return;
    setDriverName(existing.driver_name || "");
    setDriverCompany(existing.driver_company || "");
    setDriverEmail(existing.driver_email || "");
    setNoLicensePhoto(existing.no_drivers_license_photo || false);
    setTires({
      lf: { tread: existing.tire_lf_tread || 5, condition: existing.tire_lf_condition || "ok" },
      lr: { tread: existing.tire_lr_tread || 5, condition: existing.tire_lr_condition || "ok" },
      rf: { tread: existing.tire_rf_tread || 5, condition: existing.tire_rf_condition || "ok" },
      rr: { tread: existing.tire_rr_tread || 5, condition: existing.tire_rr_condition || "ok" },
    });
    setBrakes({
      lf: { tread: existing.brake_lf_tread || 5, condition: existing.brake_lf_condition || "ok" },
      lr: { tread: existing.brake_lr_tread || 5, condition: existing.brake_lr_condition || "ok" },
      rf: { tread: existing.brake_rf_tread || 5, condition: existing.brake_rf_condition || "ok" },
      rr: { tread: existing.brake_rr_tread || 5, condition: existing.brake_rr_condition || "ok" },
    });
    setAllLights(existing.all_lights_working);
    setFhwa(existing.fhwa_status || "none");
    setDamageStatus(existing.damage_status);
    setDamageDesc(existing.damage_description || "");
    setTotalEstimate(existing.total_estimate_cents ? String(existing.total_estimate_cents / 100) : "");
    setPoNumber(existing.po_number || "");
    setPoInstructions(existing.po_special_instructions || "");
    setSendBack(existing.send_back_to_vendor || false);
    setNotes(existing.notes || "");
  }, [existing]);

  const handleSave = async () => {
    await save.mutateAsync({
      unit_id: unit.id,
      driver_name: driverName || null,
      driver_company: driverCompany || null,
      driver_email: driverEmail || null,
      no_drivers_license_photo: noLicensePhoto,
      tire_lf_tread: tires.lf.tread, tire_lf_condition: tires.lf.condition,
      tire_lr_tread: tires.lr.tread, tire_lr_condition: tires.lr.condition,
      tire_rf_tread: tires.rf.tread, tire_rf_condition: tires.rf.condition,
      tire_rr_tread: tires.rr.tread, tire_rr_condition: tires.rr.condition,
      brake_lf_tread: brakes.lf.tread, brake_lf_condition: brakes.lf.condition,
      brake_lr_tread: brakes.lr.tread, brake_lr_condition: brakes.lr.condition,
      brake_rf_tread: brakes.rf.tread, brake_rf_condition: brakes.rf.condition,
      brake_rr_tread: brakes.rr.tread, brake_rr_condition: brakes.rr.condition,
      all_lights_working: allLights,
      fhwa_status: fhwa,
      damage_status: damageStatus,
      damage_description: damageDesc || null,
      total_estimate_cents: totalEstimate ? Math.round(parseFloat(totalEstimate) * 100) : 0,
      po_number: poNumber || null,
      po_special_instructions: poInstructions || null,
      send_back_to_vendor: sendBack,
      notes: notes || null,
    });
    onClose();
  };

  const WheelGrid = ({
    title, state, setState,
  }: { title: string; state: Record<string, WheelState>; setState: (s: Record<string, WheelState>) => void }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm">{title}</h4>
      {WHEELS.map((w) => (
        <div key={w.key} className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            {w.label} <span className="opacity-70">8THS REMAINING/CONDITION</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setState({ ...state, [w.key]: { ...state[w.key], tread: n } })}
                className={cn(
                  "w-8 h-8 rounded text-xs font-medium border transition-colors",
                  state[w.key].tread === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:bg-muted"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setState({ ...state, [w.key]: { ...state[w.key], condition: c.value } })}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                  state[w.key].condition === c.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:bg-muted"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Inspection — Unit {unit.unit_number}
            {existing && <Badge variant="success">On file</Badge>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Estimate Info Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg text-sm">
              <div><span className="text-muted-foreground">UNIT:</span> <strong>{unit.unit_number}</strong></div>
              <div><span className="text-muted-foreground">VIN:</span> <strong>{unit.vin || "—"}</strong></div>
              <div><span className="text-muted-foreground">YEAR:</span> <strong>{unit.year || "—"}</strong></div>
              <div><span className="text-muted-foreground">MAKE:</span> <strong>{unit.make || "—"}</strong></div>
              <div><span className="text-muted-foreground">PLATE:</span> <strong>{unit.license_plate || "—"}</strong></div>
              <div><span className="text-muted-foreground">IN-GATE:</span> <strong>{unit.in_gate_date || "—"}</strong></div>
              <div><span className="text-muted-foreground">CARRIER:</span> <strong>{unit.carrier || "NA"}</strong></div>
              <div><span className="text-muted-foreground">CUSTOMER:</span> <strong>{unit.customer || "NA"}</strong></div>
            </div>

            {/* Driver Info */}
            <section className="space-y-3">
              <h3 className="font-display font-semibold text-lg">Driver Information</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Driver Name</Label>
                  <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="NA" />
                </div>
                <div>
                  <Label>Driver Company</Label>
                  <Input value={driverCompany} onChange={(e) => setDriverCompany(e.target.value)} placeholder="NA" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Driver Email <span className="text-xs text-muted-foreground">(only if driver wants a copy of form)</span></Label>
                  <Input type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="no_lic" checked={noLicensePhoto} onCheckedChange={(c) => setNoLicensePhoto(!!c)} />
                <Label htmlFor="no_lic" className="text-sm cursor-pointer">No driver's license photo (driver refused)</Label>
              </div>
            </section>

            <Separator />

            {/* Tires & Brakes */}
            <section className="grid md:grid-cols-2 gap-6">
              <WheelGrid title="TIRE INFO" state={tires} setState={setTires} />
              <WheelGrid title="BRAKE INFO" state={brakes} setState={setBrakes} />
            </section>

            <Separator />

            {/* Lights & FHWA */}
            <section className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>LIGHTS — Are all lights working?</Label>
                <div className="flex gap-2">
                  {[{ v: true, l: "YES" }, { v: false, l: "NO" }].map((o) => (
                    <button
                      key={o.l}
                      type="button"
                      onClick={() => setAllLights(o.v)}
                      className={cn(
                        "px-4 py-1.5 rounded text-sm font-medium border",
                        allLights === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border"
                      )}
                    >{o.l}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>FHWA — Is there a current FHWA sticker?</Label>
                <div className="flex gap-2">
                  {([{ v: "current", l: "YES" }, { v: "expired", l: "EXPIRED" }, { v: "none", l: "NO" }] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setFhwa(o.v)}
                      className={cn(
                        "px-4 py-1.5 rounded text-sm font-medium border",
                        fhwa === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border"
                      )}
                    >{o.l}</button>
                  ))}
                </div>
              </div>
            </section>

            <Separator />

            {/* Damage / Estimate */}
            <section className="space-y-3">
              <h3 className="font-display font-semibold text-lg">Damage & Estimate</h3>
              <div className="flex gap-2">
                {([{ v: "no_damage", l: "NO DAMAGE" }, { v: "damaged", l: "DAMAGED" }] as const).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setDamageStatus(o.v)}
                    className={cn(
                      "px-4 py-1.5 rounded text-sm font-medium border",
                      damageStatus === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border"
                    )}
                  >{o.l}</button>
                ))}
              </div>
              {damageStatus === "damaged" && (
                <Textarea value={damageDesc} onChange={(e) => setDamageDesc(e.target.value)} placeholder="Describe damage..." rows={2} />
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Total Estimate Amount ($)</Label>
                  <Input type="number" step="0.01" value={totalEstimate} onChange={(e) => setTotalEstimate(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>CLC PO Number</Label>
                  <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="SE-012345" />
                </div>
                <div className="sm:col-span-2">
                  <Label>PO Special Instructions</Label>
                  <Textarea value={poInstructions} onChange={(e) => setPoInstructions(e.target.value)} rows={2} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="sendback" checked={sendBack} onCheckedChange={(c) => setSendBack(!!c)} />
                <Label htmlFor="sendback" className="text-sm cursor-pointer">Send back to vendor (reject)</Label>
              </div>
            </section>

            <Separator />

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close Without Saving</Button>
          <Button variant="hero" onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save Inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
