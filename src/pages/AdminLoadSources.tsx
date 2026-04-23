import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Play, Trash2, RefreshCw, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoadSources, useSyncLogs, useUpsertSource, useDeleteSource, useToggleSource, useTestSource, useRunSync, type LoadSource } from "@/hooks/useExternalLoads";
import { formatDistanceToNow } from "date-fns";

const empty: Partial<LoadSource> = {
  source_name: "",
  source_type: "json",
  feed_url: "",
  auth_type: "none",
  api_key: "",
  is_active: true,
  sync_frequency_minutes: 60,
};

const AdminLoadSources = () => {
  const navigate = useNavigate();
  const { data: sources, isLoading } = useLoadSources();
  const { data: logs } = useSyncLogs();
  const upsert = useUpsertSource();
  const remove = useDeleteSource();
  const toggle = useToggleSource();
  const test = useTestSource();
  const sync = useRunSync();

  const [editing, setEditing] = useState<Partial<LoadSource> | null>(null);

  const save = () => {
    if (!editing?.source_name || !editing?.source_type) return;
    upsert.mutate(editing as never, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/admin")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-display font-bold">Load Source Manager</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => sync.mutate(undefined)} disabled={sync.isPending}>
              <RefreshCw className={`w-4 h-4 ${sync.isPending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline ml-1">Sync all</span>
            </Button>
            <Button size="sm" onClick={() => setEditing(empty)}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline ml-1">Add source</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last sync</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>}
                {sources?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.source_name}</TableCell>
                    <TableCell><Badge variant="outline">{s.source_type}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.last_synced_at ? formatDistanceToNow(new Date(s.last_synced_at), { addSuffix: true }) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={s.is_active} onCheckedChange={(v) => toggle.mutate({ id: s.id, is_active: v })} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => test.mutate(s.id)} disabled={test.isPending}>
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => sync.mutate(s.id)} disabled={sync.isPending}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${s.source_name}?`)) remove.mutate(s.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (sources?.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sources yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent sync logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs ?? []).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{formatDistanceToNow(new Date(l.synced_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      {l.sync_status === "success" ? (
                        <Badge variant="outline" className="text-green-600 border-green-600/40"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>
                      ) : (
                        <Badge variant="outline" className="text-destructive border-destructive/40"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell>{l.records_added}</TableCell>
                    <TableCell>{l.records_updated}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{l.error_message ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {(logs?.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sync runs yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit source" : "Add source"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.source_name ?? ""} onChange={(e) => setEditing({ ...editing, source_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={editing.source_type} onValueChange={(v) => setEditing({ ...editing, source_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="scrape">Scrape</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Auth</Label>
                  <Select value={editing.auth_type} onValueChange={(v) => setEditing({ ...editing, auth_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key">API key</SelectItem>
                      <SelectItem value="bearer">Bearer</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Feed URL</Label>
                <Input value={editing.feed_url ?? ""} onChange={(e) => setEditing({ ...editing, feed_url: e.target.value })} placeholder="https://example.com/feed.json" />
              </div>
              {editing.auth_type !== "none" && (
                <div>
                  <Label>API key / token</Label>
                  <Input type="password" value={editing.api_key ?? ""} onChange={(e) => setEditing({ ...editing, api_key: e.target.value })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Sync every (min)</Label>
                  <Input type="number" value={editing.sync_frequency_minutes ?? 60} onChange={(e) => setEditing({ ...editing, sync_frequency_minutes: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoadSources;
