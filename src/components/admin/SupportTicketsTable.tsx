import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["support_tickets"]["Row"];
type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const STATUS_ICONS: Record<TicketStatus, typeof MessageSquare> = {
  open: MessageSquare,
  in_progress: Clock,
  resolved: CheckCircle,
  closed: XCircle,
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "bg-warning/10 text-warning border-warning/30",
  in_progress: "bg-primary/10 text-primary border-primary/30",
  resolved: "bg-success/10 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
};

interface SupportTicketsTableProps {
  tickets: Ticket[] | undefined;
  isLoading: boolean;
  onUpdateTicket: (params: { ticketId: string; status: TicketStatus; resolutionNote?: string }) => void;
}

export function SupportTicketsTable({ tickets, isLoading, onUpdateTicket }: SupportTicketsTableProps) {
  const [resolveDialog, setResolveDialog] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("resolved");

  const handleResolve = () => {
    if (!resolveDialog) return;
    onUpdateTicket({
      ticketId: resolveDialog.id,
      status: selectedStatus,
      resolutionNote: resolutionNote || undefined,
    });
    setResolveDialog(null);
    setResolutionNote("");
  };

  const openTickets = tickets?.filter((t) => t.status === "open" || t.status === "in_progress");

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Support Tickets
          {openTickets && openTickets.length > 0 && (
            <Badge variant="warning" className="ml-2">
              {openTickets.length} open
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading tickets...</p>
        ) : tickets?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No support tickets</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="max-w-[300px]">Message</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket) => {
                const StatusIcon = STATUS_ICONS[ticket.status || "open"];
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[ticket.status || "open"]}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {ticket.status?.replace("_", " ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category || "General"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm truncate">{ticket.message}</p>
                      {ticket.resolution_note && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Resolution: {ticket.resolution_note}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      {(ticket.status === "open" || ticket.status === "in_progress") && (
                        <Button size="sm" onClick={() => setResolveDialog(ticket)}>
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">{resolveDialog?.message}</div>
              <Select
                value={selectedStatus}
                onValueChange={(value: TicketStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Resolution note..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleResolve}>Update Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
