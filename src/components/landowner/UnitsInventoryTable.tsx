import { useState } from "react";
import { Plus, ClipboardCheck, Trash2, QrCode } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useHubUnits, useDeleteHubUnit, type HubUnit } from "@/hooks/useHubUnits";
import { HubUnitForm } from "./HubUnitForm";
import { UnitInspectionDialog } from "./UnitInspectionDialog";
import { UnitQRDialog } from "./UnitQRDialog";

interface Props {
  hubId: string;
  hubName: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive"> = {
  in_yard: "success",
  out: "default",
  on_hold: "warning",
  damaged: "destructive",
};

export const UnitsInventoryTable = ({ hubId, hubName }: Props) => {
  const { data: units, isLoading } = useHubUnits(hubId);
  const deleteUnit = useDeleteHubUnit();
  const [showForm, setShowForm] = useState(false);
  const [inspectionUnit, setInspectionUnit] = useState<HubUnit | null>(null);
  const [qrUnit, setQrUnit] = useState<HubUnit | null>(null);

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-display">Units at {hubName}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Inventory & inspections</p>
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Add Unit
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !units || units.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No units logged yet. Click "Add Unit" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit No.</TableHead>
                  <TableHead>In-Gate Doc</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Year/Make</TableHead>
                  <TableHead>Plate</TableHead>
                  <TableHead>Date In</TableHead>
                  <TableHead>Date Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.unit_number}</TableCell>
                    <TableCell className="font-mono text-xs">{u.in_gate_doc || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.vin || "—"}</TableCell>
                    <TableCell>{[u.year, u.make].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell>{u.license_plate || "—"}</TableCell>
                    <TableCell>{u.in_gate_date ? format(new Date(u.in_gate_date), "yy-MM-dd") : "—"}</TableCell>
                    <TableCell>{u.date_out ? format(new Date(u.date_out), "yy-MM-dd") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[u.status] || "default"}>
                        {u.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setQrUnit(u)} title="Show QR">
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setInspectionUnit(u)} title="Inspection">
                        <ClipboardCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remove unit ${u.unit_number}?`)) deleteUnit.mutate(u.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {showForm && <HubUnitForm hubId={hubId} onClose={() => setShowForm(false)} />}
      {inspectionUnit && (
        <UnitInspectionDialog unit={inspectionUnit} onClose={() => setInspectionUnit(null)} />
      )}
      {qrUnit && <UnitQRDialog unit={qrUnit} onClose={() => setQrUnit(null)} />}
    </Card>
  );
};
