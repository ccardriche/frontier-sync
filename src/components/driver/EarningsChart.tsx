import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyEarning } from "@/hooks/useDriverEarnings";

interface EarningsChartProps {
  dailyData: DailyEarning[] | undefined;
  monthlyData: { month: string; earnings: number }[] | undefined;
  isLoading: boolean;
}

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--primary))",
  },
  jobs: {
    label: "Jobs",
    color: "hsl(var(--accent))",
  },
};

const EarningsChart = ({ dailyData, monthlyData, isLoading }: EarningsChartProps) => {
  if (isLoading) {
    return (
      <Card variant="glass" className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show only last 14 days for cleaner view
  const recentDailyData = dailyData?.slice(-14) || [];

  return (
    <Card variant="glass" className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-display">Earnings Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Last 14 Days</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            {recentDailyData.length === 0 || recentDailyData.every((d) => d.earnings === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No earnings data available yet
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={recentDailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    className="fill-muted-foreground"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          if (name === "earnings") return [`$${value}`, "Earnings"];
                          return [value, "Jobs"];
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </TabsContent>

          <TabsContent value="monthly">
            {!monthlyData || monthlyData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly data available yet
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    className="fill-muted-foreground"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`$${value}`, "Earnings"]}
                      />
                    }
                  />
                  <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EarningsChart;
