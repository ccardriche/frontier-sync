import { format } from "date-fns";
import { Download, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CompletedJobEarning, exportEarningsToCSV } from "@/hooks/useDriverEarnings";

interface CompletedJobsTableProps {
  jobs: CompletedJobEarning[] | undefined;
  isLoading: boolean;
}

const CompletedJobsTable = ({ jobs, isLoading }: CompletedJobsTableProps) => {
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleExport = () => {
    if (jobs && jobs.length > 0) {
      exportEarningsToCSV(jobs, `completed-jobs-${format(new Date(), "yyyy-MM-dd")}`);
    }
  };

  if (isLoading) {
    return (
      <Card variant="glass" className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display">Completed Jobs</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!jobs || jobs.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No completed jobs yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="hidden md:table-cell">Route</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.slice(0, 10).map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground md:hidden">
                        <MapPin className="w-3 h-3" />
                        {job.pickupLabel || "Pickup"}
                        <ArrowRight className="w-3 h-3" />
                        {job.dropLabel || "Drop-off"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{job.pickupLabel || "Pickup"}</span>
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{job.dropLabel || "Drop-off"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(job.completedAt), "MMM dd")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(job.completedAt), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {formatCurrency(job.amount)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {jobs.length > 10 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Showing 10 of {jobs.length} jobs. Export for full history.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompletedJobsTable;
