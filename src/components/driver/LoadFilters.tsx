import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface LoadFilterState {
  origin: string;
  destination: string;
  pickupDate: string;
  equipment: string;
  minRate: string;
  source: string;
}

interface Props {
  value: LoadFilterState;
  onChange: (v: LoadFilterState) => void;
  sources: string[];
  equipmentOptions: string[];
}

const LoadFilters = ({ value, onChange, sources, equipmentOptions }: Props) => {
  const set = <K extends keyof LoadFilterState>(k: K, v: LoadFilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-lg border border-border bg-card/40 mb-4">
      <div>
        <Label className="text-xs">Origin</Label>
        <Input
          placeholder="City or state"
          value={value.origin}
          onChange={(e) => set("origin", e.target.value)}
          className="h-9"
        />
      </div>
      <div>
        <Label className="text-xs">Destination</Label>
        <Input
          placeholder="City or state"
          value={value.destination}
          onChange={(e) => set("destination", e.target.value)}
          className="h-9"
        />
      </div>
      <div>
        <Label className="text-xs">Pickup on/after</Label>
        <Input
          type="date"
          value={value.pickupDate}
          onChange={(e) => set("pickupDate", e.target.value)}
          className="h-9"
        />
      </div>
      <div>
        <Label className="text-xs">Equipment</Label>
        <Select value={value.equipment || "all"} onValueChange={(v) => set("equipment", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {equipmentOptions.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Min rate ($)</Label>
        <Input
          type="number"
          placeholder="0"
          value={value.minRate}
          onChange={(e) => set("minRate", e.target.value)}
          className="h-9"
        />
      </div>
      <div>
        <Label className="text-xs">Source</Label>
        <Select value={value.source || "all"} onValueChange={(v) => set("source", v === "all" ? "" : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LoadFilters;
