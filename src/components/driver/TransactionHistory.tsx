import { format } from "date-fns";
import { Download, ArrowUpRight, ArrowDownLeft, Building2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TransactionRecord, exportTransactionsToCSV } from "@/hooks/useDriverEarnings";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  transactions: TransactionRecord[] | undefined;
  isLoading: boolean;
}

const TransactionHistory = ({ transactions, isLoading }: TransactionHistoryProps) => {
  const formatCurrency = (cents: number) => {
    return `$${(Math.abs(cents) / 100).toFixed(2)}`;
  };

  const handleExport = () => {
    if (transactions && transactions.length > 0) {
      exportTransactionsToCSV(
        transactions,
        `transactions-${format(new Date(), "yyyy-MM-dd")}`
      );
    }
  };

  const getTransactionIcon = (transaction: TransactionRecord) => {
    if (transaction.hubId) return Building2;
    if (transaction.jobId) return Briefcase;
    return transaction.direction === "in" ? ArrowDownLeft : ArrowUpRight;
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-display">Transaction History</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!transactions || transactions.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction);
                const isCredit = transaction.direction === "in";

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isCredit ? "bg-accent/20" : "bg-destructive/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isCredit ? "text-accent" : "text-destructive"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {transaction.description || (isCredit ? "Credit" : "Debit")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(transaction.createdAt), "MMM dd, yyyy • HH:mm")}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "font-mono font-semibold",
                        isCredit ? "text-accent" : "text-destructive"
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
