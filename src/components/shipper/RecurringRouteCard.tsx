import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  MapPin,
  Repeat,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Rocket,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  RecurringJobTemplate,
  useToggleTemplate,
  useDeleteTemplate,
  useGenerateJobFromTemplate,
} from "@/hooks/useRecurringJobs";

interface RecurringRouteCardProps {
  template: RecurringJobTemplate;
  index: number;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getCadenceLabel = (cadence: string, daysOfWeek: number[]): string => {
  switch (cadence) {
    case "daily":
      return "Every day";
    case "weekly":
      if (daysOfWeek.length > 0) {
        return daysOfWeek.map((d) => DAYS_SHORT[d]).join(", ");
      }
      return "Weekly";
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      return "Monthly";
    default:
      return cadence;
  }
};

const RecurringRouteCard = ({ template, index }: RecurringRouteCardProps) => {
  const toggleTemplate = useToggleTemplate();
  const deleteTemplate = useDeleteTemplate();
  const generateJob = useGenerateJobFromTemplate();

  const handleToggle = () => {
    toggleTemplate.mutate({ id: template.id, is_active: !template.is_active });
  };

  const handleDelete = () => {
    deleteTemplate.mutate(template.id);
  };

  const handleGenerateNow = () => {
    generateJob.mutate(template);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card variant="glass" className={!template.is_active ? "opacity-60" : ""}>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Route Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{template.title}</h3>
                {template.urgency && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
                {!template.is_active && (
                  <Badge variant="outline" className="text-xs">
                    Paused
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[200px]">{template.pickup_label}</span>
                <span className="text-primary">→</span>
                <span className="truncate max-w-[200px]">{template.drop_label}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="w-3 h-3" />
                  {getCadenceLabel(template.cadence, template.days_of_week)}
                </Badge>

                {template.preferred_time && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {template.preferred_time}
                  </Badge>
                )}

                {template.budget_cents && (
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${(template.budget_cents / 100).toFixed(0)}
                  </Badge>
                )}

                {template.cargo_type && (
                  <Badge variant="outline">
                    {template.cargo_type.replace(/_/g, " ")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {template.total_jobs_created || 0}
                </p>
                <p className="text-xs text-muted-foreground">Jobs Created</p>
              </div>

              {template.next_run_date && template.is_active && (
                <div className="text-center">
                  <p className="font-medium">
                    {format(new Date(template.next_run_date), "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">Next Run</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNow}
                disabled={generateJob.isPending}
                className="gap-1"
              >
                <Rocket className="w-4 h-4" />
                Run Now
              </Button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
              {template.is_active ? (
                <Play className="w-4 h-4 text-primary" />
              ) : (
                <Pause className="w-4 h-4 text-muted-foreground" />
              )}
                <Switch
                  checked={template.is_active || false}
                  onCheckedChange={handleToggle}
                  disabled={toggleTemplate.isPending}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Route Template?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the recurring route "{template.title}".
                      Existing jobs created from this template will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecurringRouteCard;
