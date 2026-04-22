import { useState, useMemo } from "react";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportedLoad, ImportSource } from "@/hooks/useLoadImport";
import { useImportSelectedLoads } from "@/hooks/useLoadImport";

interface Props {
  loads: ImportedLoad[];
  source: ImportSource;
  onDone: () => void;
}

const ImportReviewTable = ({ loads, source, onDone }: Props) => {
  const [rows, setRows] = useState<ImportedLoad[]>(loads);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(loads.map((_, i) => i)),
  );
  const importMutation = useImportSelectedLoads();

  const allSelected = useMemo(
    () => rows.length > 0 && selected.size === rows.length,
    [rows, selected],
  );

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map((_, i) => i)));
  };

  const toggleRow = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const updateRow = (i: number, patch: Partial<ImportedLoad>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const handleImport = () => {
    const picked = rows.filter((_, i) => selected.has(i));
    if (picked.length === 0) return;
    importMutation.mutate(
      { loads: picked, source },
      { onSuccess: () => onDone() },
    );
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
        No loads to review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Review and edit before importing. Each load will be geocoded and posted as an open-bid job.
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Drop-off</TableHead>
              <TableHead className="w-28">Equipment</TableHead>
              <TableHead className="w-28">Weight (lbs)</TableHead>
              <TableHead className="w-28">Rate ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Checkbox checked={selected.has(i)} onCheckedChange={() => toggleRow(i)} />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.pickup_label}
                    onChange={(e) => updateRow(i, { pickup_label: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.drop_label}
                    onChange={(e) => updateRow(i, { drop_label: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.equipment ?? ""}
                    onChange={(e) => updateRow(i, { equipment: e.target.value })}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.weight_lbs ?? ""}
                    onChange={(e) =>
                      updateRow(i, { weight_lbs: e.target.value ? Number(e.target.value) : null })
                    }
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.rate_usd ?? ""}
                    onChange={(e) =>
                      updateRow(i, { rate_usd: e.target.value ? Number(e.target.value) : null })
                    }
                    className="h-8"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone} disabled={importMutation.isPending}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={selected.size === 0 || importMutation.isPending}>
          {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Import {selected.size} {selected.size === 1 ? "load" : "loads"}
        </Button>
      </div>
    </div>
  );
};

export default ImportReviewTable;
