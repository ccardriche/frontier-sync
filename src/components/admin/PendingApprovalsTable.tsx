import { useState } from "react";
import { format } from "date-fns";
import { Check, X, ExternalLink, Building2, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type ShipperProfile = Database["public"]["Tables"]["shipper_profiles"]["Row"];
type DriverProfile = Database["public"]["Tables"]["driver_profiles"]["Row"];
type LandownerProfile = Database["public"]["Tables"]["landowner_profiles"]["Row"];
type VerificationStatus = Database["public"]["Enums"]["verification_status"];

interface PendingApprovalsTableProps {
  data: {
    shippers: ShipperProfile[];
    drivers: DriverProfile[];
    landowners: LandownerProfile[];
  } | undefined;
  isLoading: boolean;
  onUpdateVerification: (params: {
    table: "shipper_profiles" | "driver_profiles" | "landowner_profiles";
    id: string;
    status: VerificationStatus;
  }) => void;
}

export function PendingApprovalsTable({ data, isLoading, onUpdateVerification }: PendingApprovalsTableProps) {
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    table: "shipper_profiles" | "driver_profiles" | "landowner_profiles";
    id: string;
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (
    table: "shipper_profiles" | "driver_profiles" | "landowner_profiles",
    id: string
  ) => {
    onUpdateVerification({ table, id, status: "approved" });
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    onUpdateVerification({ table: rejectDialog.table, id: rejectDialog.id, status: "rejected" });
    setRejectDialog(null);
    setRejectReason("");
  };

  const totalPending =
    (data?.shippers.length || 0) + (data?.drivers.length || 0) + (data?.landowners.length || 0);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Pending Approvals
          {totalPending > 0 && (
            <Badge variant="warning" className="ml-2">
              {totalPending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="shippers">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="shippers" className="gap-2">
              <Building2 className="h-4 w-4" />
              Shippers ({data?.shippers.length || 0})
            </TabsTrigger>
            <TabsTrigger value="drivers" className="gap-2">
              <Truck className="h-4 w-4" />
              Drivers ({data?.drivers.length || 0})
            </TabsTrigger>
            <TabsTrigger value="landowners" className="gap-2">
              <MapPin className="h-4 w-4" />
              Landowners ({data?.landowners.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shippers" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : data?.shippers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending shipper approvals</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.shippers.map((shipper) => (
                    <TableRow key={shipper.id}>
                      <TableCell className="font-medium">{shipper.business_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{shipper.contact_person_name}</p>
                          <p className="text-muted-foreground">{shipper.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shipper.business_type.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(shipper.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove("shipper_profiles", shipper.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setRejectDialog({
                                open: true,
                                table: "shipper_profiles",
                                id: shipper.id,
                                name: shipper.business_name,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="drivers" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : data?.drivers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending driver approvals</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{driver.license_type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {driver.government_id_url && (
                            <a
                              href={driver.government_id_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              ID <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {driver.license_document_url && (
                            <a
                              href={driver.license_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              License <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {driver.cdl_document_url && (
                            <a
                              href={driver.cdl_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm flex items-center gap-1"
                            >
                              CDL <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(driver.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove("driver_profiles", driver.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setRejectDialog({
                                open: true,
                                table: "driver_profiles",
                                id: driver.id,
                                name: driver.full_name,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="landowners" className="mt-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : data?.landowners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending landowner approvals</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.landowners.map((landowner) => (
                    <TableRow key={landowner.id}>
                      <TableCell className="font-medium">{landowner.owner_name}</TableCell>
                      <TableCell>{landowner.business_name || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{landowner.phone}</p>
                          <p className="text-muted-foreground">{landowner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(landowner.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove("landowner_profiles", landowner.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setRejectDialog({
                                open: true,
                                table: "landowner_profiles",
                                id: landowner.id,
                                name: landowner.owner_name,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {rejectDialog?.name}?</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Optional: Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
