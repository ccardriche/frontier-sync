import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Play, Pause, Trash2, RefreshCw, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLaneWatches,
  useUpdateLaneWatch,
  useDeleteLaneWatch,
  useRunLaneWatchNow,
} from "@/hooks/useLaneWatches";
import LaneWatchForm from "./LaneWatchForm";

const LaneWatchesPanel = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: watches, isLoading } = useLaneWatches();
  const update = useUpdateLaneWatch();
  const del = useDeleteLaneWatch();
  const run = useRunLaneWatchNow();

  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-display font-bold">Lane Watches</h2>
          <Badge variant="outline">Auto-sync every 15 min</Badge>
        </div>
        <Button variant="hero" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          New Watch
        </Button>
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {!isLoading && (watches?.length ?? 0) === 0 && (
        <Card variant="glass">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p className="mb-3">No lane watches yet.</p>
            <p className="text-sm">
              Add a watch to automatically pull matching loads from external boards into your driver feed.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {watches?.map((w) => (
          <Card key={w.id} variant="glass">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{w.name}</h3>
                    {w.is_active ? (
                      <Badge variant="glow">Active</Badge>
                    ) : (
                      <Badge variant="outline">Paused</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {w.origin_label} → {w.dest_label}
                    {w.equipment && ` · ${w.equipment}`}
                    {w.min_rate_cents && ` · min $${(w.min_rate_cents / 100).toFixed(0)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {w.last_run_at
                      ? `Last run ${new Date(w.last_run_at).toLocaleString()} · ${w.last_run_imported ?? 0} imported (${w.last_run_status ?? "—"})`
                      : "Never run"}
                    {" · total: "}
                    {w.total_imported}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => run.mutate(w.id)}
                    disabled={run.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 ${run.isPending ? "animate-spin" : ""}`} />
                    Run now
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => update.mutate({ id: w.id, patch: { is_active: !w.is_active } })}
                    title={w.is_active ? "Pause" : "Resume"}
                  >
                    {w.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete lane watch "${w.name}"?`)) del.mutate(w.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <LaneWatchForm open={showForm} onOpenChange={setShowForm} />
    </motion.section>
  );
};

export default LaneWatchesPanel;
