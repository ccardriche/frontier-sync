import { format } from "date-fns";
import { Truck, MapPin, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  bids: { count: number }[];
};
type JobStatus = Database["public"]["Enums"]["job_status"];

const STATUS_OPTIONS: JobStatus[] = [
  "posted",
  "bidding",
  "assigned",
  "enroute_pickup",
  "picked_up",
  "in_transit",
  "arrived",
  "delivered",
  "closed",
  "cancelled",
];

const statusVariants: Record<JobStatus, "posted" | "bidding" | "assigned" | "inTransit" | "delivered" | "cancelled" | "default"> = {
  posted: "posted",
  bidding: "bidding",
  assigned: "assigned",
  enroute_pickup: "inTransit",
  picked_up: "inTransit",
  in_transit: "inTransit",
  arrived: "inTransit",
  delivered: "delivered",
  closed: "delivered",
  cancelled: "cancelled",
};

interface JobsOversightTableProps {
  jobs: Job[] | undefined;
  isLoading: boolean;
  onUpdateStatus: (params: { jobId: string; status: JobStatus }) => void;
}

export function JobsOversightTable({ jobs, isLoading, onUpdateStatus }: JobsOversightTableProps) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Job Oversight
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading jobs...</p>
        ) : jobs?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No jobs found</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Bids</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {job.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[job.status] || "default"}>
                        {job.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 text-success" />
                          {job.pickup_label || "No pickup"}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 text-destructive" />
                          {job.drop_label || "No drop"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(job as any).distance_km ? `${Math.round(Number((job as any).distance_km))} km` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Package className="h-3 w-3" />
                        {job.cargo_type?.replace("_", " ") || "—"}
                        {job.urgency && (
                          <AlertCircle className="h-3 w-3 text-warning ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.bids?.[0]?.count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(job.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={job.status}
                        onValueChange={(value: JobStatus) =>
                          onUpdateStatus({ jobId: job.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
