import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RecurringRouteForm from "./RecurringRouteForm";
import RecurringRouteCard from "./RecurringRouteCard";
import { useRecurringTemplates } from "@/hooks/useRecurringJobs";

const RecurringRoutesSection = () => {
  const [showForm, setShowForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: templates, isLoading, error } = useRecurringTemplates();

  const activeCount = templates?.filter((t) => t.is_active).length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              <Repeat className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-display font-bold">Recurring Routes</h2>
              {activeCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {activeCount} active
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          New Route
        </Button>
      </div>

      <AnimatePresence>
        {showForm && <RecurringRouteForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {isExpanded && (
        <>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load recurring routes.</p>
            </div>
          )}

          {!isLoading && !error && templates?.length === 0 && !showForm && (
            <Card variant="glass" className="border-dashed">
              <CardContent className="py-8 text-center">
                <Repeat className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">
                  No recurring routes yet. Set up automated job scheduling.
                </p>
                <Button variant="outline" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4" />
                  Create Your First Route
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && templates && templates.length > 0 && (
            <div className="space-y-3">
              {templates.map((template, index) => (
                <RecurringRouteCard
                  key={template.id}
                  template={template}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default RecurringRoutesSection;
